import { http } from "msw";
import { CLOUDFLARE_BASE_URL } from "../../config";
import { image, success } from "../fixtures";

export const getImageList = http.get(
	`${CLOUDFLARE_BASE_URL}/accounts/:accountId/images/v2`,
	() =>
		success({
			continuation_token: null,
			images: [image("id"), image("id-2")],
		}),
);
