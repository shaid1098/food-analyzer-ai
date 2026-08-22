import type { ImageQuality } from '../../../shared/schemas/index.js';

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MIN_SIZE_BYTES = 1024; // 1KB minimum — likely corrupted or empty

export function validateImageQuality(base64: string, mimeType: string): ImageQuality {
  // Check mime type
  if (!SUPPORTED_TYPES.includes(mimeType)) {
    return {
      status: 'INVALID',
      message: `Unsupported image type: ${mimeType}. Supported: JPEG, PNG, WebP, GIF.`,
    };
  }

  // Check size (approximate from base64)
  const sizeBytes = Math.ceil(base64.length * 0.75);

  if (sizeBytes < MIN_SIZE_BYTES) {
    return {
      status: 'INVALID',
      message: 'Image file is too small or corrupted. Please upload a valid food image.',
    };
  }

  if (sizeBytes > MAX_SIZE_BYTES) {
    return {
      status: 'INVALID',
      message: 'Image file exceeds 10MB limit. Please upload a smaller image.',
    };
  }

  // Basic quality assessment based on size
  if (sizeBytes < 10 * 1024) {
    return {
      status: 'POOR',
      message: 'Image quality appears low. Results may be less accurate.',
    };
  }

  if (sizeBytes < 50 * 1024) {
    return {
      status: 'ACCEPTABLE',
      message: 'Image quality is acceptable.',
    };
  }

  return {
    status: 'GOOD',
    message: 'Image quality is good.',
  };
}
