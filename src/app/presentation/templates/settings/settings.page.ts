import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../application/services/auth.service';
import { ImportExportService } from '../../../application/services/import-export.service';
import { PwaService } from '../../../application/services/pwa.service';
import { ToastService } from '../../../application/services/toast.service';
import {
  StartScreen,
  ThemeMode,
  UserPreferencesService,
} from '../../../application/services/user-preferences.service';
import { CategoriesStore } from '../../../application/stores/categories.store';
import { AccountsStore } from '../../../application/stores/accounts.store';
import { TransactionsStore } from '../../../application/stores/transactions.store';
import { IconComponent } from '../../atoms/icon/icon.component';
import { LogoComponent } from '../../atoms/logo/logo.component';

@Component({
  selector: 'app-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent, LogoComponent, RouterLink],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPage {
  protected readonly auth = inject(AuthService);
  protected readonly preferences = inject(UserPreferencesService);
  protected readonly importExport = inject(ImportExportService);
  protected readonly pwa = inject(PwaService);
  protected readonly accounts = inject(AccountsStore);
  protected readonly categories = inject(CategoriesStore);
  protected readonly transactions = inject(TransactionsStore);
  private readonly toast = inject(ToastService);

  protected readonly busy = signal(false);
  protected readonly importBusy = signal(false);

  protected readonly themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: 'Clair' },
    { value: 'dark', label: 'Sombre' },
    { value: 'system', label: 'Système' },
  ];

  protected readonly startScreenOptions: { value: StartScreen; label: string }[] = [
    { value: 'dashboard', label: 'Accueil' },
    { value: 'transactions', label: 'Activité' },
    { value: 'calendar', label: 'Calendrier' },
    { value: 'statistics', label: 'Statistiques' },
    { value: 'accounts', label: 'Comptes' },
  ];

  protected lastSyncLabel(): string {
    return this.importExport.lastSyncLabel();
  }

  protected async signOut(): Promise<void> {
    this.busy.set(true);
    try {
      await this.auth.signOut();
      this.toast.show('À bientôt. Tu es repassé en mode invité.');
    } finally {
      this.busy.set(false);
    }
  }

  protected async exportBackup(): Promise<void> {
    await this.importExport.exportBackup();
  }

  protected async exportCsv(): Promise<void> {
    const categoryNames = new Map([...this.categories.byId()].map(([id, category]) => [id, category.name]));
    const accountNames = new Map(this.accounts.items().map((account) => [account.id, account.name]));
    await this.importExport.exportTransactionsCsv(this.transactions.items(), categoryNames, accountNames);
  }

  protected async onBackupSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    this.importBusy.set(true);
    try {
      await this.importExport.importBackupFromFile(file);
    } finally {
      this.importBusy.set(false);
    }
  }

  protected async onCsvSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    this.importBusy.set(true);
    try {
      const text = await file.text();
      const imported = await this.importExport.importCsvTransactions(text);
      if (imported > 0) {
        await this.transactions.load();
        this.toast.show(`${imported} transaction${imported > 1 ? 's' : ''} importée${imported > 1 ? 's' : ''}.`);
      } else {
        this.toast.show('Aucune transaction importée — vérifie le fichier.');
      }
    } finally {
      this.importBusy.set(false);
    }
  }
}
