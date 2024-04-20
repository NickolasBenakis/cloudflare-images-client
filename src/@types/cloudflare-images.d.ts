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
	imageUrl: string;
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
