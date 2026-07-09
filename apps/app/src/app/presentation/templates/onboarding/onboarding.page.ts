import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountsStore } from '../../../application/stores/accounts.store';
import { CategoriesStore } from '../../../application/stores/categories.store';
import { TransactionsStore } from '../../../application/stores/transactions.store';
import { DEFAULT_CATEGORIES } from '../../../domain/data/default-categories';
import { toIsoDate } from '../../../domain/utils/period.utils';
import { LogoComponent } from '../../atoms/logo/logo.component';
import { LottiePlayerComponent } from '../../atoms/lottie-player/lottie-player.component';
import { CategoryPickerComponent } from '../../molecules/category-picker/category-picker.component';
import { ONBOARDING_DONE_KEY } from '../../guards/onboarding.guard';

function parseAmount(text: string): number | null {
  const value = Number.parseFloat(text.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : null;
}

const SALAIRE_ID = DEFAULT_CATEGORIES.find((category) => category.name === 'Salaire')!.id;
const LOGEMENT_ID = DEFAULT_CATEGORIES.find((category) => category.name === 'Logement')!.id;

/* Premier écran d'un guest tout neuf (voir onboarding.guard.ts) : deux étapes
   courtes, une donnée réelle à la fois, jamais de fausse donnée de démo.
   Chaque étape se présente en deux panneaux — clair (le formulaire) et
   sombre (l'illustration + une phrase) — toujours dans ces deux tons-là,
   indépendamment du thème choisi par ailleurs dans l'app. Toujours
   contournable, à aucun moment un mur. */
@Component({
  selector: 'app-onboarding-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CategoryPickerComponent, LogoComponent, LottiePlayerComponent],
  templateUrl: './onboarding.page.html',
  styleUrl: './onboarding.page.scss',
})
export class OnboardingPage {
  private readonly router = inject(Router);
  private readonly accounts = inject(AccountsStore);
  private readonly categories = inject(CategoriesStore);
  private readonly transactions = inject(TransactionsStore);

  protected readonly step = signal<1 | 2>(1);
  protected readonly incomeText = signal('');
  protected readonly expenseName = signal('');
  protected readonly expenseText = signal('');
  protected readonly expenseCategoryId = signal<string | null>(LOGEMENT_ID);
  protected readonly saving = signal(false);

  protected readonly expenseCategories = computed(() => this.categories.expenseCategories());

  protected goToStep2(): void {
    this.step.set(2);
  }

  protected backToStep1(): void {
    this.step.set(1);
  }

  protected skipAll(): void {
    this.complete({ saveIncome: false, saveExpense: false });
  }

  protected skipExpense(): void {
    this.complete({ saveIncome: true, saveExpense: false });
  }

  protected finish(): void {
    this.complete({ saveIncome: true, saveExpense: true });
  }

  private async complete(opts: { saveIncome: boolean; saveExpense: boolean }): Promise<void> {
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
      const income = opts.saveIncome ? parseAmount(this.incomeText()) : null;
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

      const expense = opts.saveExpense ? parseAmount(this.expenseText()) : null;
      if (expense !== null) {
        await this.transactions.add({
          accountId,
          categoryId: this.expenseCategoryId() ?? LOGEMENT_ID,
          transferToAccountId: null,
          amount: expense,
          type: 'expense',
          date: today,
          note: this.expenseName().trim() || null,
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
