import { http, HttpResponse } from "msw";
import { CLOUDFLARE_BASE_URL } from "../../config";
import { CloudflareImageStatsResponse } from "../../lib/cloudflareImagesClient";

export const getImageStats = http.get<
	{ accountId: string },
	CloudflareImageStatsResponse
>(`${CLOUDFLARE_BASE_URL}/accounts/:accountId/images/v1/stats`, async () => {
	return HttpResponse.json({
		errors: [],
		messages: [],
		success: true,
		result: {
			count: {
				allowed: 1000,
				current: 100,
			},
		},
	});
});
