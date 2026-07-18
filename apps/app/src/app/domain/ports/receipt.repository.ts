import { Receipt } from '../models/receipt.model';

export interface ReceiptRepository {
  listByTransaction(transactionId: string): Promise<Receipt[]>;
  /** Identifiants de transactions ayant au moins un reçu. */
  listTransactionIds(): Promise<string[]>;
  attach(transactionId: string, file: File): Promise<Receipt>;
  replace(receiptId: string, file: File): Promise<Receipt>;
  remove(receiptId: string): Promise<void>;
  removeByTransaction(transactionId: string): Promise<void>;
  /** URL affichable (Object URL invité, URL signée cloud). */
  getPreviewUrl(receiptId: string): Promise<string | null>;
  releasePreviewUrl(url: string): void;
}
