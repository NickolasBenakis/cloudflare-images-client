import { http } from "msw";
import { CLOUDFLARE_BASE_URL } from "../../config";
import { success } from "../fixtures";

export const listSigningKeys = http.get(
	`${CLOUDFLARE_BASE_URL}/accounts/:accountId/images/v1/keys`,
	() =>
		success({
			keys: [{ name: "default", value: "Oix0bbNaT8Rge9PuyxUBrjI6zrgnsyJ5" }],
		}),
);
