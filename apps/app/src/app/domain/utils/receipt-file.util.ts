import { RECEIPT_ALLOWED_MIME_TYPES, RECEIPT_MAX_BYTES } from '../../domain/models/receipt.model';

export function validateReceiptFile(file: File): string | null {
  if (!RECEIPT_ALLOWED_MIME_TYPES.includes(file.type as (typeof RECEIPT_ALLOWED_MIME_TYPES)[number])) {
    return 'Format non pris en charge — JPEG, PNG ou WebP.';
  }
  if (file.size <= 0 || file.size > RECEIPT_MAX_BYTES) {
    return 'Image trop lourde (5 Mo max).';
  }
  return null;
}

export function receiptFileExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
    case 'image/heif':
      return 'heic';
    default:
      return 'jpg';
  }
}
