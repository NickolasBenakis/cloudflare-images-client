import { http, HttpResponse } from "msw";
import { CLOUDFLARE_BASE_URL } from "../../config";
import type { CloudflareImageResponse } from "../../lib/cloudflareImagesClient";

export const createImage = http.post<
	{ accountId: string },
	{
		url: string;
	},
	CloudflareImageResponse
>(
	`${CLOUDFLARE_BASE_URL}/accounts/:accountId/images/v1`,
	async ({ request }) => {
		const data = await request.formData();
		const url = data.get("url");
		const file = data.get("file");

		if (url || file) {
			return HttpResponse.json({
				errors: [],
				messages: [],
				success: true,
				result: {
					filename: "filename",
					id: "id",
					meta: {
						key: "value",
					},
					requireSignedURLs: false,
					uploaded: "uploaded",
					variants: ["variant"],
				},
			});
		}

		if (!url) {
			return HttpResponse.json({
				errors: [
					{
						code: 7003,
						message: "No route for the URI",
					},
				],
				messages: [],
				success: false,
				result: null,
			});
		}

		return HttpResponse.json({
			errors: [
				{
					code: 7003,
					message: "No file",
				},
			],
			messages: [],
			success: false,
			result: null,
		});
	},
);
