import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Receipt } from '../../domain/models/receipt.model';
import { RECEIPT_REPOSITORY } from '../../domain/ports/tokens';

interface ReceiptsState {
  byTransactionId: Record<string, Receipt[]>;
  transactionIdsWithReceipt: string[];
  previewUrls: Record<string, string>;
  loadingTransactionId: string | null;
  error: string | null;
}

const initialState: ReceiptsState = {
  byTransactionId: {},
  transactionIdsWithReceipt: [],
  previewUrls: {},
  loadingTransactionId: null,
  error: null,
};

export const ReceiptsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ byTransactionId }) => ({
    hasLoaded: computed(() => Object.keys(byTransactionId()).length > 0),
  })),
  withMethods((store) => {
    const repo = inject(RECEIPT_REPOSITORY);

    const setTransactionReceipts = (transactionId: string, receipts: Receipt[]) => {
      patchState(store, {
        byTransactionId: { ...store.byTransactionId(), [transactionId]: receipts },
      });
    };

    const upsertReceipt = (receipt: Receipt) => {
      if (!receipt.transactionId) {
        return;
      }
      const current = store.byTransactionId()[receipt.transactionId] ?? [];
      const next = [receipt, ...current.filter((item) => item.id !== receipt.id)];
      setTransactionReceipts(receipt.transactionId, next);
    };

    const ensurePreview = async (receiptId: string): Promise<string | null> => {
      if (store.previewUrls()[receiptId]) {
        return store.previewUrls()[receiptId];
      }
      const url = await repo.getPreviewUrl(receiptId);
      if (url) {
        patchState(store, { previewUrls: { ...store.previewUrls(), [receiptId]: url } });
      }
      return url;
    };

    return {
      forTransaction(transactionId: string | null): Receipt[] {
        if (!transactionId) {
          return [];
        }
        return store.byTransactionId()[transactionId] ?? [];
      },

      previewUrl(receiptId: string): string | null {
        return store.previewUrls()[receiptId] ?? null;
      },

      async loadForTransaction(transactionId: string): Promise<void> {
        patchState(store, { loadingTransactionId: transactionId, error: null });
        try {
          const receipts = await repo.listByTransaction(transactionId);
          setTransactionReceipts(transactionId, receipts);
          for (const receipt of receipts) {
            await ensurePreview(receipt.id);
          }
          patchState(store, { loadingTransactionId: null });
        } catch {
          patchState(store, {
            loadingTransactionId: null,
            error: 'Le reçu ne se charge pas. Réessaie dans un instant.',
          });
        }
      },

      ensurePreview,

      async attach(transactionId: string, file: File): Promise<Receipt | null> {
        patchState(store, { error: null });
        try {
          const receipt = await repo.attach(transactionId, file);
          upsertReceipt(receipt);
          await ensurePreview(receipt.id);
          return receipt;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Le reçu n’a pas pu être ajouté. Réessaie dans un instant.';
          patchState(store, { error: message });
          return null;
        }
      },

      async replace(receiptId: string, file: File): Promise<Receipt | null> {
        patchState(store, { error: null });
        try {
          const receipt = await repo.replace(receiptId, file);
          upsertReceipt(receipt);
          patchState(store, {
            previewUrls: Object.fromEntries(
              Object.entries(store.previewUrls()).filter(([key]) => key !== receiptId),
            ),
          });
          await ensurePreview(receipt.id);
          return receipt;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Le reçu n’a pas pu être remplacé. Réessaie dans un instant.';
          patchState(store, { error: message });
          return null;
        }
      },

      async remove(receiptId: string, transactionId: string): Promise<void> {
        try {
          await repo.remove(receiptId);
          const previewUrl = store.previewUrls()[receiptId];
          if (previewUrl) {
            repo.releasePreviewUrl(previewUrl);
          }
          const remaining = (store.byTransactionId()[transactionId] ?? []).filter(
            (receipt) => receipt.id !== receiptId,
          );
          setTransactionReceipts(transactionId, remaining);
          patchState(store, {
            previewUrls: Object.fromEntries(
              Object.entries(store.previewUrls()).filter(([key]) => key !== receiptId),
            ),
            error: null,
          });
        } catch {
          patchState(store, { error: 'La suppression du reçu n’a pas abouti. Réessaie dans un instant.' });
        }
      },

      async removeByTransaction(transactionId: string): Promise<void> {
        try {
          await repo.removeByTransaction(transactionId);
          const receipts = store.byTransactionId()[transactionId] ?? [];
          for (const receipt of receipts) {
            const previewUrl = store.previewUrls()[receipt.id];
            if (previewUrl) {
              repo.releasePreviewUrl(previewUrl);
            }
          }
          patchState(store, {
            byTransactionId: Object.fromEntries(
              Object.entries(store.byTransactionId()).filter(([key]) => key !== transactionId),
            ),
            previewUrls: Object.fromEntries(
              Object.entries(store.previewUrls()).filter(
                ([key]) => !receipts.some((receipt) => receipt.id === key),
              ),
            ),
            error: null,
          });
        } catch {
          patchState(store, { error: 'Les reçus n’ont pas pu être supprimés. Réessaie dans un instant.' });
        }
      },

      clearForTransaction(transactionId: string): void {
        const receipts = store.byTransactionId()[transactionId] ?? [];
        for (const receipt of receipts) {
          const previewUrl = store.previewUrls()[receipt.id];
          if (previewUrl) {
            repo.releasePreviewUrl(previewUrl);
          }
        }
        patchState(store, {
          byTransactionId: Object.fromEntries(
            Object.entries(store.byTransactionId()).filter(([key]) => key !== transactionId),
          ),
        });
      },

      dismissError(): void {
        patchState(store, { error: null });
      },

      async loadAllTransactionIds(): Promise<void> {
        try {
          const ids = await repo.listTransactionIds();
          patchState(store, { transactionIdsWithReceipt: ids });
        } catch {
          patchState(store, { error: 'Les reçus ne se chargent pas. Réessaie dans un instant.' });
        }
      },
    };
  }),
);
