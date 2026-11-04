import { http } from "msw";
import { CLOUDFLARE_BASE_URL } from "../../config";
import { failure, image, success } from "../fixtures";

export const getImageDetails = http.get(
	`${CLOUDFLARE_BASE_URL}/accounts/:accountId/images/v1/:imageId`,
	({ params }) => {
		if (params.imageId === "not-found") {
			return failure(404, 5404, "Image not found");
		}
		return success(image(String(params.imageId)));
	},
);
