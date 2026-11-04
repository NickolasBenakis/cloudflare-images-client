<div align="center">

# cloudflare-images-client

**A small, typed client for the [Cloudflare Images](https://developers.cloudflare.com/images/) API.**<br>
Zero dependencies. Runs on Node.js, Cloudflare Workers, Deno, Bun and in the browser.

[![npm version](https://img.shields.io/npm/v/cloudflare-images-client?color=F38020&label=npm)](https://www.npmjs.com/package/cloudflare-images-client)
[![npm downloads](https://img.shields.io/npm/dm/cloudflare-images-client?color=F38020)](https://www.npmjs.com/package/cloudflare-images-client)
[![bundle size](https://img.shields.io/bundlephobia/minzip/cloudflare-images-client?label=minzipped)](https://bundlephobia.com/package/cloudflare-images-client)
[![CI](https://github.com/NickolasBenakis/cloudflare-images-client/actions/workflows/ci.yml/badge.svg)](https://github.com/NickolasBenakis/cloudflare-images-client/actions/workflows/ci.yml)
[![types](https://img.shields.io/npm/types/cloudflare-images-client)](https://www.npmjs.com/package/cloudflare-images-client)
[![license](https://img.shields.io/npm/l/cloudflare-images-client)](LICENSE)

<a href="https://buymeacoffee.com/BMC_HANDLE"><img src="https://img.shields.io/badge/Buy_me_a_coffee-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=black" alt="Buy me a coffee" height="32"></a>

</div>

---

```ts
import { CloudflareImagesClient } from "cloudflare-images-client";

const images = new CloudflareImagesClient({
	accountId: "<ACCOUNT_ID>",
	apiToken: "<API_TOKEN>",
});

const { result } = await images.uploadImageFromUrl({
	url: "https://example.com/cat.jpg",
	metadata: { owner: "user_123" },
});

console.log(result?.variants); // ["https://imagedelivery.net/<hash>/<id>/public"]
```

## Why this package

- **Small.** No runtime dependencies and about 9.5 kB published. It uses the platform's own `fetch`, `FormData` and `Blob`.
- **Runs anywhere.** Node.js 18+, Cloudflare Workers, Deno, Bun and modern browsers. CI checks the Workers bundle on every change.
- **Typed.** Written in TypeScript, with types for every request and response. Ships ESM and CommonJS builds.
- **Checked against Cloudflare's own API spec.** Contract tests validate every request and response shape against [Cloudflare's published OpenAPI spec](https://github.com/cloudflare/api-schemas), and a weekly job flags any change Cloudflare makes.
- **Verifiable releases.** Every version is published from GitHub Actions with [npm provenance](https://docs.npmjs.com/generating-provenance-statements), so you can trace it back to the exact commit it was built from.

If you need the rest of Cloudflare's API too (DNS, R2, Workers…), the official [`cloudflare`](https://www.npmjs.com/package/cloudflare) SDK covers everything. This package is for when you only need Images.

## Installation

```bash
npm install cloudflare-images-client
```

```bash
pnpm add cloudflare-images-client   # or: yarn add / bun add
```

You need your Cloudflare **account ID** and an **API token** with the _Cloudflare Images: Edit_ permission. You can create one under [API Tokens](https://dash.cloudflare.com/profile/api-tokens) in the dashboard. Storing and uploading images requires a [Cloudflare Images](https://developers.cloudflare.com/images/pricing/) subscription.

## Usage

### Upload

```ts
// From a public URL
await images.uploadImageFromUrl({ url: "https://example.com/cat.jpg" });

// From file contents: a Blob, ArrayBuffer or Uint8Array (works in every runtime)
await images.uploadImageFromFile({
	file: await request.blob(),
	fileName: "cat.jpg",
	metadata: { owner: "user_123" },
	requireSignedURLs: true,
});

// From a path on disk (Node.js only)
await images.uploadImageFromFile({ filePath: "./cat.jpg" });
```

### Cloudflare Workers

```ts
import { CloudflareImagesClient } from "cloudflare-images-client";

export default {
	async fetch(request, env) {
		const images = new CloudflareImagesClient({
			accountId: env.CLOUDFLARE_ACCOUNT_ID,
			apiToken: env.CLOUDFLARE_API_TOKEN,
		});

		const upload = await images.uploadImageFromFile({
			file: await request.blob(),
			fileName: "upload.jpg",
		});

		return Response.json(upload);
	},
};
```

No `nodejs_compat` flag needed.

### Read, list and manage

```ts
const { result: image } = await images.getImageDetails("image-id");
const blob = await images.getImageAsBlob("image-id"); // the original file

// Paginate through every image
let token: string | null = null;
do {
	const page = await images.listImages({
		per_page: 1000,
		continuationToken: token,
	});
	for (const image of page.result?.images ?? []) console.log(image?.id);
	token = page.result?.continuation_token ?? null;
} while (token);

await images.updateImage("image-id", { metadata: { owner: "user_456" } });
await images.deleteOneImage("image-id");

const { result: stats } = await images.getImageStatistics();
console.log(`${stats.count.current} / ${stats.count.allowed} images stored`);
```

### CommonJS

```js
const { CloudflareImagesClient } = require("cloudflare-images-client");
```

## API

| Method                                                                                | Description                                                                                                            |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `uploadImageFromUrl({ url, metadata?, requireSignedURLs? })`                          | Upload an image Cloudflare fetches from a URL.                                                                         |
| `uploadImageFromFile({ file \| filePath, fileName?, metadata?, requireSignedURLs? })` | Upload file contents (`Blob`, `ArrayBuffer`, `Uint8Array`) or a file on disk (Node.js only).                           |
| `getImageDetails(imageId)`                                                            | Get an image's metadata and variant URLs.                                                                              |
| `getImageAsBlob(imageId)`                                                             | Download the original image as a `Blob`.                                                                               |
| `listImages({ per_page?, sort_order?, continuationToken? })`                          | List images, newest first by default. `per_page` defaults to 1000.                                                     |
| `getImageStatistics()`                                                                | Get how many images are stored and how many your plan allows.                                                          |
| `updateImage(imageId, { metadata?, requireSignedURLs? })`                             | Update an image's metadata or signed-URL setting.                                                                      |
| `deleteOneImage(imageId)`                                                             | Delete an image.                                                                                                       |
| `deleteManyImages(imageIds)`                                                          | Delete several images, one request each, in order.                                                                     |
| `deleteDuplicateImages()`                                                             | Delete images that share a filename, keeping one of each. Looks at the first page of `listImages` (up to 1000 images). |

### Responses and errors

Every method except `getImageAsBlob` resolves to Cloudflare's standard response envelope:

```ts
{
	success: boolean;
	errors: { code: number; message: string }[];
	messages: { code: string; message: string }[];
	result: /* the image, list, or stats */ | null;
}
```

API errors such as an unknown image ID come back with `success: false` and the details in `errors`. They don't throw. Methods only throw when the request itself fails, for example on a network error.

```ts
const res = await images.getImageDetails("missing");
if (!res.success) console.error(res.errors[0]?.message);
```

### TypeScript

All request and response types are exported:

```ts
import type {
	CloudflareImageResponse,
	CloudflareImagesResponse,
	CloudflareListImagesQueryParams,
	UploadImageFromFileProps,
} from "cloudflare-images-client";
```

## Requirements

A runtime with global `fetch`, `FormData` and `Blob`: Node.js 18+, Cloudflare Workers, Deno, Bun or a modern browser.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, the test suite and how releases work.

## Support

If this package saves you some time, you can [buy me a coffee](https://buymeacoffee.com/BMC_HANDLE) ☕. It keeps the project maintained.

## License

[MIT](LICENSE) © Nikos Benakis
