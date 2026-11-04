// Extracts the Cloudflare Images operations this client calls (plus every
// schema they reference) from Cloudflare's published OpenAPI spec into
// openapi/cloudflare-images.json. The output is key-sorted so that diffs only
// show real API changes.
//
// Usage: node scripts/openapi-update.mjs [path-or-url-to-full-openapi.json]
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const SOURCE_URL =
	"https://raw.githubusercontent.com/cloudflare/api-schemas/main/openapi.json";

// Every endpoint CloudflareImagesClient calls. Add to this list when the
// client gains a method.
export const OPERATIONS = {
	"/accounts/{account_id}/images/v1": ["post"],
	"/accounts/{account_id}/images/v1/stats": ["get"],
	"/accounts/{account_id}/images/v1/{image_id}": ["get", "patch", "delete"],
	"/accounts/{account_id}/images/v1/{image_id}/blob": ["get"],
	"/accounts/{account_id}/images/v2": ["get"],
};

const OUTPUT = new URL("../openapi/cloudflare-images.json", import.meta.url);

async function loadSpec(source) {
	if (/^https?:\/\//.test(source)) {
		const res = await fetch(source);
		if (!res.ok) throw new Error(`GET ${source} -> ${res.status}`);
		return res.json();
	}
	return JSON.parse(await readFile(source, "utf8"));
}

function resolvePointer(doc, ref) {
	if (!ref.startsWith("#/")) throw new Error(`Unsupported $ref: ${ref}`);
	return ref
		.slice(2)
		.split("/")
		.map((t) => t.replace(/~1/g, "/").replace(/~0/g, "~"))
		.reduce((node, key) => {
			if (node?.[key] === undefined) throw new Error(`Dangling $ref: ${ref}`);
			return node[key];
		}, doc);
}

function collectRefs(doc, node, out) {
	if (Array.isArray(node)) {
		for (const item of node) collectRefs(doc, item, out);
	} else if (node && typeof node === "object") {
		for (const [key, value] of Object.entries(node)) {
			if (key === "$ref" && typeof value === "string") {
				if (!out.has(value)) {
					out.add(value);
					collectRefs(doc, resolvePointer(doc, value), out);
				}
			} else {
				collectRefs(doc, value, out);
			}
		}
	}
}

function setPointer(target, ref, value) {
	const keys = ref.slice(2).split("/");
	let node = target;
	for (const key of keys.slice(0, -1)) {
		node[key] ??= {};
		node = node[key];
	}
	node[keys.at(-1)] = value;
}

function sortKeys(value) {
	if (Array.isArray(value)) return value.map(sortKeys);
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.keys(value)
				.sort()
				.map((k) => [k, sortKeys(value[k])]),
		);
	}
	return value;
}

export function extract(full) {
	const out = {
		openapi: full.openapi,
		info: {
			title: "Cloudflare Images (subset used by cloudflare-images-client)",
			version: full.info?.version ?? "unknown",
			"x-source": SOURCE_URL,
		},
		paths: {},
		components: {},
	};
	const refs = new Set();
	const missing = [];
	for (const [path, methods] of Object.entries(OPERATIONS)) {
		const pathItem = full.paths?.[path];
		for (const method of methods) {
			const op = pathItem?.[method];
			if (!op) {
				// Recorded rather than thrown so the drift workflow can report it.
				missing.push(`${method.toUpperCase()} ${path}`);
				continue;
			}
			out.paths[path] ??= {};
			out.paths[path][method] = op;
			collectRefs(full, op, refs);
		}
		if (pathItem?.parameters && out.paths[path]) {
			out.paths[path].parameters = pathItem.parameters;
			collectRefs(full, pathItem.parameters, refs);
		}
	}
	for (const ref of refs) setPointer(out, ref, resolvePointer(full, ref));
	if (missing.length) out["x-missing-operations"] = missing;
	return sortKeys(out);
}

const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isMain) {
	const source = process.argv[2] ?? SOURCE_URL;
	const subset = extract(await loadSpec(source));
	await mkdir(new URL(".", OUTPUT), { recursive: true });
	await writeFile(OUTPUT, `${JSON.stringify(subset, null, "\t")}\n`);
	for (const op of subset["x-missing-operations"] ?? []) {
		console.warn(`WARNING: ${op} is no longer in Cloudflare's spec`);
	}
	const count = Object.values(OPERATIONS).flat().length;
	const schemas = Object.keys(subset.components.schemas ?? {}).length;
	console.log(
		`Wrote ${OUTPUT.pathname}: ${count} operations, ${schemas} schemas`,
	);
}
