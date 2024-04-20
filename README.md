# cloudflare-images-client

This repository is a complete wrapper around the Cloudflare Images API. It provides a simple and efficient way to interact with the API, allowing you to manage your images on Cloudflare with ease.

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

```bash
const CloudflareImagesClient = require('cloudflare-images-client');

const client = new CloudflareImagesClient({
  apiToken: 'your-api-key', // https://dash.cloudflare.com/profile/api-tokens
  accountId: 'account-id' // account id
});

// Upload an image
  const result = await client.uploadImageFromUrl({
    url:
      "DEFAULT_IMAGE_URL.jpeg",
  });

```

## Contributing
Contributions are welcome! Please read the contributing guidelines before getting started.

## License
This project is licensed under the MIT License - see the LICENSE file for details.