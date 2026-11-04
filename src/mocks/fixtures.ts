// Shared mock payloads. Shapes follow Cloudflare's OpenAPI spec, which the
// contract tests in tests/contract.test.ts enforce.
import { HttpResponse } from "msw";

export const ACCOUNT_HASH = "ZWd9g1K7eljCn_KDTu_MWA";

export function image(id = "id") {
	return {
		filename: "logo.png",
		id,
		meta: { key: "value" },
		requireSignedURLs: false,
		uploaded: "2024-05-25T10:00:00.000Z",
		variants: [`https://imagedelivery.net/${ACCOUNT_HASH}/${id}/public`],
	};
}

export function success<T>(result: T) {
	return HttpResponse.json({ errors: [], messages: [], success: true, result });
}

export function failure(status: number, code: number, message: string) {
	return HttpResponse.json(
		{ errors: [{ code, message }], messages: [], success: false, result: null },
		{ status },
	);
}
