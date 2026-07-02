import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppModeService } from '../../../application/services/app-mode.service';
import { ConversionService } from '../../../application/services/conversion.service';
import { ToastService } from '../../../application/services/toast.service';
import { BudgetsStore } from '../../../application/stores/budgets.store';
import { CategoriesStore } from '../../../application/stores/categories.store';
import { TransactionsStore } from '../../../application/stores/transactions.store';
import { Budget } from '../../../domain/models/budget.model';
import { Category } from '../../../domain/models/category.model';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { MonthSwitcherComponent } from '../../molecules/month-switcher/month-switcher.component';

interface BudgetLine {
  budget: Budget;
  category: Category | undefined;
  spent: number;
  /** Part consommée, non bornée (1.2 = dépassé de 20 %). */
  ratio: number;
  /** Largeur de la jauge, bornée à 100. */
  fillPercent: number;
}

@Component({
  selector: 'app-budgets-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountComponent, FormsModule, IconComponent, MonthSwitcherComponent],
  templateUrl: './budgets.page.html',
  styleUrl: './budgets.page.scss',
})
export class BudgetsPage {
  protected readonly mode = inject(AppModeService);
  protected readonly conversion = inject(ConversionService);
  protected readonly budgets = inject(BudgetsStore);
  protected readonly categories = inject(CategoriesStore);
  protected readonly transactions = inject(TransactionsStore);
  private readonly toast = inject(ToastService);

  protected readonly formOpen = signal(false);
  protected readonly formCategoryId = signal<string | null>(null);
  protected readonly limitText = signal('');
  protected readonly hint = signal('');
  protected readonly confirmingDelete = signal<string | null>(null);

  constructor() {
    if (this.mode.isCloud()) {
      void this.budgets.load();
    } else {
      // Accéder à une fonctionnalité verrouillée est l'un des trois déclencheurs.
      this.conversion.requestLockedFeature('les budgets');
    }
  }

  /** Dépenses du mois affiché, par catégorie. */
  protected readonly spentByCategory = computed(() => {
    const prefix = this.budgets.month().slice(0, 7);
    const sums = new Map<string, number>();
    for (const t of this.transactions.items()) {
      if (t.type !== 'expense' || !t.date.startsWith(prefix)) continue;
      sums.set(t.categoryId, (sums.get(t.categoryId) ?? 0) + t.amount);
    }
    return sums;
  });

  protected readonly lines = computed<BudgetLine[]>(() => {
    const byId = this.categories.byId();
    const spent = this.spentByCategory();
    return this.budgets
      .items()
      .map((budget) => {
        const used = spent.get(budget.categoryId) ?? 0;
        const ratio = budget.limitAmount > 0 ? used / budget.limitAmount : 0;
        return {
          budget,
          category: byId.get(budget.categoryId),
          spent: used,
          ratio,
          fillPercent: Math.min(ratio, 1) * 100,
        };
      })
      .sort((a, b) => b.ratio - a.ratio);
  });

  /** Catégories de dépense sans budget ce mois-ci (pour le formulaire). */
  protected readonly availableCategories = computed(() => {
    const taken = new Set(this.budgets.items().map((b) => b.categoryId));
    return this.categories.expenseCategories().filter((c) => !taken.has(c.id));
  });

  /** Un constat posé, pas une alarme. */
  protected statusText(line: BudgetLine): string {
    const remaining = line.budget.limitAmount - line.spent;
    const format = (v: number) =>
      new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);
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
    this.formCategoryId.set(this.availableCategories()[0]?.id ?? null);
    this.limitText.set('');
    this.hint.set('');
    this.formOpen.set(true);
  }

  protected openEdit(line: BudgetLine): void {
    this.formCategoryId.set(line.budget.categoryId);
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
    const categoryId = this.formCategoryId();
    if (!categoryId) {
      this.hint.set('Choisis la catégorie à suivre.');
      return;
    }
    const saved = await this.budgets.upsert({
      categoryId,
      month: this.budgets.month(),
      limitAmount: Math.round(limit * 100) / 100,
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

  /** Le formulaire édite-t-il un budget existant ? */
  protected readonly editingExisting = computed(() =>
    this.budgets.items().some((b) => b.categoryId === this.formCategoryId()),
  );

  protected readonly formCategories = computed(() => {
    const current = this.formCategoryId();
    const byId = this.categories.byId();
    const list = this.availableCategories();
    const currentCategory = current ? byId.get(current) : undefined;
    return currentCategory && !list.some((c) => c.id === current) ? [currentCategory, ...list] : list;
  });
}
