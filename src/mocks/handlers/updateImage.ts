import { HttpResponse, http } from 'msw';
import { CLOUDFLARE_BASE_URL } from '../../config';
import {
  CloudflareImageResponse,
  UploadImageProps,
} from '../../lib/cloudflareImagesClient';

export const updateImage = http.patch<
  { accountId: string; imageId: string },
  UploadImageProps,
  CloudflareImageResponse
>(
  `${CLOUDFLARE_BASE_URL}/accounts/:accountId/images/v1/:imageId`,
  ({ params }) => {
    const { imageId } = params;

    if (imageId === 'not-found') {
      return HttpResponse.json({
        success: false,
        result: null,
        errors: [
          {
            code: 7003,
            message: 'Image not found',
          },
        ],
        messages: [],
      });
    }
    return HttpResponse.json({
      success: true,
      result: {
        filename: 'filename',
        id: 'id',
        meta: {},
        requireSignedURLs: false,
        uploaded: 'uploaded',
        variants: ['variant'],
      },
      errors: [],
      messages: [],
    });
  }
);
