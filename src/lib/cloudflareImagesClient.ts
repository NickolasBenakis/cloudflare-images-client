// import { readFile } from "fs/promises";
export interface CloudflareClientOptions {
	apiToken: string;
	accountId: string;
}

export interface CloudflareApiResponse {
	errors: { code: string; message: string }[];
	messages: { code: string; message: string }[];
	success: boolean;
}
export interface UploadImageProps {
	metadata?: Record<string, unknown>;
	requireSignedURLs?: boolean;
}

export interface UploadImageFromUrlProps extends UploadImageProps {
	url: string;
}

export interface UploadImageFromFileProps extends UploadImageProps {
	filePath: string;
}

export interface CloudflareDeleteImageResponse extends CloudflareApiResponse {
	result: Record<string, unknown>;
}

export interface CloudflareImagesResponse extends CloudflareApiResponse {
	result?: {
		continuation_token: string;
		images: CloudflareImageResponse["result"][];
	};
}

export interface CloudflareListImagesQueryParams {
	continuationToken?: string | null;
	per_page?: number;
	sort_order?: "asc" | "desc";
}

export interface CloudflareImageResponse extends CloudflareApiResponse {
	result: {
		filename: string;
		id: string;
		meta: Record<string, unknown>;
		requireSignedURLs: boolean;
		uploaded: string;
		variants: string[];
	};
}

export interface CloudflareImageStatsResponse extends CloudflareApiResponse {
	result: {
		count: {
			allowed: number;
			current: number;
		};
	};
}

interface ICloudflareClient {
	uploadImageFromUrl: (
		props: UploadImageFromUrlProps,
	) => Promise<CloudflareImageResponse>;
	// uploadImageFromFile: (
	// 	props: UploadImageFromFileProps,
	// ) => Promise<CloudflareImageResponse>;
	getImageStatistics: () => Promise<CloudflareImageStatsResponse>;
	getImageDetails: (imageId: string) => Promise<CloudflareImageResponse>;
	getImageAsBlob: (imageId: string) => Promise<Blob>;
	listImages: ({
		continuationToken,
		per_page,
		sort_order,
	}: CloudflareListImagesQueryParams) => Promise<CloudflareImagesResponse>;
	updateImage: (
		imageId: string,
		imageProps: UploadImageProps,
	) => Promise<CloudflareImageResponse>;
	deleteOneImage: (imageId: string) => Promise<CloudflareDeleteImageResponse>;
	deleteManyImages: (
		imageIds: string[],
	) => Promise<CloudflareDeleteImageResponse[]>;
	deleteDuplicateImages: () => Promise<void>;
}
class CloudflareImagesClient implements ICloudflareClient {
	private baseUrl = "https://api.cloudflare.com/client/v4";
	private readonly accountId: string;
	private readonly apiToken: string;
	constructor(options?: CloudflareClientOptions) {
		this.accountId = options?.accountId || "";
		this.apiToken = options?.apiToken || "";
	}

	async uploadImageFromUrl({
		url,
		metadata = {},
		requireSignedURLs = false,
	}: UploadImageFromUrlProps) {
		const endpoint = `${this.baseUrl}/accounts/${this.accountId}/images/v1`;

		const formData = new FormData();
		formData.append("url", url);
		formData.append("metadata", JSON.stringify(metadata));
		formData.append("requireSignedURLs", JSON.stringify(requireSignedURLs));

		try {
			const response = await fetch(endpoint, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${this.apiToken}`,
				},
				body: formData,
			});

			const jsonResponse: CloudflareImageResponse = await response.json();

			return jsonResponse;
		} catch (error) {
			console.error("error", error);
			throw new Error("Error uploading image from URL");
		}
	}

	// async uploadImageFromFile({ filePath, metadata }: UploadImageFromFileProps) {
	// 	const endpoint = `${this.baseUrl}/accounts/${this.accountId}/images/v1`;

	// 	try {
	// 		const file = (await readFile(filePath)) as unknown as Blob;
	// 		const blob = new Blob([file], { type: "image/png" });
	// 		const formData = new FormData();
	// 		formData.append("file", blob, "nikos");
	// 		formData.append("metadata", JSON.stringify(metadata));

	// 		const response = await fetch(endpoint, {
	// 			method: "POST",
	// 			headers: {
	// 				"Content-Type":
	// 					"multipart/form-data; boundary=---011000010111000001101001",
	// 				Authorization: `Bearer ${this.apiToken}`,
	// 			},
	// 			body: formData,
	// 		});

	// 		const jsonResponse: CloudflareImageResponse = await response.json();

	// 		return jsonResponse;
	// 	} catch (error) {
	// 		console.log("error", error);
	// 		throw new Error("Error uploading image from File");
	// 	}
	// }

	async getImageStatistics() {
		const endpoint = `${this.baseUrl}/accounts/${this.accountId}/images/v1/stats`;

		try {
			const response = await fetch(endpoint, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.apiToken}`,
				},
			});

