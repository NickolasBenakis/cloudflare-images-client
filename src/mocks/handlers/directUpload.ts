import { http } from "msw";
import { CLOUDFLARE_BASE_URL } from "../../config";
import { success } from "../fixtures";

export const createDirectUpload = http.post(
	`${CLOUDFLARE_BASE_URL}/accounts/:accountId/images/v2/direct_upload`,
	async ({ request }) => {
		const data = await request.formData();
		const id = String(data.get("id") ?? "2cdc28f0-017a-49c4-9ed7-87056c83901");
		return success({
			id,
			uploadURL: `https://upload.imagedelivery.net/ZWd9g1K7eljCn_KDTu_MWA/${id}`,
		});
	},
);
