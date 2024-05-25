import { HttpResponse, http } from "msw";
import { CLOUDFLARE_BASE_URL } from "../../config";

export const deleteImage = http.delete<{ accountId: string; imageId: string }>(
	`${CLOUDFLARE_BASE_URL}/accounts/:accountId/images/v1/:imageId`,
	({ params }) => {
		const { imageId } = params;

		if (imageId === "not-found") {
			return HttpResponse.json({
				success: false,
				result: null,
				errors: [
					{
						code: 7003,
						message: "Image not found",
					},
				],
				messages: [],
			});
		}

		return HttpResponse.json({
			success: true,
			result: null,
			errors: [],
			messages: [],
		});
	},
);
