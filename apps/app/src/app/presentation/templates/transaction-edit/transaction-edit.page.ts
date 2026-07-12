import { Location } from '@angular/common';
import {
  afterNextRender,
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
import { ActivatedRoute, Router } from '@angular/router';
import { ConversionService } from '../../../application/services/conversion.service';
import { ToastService } from '../../../application/services/toast.service';
import { AccountsStore } from '../../../application/stores/accounts.store';
import { CategoriesStore } from '../../../application/stores/categories.store';
import { ReceiptsStore } from '../../../application/stores/receipts.store';
import { TransactionTemplatesStore } from '../../../application/stores/transaction-templates.store';
import { TransactionsStore } from '../../../application/stores/transactions.store';
import { CategoryKind } from '../../../domain/models/category.model';
import { DEFAULT_CATEGORIES } from '../../../domain/data/default-categories';
import { TransactionTemplate } from '../../../domain/models/transaction-template.model';
import {
  lastUsedCategoryId,
  suggestCategoryIdFromNote,
} from '../../../domain/utils/category-usage.util';
import { suggestMarkerColor } from '../../../domain/utils/marker-color.util';
import { toIsoDate } from '../../../domain/utils/period.utils';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { MerchantBadgeComponent } from '../../atoms/merchant-badge/merchant-badge.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { CategoryPickerComponent } from '../../molecules/category-picker/category-picker.component';
import {
  ReceiptAttachComponent,
  ReceiptSuggestionApply,
} from '../../molecules/receipt-attach/receipt-attach.component';

/** Montant saisi à la française : "12,50" comme "12.50". */
function parseAmount(text: string): number | null {
  const amountValue = Number.parseFloat(text.replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(amountValue) || amountValue <= 0) {
    return null;
  }
  return Math.round(amountValue * 100) / 100;
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/* Revenus les plus fréquents montrés d'emblée ; le reste (placements, pensions…)
   se déplie à la demande — « deux gestes suffisent », charge cognitive minimale. */
const COMMON_INCOME_CATEGORY_NAMES = new Set([
  'Salaire',
  'Freelance & indépendant',
  'Allocations & aides familiales',
  'Remboursements reçus',
  'Autres revenus',
]);

const COMMON_INCOME_CATEGORY_IDS = DEFAULT_CATEGORIES.filter(
  (category) => category.type === 'income' && COMMON_INCOME_CATEGORY_NAMES.has(category.name),
).map((category) => category.id);

@Component({
  selector: 'app-transaction-edit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountComponent, CategoryPickerComponent, FormsModule, IconComponent, MerchantBadgeComponent, ReceiptAttachComponent],
  templateUrl: './transaction-edit.page.html',
  styleUrl: './transaction-edit.page.scss',
})
export class TransactionEditPage {
  protected readonly accounts = inject(AccountsStore);
  protected readonly categories = inject(CategoriesStore);
  protected readonly transactions = inject(TransactionsStore);
  protected readonly templates = inject(TransactionTemplatesStore);
  protected readonly receipts = inject(ReceiptsStore);
  private readonly conversion = inject(ConversionService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  private readonly amountInput = viewChild<ElementRef<HTMLInputElement>>('amountInput');

  protected readonly editedId = signal<string | null>(null);
  protected readonly isCreateMode = computed(() => this.editedId() === null);

  protected readonly type = signal<CategoryKind>('expense');
  protected readonly amountText = signal('');
  protected readonly categoryId = signal<string | null>(null);
  protected readonly accountId = signal<string | null>(null);
  protected readonly date = signal(toIsoDate(new Date()));
  protected readonly note = signal('');
  protected readonly detachFromRecurrence = signal(false);
  protected readonly linkedRecurringRuleId = signal<string | null>(null);

  protected readonly hint = signal('');
  protected readonly confirmingDelete = signal(false);
  protected readonly saving = signal(false);
  protected readonly pendingReceiptFile = signal<File | null>(null);
  protected readonly templateFormOpen = signal(false);
  protected readonly templateName = signal('');

  protected readonly canSaveAsTemplate = computed(
    () => parseAmount(this.amountText()) !== null && this.categoryId() !== null,
  );

  /** L'utilisateur a choisi une catégorie manuellement — on n'écrase plus via la note. */
  private readonly categoryTouched = signal(false);

  protected readonly commonIncomeCategoryIds = COMMON_INCOME_CATEGORY_IDS;

  protected readonly pickableCategories = computed(() =>
    this.type() === 'expense' ? this.categories.expenseCategories() : this.categories.incomeCategories(),
  );

  protected readonly selectedCategory = computed(() => {
    const categoryId = this.categoryId();
    if (!categoryId) {
      return undefined;
    }
    return this.pickableCategories().find((category) => category.id === categoryId);
  });

  protected readonly merchantTexts = computed(() =>
    [this.note(), this.selectedCategory()?.name].filter((text): text is string => !!text?.trim()),
  );

  protected readonly amountSuggestions = computed(() => {
    const amounts = new Set<number>();
    for (const transaction of this.transactions.items()) {
      if (transaction.type !== this.type()) {
        continue;
      }
      amounts.add(transaction.amount);
      if (amounts.size >= 5) {
        break;
      }
    }
    return [...amounts];
  });

  private readonly recentMarkerColors = computed(() => {
    const colors: string[] = [];
    for (const transaction of this.transactions.items()) {
      if (!transaction.markerColor || colors.includes(transaction.markerColor)) {
        continue;
      }
      colors.push(transaction.markerColor);
      if (colors.length >= 3) {
        break;
      }
    }
    return colors;
  });

  private populated = false;

  private templateApplied = false;

  constructor() {
    if (!this.templates.loaded()) {
      void this.templates.load();
    }

    effect(() => {
      const transactionId = this.route.snapshot.paramMap.get('id');
      if (!transactionId || this.populated || !this.transactions.loaded()) {
        return;
      }
      const existing = this.transactions.items().find((transaction) => transaction.id === transactionId);
      if (!existing || existing.type === 'transfer') {
        if (existing?.type === 'transfer') {
          void this.router.navigate(['/transferts', transactionId], { replaceUrl: true });
        }
        return;
      }
      this.populated = true;
      this.editedId.set(transactionId);
      this.type.set(existing.type);
      this.amountText.set(existing.amount.toString().replace('.', ','));
      this.categoryId.set(existing.categoryId);
      this.accountId.set(existing.accountId);
      this.date.set(existing.date);
      this.note.set(existing.note ?? '');
      this.linkedRecurringRuleId.set(existing.recurringRuleId);
      this.detachFromRecurrence.set(false);
      this.categoryTouched.set(true);
    });

    effect(() => {
      const firstAccount = this.accounts.items()[0];
      if (firstAccount && this.accountId() === null) {
        this.accountId.set(firstAccount.id);
      }
    });

    effect(() => {
      if (this.editedId() || this.categoryTouched() || this.categoryId()) {
        return;
      }
      const suggestedCategoryId = lastUsedCategoryId(this.transactions.items(), this.type());
      if (
        suggestedCategoryId &&
        this.pickableCategories().some((category) => category.id === suggestedCategoryId)
      ) {
        this.categoryId.set(suggestedCategoryId);
      }
    });

    effect(() => {
      if (this.editedId() || this.categoryTouched()) {
        return;
      }
      const suggestedFromNote = suggestCategoryIdFromNote(this.note(), this.pickableCategories());
      if (suggestedFromNote) {
        this.categoryId.set(suggestedFromNote);
      }
    });

    const queryType = this.route.snapshot.queryParamMap.get('type');
    if (queryType === 'income' || queryType === 'expense') {
      this.type.set(queryType);
    }

    const queryDate = this.route.snapshot.queryParamMap.get('date');
    if (queryDate && isIsoDate(queryDate)) {
      this.date.set(queryDate);
    }

    effect(() => {
      if (this.templateApplied || this.editedId() || !this.templates.loaded()) {
        return;
      }
      const templateId = this.route.snapshot.queryParamMap.get('modele');
      if (!templateId) {
        return;
      }
      const template = this.templates.byId().get(templateId);
      if (template) {
        this.applyTemplate(template);
        this.templateApplied = true;
      }
    });

    afterNextRender(() => {
      if (!this.editedId()) {
        // preventScroll : sinon l'ouverture du clavier pousse l'en-tête hors écran.
        this.focusAmountField(true);
      }
    });
  }

  protected applyTemplate(template: TransactionTemplate): void {
    this.type.set(template.type);
    this.amountText.set(template.amount.toString().replace('.', ','));
    this.categoryId.set(template.categoryId);
    if (template.accountId) {
      this.accountId.set(template.accountId);
    }
    this.note.set(template.note ?? '');
    this.categoryTouched.set(true);
    this.hint.set('');
  }

  protected openTemplateForm(): void {
    this.templateName.set(this.note().trim() || '');
    this.templateFormOpen.set(true);
  }

  protected async saveAsTemplate(): Promise<void> {
    const name = this.templateName().trim();
    if (!name) {
      this.hint.set('Donne un nom au modèle — par exemple « Café du matin ».');
      return;
    }
    const amount = parseAmount(this.amountText());
    const selectedCategoryId = this.categoryId();
    const selectedAccountId = this.accountId();
    if (amount === null || !selectedCategoryId) {
      this.hint.set('Montant et catégorie sont nécessaires pour enregistrer un modèle.');
      return;
    }
    const created = await this.templates.add({
      name,
      type: this.type(),
      amount,
      categoryId: selectedCategoryId,
      accountId: selectedAccountId,
      note: this.note().trim() || null,
      isPinned: false,
      sortOrder: 0,
    });
    if (created) {
      this.templateFormOpen.set(false);
      this.toast.show('Modèle enregistré.');
    }
  }

  protected onPendingReceiptFile(file: File | null): void {
    this.pendingReceiptFile.set(file);
  }

  protected applyReceiptSuggestion(suggestion: ReceiptSuggestionApply): void {
    if (suggestion.amount !== undefined) {
      this.amountText.set(suggestion.amount.toString().replace('.', ','));
    }
    if (suggestion.date && isIsoDate(suggestion.date)) {
      this.date.set(suggestion.date);
    }
    if (suggestion.merchant) {
      this.note.set(suggestion.merchant);
    }
  }

  protected onDateChange(value: string): void {
    this.date.set(isIsoDate(value) ? value : toIsoDate(new Date()));
  }

  protected setType(transactionType: CategoryKind): void {
    this.type.set(transactionType);
    this.categoryTouched.set(false);
    const selectedCategoryId = this.categoryId();
    if (selectedCategoryId && !this.pickableCategories().some((category) => category.id === selectedCategoryId)) {
      this.categoryId.set(null);
    }
    const lastCategoryId = lastUsedCategoryId(this.transactions.items(), transactionType);
    if (lastCategoryId && this.pickableCategories().some((category) => category.id === lastCategoryId)) {
      this.categoryId.set(lastCategoryId);
    }
  }

  protected selectCategory(categoryId: string): void {
    this.categoryTouched.set(true);
    this.categoryId.set(categoryId);
    this.hint.set('');
  }

  protected applyAmountSuggestion(amount: number): void {
    this.amountText.set(amount.toString().replace('.', ','));
    this.hint.set('');
  }

  protected async save(): Promise<void> {
    await this.persist(true);
  }

  protected async saveAndContinue(): Promise<void> {
    await this.persist(false);
  }

  protected async remove(): Promise<void> {
    const transactionId = this.editedId();
    if (!transactionId) {
      return;
    }
    if (!this.confirmingDelete()) {
      this.confirmingDelete.set(true);
      return;
    }
    await this.transactions.remove(transactionId);
    this.toast.show('Supprimé. Ton historique est à jour.');
    this.close();
  }

  protected close(): void {
    // navigationId > 1 : on est arrivé ici depuis l'app → retour naturel.
    // Sinon (arrivée directe : raccourci PWA, lien), back() sortirait de
    // Sereno → on va au dashboard.
    const state = this.location.getState() as { navigationId?: number } | null;
    if ((state?.navigationId ?? 1) > 1) {
      this.location.back();
    } else {
      void this.router.navigateByUrl('/');
    }
  }

  private async persist(closeAfterSave: boolean): Promise<void> {
    if (this.saving()) {
      return;
    }

    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    this.saving.set(true);
    const transactionId = this.editedId();
    const pendingReceipt = this.pendingReceiptFile();
    // La toute première transaction est un moment : on le souligne (calmement).
    const isFirstTransaction = !transactionId && this.transactions.items().length === 0;
    const result = transactionId
      ? await this.transactions.update(transactionId, payload)
      : await this.transactions.add(payload);
    this.saving.set(false);

    if (!result) {
      return;
    }

    const savedTransactionId =
      transactionId ?? (result && typeof result === 'object' && 'id' in result ? result.id : null);
    if (savedTransactionId && pendingReceipt) {
      await this.receipts.attach(savedTransactionId, pendingReceipt);
      this.pendingReceiptFile.set(null);
    }

    this.toast.show(
      transactionId
        ? 'Modifié. Tout est à jour.'
        : isFirstTransaction
          ? 'C’est noté — regarde ta première couche se déposer.'
          : 'C’est noté.',
    );

    if (transactionId || closeAfterSave) {
      this.close();
      if (!transactionId) {
        this.conversion.scheduleQuotaCheck();
      }
      return;
    }

    this.resetForNextEntry();
    this.conversion.scheduleQuotaCheck();
  }

  private buildPayload(): {
    accountId: string;
    categoryId: string;
    amount: number;
    type: CategoryKind;
    date: string;
    note: string | null;
    markerColor: string | null;
    status: 'posted';
    recurringRuleId: string | null;
    transferToAccountId: null;
  } | null {
    const amount = parseAmount(this.amountText());
    if (amount === null) {
      this.hint.set('Indique un montant supérieur à zéro — par exemple 12,50.');
      this.focusAmountField();
      return null;
    }

    const selectedCategoryId = this.categoryId();
    if (!selectedCategoryId) {
      this.hint.set('Choisis une catégorie pour savoir où ranger cette transaction.');
      return null;
    }

    const selectedAccountId = this.accountId();
    if (!selectedAccountId) {
      this.hint.set('Aucun compte disponible pour le moment. Réessaie dans un instant.');
      return null;
    }

    const rawDate = this.date().trim();
    const selectedDate = isIsoDate(rawDate) ? rawDate : toIsoDate(new Date());

    this.hint.set('');
    const recurringRuleId =
      this.detachFromRecurrence() && this.linkedRecurringRuleId()
        ? null
        : this.linkedRecurringRuleId();
    return {
      accountId: selectedAccountId,
      categoryId: selectedCategoryId,
      amount,
      type: this.type(),
      date: selectedDate,
      note: this.note().trim() || null,
      markerColor: suggestMarkerColor(selectedCategoryId, this.recentMarkerColors()),
      status: 'posted',
      recurringRuleId,
      transferToAccountId: null,
    };
  }

  private resetForNextEntry(): void {
    this.amountText.set('');
    this.note.set('');
    this.hint.set('');
    this.pendingReceiptFile.set(null);
    this.categoryTouched.set(false);
    this.date.set(toIsoDate(new Date()));
    window.scrollTo(0, 0);
    this.focusAmountField(true);
  }

  private focusAmountField(preventScroll = false): void {
    queueMicrotask(() => this.amountInput()?.nativeElement.focus({ preventScroll }));
  }
}
