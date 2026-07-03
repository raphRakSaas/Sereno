export type ReceiptStatus = 'pending' | 'processing' | 'extracted' | 'confirmed' | 'failed';

/** Données extraites par OCR — l'utilisateur valide avant application. */
export interface ReceiptExtractedData {
  amount?: number;
  date?: string;
  merchant?: string;
  rawText?: string;
}

export interface Receipt {
  id: string;
  transactionId: string | null;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  status: ReceiptStatus;
  extractedData: ReceiptExtractedData | null;
  ocrProvider: string;
  ocrProcessedAt: string | null;
  createdAt: string;
}

export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;

export const RECEIPT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;
