import { Injectable, signal } from '@angular/core';
import {
  InstallmentOccurrence,
  InstallmentPlan,
  NewInstallmentPlan,
} from '../../domain/models/installment-plan.model';
import { generateInstallmentOccurrences } from '../../domain/utils/installment-schedule.util';

const PLANS_KEY = 'sereno.installment-plans';
const OCCURRENCES_KEY = 'sereno.installment-occurrences';

interface StoredInstallmentData {
  plans: InstallmentPlan[];
  occurrences: InstallmentOccurrence[];
}

@Injectable({ providedIn: 'root' })
export class InstallmentPlansService {
  private readonly stored = signal(this.load());

  readonly plans = signal(this.stored().plans);
  readonly occurrences = signal(this.stored().occurrences);

  listPlans(): InstallmentPlan[] {
    return this.plans();
  }

  listOccurrences(planId?: string): InstallmentOccurrence[] {
    const items = this.occurrences();
    return planId ? items.filter((occurrence) => occurrence.planId === planId) : items;
  }

  create(input: NewInstallmentPlan): InstallmentPlan {
    const plan: InstallmentPlan = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const generated = generateInstallmentOccurrences(plan);
    this.persist({
      plans: [...this.plans(), plan],
      occurrences: [...this.occurrences(), ...generated],
    });
    return plan;
  }

  update(id: string, patch: Partial<NewInstallmentPlan>): InstallmentPlan | null {
    const existing = this.plans().find((plan) => plan.id === id);
    if (!existing) {
      return null;
    }
    const updated: InstallmentPlan = { ...existing, ...patch };
    const regenerated = generateInstallmentOccurrences(updated);
    this.persist({
      plans: this.plans().map((plan) => (plan.id === id ? updated : plan)),
      occurrences: [
        ...this.occurrences().filter((occurrence) => occurrence.planId !== id),
        ...regenerated,
      ],
    });
    return updated;
  }

  remove(id: string): void {
    this.persist({
      plans: this.plans().filter((plan) => plan.id !== id),
      occurrences: this.occurrences().filter((occurrence) => occurrence.planId !== id),
    });
  }

  linkOccurrenceTransaction(occurrenceId: string, transactionId: string): void {
    this.persist({
      plans: this.plans(),
      occurrences: this.occurrences().map((occurrence) =>
        occurrence.id === occurrenceId ? { ...occurrence, transactionId } : occurrence,
      ),
    });
  }

  private persist(data: StoredInstallmentData): void {
    this.stored.set(data);
    this.plans.set(data.plans);
    this.occurrences.set(data.occurrences);
    localStorage.setItem(PLANS_KEY, JSON.stringify(data.plans));
    localStorage.setItem(OCCURRENCES_KEY, JSON.stringify(data.occurrences));
  }

  private load(): StoredInstallmentData {
    try {
      const plansRaw = localStorage.getItem(PLANS_KEY);
      const occurrencesRaw = localStorage.getItem(OCCURRENCES_KEY);
      return {
        plans: plansRaw ? (JSON.parse(plansRaw) as InstallmentPlan[]) : [],
        occurrences: occurrencesRaw ? (JSON.parse(occurrencesRaw) as InstallmentOccurrence[]) : [],
      };
    } catch {
      return { plans: [], occurrences: [] };
    }
  }
}
