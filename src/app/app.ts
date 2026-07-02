import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConversionService } from './application/services/conversion.service';
import { KeyboardShortcutsService } from './application/services/keyboard-shortcuts.service';
import { ToastService } from './application/services/toast.service';
import { AccountsStore } from './application/stores/accounts.store';
import { CategoriesStore } from './application/stores/categories.store';
import { TransactionTemplatesStore } from './application/stores/transaction-templates.store';
import { TransactionsStore } from './application/stores/transactions.store';
import { BottomNavComponent } from './presentation/organisms/bottom-nav/bottom-nav.component';
import { ConversionModalComponent } from './presentation/organisms/conversion-modal/conversion-modal.component';
import { SideNavComponent } from './presentation/organisms/side-nav/side-nav.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BottomNavComponent, ConversionModalComponent, SideNavComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly toasts = inject(ToastService);
  private readonly conversion = inject(ConversionService);
  private readonly shortcuts = inject(KeyboardShortcutsService);

  private readonly accounts = inject(AccountsStore);
  private readonly categories = inject(CategoriesStore);
  private readonly transactions = inject(TransactionsStore);
  private readonly templates = inject(TransactionTemplatesStore);

  constructor() {
    // L'initializer (app.config) a déjà chargé les stores si une session
    // existait ; sinon on charge les données invité ici.
    if (!this.accounts.loaded()) void this.accounts.load();
    if (!this.categories.loaded()) void this.categories.load();
    if (!this.transactions.loaded()) void this.transactions.load();
    if (!this.templates.loaded()) void this.templates.load();

    // Déclencheur "14 jours d'utilisation" — vérifié à chaque démarrage.
    void this.conversion.checkQuotaTriggers();

    this.shortcuts.init();
  }
}
