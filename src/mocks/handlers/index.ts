import { createImage } from "./createImage";
import { deleteImage } from "./deleteImage";
import { getImageBlob } from "./getImageBlob";
import { getImageDetails } from "./getImageDetails";
import { getImageList } from "./getImageList";
import { getImageStats } from "./getImageStats";
import { updateImage } from "./updateImage";

export const handlers = [
	createImage,
	getImageStats,
	getImageDetails,
	getImageList,
	getImageBlob,
	updateImage,
	deleteImage,
];
