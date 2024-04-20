interface uploadImageProps {
	metadata?: Record<string, unknown>;
	requireSignedURLs?: boolean;
}

interface uploadImageFromUrlProps extends uploadImageProps {
	imageUrl: string;
}

interface uploadImageFromFileProps extends uploadImageProps {
	file: File;
}

interface CloudflareUploadImageResponse {
	errors: string[];
	messages: string[];
	result: {
		filename: string;
		id: string;
		meta: Record<string, unknown>;
		requireSignedURLs: boolean;
		uploaded: string;
		variants: string[];
	};
	success: boolean;
}
class CloudflareClient {
	private baseUrl = "https://api.cloudflare.com/client/v4";
	private readonly accountId: string;
	private readonly apiToken: string;
	constructor() {
		this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";
		this.apiToken = process.env.CLOUDFLARE_API_TOKEN || "";
	}

	async uploadImageFromUrl({
		imageUrl,
		metadata,
		requireSignedURLs,
	}: uploadImageFromUrlProps) {
		const endpoint = `${this.baseUrl}/accounts/${this.accountId}/images/v1`;

		const formData = new FormData();
		formData.append("url", imageUrl);
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

			const jsonResponse: CloudflareUploadImageResponse = await response.json();

			return jsonResponse;
		} catch (error) {
			console.log("error", error);
			throw new Error("Error uploading image from URL");
		}
	}

	async getImageStatistics() {
		const endpoint = `${this.baseUrl}/accounts/${this.accountId}/images/v1/stats`;

		try {
			const response = await fetch(endpoint, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.apiToken}`,
				},
			});

			const jsonResponse = await response.json();
			return jsonResponse;
		} catch (error) {
			console.log("error", error);
			throw new Error("Error getting image statistics");
		}
	}
}

const cloudflareClient = new CloudflareClient();
export default cloudflareClient;
