import { describe } from "node:test";
import { expect, test } from "vitest";
import { cloudflareClient } from "../src/index";

describe("uploadImage From Url", async () => {
	test("success response", async () => {
		const response = await cloudflareClient.uploadImageFromUrl({
			imageUrl:
				"https://images.squarespace-cdn.com/content/v1/60f1a490a90ed8713c41c36c/1629223610791-LCBJG5451DRKX4WOB4SP/37-design-powers-url-structure.jpeg",
			metadata: {},
		});

		expect(response.errors).toEqual([]);
		expect(response.messages).toEqual([]);
		expect(response.success).toBe(true);
		expect(response.result.filename).toBeTypeOf("string");
		expect(response.result.id).toBeTypeOf("string");
		expect(response.result.meta).toEqual({});
		expect(response.result.requireSignedURLs).toBe(false);
		expect(response.result.uploaded).toBeTypeOf("string");
		expect(response.result.variants.length).toBeGreaterThan(0);
	});

	test("error response", async () => {
		const response = await cloudflareClient.uploadImageFromUrl({
			imageUrl: "",
			metadata: {},
		});

		expect(response.errors.length).toBeGreaterThan(0);
	});
});

describe("get Image statistics", async () => {
	test("success response", async () => {
		const response = await cloudflareClient.getImageStatistics();

		expect(response.errors).toEqual([]);
		expect(response.messages).toEqual([]);
		expect(response.success).toBe(true);
		expect(response.result.count.allowed).toBeTypeOf("number");
		expect(response.result.count.current).toBeTypeOf("number");
	});
});

describe("get Image details", async () => {
	test("success response", async () => {
		const response = await cloudflareClient.getImageDetails(
			process.env.CLOUDFLARE_TEST_IMAGE_ID || "",
		);

		expect(response.errors).toEqual([]);
		expect(response.messages).toEqual([]);
		expect(response.success).toBe(true);
		expect(response.result.filename).toBeTypeOf("string");
		expect(response.result.id).toBeTypeOf("string");
		expect(response.result.meta).toEqual({});
		expect(response.result.requireSignedURLs).toBe(false);
		expect(response.result.uploaded).toBeTypeOf("string");
		expect(response.result.variants.length).toBeGreaterThan(0);
	});

	test("error response with no image url", async () => {
		const response = await cloudflareClient.getImageDetails("");

		expect(response.errors.length).toBeGreaterThan(0);
	});
});
