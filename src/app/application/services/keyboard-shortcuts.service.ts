import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ToastService } from './toast.service';

const SHORTCUTS_MESSAGE =
  'Raccourcis : n nouvelle transaction · / rechercher (Activité) · ? afficher cette aide';

@Injectable({ providedIn: 'root' })
export class KeyboardShortcutsService {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly focusSearchSignal = signal(0);
  readonly focusSearchTick = this.focusSearchSignal.asReadonly();

  private onTransactionsRoute = false;

  init(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.onTransactionsRoute = this.router.url.startsWith('/transactions');
      });

    this.onTransactionsRoute = this.router.url.startsWith('/transactions');

    document.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (this.isTypingContext(event)) {
      return;
    }

    if (event.key === 'n' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      void this.router.navigate(['/transactions/nouvelle']);
      return;
    }

    if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      if (!this.onTransactionsRoute) {
        return;
      }
      event.preventDefault();
      this.focusSearchSignal.update((tick) => tick + 1);
      return;
    }

    if (event.key === '?' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      this.toast.show(SHORTCUTS_MESSAGE);
    }
  }

  private isTypingContext(event: KeyboardEvent): boolean {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    if (target.isContentEditable) {
      return true;
    }
    const tagName = target.tagName;
    return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
  }
}
