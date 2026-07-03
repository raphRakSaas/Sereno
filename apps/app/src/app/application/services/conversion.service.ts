import { inject, Injectable, signal } from '@angular/core';
import { AUTH_GATEWAY } from '../../domain/ports/auth.gateway';
import { DexieService } from '../../infrastructure/dexie/dexie.providers';
import { AppModeService } from './app-mode.service';

export type ConversionReason = 'transactions' | 'days' | 'feature';

const TRANSACTION_TRIGGER = 20;
const DAYS_TRIGGER = 14;
const SNOOZE_DAYS = 7;
const SNOOZE_KEY = 'sereno.conversion.snoozedUntil';

/* Les trois déclencheurs combinés de la proposition de compte — le premier
   atteint ouvre la modale. Le ton reste une invitation : jamais de "limite
   atteinte", et "Plus tard" met les déclencheurs automatiques en pause
   une semaine. L'accès à une fonctionnalité verrouillée, lui, ouvre toujours
   la modale (c'est une demande explicite de l'utilisateur). */
@Injectable({ providedIn: 'root' })
export class ConversionService {
  private readonly dexie = inject(DexieService);
  private readonly mode = inject(AppModeService);
  private readonly gateway = inject(AUTH_GATEWAY);

  readonly open = signal(false);
  readonly reason = signal<ConversionReason>('days');
  readonly featureName = signal('');

  private quotaCheckTimer: ReturnType<typeof setTimeout> | null = null;

  /** À appeler au démarrage et après chaque transaction créée. */
  async checkQuotaTriggers(): Promise<void> {
    if (this.mode.isCloud() || !this.gateway.available || this.open() || this.isSnoozed()) {
      return;
    }
    const count = await this.dexie.db.transactions.count();
    if (count >= TRANSACTION_TRIGGER) {
      this.trigger('transactions');
      return;
    }
    const firstLaunch = await this.dexie.firstLaunchAt();
    if (firstLaunch) {
      const days = (Date.now() - firstLaunch.getTime()) / 86_400_000;
      if (days >= DAYS_TRIGGER) {
        this.trigger('days');
      }
    }
  }

  /** Laisse le temps au toast de confirmation avant d'ouvrir la modale. */
  scheduleQuotaCheck(delayMs = 3500): void {
    if (this.quotaCheckTimer !== null) {
      clearTimeout(this.quotaCheckTimer);
    }
    this.quotaCheckTimer = setTimeout(() => {
      this.quotaCheckTimer = null;
      void this.checkQuotaTriggers();
    }, delayMs);
  }

  /** Tentative d'accès à une fonctionnalité réservée aux comptes. */
  requestLockedFeature(featureName: string): void {
    if (this.mode.isCloud() || !this.gateway.available) {
      return;
    }
    this.featureName.set(featureName);
    this.trigger('feature');
  }

  dismiss(): void {
    this.open.set(false);
    const until = Date.now() + SNOOZE_DAYS * 86_400_000;
    localStorage.setItem(SNOOZE_KEY, String(until));
  }

  /** Fermée parce que l'utilisateur part créer son compte. */
  proceed(): void {
    this.open.set(false);
  }

  private trigger(reason: ConversionReason): void {
    this.reason.set(reason);
    this.open.set(true);
  }

  private isSnoozed(): boolean {
    const raw = localStorage.getItem(SNOOZE_KEY);
    return raw !== null && Number(raw) > Date.now();
  }
}
