import { http, HttpResponse } from "msw";
import { CLOUDFLARE_BASE_URL } from "../../config";

export const getImageList = http.get<
	{ accountId: string },
	{
		continuationToken?: string | null;
		per_page?: number;
		sort_order?: "asc" | "desc";
	}
>(`${CLOUDFLARE_BASE_URL}/accounts/:accountId/images/v2`, async () => {
	return HttpResponse.json({
		errors: [],
		messages: [],
		success: true,
		result: {
			continuation_token: "string",
			images: [
				{
					filename: "string",
					id: "string",
					meta: {
						string: "string",
					},
					requireSignedURLs: false,
					uploaded: "string",
					variants: ["string"],
				},
			],
		},
	});
});
