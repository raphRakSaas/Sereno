import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { KeyboardShortcutsService } from '../../../application/services/keyboard-shortcuts.service';
import {
  TransactionSort,
  UserPreferencesService,
} from '../../../application/services/user-preferences.service';
import { AccountsStore } from '../../../application/stores/accounts.store';
import { CategoriesStore } from '../../../application/stores/categories.store';
import { ReceiptsStore } from '../../../application/stores/receipts.store';
import { TransactionsStore } from '../../../application/stores/transactions.store';
import { monthOf } from '../../../domain/models/budget.model';
import { MARKER_COLORS } from '../../../domain/data/marker-colors';
import { isCardAccount } from '../../../domain/models/account.model';
import { Transaction } from '../../../domain/models/transaction.model';
import {
  ActivityFilters,
  MarkerColorFilter,
  PhotoFilter,
  RecurringFilter,
  TypeFilter,
  applyActivityFilters,
  countActiveFilters,
  parseOptionalAmount,
} from '../../../domain/utils/transaction-filter.util';
import {
  TRANSACTION_SORT_LABELS,
  sortTransactions,
} from '../../../domain/utils/transaction-sort.util';
import { Category } from '../../../domain/models/category.model';
import { categoriesForPicker, categoryDisplayName } from '../../../domain/utils/category-tree.util';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { MonthSwitcherComponent } from '../../molecules/month-switcher/month-switcher.component';
import { StrataGhostComponent } from '../../molecules/strata-ghost/strata-ghost.component';
import { TransactionListItemComponent } from '../../molecules/transaction-list-item/transaction-list-item.component';

interface DayGroup {
  date: string;
  label: string;
  items: Transaction[];
}

function dayLabel(date: string): string {
  const today = new Date();
  const toIso = (dateValue: Date) =>
    `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, '0')}-${String(dateValue.getDate()).padStart(2, '0')}`;
  if (date === toIso(today)) {
    return "Aujourd'hui";
  }
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date === toIso(yesterday)) {
    return 'Hier';
  }
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(date + 'T00:00:00'),
  );
}

