import { inject, Injectable } from '@angular/core';
import { Budget, NewBudget } from '../../domain/models/budget.model';
import { BudgetRepository } from '../../domain/ports/budget.repository';
import { BudgetRow, toBudget } from './rows';
import { SupabaseClientService } from './supabase-client.service';

@Injectable({ providedIn: 'root' })
export class SupabaseBudgetRepository implements BudgetRepository {
  private readonly supabase = inject(SupabaseClientService);

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
          category_id: input.categoryId,
          month: input.month,
          limit_amount: input.limitAmount,
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
