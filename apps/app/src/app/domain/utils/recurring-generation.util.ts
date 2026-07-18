import { CategoryKind } from '../models/category.model';
import { RecurringRule } from '../models/recurring-rule.model';
import { NewTransaction } from '../models/transaction.model';
import { advanceRecurringDate } from './recurring-schedule.util';

export interface RecurringGenerationInput {
  rule: RecurringRule;
  /** Type de la catégorie liée ; défaut 'expense' si inconnu. */
  categoryType: CategoryKind | null;
  /** Aujourd'hui, yyyy-MM-dd (injecté pour tests). */
  todayIso: string;
  /**
   * Dates déjà matérialisées pour cette règle (idempotence locale).
   * Équivalent cloud : SELECT date WHERE recurring_rule_id = ? AND date IN due.
   */
  existingOccurrenceDates: ReadonlySet<string>;
}

export interface PlannedRecurringTransaction extends NewTransaction {
  /** Clé logique `${ruleId}:${date}` — miroir de l'Edge Function. */
  idempotencyKey: string;
}

export interface RecurringGenerationResult {
  transactionsToCreate: PlannedRecurringTransaction[];
  /** nextRunDate après rattrapage (première date > today / hors endDate). */
  nextRunDate: string;
  /** true si endDate dépassée → désactiver la règle. */
  deactivate: boolean;
}

/**
 * Calcule les occurrences dues jusqu'à today, filtre les déjà présentes,
 * et avance nextRunDate. Aligné sur supabase/functions/process-recurring.
 */
export function planRecurringOccurrences(input: RecurringGenerationInput): RecurringGenerationResult {
  const { rule, todayIso, existingOccurrenceDates } = input;
  if (!rule.active) {
    return {
      transactionsToCreate: [],
      nextRunDate: rule.nextRunDate,
      deactivate: false,
    };
  }

  const dueDates: string[] = [];
  let cursor = rule.nextRunDate;
  while (cursor <= todayIso) {
    if (rule.endDate && cursor > rule.endDate) {
      break;
    }
    dueDates.push(cursor);
    cursor = advanceRecurringDate(cursor, rule.frequency);
  }

  const categoryType = input.categoryType ?? 'expense';
  const transactionsToCreate: PlannedRecurringTransaction[] = dueDates
    .filter((dateIso) => !existingOccurrenceDates.has(dateIso))
    .map((dateIso) => ({
      accountId: rule.accountId,
      categoryId: rule.categoryId,
      transferToAccountId: null,
      amount: rule.amount,
      type: categoryType,
      date: dateIso,
      note: null,
      markerColor: null,
      status: 'posted' as const,
      recurringRuleId: rule.id,
      idempotencyKey: `${rule.id}:${dateIso}`,
    }));

  const deactivate = !!(rule.endDate && cursor > rule.endDate);
  return {
    transactionsToCreate,
    nextRunDate: cursor,
    deactivate,
  };
}
