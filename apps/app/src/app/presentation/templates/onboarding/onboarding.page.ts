import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AccountsStore } from '../../../application/stores/accounts.store';
import { CategoriesStore } from '../../../application/stores/categories.store';
import { TransactionsStore } from '../../../application/stores/transactions.store';
import { DEFAULT_CATEGORIES } from '../../../domain/data/default-categories';
import { toIsoDate } from '../../../domain/utils/period.utils';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { CategoryIconComponent } from '../../atoms/category-icon/category-icon.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { LottiePlayerComponent } from '../../atoms/lottie-player/lottie-player.component';
import { NumericKeypadComponent } from '../../molecules/numeric-keypad/numeric-keypad.component';
import { ONBOARDING_DONE_KEY } from '../../guards/onboarding.guard';

type OnbStep = 'welcome' | 'income' | 'expenses' | 'ready';
const STEP_ORDER: OnbStep[] = ['welcome', 'income', 'expenses', 'ready'];

function parseAmount(text: string): number | null {
  const value = Number.parseFloat(text.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : null;
}

const SALAIRE_ID = DEFAULT_CATEGORIES.find((category) => category.name === 'Salaire')!.id;

/* Premier écran d'un guest tout neuf (voir onboarding.guard.ts) : 4 étapes
   courtes (bienvenue / revenu / dépenses / prêt), toujours contournables,
   jamais un mur. Rien n'est pré-rempli — l'utilisateur ajoute ce qu'il veut
   suivre. Voir docs/DESIGN.md et le handoff pour le détail visuel. */
@Component({
  selector: 'app-onboarding-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AmountComponent,
    CategoryIconComponent,
    IconComponent,
    LottiePlayerComponent,
    NumericKeypadComponent,
  ],
  templateUrl: './onboarding.page.html',
  styleUrl: './onboarding.page.scss',
})
export class OnboardingPage {
  private readonly router = inject(Router);
  private readonly accounts = inject(AccountsStore);
  protected readonly categories = inject(CategoriesStore);
  private readonly transactions = inject(TransactionsStore);

  protected readonly step = signal<OnbStep>('welcome');
  protected readonly income = signal('0');
  protected readonly addedCategoryIds = signal<string[]>([]);
  protected readonly expenseAmounts = signal<Record<string, string>>({});
  protected readonly saving = signal(false);

  protected readonly stepIndex = computed(() => STEP_ORDER.indexOf(this.step()));
  protected readonly dots = computed(() => {
    const idx = this.stepIndex();
    return [0, 1, 2].map((i) => i <= idx - 1);
  });

  protected readonly availableChips = computed(() => {
    const added = new Set(this.addedCategoryIds());
    return this.categories.expenseCategories().filter((category) => !added.has(category.id));
  });

  protected readonly addedRows = computed(() => {
    const byId = this.categories.byId();
    const amounts = this.expenseAmounts();
    return this.addedCategoryIds()
      .map((id) => ({ id, category: byId.get(id), value: amounts[id] ?? '' }))
      .filter((row) => row.category);
  });

  protected readonly incomeValue = computed(() => parseAmount(this.income()) ?? 0);

  protected readonly totalExpense = computed(() =>
    this.addedCategoryIds().reduce((sum, id) => sum + (parseAmount(this.expenseAmounts()[id] ?? '') ?? 0), 0),
  );

  protected next(): void {
    const idx = this.stepIndex();
    if (idx < STEP_ORDER.length - 1) {
      this.step.set(STEP_ORDER[idx + 1]);
    }
  }

  protected back(): void {
    const idx = this.stepIndex();
    if (idx > 0) {
      this.step.set(STEP_ORDER[idx - 1]);
    }
  }

  protected goToAuth(): void {
    void this.router.navigateByUrl('/compte');
  }

  protected addCategory(categoryId: string): void {
    if (!this.addedCategoryIds().includes(categoryId)) {
      this.addedCategoryIds.update((ids) => [...ids, categoryId]);
    }
  }

  protected removeCategory(categoryId: string): void {
    this.addedCategoryIds.update((ids) => ids.filter((id) => id !== categoryId));
    this.expenseAmounts.update((amounts) => {
      const { [categoryId]: _removed, ...rest } = amounts;
      return rest;
    });
  }

  protected setExpenseAmount(categoryId: string, raw: string): void {
    const cleaned = raw.replace(/[^0-9,.]/g, '');
    this.expenseAmounts.update((amounts) => ({ ...amounts, [categoryId]: cleaned }));
  }

  protected setIncome(raw: string): void {
    this.income.set(raw.replace(/[^0-9,.]/g, ''));
  }

  protected async finish(): Promise<void> {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);

    if (!this.accounts.loaded()) {
      await this.accounts.load();
    }
    const accountId = this.accounts.items()[0]?.id;
    const today = toIsoDate(new Date());

    if (accountId) {
      const income = parseAmount(this.income());
      if (income !== null) {
        await this.transactions.add({
          accountId,
          categoryId: SALAIRE_ID,
          transferToAccountId: null,
          amount: income,
          type: 'income',
          date: today,
          note: 'Revenu mensuel',
          markerColor: null,
          status: 'posted',
          recurringRuleId: null,
        });
      }

      const byId = this.categories.byId();
      for (const categoryId of this.addedCategoryIds()) {
        const amount = parseAmount(this.expenseAmounts()[categoryId] ?? '');
        if (amount === null) {
          continue;
        }
        await this.transactions.add({
          accountId,
          categoryId,
          transferToAccountId: null,
          amount,
          type: 'expense',
          date: today,
          note: byId.get(categoryId)?.name ?? null,
          markerColor: null,
          status: 'posted',
          recurringRuleId: null,
        });
      }
    }

    localStorage.setItem(ONBOARDING_DONE_KEY, '1');
    void this.router.navigateByUrl('/');
  }
}
