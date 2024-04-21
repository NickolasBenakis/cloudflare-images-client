[![Node.js CI](https://github.com/NickolasBenakis/cloudflare-images-client/actions/workflows/node.js.yml/badge.svg)](https://github.com/NickolasBenakis/cloudflare-images-client/actions/workflows/node.js.yml)

## License
[![MIT License](https://img.shields.io/apm/l/atomic-design-ui.svg?)](https://github.com/tterb/atomic-design-ui/blob/master/LICENSEs)

## Version
[![Version](https://badge.fury.io/gh/tterb%2FHyde.svg)](https://badge.fury.io/gh/tterb%2FHyde)
[![GitHub Release](https://img.shields.io/github/release/tterb/PlayMusic.svg?style=flat)]()  

## Downloads
#### GitHub (All Releases)
[![Github All Releases](https://img.shields.io/github/downloads/atom/atom/total.svg?style=flat)]()  

# cloudflare-images-client

This repository is a complete wrapper around the Cloudflare Images API. It provides a simple and efficient way to interact with the API, allowing you to manage your images on Cloudflare with ease.

https://developers.cloudflare.com/images/
https://developers.cloudflare.com/api/operations/cloudflare-images-list-images-v2

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
