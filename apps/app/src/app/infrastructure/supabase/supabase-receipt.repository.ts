import { inject, Injectable } from '@angular/core';
import { Receipt } from '../../domain/models/receipt.model';
import { ReceiptRepository } from '../../domain/ports/receipt.repository';
import { receiptFileExtension, validateReceiptFile } from '../../domain/utils/receipt-file.util';
import { ReceiptRow, toReceipt } from './rows';
import { SupabaseClientService } from './supabase-client.service';

const RECEIPTS_BUCKET = 'receipts';

@Injectable({ providedIn: 'root' })
export class SupabaseReceiptRepository implements ReceiptRepository {
  private readonly supabase = inject(SupabaseClientService);
  private readonly signedUrls = new Map<string, string>();

  async listByTransaction(transactionId: string): Promise<Receipt[]> {
    const { data, error } = await this.supabase
      .require()
      .from('receipts')
      .select('*')
      .eq('transaction_id', transactionId)
      .order('created_at', { ascending: false });
    if (error) {
      throw error;
    }
    return (data as ReceiptRow[]).map(toReceipt);
  }

  async listTransactionIds(): Promise<string[]> {
    const { data, error } = await this.supabase.require().from('receipts').select('transaction_id');
    if (error) {
      throw error;
    }
    return [...new Set((data ?? []).map((row) => row.transaction_id as string).filter(Boolean))];
  }

  async attach(transactionId: string, file: File): Promise<Receipt> {
    const validationError = validateReceiptFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    const userId = await this.supabase.requireUserId();
    const receiptId = crypto.randomUUID();
    const storagePath = `${userId}/${receiptId}.${receiptFileExtension(file.type)}`;

    const { error: uploadError } = await this.supabase
      .require()
      .storage.from(RECEIPTS_BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      throw uploadError;
    }

    const { data, error } = await this.supabase
      .require()
      .from('receipts')
      .insert({
        id: receiptId,
        user_id: userId,
        transaction_id: transactionId,
        storage_path: storagePath,
        mime_type: file.type,
        file_size_bytes: file.size,
        status: 'confirmed',
      })
      .select()
      .single();
    if (error) {
      await this.supabase.require().storage.from(RECEIPTS_BUCKET).remove([storagePath]);
      throw error;
    }

    return toReceipt(data as ReceiptRow);
  }

  async replace(receiptId: string, file: File): Promise<Receipt> {
    const validationError = validateReceiptFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    const existing = await this.getRow(receiptId);
    const userId = await this.supabase.requireUserId();
    const storagePath = `${userId}/${receiptId}.${receiptFileExtension(file.type)}`;

    await this.supabase.require().storage.from(RECEIPTS_BUCKET).remove([existing.storage_path]);

    const { error: uploadError } = await this.supabase
      .require()
      .storage.from(RECEIPTS_BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: true });
    if (uploadError) {
      throw uploadError;
    }

    this.signedUrls.delete(receiptId);

    const { data, error } = await this.supabase
      .require()
      .from('receipts')
      .update({
        storage_path: storagePath,
        mime_type: file.type,
        file_size_bytes: file.size,
        status: 'confirmed',
        extracted_data: null,
        ocr_processed_at: null,
      })
      .eq('id', receiptId)
      .select()
      .single();
    if (error) {
      throw error;
    }

    return toReceipt(data as ReceiptRow);
  }

  async remove(receiptId: string): Promise<void> {
    const existing = await this.getRow(receiptId);
    this.signedUrls.delete(receiptId);
    await this.supabase.require().storage.from(RECEIPTS_BUCKET).remove([existing.storage_path]);
    const { error } = await this.supabase.require().from('receipts').delete().eq('id', receiptId);
    if (error) {
      throw error;
    }
  }

  async removeByTransaction(transactionId: string): Promise<void> {
    const receipts = await this.listByTransaction(transactionId);
    for (const receipt of receipts) {
      await this.remove(receipt.id);
    }
  }

  async getPreviewUrl(receiptId: string): Promise<string | null> {
    const cached = this.signedUrls.get(receiptId);
    if (cached) {
      return cached;
    }

    const row = await this.getRow(receiptId);
    const { data, error } = await this.supabase
      .require()
      .storage.from(RECEIPTS_BUCKET)
      .createSignedUrl(row.storage_path, 3600);
    if (error || !data?.signedUrl) {
      return null;
    }
    this.signedUrls.set(receiptId, data.signedUrl);
    return data.signedUrl;
  }

  releasePreviewUrl(_url: string): void {
    // Les URLs signées expirent seules ; rien à révoquer côté navigateur.
  }

  private async getRow(receiptId: string): Promise<ReceiptRow> {
    const { data, error } = await this.supabase
      .require()
      .from('receipts')
      .select('*')
      .eq('id', receiptId)
      .single();
    if (error) {
      throw error;
    }
    return data as ReceiptRow;
  }
}
