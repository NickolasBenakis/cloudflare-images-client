import { http, HttpResponse } from "msw";
import { CLOUDFLARE_BASE_URL } from "../../config";
import { CloudflareImageResponse } from "../../lib/cloudflareImagesClient";

export const getImageDetails = http.get<
	{ accountId: string; imageId: string },
	CloudflareImageResponse
>(
	`${CLOUDFLARE_BASE_URL}/accounts/:accountId/images/v1/:imageId`,
	async ({ params }) => {
		const { imageId } = params;

		if (imageId === "id") {
			return HttpResponse.json({
				errors: [],
				messages: [],
				success: true,
				result: {
					filename: "string",
					id: "string",
					meta: {
						string: "string",
					},
					requireSignedURLs: false,
					uploaded: "string",
					variants: ["string"],
				},
			});
		}

		return HttpResponse.json({
			errors: [
				{
					code: 7003,
					message: "No image found",
				},
			],
			messages: [],
			success: false,
			result: null,
		});
	},
);
