import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AccountsStore } from './application/stores/accounts.store';
import { CategoriesStore } from './application/stores/categories.store';
import { TransactionsStore } from './application/stores/transactions.store';
import { ToastService } from './application/services/toast.service';
import { BottomNavComponent } from './presentation/organisms/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BottomNavComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly toasts = inject(ToastService);

  private readonly accounts = inject(AccountsStore);
  private readonly categories = inject(CategoriesStore);
  private readonly transactions = inject(TransactionsStore);

  constructor() {
    void this.accounts.load();
    void this.categories.load();
    void this.transactions.load();
  }
}
