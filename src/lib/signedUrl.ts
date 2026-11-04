// Signed URLs for private Cloudflare Images (images uploaded with
// `requireSignedURLs: true`). Implements Cloudflare's documented algorithm:
// HMAC-SHA256 over `pathname?query` (including `exp`), hex-encoded into `sig`.
// https://developers.cloudflare.com/images/manage-images/serve-images/serve-private-images/

export const IMAGE_DELIVERY_BASE_URL = "https://imagedelivery.net";

const DEFAULT_EXPIRES_IN_SECONDS = 60 * 60;

export interface ImageDeliveryUrlProps {
	/** Your account hash, shown on the Images dashboard. Not the account ID. */
	accountHash: string;
	imageId: string;
	/** Variant name, e.g. `"public"`. */
	variant: string;
	/** Defaults to `https://imagedelivery.net`. */
	baseUrl?: string;
}

export interface SignImageUrlOptions {
	/** A signing key value from the Images dashboard (Keys) or `listSigningKeys()`. */
	key: string;
	/** Seconds from now until the URL stops working. Defaults to 3600 (1 hour). */
	expiresIn?: number;
	/** Absolute expiry as a `Date` or Unix timestamp in seconds. Overrides `expiresIn`. */
	expiresAt?: Date | number;
}

/** Builds an image delivery URL: `https://imagedelivery.net/<hash>/<id>/<variant>`. */
export function imageDeliveryUrl({
	accountHash,
	imageId,
	variant,
	baseUrl = IMAGE_DELIVERY_BASE_URL,
}: ImageDeliveryUrlProps): string {
	if (!accountHash || !imageId || !variant) {
		throw new Error("accountHash, imageId and variant are required");
	}
	const base = baseUrl.replace(/\/+$/, "");
	// Custom image IDs may contain "/", and flexible variants use "=" and ","
	// (e.g. "w=400,sharpen=3"). Cloudflare expects those literally.
	const id = encodeURIComponent(imageId).replace(/%2F/gi, "/");
	const variantSegment = encodeURIComponent(variant).replace(
		/%(3D|2C)/gi,
		(match) => decodeURIComponent(match),
	);
	return `${base}/${encodeURIComponent(accountHash)}/${id}/${variantSegment}`;
}

// Node 18 doesn't expose Web Crypto as a global by default. The specifier is
// kept in a variable so bundlers for other runtimes don't try to resolve it.
const NODE_CRYPTO = "node:crypto";

async function getSubtle(): Promise<SubtleCrypto> {
	const subtle = globalThis.crypto?.subtle;
	if (subtle) return subtle;
	const nodeCrypto: { webcrypto?: { subtle?: SubtleCrypto } } = await import(
		/* @vite-ignore */ /* webpackIgnore: true */ NODE_CRYPTO
	);
	if (!nodeCrypto.webcrypto?.subtle) {
		throw new Error("Web Crypto is not available in this runtime");
	}
	return nodeCrypto.webcrypto.subtle;
}

function toHex(buffer: ArrayBuffer): string {
	return Array.from(new Uint8Array(buffer), (b) =>
		b.toString(16).padStart(2, "0"),
	).join("");
}

// Unix seconds won't reach 1e11 until the year 5138, so anything larger is
// almost certainly milliseconds passed by mistake.
const MAX_UNIX_SECONDS = 1e11;

function expiryTimestamp({
	expiresAt,
	expiresIn,
}: SignImageUrlOptions): number {
	const now = Math.floor(Date.now() / 1000);
	if (expiresAt !== undefined) {
		const seconds =
			expiresAt instanceof Date
				? Math.floor(expiresAt.getTime() / 1000)
				: Math.floor(expiresAt);
		if (!Number.isFinite(seconds)) throw new Error("Invalid expiresAt");
		if (seconds > MAX_UNIX_SECONDS) {
			throw new Error(
				"expiresAt looks like milliseconds; pass a Date or Unix seconds",
			);
		}
		if (seconds <= now) throw new Error("expiresAt must be in the future");
		return seconds;
	}
	const ttl = Math.floor(expiresIn ?? DEFAULT_EXPIRES_IN_SECONDS);
	if (!Number.isFinite(ttl) || ttl < 1) {
		throw new Error("expiresIn must be at least 1 second");
	}
	return now + ttl;
}

/**
 * Signs an image delivery URL so a private image can be viewed until it expires.
 * Pass any variant URL returned by the API (`image.variants[n]`) or one built
 * with `imageDeliveryUrl()`. Run this on your server: the key must stay secret.
 */
export async function signImageUrl(
	imageUrl: string | URL,
	options: SignImageUrlOptions,
): Promise<string> {
	if (!options?.key) throw new Error("A signing key is required");
	const url = new URL(imageUrl.toString());
	url.searchParams.delete("sig");
	url.searchParams.set("exp", String(expiryTimestamp(options)));

	const subtle = await getSubtle();
	const encoder = new TextEncoder();
	const cryptoKey = await subtle.importKey(
		"raw",
		encoder.encode(options.key),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const stringToSign = `${url.pathname}?${url.searchParams.toString()}`;
	const mac = await subtle.sign(
		"HMAC",
		cryptoKey,
		encoder.encode(stringToSign),
	);
	url.searchParams.set("sig", toHex(mac));
	return url.toString();
}
