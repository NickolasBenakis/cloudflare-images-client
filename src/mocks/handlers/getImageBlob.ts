import { http, HttpResponse } from "msw";
import { CLOUDFLARE_BASE_URL } from "../../config";

export const getImageBlob = http.get<
	{ accountId: string; imageId: string },
	Blob
>(
	`${CLOUDFLARE_BASE_URL}/accounts/:accountId/images/v1/:imageId/blob`,
	async ({ params }) => {
		if (!params.imageId) {
			return new HttpResponse("Error: Image ID is required", {
				status: 400,
			});
		}

		return new HttpResponse(new Blob(), {
			headers: {
				"Content-Type": "image/jpeg",
			},
		});
	},
);
