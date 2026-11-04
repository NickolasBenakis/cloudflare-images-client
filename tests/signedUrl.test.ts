import { createHmac } from "node:crypto";
import { afterEach, describe, expect, test, vi } from "vitest";
import { imageDeliveryUrl, signImageUrl } from "../src/index";

const KEY = "Oix0bbNaT8Rge9PuyxUBrjI6zrgnsyJ5";
const URL_ = "https://imagedelivery.net/ZWd9g1K7eljCn_KDTu_MWA/abc-123/public";

/** Independent reference implementation of Cloudflare's documented algorithm. */
function referenceSign(url: string, key: string, exp: number) {
	const u = new URL(url);
	u.searchParams.set("exp", String(exp));
	const sig = createHmac("sha256", key)
		.update(`${u.pathname}?${u.searchParams.toString()}`)
		.digest("hex");
	u.searchParams.set("sig", sig);
	return u.toString();
}

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe("signImageUrl", () => {
	test("matches Cloudflare's algorithm for a fixed expiry", async () => {
		const signed = await signImageUrl(URL_, {
			key: KEY,
			expiresAt: 1_900_000_000,
		});
		expect(signed).toBe(referenceSign(URL_, KEY, 1_900_000_000));
		expect(new URL(signed).searchParams.get("sig")).toMatch(/^[0-9a-f]{64}$/);
	});

	test("defaults to one hour from now", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
		const signed = new URL(await signImageUrl(URL_, { key: KEY }));
		expect(Number(signed.searchParams.get("exp"))).toBe(
			Date.parse("2026-01-01T01:00:00Z") / 1000,
		);
	});

	test("supports expiresIn and Date expiresAt", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
		const inFiveMinutes = new URL(
			await signImageUrl(URL_, { key: KEY, expiresIn: 300 }),
		);
		expect(inFiveMinutes.searchParams.get("exp")).toBe(
			String(Date.parse("2026-01-01T00:05:00Z") / 1000),
		);
		const byDate = await signImageUrl(URL_, {
			key: KEY,
			expiresAt: new Date("2030-06-01T00:00:00Z"),
		});
		expect(byDate).toBe(
			referenceSign(URL_, KEY, Date.parse("2030-06-01T00:00:00Z") / 1000),
		);
	});

	test("signs existing query parameters and replaces an old signature", async () => {
		const withQuery = `${URL_}?foo=bar&sig=stale`;
		const signed = await signImageUrl(withQuery, {
			key: KEY,
			expiresAt: 2_000_000_000,
		});
		expect(signed).toBe(referenceSign(`${URL_}?foo=bar`, KEY, 2_000_000_000));
		expect(new URL(signed).searchParams.getAll("sig")).toHaveLength(1);
	});

	test("accepts a URL object", async () => {
		const signed = await signImageUrl(new URL(URL_), {
			key: KEY,
			expiresAt: 1_900_000_000,
		});
		expect(signed).toBe(referenceSign(URL_, KEY, 1_900_000_000));
	});

	test("falls back to node:crypto when Web Crypto isn't global (Node 18)", async () => {
		vi.stubGlobal("crypto", undefined);
		const signed = await signImageUrl(URL_, {
			key: KEY,
			expiresAt: 1_900_000_000,
		});
		expect(signed).toBe(referenceSign(URL_, KEY, 1_900_000_000));
	});

	test("rejects a missing key or invalid expiry", async () => {
		await expect(signImageUrl(URL_, { key: "" })).rejects.toThrow(
			"signing key",
		);
		await expect(
			signImageUrl(URL_, { key: KEY, expiresIn: 0 }),
		).rejects.toThrow("expiresIn");
		await expect(
			signImageUrl(URL_, { key: KEY, expiresAt: new Date("nope") }),
		).rejects.toThrow("expiresAt");
	});
});

describe("imageDeliveryUrl", () => {
	test("builds an imagedelivery.net URL", () => {
		expect(
			imageDeliveryUrl({
				accountHash: "ZWd9g1K7eljCn_KDTu_MWA",
				imageId: "abc-123",
				variant: "public",
			}),
		).toBe(URL_);
	});

	test("supports a custom base URL and encodes segments", () => {
		expect(
			imageDeliveryUrl({
				accountHash: "hash",
				imageId: "folder/image 1",
				variant: "w=400",
				baseUrl: "https://images.example.com/cdn-cgi/imagedelivery/",
			}),
		).toBe(
			"https://images.example.com/cdn-cgi/imagedelivery/hash/folder%2Fimage%201/w%3D400",
		);
	});

	test("requires every part", () => {
		expect(() =>
			imageDeliveryUrl({ accountHash: "", imageId: "a", variant: "public" }),
		).toThrow("required");
	});
});
