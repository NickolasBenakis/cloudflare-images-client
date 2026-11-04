[![CI](https://github.com/NickolasBenakis/cloudflare-images-client/actions/workflows/ci.yml/badge.svg)](https://github.com/NickolasBenakis/cloudflare-images-client/actions/workflows/ci.yml) [![npm](https://img.shields.io/npm/v/cloudflare-images-client)](https://www.npmjs.com/package/cloudflare-images-client)

# cloudflare-images-client

This repository is a complete wrapper around the Cloudflare Images API. It provides a simple and efficient way to interact with the API, allowing you to manage your images on Cloudflare with ease.

- **Cloudflare Images Docs** https://developers.cloudflare.com/images/
- **Cloudflare Images Api** https://developers.cloudflare.com/api/operations/cloudflare-images-list-images-v2
- **Npm Registry** https://www.npmjs.com/package/cloudflare-images-client

## API

The API provides the following functionalities:

- **uploadImageFromUrl**: Allows you to upload image to Cloudflare.
- **listImages**: Lists all the images that you have uploaded to Cloudflare.
- **getImageDetails**: Retrieves the details of a specific image.
- **getImageAsBlob**: Retrieves the image as Blob file.
- **getImageStatistics**: Retrieves the stats of cloudflare images storage.
- **updateImage**: Updates a specific image from Cloudflare.
- **deleteOneImage**: Deletes one image from Cloudflare.
- **deleteManyImages**: Deletes many images from Cloudflare.
- **deleteDuplicateImages**: Deletes duplicate images from Cloudflare.

## Installation

To install the package, use the following command:

```bash
npm install cloudflare-images-client
```

## USAGE

```ts
import { CloudflareImagesClient } from "cloudflare-images-client";
// or: const { CloudflareImagesClient } = require("cloudflare-images-client");

const client = new CloudflareImagesClient({
	apiToken: "your-api-key", // https://dash.cloudflare.com/profile/api-tokens
	accountId: "account-id",
});

// Upload an image from a URL
const result = await client.uploadImageFromUrl({
	url: "DEFAULT_IMAGE_URL.jpeg",
});

// Upload file contents (works in Node, Cloudflare Workers, Deno and browsers)
await client.uploadImageFromFile({
	file: blobOrUint8Array,
	fileName: "photo.png",
});

// Upload from a path on disk (Node.js only)
await client.uploadImageFromFile({ filePath: "./photo.png" });
```

Requires a runtime with global `fetch`, `FormData` and `Blob` (Node.js 18+, Cloudflare Workers, Deno, Bun, modern browsers).

## Contributing

Contributions are welcome! Please read the contributing guidelines before getting started.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## API contract tests

The tests in [`tests/contract.test.ts`](tests/contract.test.ts) check every request the client sends, and every response the mocks return, against Cloudflare's published [OpenAPI spec](https://github.com/cloudflare/api-schemas). The operations the client uses are pinned in [`openapi/cloudflare-images.json`](openapi/cloudflare-images.json).

- `npm run openapi:update` refreshes the pinned spec from Cloudflare.
- `npm run test:contract` runs only the contract tests.
- A weekly workflow ([`api-drift.yml`](.github/workflows/api-drift.yml)) refreshes the spec. If Cloudflare changed anything the client uses, it opens an `api-drift` issue with the diff and whether the contract tests still pass.

When adding a client method, add its endpoint to `OPERATIONS` in [`scripts/openapi-update.mjs`](scripts/openapi-update.mjs), run `npm run openapi:update`, and add a contract test.

## Releasing

Releases are automated by [`.github/workflows/release.yml`](.github/workflows/release.yml):

1. Bump the version in a PR: `npm version minor --no-git-tag-version` (or `patch` / `major`, or a prerelease such as `1.3.0-beta.1`).
2. Merge the PR into `main`.
3. The workflow sees a version that isn't on npm yet, runs the full CI suite, publishes to npm with provenance, and creates the `X.Y.Z` tag and GitHub Release with generated notes. Prereleases are published under the `next` dist-tag.

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (GitHub OIDC), so there is no npm token stored in the repo.
