require("dotenv").config();
import { describe, expect, test } from "vitest";
import { CloudflareImagesClient } from "../src/index";

describe("Cloudflare Client", async () => {
	const cloudflareClient = new CloudflareImagesClient({
		accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
		apiToken: process.env.CLOUDFLARE_API_TOKEN || "",
	});
	let uploadedTestImageId = "";

	describe("uploadImage From Url", async () => {
		test("success response", async () => {
			const response = await cloudflareClient.uploadImageFromUrl({
				url: "https://images.squarespace-cdn.com/content/v1/60f1a490a90ed8713c41c36c/1629223610791-LCBJG5451DRKX4WOB4SP/37-design-powers-url-structure.jpeg",
			});

			expect(response.errors).toEqual([]);
			expect(response.messages).toEqual([]);
			expect(response.success).toBe(true);
			expect(response.result.filename).toBeTypeOf("string");
			expect(response.result.id).toBeTypeOf("string");
			expect(response.result.meta).toBeTypeOf("object");
			expect(response.result.requireSignedURLs).toBe(false);
			expect(response.result.uploaded).toBeTypeOf("string");
			expect(response.result.variants.length).toBeGreaterThan(0);

			uploadedTestImageId = response.result.id;
		});

		test("error response", async () => {
			const response = await cloudflareClient.uploadImageFromUrl({
				url: "",
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
			const response =
				await cloudflareClient.getImageDetails(uploadedTestImageId);

			expect(response.errors).toEqual([]);
			expect(response.messages).toEqual([]);
			expect(response.success).toBe(true);
			expect(response.result.filename).toBeTypeOf("string");
			expect(response.result.id).toBeTypeOf("string");
			expect(response.result.meta).toBeTypeOf("object");
			expect(response.result.requireSignedURLs).toBe(false);
			expect(response.result.uploaded).toBeTypeOf("string");
			expect(response.result.variants.length).toBeGreaterThan(0);
		});

		test("error response with no image url", async () => {
			const response = await cloudflareClient.getImageDetails("");

			expect(response.errors.length).toBeGreaterThan(0);
		});
	});

	describe("get Image blob", async () => {
		test("success response", async () => {
			const response =
				await cloudflareClient.getImageAsBlob(uploadedTestImageId);

			expect(response).toBeTypeOf("object");
			expect(response.type).includes("image");
		});

		test("error response with no image url", async () => {
			try {
				const response = await cloudflareClient.getImageAsBlob("");
			} catch (error) {
				expect(Error(error).message).toEqual("Error: Image ID is required");
			}
		});
	});

	describe("list images", async () => {
		test("success response without query params", async () => {
			const response = await cloudflareClient.listImages();

			expect(response.errors).toEqual([]);
			expect(response.messages).toEqual([]);
			expect(response.success).toBe(true);
			expect(response.result?.continuation_token).oneOf(["string", null]);
			expect(response.result?.images).toBeTypeOf("object");
			expect(response.result?.images.length).toBeGreaterThanOrEqual(0);
		});
	});

	// describe.skip("Upload Image from file", () => {
	// 	test.skip("uploadImage From File", async () => {
	// 		const paola = path.join(__dirname, "images", "test.png");
	// 		const paolablob = new Blob([paola]);
	// 		console.log("paola", paola);
	// 		const response = await cloudflareClient.uploadImageFromFile({
	// 			filePath: paola,
	// 			metadata: {},
	// 		});

	// 		expect(response.errors).toEqual([]);
	// 		expect(response.messages).toEqual([]);
	// 		expect(response.success).toBe(true);
	// 		expect(response.result.filename).toBeTypeOf("string");
	// 		expect(response.result.id).toBeTypeOf("string");
	// 		expect(response.result.meta).toBeTypeOf("object");
	// 		expect(response.result.requireSignedURLs).toBe(false);
	// 		expect(response.result.uploaded).toBeTypeOf("string");
	// 		expect(response.result.variants.length).toBeGreaterThan(0);
	// 	});
	// });

	describe("Update Image", async () => {
		test("success response", async () => {
			const response = await cloudflareClient.updateImage(uploadedTestImageId, {
				metadata: {
					key: "value",
				},
			});

			expect(response.errors).toEqual([]);
			expect(response.messages).toEqual([]);
			expect(response.success).toBe(true);
			expect(response.result.filename).toBeTypeOf("string");
			expect(response.result.id).toBeTypeOf("string");
			expect(response.result.meta).toEqual({ key: "value" });
			expect(response.result.requireSignedURLs).toBe(false);
			expect(response.result.uploaded).toBeTypeOf("string");
			expect(response.result.variants.length).toBeGreaterThan(0);
		});

		test("error response with no image url", async () => {
			const response = await cloudflareClient.updateImage("", {
				metadata: {
					key: "value",
				},
			});

			expect(response.errors.length).toBeGreaterThan(0);
		});
	});

	describe("Delete  One Image", async () => {
		test("success response", async () => {
			const response =
				await cloudflareClient.deleteOneImage(uploadedTestImageId);

			expect(response.errors).toEqual([]);
			expect(response.messages).toEqual([]);
			expect(response.success).toBe(true);
		});

		test("error response with no image url", async () => {
			const response = await cloudflareClient.deleteOneImage("");

			expect(response.errors.length).toBeGreaterThan(0);
		});
	});
});
