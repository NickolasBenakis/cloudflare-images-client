import { describe, expect, test } from "vitest";
import { CloudflareImagesClient } from "../src/index";

const client = new CloudflareImagesClient({
	accountId: "test-account-id",
	apiToken: "test-api-token",
});

describe("createDirectUpload", () => {
	test("returns the draft image ID and a one-time upload URL", async () => {
		const res = await client.createDirectUpload({ id: "avatar-1" });
		expect(res.success).toBe(true);
		expect(res.result?.id).toBe("avatar-1");
		expect(res.result?.uploadURL).toMatch(
			/^https:\/\/upload\.imagedelivery\.net\/.+\/avatar-1$/,
		);
	});
});

describe("variants", () => {
	test("listVariants returns variants keyed by name", async () => {
		const res = await client.listVariants();
		expect(Object.keys(res.result?.variants ?? {})).toEqual([
			"public",
			"thumbnail",
		]);
	});

	test("create, get, update and delete", async () => {
		const options = {
			fit: "cover",
			width: 400,
			height: 300,
			metadata: "none",
		} as const;
		const created = await client.createVariant({ id: "card", options });
		expect(created.result?.variant.id).toBe("card");

		const fetched = await client.getVariant("card");
		expect(fetched.result?.variant.id).toBe("card");

		const updated = await client.updateVariant("card", {
			options: { ...options, width: 800 },
		});
		expect(updated.result?.variant.options.width).toBe(800);

		const deleted = await client.deleteVariant("card");
		expect(deleted.success).toBe(true);
	});

	test("API errors resolve with success: false", async () => {
		const res = await client.getVariant("not-found");
		expect(res.success).toBe(false);
		expect(res.errors[0]?.message).toBe("Variant not found");
	});

	test("an empty variant ID throws before any request", async () => {
		await expect(client.getVariant("")).rejects.toThrow(
			"Variant ID is required",
		);
		await expect(client.deleteVariant("")).rejects.toThrow(
			"Variant ID is required",
		);
	});
});

describe("listSigningKeys", () => {
	test("returns the account's signing keys", async () => {
		const res = await client.listSigningKeys();
		expect(res.result?.keys[0]?.name).toBe("default");
	});
});
