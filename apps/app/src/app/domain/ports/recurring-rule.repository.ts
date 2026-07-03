import { NewRecurringRule, RecurringRule } from '../models/recurring-rule.model';

export interface RecurringRuleRepository {
  list(): Promise<RecurringRule[]>;
  create(input: NewRecurringRule): Promise<RecurringRule>;
  update(id: string, patch: Partial<NewRecurringRule>): Promise<RecurringRule>;
  remove(id: string): Promise<void>;
}
