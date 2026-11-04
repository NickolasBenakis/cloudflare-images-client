// Contract tests: every request the client sends and every response our MSW
// mocks return must match Cloudflare's published OpenAPI spec (pinned in
// openapi/cloudflare-images.json, refreshed by `npm run openapi:update`).
import { readFileSync } from "node:fs";
import path from "node:path";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
} from "vitest";
import { CloudflareImagesClient } from "../src/index";
import { server } from "../src/mocks/node";
import {
	type Exchange,
	formDataToObject,
	spec,
	validateExchange,
} from "./helpers/openapiContract";

const client = new CloudflareImagesClient({
	accountId: "023e105f4ecef8ad9ca31a8372d0c353",
	apiToken: "test-api-token",
});
const imagePath = path.join(__dirname, "images", "test.png");

let exchanges: Exchange[] = [];
let listenerErrors: unknown[] = [];
const pending = new Map<
	string,
	Promise<Omit<Exchange, "status" | "responseContentType" | "responseBody">>
>();

async function readRequest(request: Request) {
	const contentType = request.headers.get("content-type");
	let requestBody: unknown;
	if (contentType?.startsWith("multipart/form-data")) {
		requestBody = formDataToObject(await request.formData());
	} else {
		const text = await request.text();
		if (text) requestBody = JSON.parse(text);
	}
	return {
		method: request.method,
		url: new URL(request.url),
		contentType,
		requestBody,
	};
}

beforeAll(() => {
	server.events.on("request:start", ({ request, requestId }) => {
		pending.set(requestId, readRequest(request.clone()));
	});
	server.events.on("response:mocked", async ({ response, requestId }) => {
		const req = pending.get(requestId);
		if (!req) return;
		pending.delete(requestId);
		try {
			const responseContentType = response.headers.get("content-type");
			const responseBody = responseContentType?.includes("json")
				? await response.clone().json()
				: undefined;
			exchanges.push({
				...(await req),
				status: response.status,
				responseContentType,
				responseBody,
			});
		} catch (error) {
			listenerErrors.push(error);
		}
	});
});

afterAll(() => {
	server.events.removeAllListeners();
});

beforeEach(() => {
	exchanges = [];
	listenerErrors = [];
});

/** Waits for MSW's async event handlers, then asserts exactly one conforming exchange. */
async function expectConforms() {
	await expect.poll(() => exchanges.length + listenerErrors.length).toBe(1);
	expect(listenerErrors).toEqual([]);
	expect(validateExchange(exchanges[0])).toEqual([]);
}

describe("Cloudflare Images API contract", () => {
	test("pinned spec covers every operation the client uses", () => {
		const operations = Object.entries(spec.paths).flatMap(([p, item]) =>
			Object.keys(item)
				.filter((m) => m !== "parameters")
				.map((m) => `${m.toUpperCase()} ${p}`),
		);
		expect(operations.sort()).toMatchInlineSnapshot(`
			[
			  "DELETE /accounts/{account_id}/images/v1/variants/{variant_id}",
			  "DELETE /accounts/{account_id}/images/v1/{image_id}",
			  "GET /accounts/{account_id}/images/v1/keys",
			  "GET /accounts/{account_id}/images/v1/stats",
			  "GET /accounts/{account_id}/images/v1/variants",
			  "GET /accounts/{account_id}/images/v1/variants/{variant_id}",
			  "GET /accounts/{account_id}/images/v1/{image_id}",
			  "GET /accounts/{account_id}/images/v1/{image_id}/blob",
			  "GET /accounts/{account_id}/images/v2",
			  "PATCH /accounts/{account_id}/images/v1/variants/{variant_id}",
			  "PATCH /accounts/{account_id}/images/v1/{image_id}",
			  "POST /accounts/{account_id}/images/v1",
			  "POST /accounts/{account_id}/images/v1/variants",
			  "POST /accounts/{account_id}/images/v2/direct_upload",
			]
		`);
	});

	test("uploadImageFromUrl", async () => {
		await client.uploadImageFromUrl({
			url: "https://example.com/image.png",
			metadata: { key: "value" },
			requireSignedURLs: true,
		});
		await expectConforms();
	});

	test("uploadImageFromUrl error", async () => {
		await client.uploadImageFromUrl({ url: "" });
		await expectConforms();
	});

	test("uploadImageFromFile with filePath", async () => {
		await client.uploadImageFromFile({ filePath: imagePath, metadata: {} });
		await expectConforms();
	});

	test("uploadImageFromFile with Blob", async () => {
		await client.uploadImageFromFile({
			file: new Blob([readFileSync(imagePath)], { type: "image/png" }),
			fileName: "test.png",
		});
		await expectConforms();
	});

	test("getImageStatistics", async () => {
		await client.getImageStatistics();
		await expectConforms();
	});

	test("getImageDetails", async () => {
		await client.getImageDetails("id");
		await expectConforms();
	});

	test("getImageDetails error", async () => {
		await client.getImageDetails("not-found");
		await expectConforms();
	});

	test("getImageAsBlob", async () => {
		await client.getImageAsBlob("image-id");
		await expectConforms();
	});

	test("listImages with defaults", async () => {
		await client.listImages();
		await expectConforms();
	});

	test("listImages with all query params", async () => {
		await client.listImages({
			continuationToken: "token",
			per_page: 100,
			sort_order: "asc",
		});
		await expectConforms();
	});

	test("updateImage", async () => {
		await client.updateImage("image-id", {
			metadata: { key: "value" },
			requireSignedURLs: false,
		});
		await expectConforms();
	});

	test("deleteOneImage", async () => {
		await client.deleteOneImage("image-id");
		await expectConforms();
	});

	test("deleteOneImage error", async () => {
		await client.deleteOneImage("not-found");
		await expectConforms();
	});

	test("createDirectUpload with defaults", async () => {
		await client.createDirectUpload();
		await expectConforms();
	});

	test("createDirectUpload with every option", async () => {
		await client.createDirectUpload({
			id: "user-avatar-123",
			metadata: { owner: "user_123" },
			// Custom IDs can't require signed URLs, so keep this false here.
			requireSignedURLs: false,
			expiry: new Date(Date.now() + 10 * 60 * 1000),
			creator: "user_123",
		});
		await expectConforms();
	});

	test("createDirectUpload for a private image", async () => {
		await client.createDirectUpload({ requireSignedURLs: true });
		await expectConforms();
	});

	test("listVariants", async () => {
		await client.listVariants();
		await expectConforms();
	});

	test("getVariant", async () => {
		await client.getVariant("thumbnail");
		await expectConforms();
	});

	test("getVariant error", async () => {
		await client.getVariant("not-found");
		await expectConforms();
	});

	test("createVariant", async () => {
		await client.createVariant({
			id: "hero",
			options: { fit: "cover", width: 1920, height: 1080, metadata: "none" },
			neverRequireSignedURLs: true,
		});
		await expectConforms();
	});

	test("updateVariant", async () => {
		await client.updateVariant("hero", {
			options: { fit: "contain", width: 1280, height: 720, metadata: "keep" },
		});
		await expectConforms();
	});

	test("deleteVariant", async () => {
		await client.deleteVariant("hero");
		await expectConforms();
	});

	test("listSigningKeys", async () => {
		await client.listSigningKeys();
		await expectConforms();
	});
});