			const jsonResponse: CloudflareImageStatsResponse = await response.json();
			return jsonResponse;
		} catch (error) {
			console.error("error", error);
			throw new Error("Error getting image statistics");
		}
	}

	async getImageDetails(imageId: string) {
		const endpoint = `${this.baseUrl}/accounts/${this.accountId}/images/v1/${imageId}`;

		try {
			const response = await fetch(endpoint, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.apiToken}`,
				},
			});

			const jsonResponse: CloudflareImageResponse = await response.json();
			return jsonResponse;
		} catch (error) {
			console.error("error", error);
			throw new Error("Error getting image details");
		}
	}

	async getImageAsBlob(imageId: string) {
		if (!imageId) {
			throw new Error("Image ID is required");
		}

		const endpoint = `${this.baseUrl}/accounts/${this.accountId}/images/v1/${imageId}/blob`;

		try {
			const response = await fetch(endpoint, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.apiToken}`,
				},
			});

			const blob = await response.blob();
			return blob;
		} catch (error) {
			console.error("error", error);
			throw new Error("Error getting image blob");
		}
	}

	async listImages(params?: CloudflareListImagesQueryParams) {
		const {
			continuationToken = null,
			per_page = 1000,
			sort_order = "desc",
		} = params || {};

		const endpoint = `${this.baseUrl}/accounts/${
			this.accountId
		}/images/v2?per_page=${per_page}&sort_order=${sort_order}${
			continuationToken ? `&continuation_token=${continuationToken}` : ""
		}`;

		try {
			const response = await fetch(endpoint, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.apiToken}`,
				},
			});

			const jsonResponse: CloudflareImagesResponse = await response.json();

			return jsonResponse;
		} catch (error) {
			console.error("error", error);
			throw new Error("Error getting list images");
		}
	}

	async updateImage(imageId: string, imageProps: UploadImageProps) {
		const endpoint = `${this.baseUrl}/accounts/${this.accountId}/images/v1/${imageId}`;

		try {
			const response = await fetch(endpoint, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.apiToken}`,
				},
				body: JSON.stringify(imageProps),
			});

			const jsonResponse: CloudflareImageResponse = await response.json();

			return jsonResponse;
		} catch (error) {
			console.error("error", error);
			throw new Error("Error updating image");
		}
	}

	async deleteOneImage(imageId: string) {
		const endpoint = `${this.baseUrl}/accounts/${this.accountId}/images/v1/${imageId}`;

		try {
			const response = await fetch(endpoint, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${this.apiToken}`,
				},
			});

			const jsonResponse: CloudflareDeleteImageResponse = await response.json();

			return jsonResponse;
		} catch (error) {
			console.error("error", error);
			throw new Error("Error deleting image");
		}
	}

	async deleteManyImages(imageIds: string[]) {
		const results = [];
		for (const imageId of imageIds) {
			try {
				const result = await this.deleteOneImage(imageId);
				results.push(result);
			} catch (error) {
				results.push(error as CloudflareDeleteImageResponse);
			}
		}

		return results;
	}

	async deleteDuplicateImages() {
		const cloudflareImages = await this.listImages();
		const allCloudflareImageIds = cloudflareImages.result?.images?.map(
			(image) => image?.id as string,
		);
		const cloudflareImagesByFilename =
			cloudflareImages.result?.images?.reduce(
				(
					acc: Record<string, CloudflareImageResponse["result"]>,
					image: CloudflareImageResponse["result"],
				) => {
					acc[image.filename] = image;
					return acc;
				},
				{} as Record<string, CloudflareImageResponse["result"]>,
			) || {};

		const uniqueCloudflareImageIds = Object.values(
			cloudflareImagesByFilename,
		).map((image: CloudflareImageResponse["result"]) => image.id as string);

		const imageUrlsToDelete = allCloudflareImageIds?.filter((id: string) => {
			return !uniqueCloudflareImageIds?.includes?.(id);
		});

		if (!imageUrlsToDelete?.length) {
			console.info("all cloudflare urls are unique", true);
			return;
		}

		await this.deleteManyImages(imageUrlsToDelete);
	}
}

export default CloudflareImagesClient;
