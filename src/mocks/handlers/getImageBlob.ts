import { HttpResponse, http } from "msw";
import { CLOUDFLARE_BASE_URL } from "../../config";
import { failure } from "../fixtures";

export const getImageBlob = http.get(
	`${CLOUDFLARE_BASE_URL}/accounts/:accountId/images/v1/:imageId/blob`,
	({ params }) => {
		if (params.imageId === "not-found") {
			return failure(404, 5404, "Image not found");
		}
		return new HttpResponse(new Blob([new Uint8Array([0xff, 0xd8, 0xff])]), {
			headers: { "Content-Type": "image/jpeg" },
		});
	},
);
