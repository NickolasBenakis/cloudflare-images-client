import { http } from "msw";
import { CLOUDFLARE_BASE_URL } from "../../config";
import { failure, success, variant } from "../fixtures";

const base = `${CLOUDFLARE_BASE_URL}/accounts/:accountId/images/v1/variants`;

export const variantHandlers = [
	http.get(base, () =>
		success({
			variants: { public: variant("public"), thumbnail: variant("thumbnail") },
		}),
	),
	http.post(base, async ({ request }) => {
		const body = (await request.json()) as { id?: string };
		if (!body?.id) return failure(400, 5400, "Variant id is required");
		return success({ variant: { ...variant(body.id), ...body } });
	}),
	http.get(`${base}/:variantId`, ({ params }) => {
		if (params.variantId === "not-found") {
			return failure(404, 5404, "Variant not found");
		}
		return success({ variant: variant(String(params.variantId)) });
	}),
	http.patch(`${base}/:variantId`, async ({ params, request }) => {
		const body = (await request.json()) as Record<string, unknown>;
		return success({
			variant: { ...variant(String(params.variantId)), ...body },
		});
	}),
	http.delete(`${base}/:variantId`, ({ params }) => {
		if (params.variantId === "not-found") {
			return failure(404, 5404, "Variant not found");
		}
		return success({});
	}),
];
