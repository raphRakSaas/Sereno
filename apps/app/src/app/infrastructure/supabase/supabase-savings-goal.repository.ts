import { inject, Injectable } from '@angular/core';
import { NewSavingsGoal, SavingsGoal } from '../../domain/models/savings-goal.model';
import { SavingsGoalRepository } from '../../domain/ports/savings-goal.repository';
import { SavingsGoalRow, toSavingsGoal } from './rows';
import { SupabaseClientService } from './supabase-client.service';

function toRow(input: Partial<NewSavingsGoal>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row['name'] = input.name;
  if (input.targetAmount !== undefined) row['target_amount'] = input.targetAmount;
  if (input.currentAmount !== undefined) row['current_amount'] = input.currentAmount;
  return row;
}

@Injectable({ providedIn: 'root' })
export class SupabaseSavingsGoalRepository implements SavingsGoalRepository {
  private readonly supabase = inject(SupabaseClientService);

  async list(): Promise<SavingsGoal[]> {
    const { data, error } = await this.supabase
      .require()
      .from('savings_goals')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data as SavingsGoalRow[]).map(toSavingsGoal);
  }

  async create(input: NewSavingsGoal): Promise<SavingsGoal> {
    const userId = await this.supabase.requireUserId();
    const { data, error } = await this.supabase
      .require()
      .from('savings_goals')
      .insert({ user_id: userId, ...toRow(input) })
      .select()
      .single();
    if (error) throw error;
    return toSavingsGoal(data as SavingsGoalRow);
  }

  async update(id: string, patch: Partial<NewSavingsGoal>): Promise<SavingsGoal> {
    const { data, error } = await this.supabase
      .require()
      .from('savings_goals')
      .update(toRow(patch))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return toSavingsGoal(data as SavingsGoalRow);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.require().from('savings_goals').delete().eq('id', id);
    if (error) throw error;
  }
}
