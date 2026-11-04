import { http } from "msw";
import { CLOUDFLARE_BASE_URL } from "../../config";
import { failure, image, success } from "../fixtures";

export const createImage = http.post(
	`${CLOUDFLARE_BASE_URL}/accounts/:accountId/images/v1`,
	async ({ request }) => {
		const data = await request.formData();
		if (data.get("url") || data.get("file")) {
			return success(image());
		}
		return failure(400, 5400, "Bad request: either url or file is required");
	},
);
