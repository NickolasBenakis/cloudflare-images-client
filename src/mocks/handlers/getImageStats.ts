import { http } from "msw";
import { CLOUDFLARE_BASE_URL } from "../../config";
import { success } from "../fixtures";

export const getImageStats = http.get(
	`${CLOUDFLARE_BASE_URL}/accounts/:accountId/images/v1/stats`,
	() => success({ count: { allowed: 100000, current: 1000 } }),
);
