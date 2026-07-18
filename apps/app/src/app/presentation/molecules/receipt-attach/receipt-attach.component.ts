import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ReceiptsStore } from '../../../application/stores/receipts.store';
import { Receipt } from '../../../domain/models/receipt.model';
import { validateReceiptFile } from '../../../domain/utils/receipt-file.util';
import { IconComponent } from '../../atoms/icon/icon.component';

@Component({
  selector: 'app-receipt-attach',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './receipt-attach.component.html',
  styleUrl: './receipt-attach.component.scss',
})
export class ReceiptAttachComponent {
  protected readonly receipts = inject(ReceiptsStore);

  readonly transactionId = input<string | null>(null);
  readonly disabled = input(false);

  readonly pendingFileChange = output<File | null>();

  protected readonly pendingFile = signal<File | null>(null);
  protected readonly pendingPreviewUrl = signal<string | null>(null);
  protected readonly hint = signal('');
  protected readonly viewerOpen = signal(false);

  protected readonly activeReceipt = computed(() => {
    const transactionId = this.transactionId();
    if (!transactionId) {
      return null;
    }
    return this.receipts.forTransaction(transactionId)[0] ?? null;
  });

  constructor() {
    effect(() => {
      const transactionId = this.transactionId();
      if (transactionId) {
        void this.receipts.loadForTransaction(transactionId);
      }
    });
  }

  protected receiptPreview(receipt: Receipt | null): string | null {
    if (!receipt) {
      return this.pendingPreviewUrl();
    }
    return this.receipts.previewUrl(receipt.id);
  }

  protected openCameraInput(cameraInput: HTMLInputElement): void {
    cameraInput.click();
  }

  protected openGalleryInput(galleryInput: HTMLInputElement): void {
    galleryInput.click();
  }

  protected async onFileSelected(event: Event): Promise<void> {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];
    inputElement.value = '';
    if (!file) {
      return;
    }

    const validationError = validateReceiptFile(file);
    if (validationError) {
      this.hint.set(validationError);
      return;
    }

    this.hint.set('');
    const transactionId = this.transactionId();

    if (!transactionId) {
      this.setPendingFile(file);
      return;
    }

    const existing = this.activeReceipt();
    if (existing) {
      await this.receipts.replace(existing.id, file);
    } else {
      await this.receipts.attach(transactionId, file);
    }
  }

  protected async removeReceipt(): Promise<void> {
    const transactionId = this.transactionId();
    const receipt = this.activeReceipt();
    if (transactionId && receipt) {
      await this.receipts.remove(receipt.id, transactionId);
      return;
    }
    this.clearPendingFile();
  }

  protected openViewer(): void {
    if (this.receiptPreview(this.activeReceipt())) {
      this.viewerOpen.set(true);
    }
  }

  protected closeViewer(): void {
    this.viewerOpen.set(false);
  }

  private setPendingFile(file: File): void {
    this.clearPendingFile(false);
    this.pendingFile.set(file);
    const previewUrl = URL.createObjectURL(file);
    this.pendingPreviewUrl.set(previewUrl);
    this.pendingFileChange.emit(file);
  }

  private clearPendingFile(emit = true): void {
    const previewUrl = this.pendingPreviewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    this.pendingFile.set(null);
    this.pendingPreviewUrl.set(null);
    if (emit) {
      this.pendingFileChange.emit(null);
    }
  }
}
