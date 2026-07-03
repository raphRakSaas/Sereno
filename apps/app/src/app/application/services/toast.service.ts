import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  tone: 'calm' | 'attention';
}

/** Confirmations discrètes ("C'est noté.") — jamais de rouge, jamais d'alarme. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(message: string, tone: Toast['tone'] = 'calm'): void {
    const toast: Toast = { id: this.nextId++, message, tone };
    this._toasts.update((list) => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), 3200);
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
