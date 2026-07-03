import { inject, Injectable } from '@angular/core';
import { Budget, GLOBAL_BUDGET_CATEGORY_ID, NewBudget } from '../../domain/models/budget.model';
import { BudgetRepository } from '../../domain/ports/budget.repository';
import { BudgetRow, toBudget } from './rows';
import { SupabaseClientService } from './supabase-client.service';

function toRow(input: NewBudget): Record<string, unknown> {
  return {
    category_id: input.categoryId ?? GLOBAL_BUDGET_CATEGORY_ID,
    month: input.month,
    limit_amount: input.limitAmount,
    period_type: input.periodType,
    period_start: input.periodStart,
    period_end: input.periodEnd,
    alert_threshold_pct: input.alertThresholdPct,
  };
}

@Injectable({ providedIn: 'root' })
export class SupabaseBudgetRepository implements BudgetRepository {
  private readonly supabase = inject(SupabaseClientService);

  async listAll(): Promise<Budget[]> {
    const { data, error } = await this.supabase
      .require()
      .from('budgets')
      .select('*')
      .order('month', { ascending: true });
    if (error) throw error;
    return (data as BudgetRow[]).map(toBudget);
  }

  async listByMonth(month: string): Promise<Budget[]> {
    const { data, error } = await this.supabase.require().from('budgets').select('*').eq('month', month);
    if (error) throw error;
    return (data as BudgetRow[]).map(toBudget);
  }

  async upsert(input: NewBudget): Promise<Budget> {
    const userId = await this.supabase.requireUserId();
    const { data, error } = await this.supabase
      .require()
      .from('budgets')
      .upsert(
        {
          user_id: userId,
          ...toRow(input),
        },
        { onConflict: 'user_id,category_id,month' },
      )
      .select()
      .single();
    if (error) throw error;
    return toBudget(data as BudgetRow);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.require().from('budgets').delete().eq('id', id);
    if (error) throw error;
  }
}
