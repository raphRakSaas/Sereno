import { inject, Injectable } from '@angular/core';
import { NewRecurringRule, RecurringRule } from '../../domain/models/recurring-rule.model';
import { RecurringRuleRepository } from '../../domain/ports/recurring-rule.repository';
import { RecurringRuleRow, toRecurringRule } from './rows';
import { SupabaseClientService } from './supabase-client.service';

function toRow(input: Partial<NewRecurringRule>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.accountId !== undefined) row['account_id'] = input.accountId;
  if (input.categoryId !== undefined) row['category_id'] = input.categoryId;
  if (input.amount !== undefined) row['amount'] = input.amount;
  if (input.frequency !== undefined) row['frequency'] = input.frequency;
  if (input.nextRunDate !== undefined) row['next_run_date'] = input.nextRunDate;
  if (input.endDate !== undefined) row['end_date'] = input.endDate;
  if (input.active !== undefined) row['active'] = input.active;
  return row;
}

@Injectable({ providedIn: 'root' })
export class SupabaseRecurringRuleRepository implements RecurringRuleRepository {
  private readonly supabase = inject(SupabaseClientService);

  async list(): Promise<RecurringRule[]> {
    const { data, error } = await this.supabase
      .require()
      .from('recurring_rules')
      .select('*')
      .order('next_run_date', { ascending: true });
    if (error) throw error;
    return (data as RecurringRuleRow[]).map(toRecurringRule);
  }

  async create(input: NewRecurringRule): Promise<RecurringRule> {
    const userId = await this.supabase.requireUserId();
    const { data, error } = await this.supabase
      .require()
      .from('recurring_rules')
      .insert({ ...toRow(input), user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return toRecurringRule(data as RecurringRuleRow);
  }

  async update(id: string, patch: Partial<NewRecurringRule>): Promise<RecurringRule> {
    const { data, error } = await this.supabase
      .require()
      .from('recurring_rules')
      .update(toRow(patch))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return toRecurringRule(data as RecurringRuleRow);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.require().from('recurring_rules').delete().eq('id', id);
    if (error) throw error;
  }
}
