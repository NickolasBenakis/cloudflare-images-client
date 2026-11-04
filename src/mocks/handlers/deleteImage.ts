import { http } from "msw";
import { CLOUDFLARE_BASE_URL } from "../../config";
import { failure, success } from "../fixtures";

export const deleteImage = http.delete(
	`${CLOUDFLARE_BASE_URL}/accounts/:accountId/images/v1/:imageId`,
	({ params }) => {
		if (params.imageId === "not-found") {
			return failure(404, 5404, "Image not found");
		}
		return success({});
	},
);
