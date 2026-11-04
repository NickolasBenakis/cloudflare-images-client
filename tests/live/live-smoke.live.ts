// Live smoke test against the real Cloudflare API. Not part of `npm test`.
//
//   cp .env.live.example .env.live   # fill in, never commit
//   npm run smoke:live
//
// Every real API response is also validated against the pinned OpenAPI spec.
// Steps that need the paid Images plan are reported as "not on this plan"
// instead of failing, so the script runs free. Everything it creates is named
// `cfic-smoke-*` and deleted at the end.
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { CLOUDFLARE_BASE_URL } from "../../src/config";
import { CloudflareImagesClient, signImageUrl } from "../../src/index";
import {
	type Exchange,
	formDataToObject,
	validateExchange,
} from "../helpers/openapiContract";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
const apiToken = process.env.CLOUDFLARE_API_TOKEN ?? "";
if (!accountId || !apiToken) {
	throw new Error(
		"Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (see .env.live.example)",
	);
}

const RUN = `cfic-smoke-${Date.now().toString(36)}`;
const client = new CloudflareImagesClient({ accountId, apiToken });
const imageBytes = readFileSync(
	path.join(__dirname, "..", "images", "test.png"),
);

// --- Record every Cloudflare API exchange and check it against the spec ----
const violations: string[] = [];
let realFetch: typeof fetch;

async function snapshotBody(
	body: BodyInit | null | undefined,
	contentType: string | null,
) {
	if (body == null) return undefined;
	if (body instanceof FormData) return formDataToObject(body);
	if (typeof body === "string")
		return contentType?.includes("json") ? JSON.parse(body) : body;
	return undefined;
}

beforeAll(() => {
	realFetch = globalThis.fetch;
	globalThis.fetch = async (input, init) => {
		const response = await realFetch(input, init);
		const url = new URL(input instanceof Request ? input.url : String(input));
		if (!url.href.startsWith(CLOUDFLARE_BASE_URL)) return response;
		const headers = new Headers(init?.headers);
		const responseContentType = response.headers.get("content-type");
		const exchange: Exchange = {
			method: init?.method ?? "GET",
			url,
			contentType:
				init?.body instanceof FormData
					? "multipart/form-data"
					: headers.get("content-type"),
			requestBody: await snapshotBody(init?.body, headers.get("content-type")),
			status: response.status,
			responseContentType,
			responseBody: responseContentType?.includes("json")
				? await response.clone().json()
				: undefined,
		};
		for (const problem of validateExchange(exchange)) violations.push(problem);
		return response;
	};
});

// --- Track and clean up everything this run creates ------------------------
const createdImages = new Set<string>();
const createdVariants = new Set<string>();
const planGated: string[] = [];

afterAll(async () => {
	for (const id of createdImages)
		await client.deleteOneImage(id).catch(() => {});
	for (const id of createdVariants)
		await client.deleteVariant(id).catch(() => {});
	globalThis.fetch = realFetch;

	console.log(`\n── Live smoke summary (${RUN}) ──`);
	console.log(
		`Cleaned up: ${createdImages.size} image(s), ${createdVariants.size} variant(s)`,
	);
	if (planGated.length) {
		console.log("Not available on this plan (skipped, not failures):");
		for (const line of planGated) console.log(`  - ${line}`);
	}
	console.log(
		violations.length
			? `Spec violations in real responses:\n  - ${violations.join("\n  - ")}`
			: "Every real API response matched the pinned OpenAPI spec.",
	);
});

type Envelope = {
	success: boolean;
	errors: { code: number; message: string }[];
};

/**
 * Cloudflare refuses plan-gated features with an auth/permission-style error.
 * We can't know every code, so anything that isn't success is treated as
 * "not on this plan" only for calls that need paid storage, and printed raw.
 */
function skipIfPlanGated(
	res: Envelope,
	step: string,
	ctx: { skip: (note?: string) => void },
) {
	if (res.success) return;
	const detail = res.errors.map((e) => `${e.code}: ${e.message}`).join("; ");
	planGated.push(`${step} → ${detail || "no error details"}`);
	ctx.skip(`${step} not available: ${detail}`);
}

function expectNoViolations() {
	expect(violations, "real API responses must match the pinned spec").toEqual(
		[],
	);
}