@Component({
  selector: 'app-transactions-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AmountComponent,
    DatePipe,
    FormsModule,
    IconComponent,
    MonthSwitcherComponent,
    RouterLink,
    StrataGhostComponent,
    TransactionListItemComponent,
  ],
  templateUrl: './transactions.page.html',
  styleUrl: './transactions.page.scss',
})
export class TransactionsPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly preferences = inject(UserPreferencesService);
  private readonly shortcuts = inject(KeyboardShortcutsService);

  protected readonly categories = inject(CategoriesStore);
  protected readonly accounts = inject(AccountsStore);
  protected readonly transactions = inject(TransactionsStore);
  protected readonly receipts = inject(ReceiptsStore);

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  protected readonly month = signal(monthOf(new Date()));
  protected readonly searchQuery = signal('');
  protected readonly typeFilter = signal<TypeFilter>('all');
  protected readonly accountFilter = signal<string | null>(null);
  protected readonly categoryFilter = signal<string | null>(null);
  protected readonly amountMinText = signal('');
  protected readonly amountMaxText = signal('');
  protected readonly recurringFilter = signal<RecurringFilter>('all');
  protected readonly dateFromFilter = signal<string | null>(null);
  protected readonly dateToFilter = signal<string | null>(null);
  protected readonly photoFilter = signal<PhotoFilter>('all');
  protected readonly cardAccountFilter = signal<string | null>(null);
  protected readonly markerColorFilter = signal<MarkerColorFilter>('all');
  protected readonly filtersOpen = signal(false);

  protected readonly markerColors = MARKER_COLORS;
  protected readonly sortLabels = TRANSACTION_SORT_LABELS;
  protected readonly sortOptions = Object.entries(TRANSACTION_SORT_LABELS) as [TransactionSort, string][];

  private readonly queryAccountId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('compte'))),
    { initialValue: null },
  );

  private readonly queryCategoryId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('categorie'))),
    { initialValue: null },
  );

  private readonly queryDateIso = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('date'))),
    { initialValue: null },
  );

  private readonly queryMonth = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('mois'))),
    { initialValue: null },
  );

  protected readonly filters = computed(
    (): ActivityFilters => ({
      searchQuery: this.searchQuery(),
      type: this.typeFilter(),
      accountId: this.accountFilter(),
      categoryId: this.categoryFilter(),
      amountMin: parseOptionalAmount(this.amountMinText()),
      amountMax: parseOptionalAmount(this.amountMaxText()),
      recurring: this.recurringFilter(),
      dateFrom: this.dateFromFilter(),
      dateTo: this.dateToFilter(),
      photoFilter: this.photoFilter(),
      cardAccountId: this.cardAccountFilter(),
      markerColor: this.markerColorFilter(),
    }),
  );

  protected readonly activeFilterCount = computed(() => countActiveFilters(this.filters()));

  protected readonly receiptTransactionIds = computed(
    () => new Set(this.receipts.transactionIdsWithReceipt()),
  );

  protected readonly filterCategoryOptions = computed(() => {
    const type = this.typeFilter();
    const all = this.categories.items();
    const typed = type === 'all' ? all : all.filter((category) => category.type === type);
    return categoriesForPicker(typed);
  });

  protected readonly cardAccountOptions = computed(() =>
    this.accounts.items().filter((account) => isCardAccount(account.type)),
  );

  protected categoryLabel(category: Category): string {
    return categoryDisplayName(category, this.categories.byId());
  }

  protected readonly monthTransactions = computed(() => {
    const prefix = this.month().slice(0, 7);
    return this.transactions.items().filter((transaction) => transaction.date.startsWith(prefix));
  });

  protected readonly filteredTransactions = computed(() => {
    const filtered = applyActivityFilters(
      this.monthTransactions(),
      this.filters(),
      this.categories.byId(),
      this.accounts.byId(),
      this.receiptTransactionIds(),
    );
    return sortTransactions(filtered, this.preferences.transactionSort());
  });

  protected readonly monthIncome = computed(() =>
    this.filteredTransactions()
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  );

  protected readonly monthExpense = computed(() =>
    this.filteredTransactions()
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  );

  protected readonly groups = computed<DayGroup[]>(() => {
    const sortMode = this.preferences.transactionSort();
    const mapByDate = new Map<string, Transaction[]>();
    for (const transaction of this.filteredTransactions()) {
      const list = mapByDate.get(transaction.date) ?? [];
      list.push(transaction);
      mapByDate.set(transaction.date, list);
    }
    const dateDescending = sortMode !== 'date_asc';
    return [...mapByDate.entries()]
      .sort(([dateA], [dateB]) =>
        dateDescending ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB),
      )
      .map(([date, items]) => ({ date, label: dayLabel(date), items }));
  });

  protected readonly hasMonthData = computed(() => this.monthTransactions().length > 0);
  protected readonly hasFilteredResults = computed(() => this.filteredTransactions().length > 0);
  protected readonly isFiltered = computed(() => this.activeFilterCount() > 0);

  constructor() {
    effect(() => {
      const accountId = this.queryAccountId();
      if (accountId) {
        this.accountFilter.set(accountId);
        this.filtersOpen.set(true);
      }
    });

    effect(() => {
      const categoryId = this.queryCategoryId();
      if (categoryId) {
        this.categoryFilter.set(categoryId);
        this.filtersOpen.set(true);
      }
    });

    effect(() => {
      const dateIso = this.queryDateIso();
      if (dateIso) {
        this.dateFromFilter.set(dateIso);
        this.dateToFilter.set(dateIso);
        this.filtersOpen.set(true);
      }
    });

    effect(() => {
      const monthParam = this.queryMonth();
      if (monthParam && /^\d{4}-\d{2}-01$/.test(monthParam)) {
        this.month.set(monthParam);
      }
    });

    effect(() => {
      if (this.filtersOpen()) {
        void this.receipts.loadAllTransactionIds();
      }
    });

    effect(() => {
      const tick = this.shortcuts.focusSearchTick();
      if (tick === 0) {
        return;
      }
      const input = this.searchInput()?.nativeElement;
      input?.focus();
    });
  }

  protected toggleFilters(): void {
    this.filtersOpen.update((open) => !open);
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.typeFilter.set('all');
    this.accountFilter.set(null);
    this.categoryFilter.set(null);
    this.amountMinText.set('');
    this.amountMaxText.set('');
    this.recurringFilter.set('all');
    this.dateFromFilter.set(null);
    this.dateToFilter.set(null);
    this.photoFilter.set('all');
    this.cardAccountFilter.set(null);
    this.markerColorFilter.set('all');
  }

  protected setMarkerColorFilter(value: MarkerColorFilter): void {
    this.markerColorFilter.set(value);
  }

  protected setTypeFilter(type: TypeFilter): void {
    this.typeFilter.set(type);
    const selectedCategoryId = this.categoryFilter();
    if (selectedCategoryId && type !== 'all') {
      const category = this.categories.byId().get(selectedCategoryId);
      if (category && category.type !== type) {
        this.categoryFilter.set(null);
      }
    }
  }

  protected setRecurringFilter(value: RecurringFilter): void {
    this.recurringFilter.set(value);
  }

  protected setPhotoFilter(value: PhotoFilter): void {
    this.photoFilter.set(value);
  }

  protected setSortFromSelect(value: string): void {
    this.preferences.setTransactionSort(value as TransactionSort);
  }

  protected readonly typeOptions: [TypeFilter, string][] = [
    ['all', 'Tous'],
    ['expense', 'Dépenses'],
    ['income', 'Revenus'],
    ['transfer', 'Virements'],
  ];

  protected readonly recurringOptions: [RecurringFilter, string][] = [
    ['all', 'Toutes'],
    ['yes', 'Récurrentes'],
    ['no', 'Ponctuelles'],
  ];

  protected readonly photoOptions: [PhotoFilter, string][] = [
    ['all', 'Toutes'],
    ['yes', 'Avec photo'],
    ['no', 'Sans photo'],
  ];
}
