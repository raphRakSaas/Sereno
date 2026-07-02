import { inject, Injectable } from '@angular/core';
import { NewTransaction, Transaction } from '../../domain/models/transaction.model';
import { TransactionFilter, TransactionRepository } from '../../domain/ports/transaction.repository';
import { toTransaction, TransactionRow } from './rows';
import { SupabaseClientService } from './supabase-client.service';

function nextMonth(month: string): string {
  const d = new Date(month + 'T00:00:00');
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function toRow(input: Partial<NewTransaction>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.accountId !== undefined) row['account_id'] = input.accountId;
  if (input.categoryId !== undefined) row['category_id'] = input.categoryId;
  if (input.amount !== undefined) row['amount'] = input.amount;
  if (input.type !== undefined) row['type'] = input.type;
  if (input.date !== undefined) row['date'] = input.date;
  if (input.note !== undefined) row['note'] = input.note;
  if (input.recurringRuleId !== undefined) row['recurring_rule_id'] = input.recurringRuleId;
  return row;
}

@Injectable({ providedIn: 'root' })
export class SupabaseTransactionRepository implements TransactionRepository {
  private readonly supabase = inject(SupabaseClientService);

  async list(filter?: TransactionFilter): Promise<Transaction[]> {
    let query = this.supabase
      .require()
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (filter?.month) {
      query = query.gte('date', filter.month).lt('date', nextMonth(filter.month));
    }
    if (filter?.accountId) {
      query = query.eq('account_id', filter.accountId);
    }
    if (filter?.categoryId) {
      query = query.eq('category_id', filter.categoryId);
    }
    if (filter?.limit) {
      query = query.limit(filter.limit);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data as TransactionRow[]).map(toTransaction);
  }

  async getById(id: string): Promise<Transaction | null> {
    const { data, error } = await this.supabase
      .require()
      .from('transactions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? toTransaction(data as TransactionRow) : null;
  }

  async create(input: NewTransaction): Promise<Transaction> {
    const userId = await this.supabase.requireUserId();
    const { data, error } = await this.supabase
      .require()
      .from('transactions')
      .insert({ ...toRow(input), user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return toTransaction(data as TransactionRow);
  }

  async update(id: string, patch: Partial<NewTransaction>): Promise<Transaction> {
    const { data, error } = await this.supabase
      .require()
      .from('transactions')
      .update(toRow(patch))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return toTransaction(data as TransactionRow);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.require().from('transactions').delete().eq('id', id);
    if (error) throw error;
  }

  async count(): Promise<number> {
    const { count, error } = await this.supabase
      .require()
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count ?? 0;
  }
}
