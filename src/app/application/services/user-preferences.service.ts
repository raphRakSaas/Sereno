import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';
export type StartScreen = 'dashboard' | 'transactions' | 'calendar' | 'statistics' | 'accounts';
export type TransactionSort = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'category';

const STORAGE_KEY = 'sereno.preferences';

interface StoredPreferences {
  theme: ThemeMode;
  startScreen: StartScreen;
  weekStartsMonday: boolean;
  transactionSort: TransactionSort;
  quickButtonsEnabled: boolean;
  lastSyncAt: string | null;
}

const DEFAULTS: StoredPreferences = {
  theme: 'system',
  startScreen: 'dashboard',
  weekStartsMonday: true,
  transactionSort: 'date_desc',
  quickButtonsEnabled: true,
  lastSyncAt: null,
};

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly stored = signal(this.load());

  readonly theme = signal(this.stored().theme);
  readonly startScreen = signal(this.stored().startScreen);
  readonly weekStartsMonday = signal(this.stored().weekStartsMonday);
  readonly transactionSort = signal(this.stored().transactionSort);
  readonly quickButtonsEnabled = signal(this.stored().quickButtonsEnabled);
  readonly lastSyncAt = signal(this.stored().lastSyncAt);

  constructor() {
    this.applyTheme(this.theme());
  }

  setTheme(theme: ThemeMode): void {
    this.theme.set(theme);
    this.persist({ theme });
    this.applyTheme(theme);
  }

  setStartScreen(startScreen: StartScreen): void {
    this.startScreen.set(startScreen);
    this.persist({ startScreen });
  }

  setWeekStartsMonday(weekStartsMonday: boolean): void {
    this.weekStartsMonday.set(weekStartsMonday);
    this.persist({ weekStartsMonday });
  }

  setTransactionSort(transactionSort: TransactionSort): void {
    this.transactionSort.set(transactionSort);
    this.persist({ transactionSort });
  }

  setQuickButtonsEnabled(quickButtonsEnabled: boolean): void {
    this.quickButtonsEnabled.set(quickButtonsEnabled);
    this.persist({ quickButtonsEnabled });
  }

  markSynced(): void {
    const lastSyncAt = new Date().toISOString();
    this.lastSyncAt.set(lastSyncAt);
    this.persist({ lastSyncAt });
  }

  startRoute(): string {
    const map: Record<StartScreen, string> = {
      dashboard: '/',
      transactions: '/transactions',
      calendar: '/calendrier',
      statistics: '/statistiques',
      accounts: '/comptes',
    };
    return map[this.startScreen()];
  }

  private persist(patch: Partial<StoredPreferences>): void {
    const next = { ...this.stored(), ...patch };
    this.stored.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private load(): StoredPreferences {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULTS };
      }
      return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULTS };
    }
  }

  private applyTheme(theme: ThemeMode): void {
    const root = document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
      return;
    }
    root.setAttribute('data-theme', theme);
  }
}
