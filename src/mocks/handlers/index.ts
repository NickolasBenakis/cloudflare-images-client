import { createImage } from "./createImage";
import { deleteImage } from "./deleteImage";
import { createDirectUpload } from "./directUpload";
import { getImageBlob } from "./getImageBlob";
import { getImageDetails } from "./getImageDetails";
import { getImageList } from "./getImageList";
import { getImageStats } from "./getImageStats";
import { listSigningKeys } from "./signingKeys";
import { updateImage } from "./updateImage";
import { variantHandlers } from "./variants";

// Order matters: MSW uses the first match, and `/v1/variants` and `/v1/keys`
// would otherwise match the `/v1/:imageId` route below.
export const handlers = [
	...variantHandlers,
	listSigningKeys,
	createDirectUpload,
	createImage,
	getImageStats,
	getImageDetails,
	getImageList,
	getImageBlob,
	updateImage,
	deleteImage,
];
