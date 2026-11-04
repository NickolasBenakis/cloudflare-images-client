// Validates recorded HTTP exchanges against the pinned Cloudflare Images
// OpenAPI spec (openapi/cloudflare-images.json).
import { readFileSync } from "node:fs";
import Ajv, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import { CLOUDFLARE_BASE_URL } from "../../src/config";

type Json = Record<string, unknown>;
type Operation = {
	parameters?: Json[];
	requestBody?: { content: Record<string, { schema: Json }> };
	responses: Record<string, { content?: Record<string, { schema?: Json }> }>;
};
type Spec = { paths: Record<string, Record<string, Operation>> };

export type Exchange = {
	method: string;
	url: URL;
	contentType: string | null;
	requestBody: unknown;
	status: number;
	responseContentType: string | null;
	responseBody: unknown;
};

const specPath = new URL(
	"../../openapi/cloudflare-images.json",
	import.meta.url,
);
export const spec: Spec = JSON.parse(readFileSync(specPath, "utf8"));

const ajv = new Ajv({
	strict: false,
	allErrors: true,
	validateSchema: false,
	discriminator: true,
});
addFormats(ajv);
ajv.addSchema(spec as unknown as Json, "spec");

const queryAjv = new Ajv({ strict: false, coerceTypes: true });
addFormats(queryAjv);

function resolve(node: Json): Json {
	const ref = node.$ref;
	if (typeof ref !== "string") return node;
	const target = ref
		.slice(2)
		.split("/")
		.map((t) => t.replace(/~1/g, "/").replace(/~0/g, "~"))
		.reduce<unknown>((n, k) => (n as Json)[k], spec);
	return resolve(target as Json);
}

/** Replaces every `$ref` with its target (the Images schemas have no cycles). */
function inline(node: unknown): unknown {
	if (Array.isArray(node)) return node.map(inline);
	if (node && typeof node === "object") {
		const resolved = resolve(node as Json);
		return Object.fromEntries(
			Object.entries(resolved).map(([k, v]) => [k, inline(v)]),
		);
	}
	return node;
}

/** Wraps a schema fragment so its internal `#/components/...` refs resolve against the spec. */
function compile(schema: Json) {
	const ref = schema.$ref;
	if (typeof ref === "string") return ajv.compile({ $ref: `spec${ref}` });
	return ajv.compile(
		JSON.parse(JSON.stringify(schema).replace(/"\$ref":"#/g, '"$ref":"spec#')),
	);
}

function format(errors: ErrorObject[] | null | undefined) {
	return (errors ?? [])
		.map((e) => `${e.instancePath || "(root)"} ${e.message}`)
		.join("; ");
}

const routes = Object.entries(spec.paths).map(([template, item]) => ({
	template,
	item,
	regex: new RegExp(
		`^${CLOUDFLARE_BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}${template.replace(
			/\{[^}]+\}/g,
			"[^/]+",
		)}$`,
	),
}));

function findOperation(method: string, url: URL) {
	const route = routes.find((r) =>
		r.regex.test(`${url.origin}${url.pathname}`),
	);
	const operation = route?.item[method.toLowerCase()];
	if (!route || !operation) {
		throw new Error(
			`${method} ${url.pathname} is not an operation in the pinned Cloudflare spec`,
		);
	}
	return { template: route.template, operation };
}

function pickResponse(operation: Operation, status: number) {
	const r = operation.responses;
	return r[String(status)] ?? r[`${String(status)[0]}XX`] ?? r.default;
}

/** Returns a list of contract violations; empty means the exchange conforms. */
export function validateExchange(ex: Exchange): string[] {
	const problems: string[] = [];
	const { template, operation } = findOperation(ex.method, ex.url);
	const label = `${ex.method} ${template}`;

	// Query parameters: must be declared, and values must match their schema.
	const declared = new Map(
		(operation.parameters ?? [])
			.map(resolve)
			.filter((p) => p.in === "query")
			.map((p) => [p.name as string, p.schema as Json]),
	);
	for (const [name, value] of ex.url.searchParams) {
		const schema = declared.get(name);
		if (!schema) {
			problems.push(`${label}: query parameter "${name}" is not in the spec`);
			continue;
		}
		const check = queryAjv.compile(inline(schema));
		if (!check(value)) {
			problems.push(
				`${label}: query "${name}=${value}" ${format(check.errors)}`,
			);
		}
	}

	// Request body.
	if (ex.requestBody !== undefined) {
		const mediaType = ex.contentType?.split(";")[0] ?? "";
		const content = operation.requestBody?.content ?? {};
		const bodySchema = content[mediaType]?.schema;
		if (!bodySchema) {
			problems.push(
				`${label}: request body type "${mediaType}" is not in the spec (expected ${Object.keys(content).join(", ") || "no body"})`,
			);
		} else {
			if (mediaType === "multipart/form-data") {
				const props = (resolve(bodySchema).properties ?? {}) as Json;
				for (const field of Object.keys(ex.requestBody as Json)) {
					if (!(field in props)) {
						problems.push(`${label}: form field "${field}" is not in the spec`);
					}
				}
			}
			const check = compile(bodySchema);
			if (!check(ex.requestBody)) {
				problems.push(`${label}: request body ${format(check.errors)}`);
			}
		}
	}

	// Response.
	const response = pickResponse(operation, ex.status);
	if (!response) {
		problems.push(`${label}: status ${ex.status} is not a documented response`);
		return problems;
	}
	const media = Object.keys(response.content ?? {});
	const actual = ex.responseContentType?.split(";")[0] ?? "";
	const matched = media.find(
		(m) =>
			m === actual || (m.endsWith("/*") && actual.startsWith(m.slice(0, -1))),
	);
	if (!matched) {
		problems.push(
			`${label}: ${ex.status} response type "${actual}" is not in the spec (expected ${media.join(", ")})`,
		);
		return problems;
	}
	const schema = response.content?.[matched]?.schema;
	if (schema && matched === "application/json") {
		const check = compile(schema);
		if (!check(ex.responseBody)) {
			problems.push(
				`${label}: ${ex.status} response body ${format(check.errors)}`,
			);
		}
	}
	return problems;
}

/** Converts multipart form data to the object shape the spec describes. */
export function formDataToObject(form: FormData): Json {
	const out: Json = {};
	for (const [key, value] of form) {
		if (typeof value !== "string") {
			out[key] = "<binary>";
			continue;
		}
		try {
			out[key] = JSON.parse(value);
		} catch {
			out[key] = value;
		}
	}
	return out;
}
