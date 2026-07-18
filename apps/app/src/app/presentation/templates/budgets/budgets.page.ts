import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../application/services/toast.service';
import { BudgetsStore } from '../../../application/stores/budgets.store';
import { CategoriesStore } from '../../../application/stores/categories.store';
import { TransactionsStore } from '../../../application/stores/transactions.store';
import {
  Budget,
  BUDGET_PERIOD_LABELS,
  BudgetPeriodType,
  GLOBAL_BUDGET_CATEGORY_ID,
  isGlobalBudget,
  projectedSpend,
} from '../../../domain/models/budget.model';
import { Category } from '../../../domain/models/category.model';
import { toIsoDate } from '../../../domain/utils/period.utils';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { CategoryIconComponent } from '../../atoms/category-icon/category-icon.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { MonthSwitcherComponent } from '../../molecules/month-switcher/month-switcher.component';

interface BudgetLine {
  budget: Budget;
  category: Category | undefined;
  label: string;
  spent: number;
  ratio: number;
  projectedRatio: number;
  fillPercent: number;
  isNear: boolean;
  isOver: boolean;
  isProjectedOver: boolean;
}

@Component({
  selector: 'app-budgets-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountComponent, CategoryIconComponent, FormsModule, IconComponent, MonthSwitcherComponent],
  templateUrl: './budgets.page.html',
  styleUrl: './budgets.page.scss',
})
export class BudgetsPage {
  protected readonly budgets = inject(BudgetsStore);
  protected readonly categories = inject(CategoriesStore);
  protected readonly transactions = inject(TransactionsStore);
  private readonly toast = inject(ToastService);

  protected readonly globalBudgetId = GLOBAL_BUDGET_CATEGORY_ID;
  protected readonly periodLabels = BUDGET_PERIOD_LABELS;
  protected readonly periodOptions = Object.entries(BUDGET_PERIOD_LABELS) as [BudgetPeriodType, string][];

  protected readonly formOpen = signal(false);
  protected readonly formCategoryId = signal<string | null>(null);
  protected readonly formPeriodType = signal<BudgetPeriodType>('monthly');
  protected readonly limitText = signal('');
  protected readonly hint = signal('');
  protected readonly confirmingDelete = signal<string | null>(null);

  protected readonly todayIso = toIsoDate(new Date());

  constructor() {
    void this.budgets.load();
  }

  protected readonly spentByCategory = computed(() => {
    const prefix = this.budgets.month().slice(0, 7);
    const byId = this.categories.byId();
    const sums = new Map<string, number>();
    let totalExpenses = 0;
    for (const transaction of this.transactions.items()) {
      if (transaction.type !== 'expense' || !transaction.categoryId || !transaction.date.startsWith(prefix)) {
        continue;
      }
      totalExpenses += transaction.amount;
      const category = byId.get(transaction.categoryId);
      const budgetKey = category?.parentId ?? transaction.categoryId;
      sums.set(budgetKey, (sums.get(budgetKey) ?? 0) + transaction.amount);
    }
    sums.set(GLOBAL_BUDGET_CATEGORY_ID, totalExpenses);
    return sums;
  });

  protected readonly lines = computed<BudgetLine[]>(() => {
    const byId = this.categories.byId();
    const spent = this.spentByCategory();
    return this.budgets
      .items()
      .map((budget) => {
        const budgetKey = isGlobalBudget(budget) ? GLOBAL_BUDGET_CATEGORY_ID : budget.categoryId!;
        const used = spent.get(budgetKey) ?? 0;
        const ratio = budget.limitAmount > 0 ? used / budget.limitAmount : 0;
        const projected = projectedSpend(used, budget.periodStart, budget.periodEnd, this.todayIso);
        const projectedRatio = budget.limitAmount > 0 ? projected / budget.limitAmount : 0;
        const category = budget.categoryId ? byId.get(budget.categoryId) : undefined;
        return {
          budget,
          category,
          label: isGlobalBudget(budget) ? 'Budget global' : (category?.name ?? 'Catégorie'),
          spent: used,
          ratio,
          projectedRatio,
          fillPercent: Math.min(ratio, 1) * 100,
          isNear: ratio >= 0.8 && ratio <= 1,
          isOver: ratio > 1,
          isProjectedOver: projectedRatio > 1,
        };
      })
      .sort((left, right) => right.ratio - left.ratio);
  });

