import { inject, Injectable } from '@angular/core';
import { Receipt } from '../../domain/models/receipt.model';
import { ReceiptRepository } from '../../domain/ports/receipt.repository';
import { validateReceiptFile } from '../../domain/utils/receipt-file.util';
import { DexieService } from './dexie.providers';

interface DexieReceiptRow extends Receipt {
  blob: Blob;
}

@Injectable({ providedIn: 'root' })
export class DexieReceiptRepository implements ReceiptRepository {
  private readonly db = inject(DexieService).db;
  private readonly objectUrls = new Map<string, string>();

  async listByTransaction(transactionId: string): Promise<Receipt[]> {
    const rows = await this.db.receipts.where('transactionId').equals(transactionId).toArray();
    return rows.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async listTransactionIds(): Promise<string[]> {
    const rows = await this.db.receipts.toArray();
    return [
      ...new Set(rows.map((row) => row.transactionId).filter((transactionId): transactionId is string => Boolean(transactionId))),
    ];
  }

  async attach(transactionId: string, file: File): Promise<Receipt> {
    const validationError = validateReceiptFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    const row: DexieReceiptRow = {
      id: crypto.randomUUID(),
      transactionId,
      storagePath: `local:${crypto.randomUUID()}`,
      mimeType: file.type,
      fileSizeBytes: file.size,
      status: 'confirmed',
      extractedData: null,
      ocrProvider: 'none',
      ocrProcessedAt: null,
      createdAt: new Date().toISOString(),
      blob: file,
    };
    await this.db.receipts.add(row);
    return this.toPublic(row);
  }

  async replace(receiptId: string, file: File): Promise<Receipt> {
    const validationError = validateReceiptFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    const existing = await this.db.receipts.get(receiptId);
    if (!existing) {
      throw new Error(`Reçu ${receiptId} introuvable`);
    }

    this.dropPreviewUrl(receiptId);
    const updated: DexieReceiptRow = {
      ...existing,
      mimeType: file.type,
      fileSizeBytes: file.size,
      status: 'confirmed',
      extractedData: null,
      ocrProvider: 'none',
      ocrProcessedAt: null,
      blob: file,
    };
    await this.db.receipts.put(updated);
    return this.toPublic(updated);
  }

  async remove(receiptId: string): Promise<void> {
    this.dropPreviewUrl(receiptId);
    await this.db.receipts.delete(receiptId);
  }

  async removeByTransaction(transactionId: string): Promise<void> {
    const rows = await this.db.receipts.where('transactionId').equals(transactionId).toArray();
    for (const row of rows) {
      this.dropPreviewUrl(row.id);
    }
    await this.db.receipts.where('transactionId').equals(transactionId).delete();
  }

  async getPreviewUrl(receiptId: string): Promise<string | null> {
    const cached = this.objectUrls.get(receiptId);
    if (cached) {
      return cached;
    }
    const row = await this.db.receipts.get(receiptId);
    if (!row?.blob) {
      return null;
    }
    const url = URL.createObjectURL(row.blob);
    this.objectUrls.set(receiptId, url);
    return url;
  }

  releasePreviewUrl(url: string): void {
    for (const [receiptId, objectUrl] of this.objectUrls.entries()) {
      if (objectUrl === url) {
        URL.revokeObjectURL(objectUrl);
        this.objectUrls.delete(receiptId);
        return;
      }
    }
    URL.revokeObjectURL(url);
  }

  private dropPreviewUrl(receiptId: string): void {
    const url = this.objectUrls.get(receiptId);
    if (url) {
      URL.revokeObjectURL(url);
      this.objectUrls.delete(receiptId);
    }
  }

  private toPublic(row: DexieReceiptRow): Receipt {
    const { blob: _blob, ...receipt } = row;
    return receipt;
  }
}