describe(`live Cloudflare Images API (${RUN})`, () => {
	test("credentials work and stats match the spec", async (ctx) => {
		const res = await client.getImageStatistics();
		expectNoViolations();
		// 5403 = account isn't subscribed to Images storage (free plan).
		skipIfPlanGated(res, "getImageStatistics", ctx);
		expect(typeof res.result.count.allowed).toBe("number");
	});

	test("listVariants and listSigningKeys", async (ctx) => {
		const variants = await client.listVariants();
		const keys = await client.listSigningKeys();
		expectNoViolations();
		skipIfPlanGated(variants, "listVariants", ctx);
		skipIfPlanGated(keys, "listSigningKeys", ctx);
		expect(variants.result?.variants).toBeTypeOf("object");
		expect(Array.isArray(keys.result?.keys)).toBe(true);
	});

	test("direct creator upload: create URL, upload from 'browser', image becomes ready", async (ctx) => {
		const res = await client.createDirectUpload({
			metadata: { run: RUN },
			expiry: new Date(Date.now() + 5 * 60 * 1000),
		});
		expectNoViolations();
		skipIfPlanGated(res, "createDirectUpload", ctx);
		const { id, uploadURL } = res.result!;
		createdImages.add(id);

		// What a browser does: plain multipart POST, field "file", no auth header.
		const form = new FormData();
		form.append(
			"file",
			new Blob([imageBytes], { type: "image/png" }),
			`${RUN}.png`,
		);
		const upload = await realFetch(uploadURL, { method: "POST", body: form });
		expect(upload.status).toBe(200);
		expect(((await upload.json()) as Envelope).success).toBe(true);

		const details = await client.getImageDetails(id);
		expect(details.success).toBe(true);
		expect(details.result?.id).toBe(id);
		expectNoViolations();
	});

	test("signed URLs: valid signature 200, tampered 403, unsigned 403", async (ctx) => {
		const upload = await client.uploadImageFromFile({
			file: new Blob([imageBytes], { type: "image/png" }),
			fileName: `${RUN}-private.png`,
			requireSignedURLs: true,
			metadata: { run: RUN },
		});
		expectNoViolations();
		skipIfPlanGated(upload, "uploadImageFromFile (private)", ctx);
		createdImages.add(upload.result!.id);
		const variantUrl = upload.result!.variants[0];

		let key = process.env.CLOUDFLARE_IMAGES_SIGNING_KEY;
		if (!key) {
			const keys = await client.listSigningKeys();
			key = keys.result?.keys[0]?.value;
		}
		expect(key, "need a signing key (env or listSigningKeys)").toBeTruthy();

		const signed = await signImageUrl(variantUrl, {
			key: key!,
			expiresIn: 300,
		});
		const ok = await realFetch(signed);
		expect(ok.status).toBe(200);
		expect(ok.headers.get("content-type")).toMatch(/^image\//);

		const tampered = new URL(signed);
		const sig = tampered.searchParams.get("sig")!;
		tampered.searchParams.set(
			"sig",
			(sig[0] === "0" ? "1" : "0") + sig.slice(1),
		);
		expect((await realFetch(tampered)).status).toBe(403);

		expect((await realFetch(variantUrl)).status).toBe(403);
	});

	test("variants: create, update, get, delete", async (ctx) => {
		const id = RUN.replace(/-/g, "");
		const created = await client.createVariant({
			id,
			options: { fit: "cover", width: 120, height: 120, metadata: "none" },
		});
		expectNoViolations();
		skipIfPlanGated(created, "createVariant", ctx);
		createdVariants.add(id);

		const updated = await client.updateVariant(id, {
			options: { fit: "contain", width: 160, height: 90, metadata: "none" },
		});
		expect(updated.success).toBe(true);
		expect(updated.result?.variant.options.width).toBe(160);

		const fetched = await client.getVariant(id);
		expect(fetched.result?.variant.options.fit).toBe("contain");

		const deleted = await client.deleteVariant(id);
		expect(deleted.success).toBe(true);
		createdVariants.delete(id);
		expectNoViolations();
	});

	test("deleted resources are really gone", async () => {
		for (const id of [...createdImages]) {
			const res = await client.deleteOneImage(id);
			expect(res.success).toBe(true);
			createdImages.delete(id);
			const gone = await client.getImageDetails(id);
			expect(gone.success).toBe(false);
		}
		expectNoViolations();
	});
});
