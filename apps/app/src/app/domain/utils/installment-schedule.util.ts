import { InstallmentFrequency, InstallmentOccurrence, InstallmentPlan } from '../models/installment-plan.model';
import { advanceRecurringDate } from './recurring-schedule.util';

function advanceInstallmentDate(dateIso: string, frequency: InstallmentFrequency): string {
  if (frequency === 'weekly') {
    return advanceRecurringDate(dateIso, 'weekly');
  }
  return advanceRecurringDate(dateIso, 'monthly');
}

/** Génère les échéances d'un plan (montant réparti, dernier ajusté au centime). */
export function generateInstallmentOccurrences(plan: InstallmentPlan): InstallmentOccurrence[] {
  const baseAmount = Math.round((plan.totalAmount / plan.installmentCount) * 100) / 100;
  const occurrences: InstallmentOccurrence[] = [];
  let dueDate = plan.startDate;

  for (let index = 0; index < plan.installmentCount; index++) {
    const isLast = index === plan.installmentCount - 1;
    const amount = isLast
      ? Math.round((plan.totalAmount - baseAmount * (plan.installmentCount - 1)) * 100) / 100
      : baseAmount;

    occurrences.push({
      id: `${plan.id}-${index + 1}`,
      planId: plan.id,
      dueDate,
      amount,
      transactionId: null,
    });

    if (!isLast) {
      dueDate = advanceInstallmentDate(dueDate, plan.frequency);
    }
  }

  return occurrences;
}