  protected readonly availableCategories = computed(() => {
    const taken = new Set(
      this.budgets.items().filter((budget) => !isGlobalBudget(budget)).map((budget) => budget.categoryId),
    );
    return this.categories.expenseCategories().filter((category) => !category.parentId && !taken.has(category.id));
  });

  protected statusText(line: BudgetLine): string {
    const remaining = line.budget.limitAmount - line.spent;
    const format = (value: number) =>
      new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

    if (line.isProjectedOver && !line.isOver) {
      const projected = projectedSpend(
        line.spent,
        line.budget.periodStart,
        line.budget.periodEnd,
        this.todayIso,
      );
      return `Au rythme actuel, tu finirais à ${format(projected)} — un peu au-dessus de la limite.`;
    }

    if (remaining < 0) {
      return `Dépassé de ${format(-remaining)} — ça arrive. Le mois prochain repart de zéro.`;
    }
    if (line.ratio >= 0.8) {
      return `Il reste ${format(remaining)}. Tu t'en approches, tout va bien.`;
    }
    return `Il reste ${format(remaining)}.`;
  }

  protected async changeMonth(month: string): Promise<void> {
    await this.budgets.load(month);
  }

  protected openCreate(): void {
    this.formCategoryId.set(this.availableCategories()[0]?.id ?? GLOBAL_BUDGET_CATEGORY_ID);
    this.formPeriodType.set('monthly');
    this.limitText.set('');
    this.hint.set('');
    this.formOpen.set(true);
  }

  protected openEdit(line: BudgetLine): void {
    this.formCategoryId.set(line.budget.categoryId ?? GLOBAL_BUDGET_CATEGORY_ID);
    this.formPeriodType.set(line.budget.periodType ?? 'monthly');
    this.limitText.set(line.budget.limitAmount.toString().replace('.', ','));
    this.hint.set('');
    this.formOpen.set(true);
  }

  protected async save(): Promise<void> {
    const limit = Number.parseFloat(this.limitText().replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(limit) || limit <= 0) {
      this.hint.set('Indique une limite supérieure à zéro — par exemple 250.');
      return;
    }
    const rawCategoryId = this.formCategoryId();
    const categoryId = rawCategoryId === GLOBAL_BUDGET_CATEGORY_ID ? null : rawCategoryId;
    if (!rawCategoryId) {
      this.hint.set('Choisis la catégorie à suivre.');
      return;
    }
    const saved = await this.budgets.upsert({
      categoryId,
      month: this.budgets.month(),
      limitAmount: Math.round(limit * 100) / 100,
      periodType: this.formPeriodType(),
    });
    if (saved) {
      this.toast.show('Budget en place. Sereno veille, en douceur.');
      this.formOpen.set(false);
    }
  }

  protected async remove(id: string): Promise<void> {
    if (this.confirmingDelete() !== id) {
      this.confirmingDelete.set(id);
      return;
    }
    await this.budgets.remove(id);
    this.confirmingDelete.set(null);
    this.toast.show('Budget retiré.');
  }

  protected readonly editingExisting = computed(() => {
    const current = this.formCategoryId();
    if (!current) {
      return false;
    }
    return this.budgets.items().some((budget) => {
      if (current === GLOBAL_BUDGET_CATEGORY_ID) {
        return isGlobalBudget(budget);
      }
      return budget.categoryId === current;
    });
  });

  protected readonly formCategories = computed(() => {
    const current = this.formCategoryId();
    const byId = this.categories.byId();
    const list = this.availableCategories();
    const currentCategory = current && current !== GLOBAL_BUDGET_CATEGORY_ID ? byId.get(current) : undefined;
    const categories =
      currentCategory && !list.some((category) => category.id === current) ? [currentCategory, ...list] : list;
    return categories;
  });

  protected readonly hasGlobalBudget = computed(() =>
    this.budgets.items().some((budget) => isGlobalBudget(budget)),
  );

  protected readonly canCopyPreviousMonth = computed(
    () => this.lines().length === 0 && !this.formOpen(),
  );

  protected async copyPreviousMonthBudgets(): Promise<void> {
    const copiedCount = await this.budgets.copyFromPreviousMonth();
    if (copiedCount === null) {
      return;
    }
    if (copiedCount === 0) {
      this.toast.show('Aucun budget à reprendre le mois précédent.');
      return;
    }
    this.toast.show(`${copiedCount} budget${copiedCount > 1 ? 's' : ''} repris du mois précédent.`);
  }
}
