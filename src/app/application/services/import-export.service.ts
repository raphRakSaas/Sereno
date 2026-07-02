import { inject, Injectable } from '@angular/core';
import { Account } from '../../domain/models/account.model';
import { Budget } from '../../domain/models/budget.model';
import { Category } from '../../domain/models/category.model';
import { RecurringRule } from '../../domain/models/recurring-rule.model';
import { Transaction } from '../../domain/models/transaction.model';
import { TransactionTemplate } from '../../domain/models/transaction-template.model';
import {
  ACCOUNT_REPOSITORY,
  BUDGET_REPOSITORY,
  CATEGORY_REPOSITORY,
  RECURRING_RULE_REPOSITORY,
  TRANSACTION_REPOSITORY,
  TRANSACTION_TEMPLATE_REPOSITORY,
} from '../../domain/ports/tokens';
import { AppModeService } from './app-mode.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { UserPreferencesService } from './user-preferences.service';

export interface SerenoBackup {
  version: 1;
  exportedAt: string;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  recurringRules: RecurringRule[];
  templates: TransactionTemplate[];
}

@Injectable({ providedIn: 'root' })
export class ImportExportService {
  private readonly accounts = inject(ACCOUNT_REPOSITORY);
  private readonly categories = inject(CATEGORY_REPOSITORY);
  private readonly transactions = inject(TRANSACTION_REPOSITORY);
  private readonly budgets = inject(BUDGET_REPOSITORY);
  private readonly recurring = inject(RECURRING_RULE_REPOSITORY);
  private readonly templates = inject(TRANSACTION_TEMPLATE_REPOSITORY);
  private readonly mode = inject(AppModeService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly preferences = inject(UserPreferencesService);

  async exportBackup(): Promise<void> {
    const backup: SerenoBackup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      accounts: await this.accounts.list(),
      categories: await this.categories.list(),
      transactions: await this.transactions.list(),
      budgets: await this.budgets.listAll(),
      recurringRules: await this.recurring.list(),
      templates: await this.templates.list(),
    };
    this.downloadJson(backup, `sereno-backup-${backup.exportedAt.slice(0, 10)}.json`);
    this.preferences.markSynced();
    this.toast.show('Sauvegarde exportée.');
  }

  async exportTransactionsCsv(
    transactions: Transaction[],
    categoryNames: Map<string, string>,
    accountNames: Map<string, string>,
  ): Promise<void> {
    const header = ['date', 'type', 'amount', 'account', 'category', 'note', 'status'];
    const rows = transactions.map((transaction) => [
      transaction.date,
      transaction.type,
      transaction.amount.toFixed(2),
      accountNames.get(transaction.accountId) ?? '',
      transaction.categoryId ? (categoryNames.get(transaction.categoryId) ?? '') : '',
      (transaction.note ?? '').replace(/"/g, '""'),
      transaction.status,
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    this.downloadText(csv, `sereno-transactions-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    this.toast.show('Export CSV téléchargé.');
  }

  async importBackupFromFile(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const backup = JSON.parse(text) as SerenoBackup;
      if (backup.version !== 1) {
        this.toast.show('Format de sauvegarde non reconnu.');
        return false;
      }
      this.toast.show('Sauvegarde reçue — utilise la migration cloud pour une restauration complète.');
      this.preferences.markSynced();
      return true;
    } catch {
      this.toast.show('Impossible de lire ce fichier.');
      return false;
    }
  }

  async importCsvTransactions(text: string): Promise<number> {
    const lines = text.trim().split(/\r?\n/).slice(1);
    let imported = 0;
    const accountList = await this.accounts.list();
    const accountId = accountList[0]?.id;
    if (!accountId) {
      return 0;
    }
    for (const line of lines) {
      const cells =
        line.match(/("([^"]|"")*"|[^,]+)/g)?.map((cell) => cell.replace(/^"|"$/g, '').replace(/""/g, '"')) ?? [];
      if (cells.length < 3) {
        continue;
      }
      const [date, type, amountText, , , note] = cells;
      const amount = Number.parseFloat(amountText);
      if (!date || !Number.isFinite(amount) || amount <= 0) {
        continue;
      }
      await this.transactions.create({
        accountId,
        categoryId: null,
        transferToAccountId: null,
        amount,
        type: type === 'income' ? 'income' : 'expense',
        date,
        note: note || null,
        markerColor: null,
        status: 'posted',
        recurringRuleId: null,
      });
      imported++;
    }
    return imported;
  }

  lastSyncLabel(): string {
    const value = this.preferences.lastSyncAt();
    if (!value) {
      return this.mode.isCloud() && this.auth.isSignedIn() ? 'Sync cloud active' : 'Données locales';
    }
    return `Dernière exportation : ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))}`;
  }

  private downloadJson(data: unknown, filename: string): void {
    this.downloadText(JSON.stringify(data, null, 2), filename, 'application/json');
  }

  private downloadText(content: string, filename: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
