# cloudflare-images-client

This repository is a complete wrapper around the Cloudflare Images API. It provides a simple and efficient way to interact with the API, allowing you to manage your images on Cloudflare with ease.

## API

The API provides the following functionalities:

- **Upload Images**: Allows you to upload images to Cloudflare.
- **List Images**: Lists all the images that you have uploaded to Cloudflare.
- **Get Image Details**: Retrieves the details of a specific image.
- **Delete Image**: Deletes a specific image from Cloudflare.

## Installation

To install the package, use the following command:

```bash
npm install cloudflare-images-client
```

## USAGE

```bash
const CloudflareImagesClient = require('cloudflare-images-client');

const client = new CloudflareImagesClient('your-api-key');

// Upload an image
client.uploadImage('path/to/image.jpg').then(response => {
  console.log(response);
});

```

## Contributing
Contributions are welcome! Please read the contributing guidelines before getting started.

## License
This project is licensed under the MIT License - see the LICENSE file for details.