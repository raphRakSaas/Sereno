import { inject, Injectable } from '@angular/core';
import {
  NewTransactionTemplate,
  TransactionTemplate,
} from '../../domain/models/transaction-template.model';
import { TransactionTemplateRepository } from '../../domain/ports/transaction-template.repository';
import { TransactionTemplateRow, toTransactionTemplate } from './rows';
import { SupabaseClientService } from './supabase-client.service';

function toRow(input: Partial<NewTransactionTemplate>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row['name'] = input.name;
  if (input.type !== undefined) row['type'] = input.type;
  if (input.amount !== undefined) row['amount'] = input.amount;
  if (input.categoryId !== undefined) row['category_id'] = input.categoryId;
  if (input.accountId !== undefined) row['account_id'] = input.accountId;
  if (input.note !== undefined) row['note'] = input.note;
  if (input.isPinned !== undefined) row['is_pinned'] = input.isPinned;
  if (input.sortOrder !== undefined) row['sort_order'] = input.sortOrder;
  return row;
}

@Injectable({ providedIn: 'root' })
export class SupabaseTransactionTemplateRepository implements TransactionTemplateRepository {
  private readonly supabase = inject(SupabaseClientService);

  async list(): Promise<TransactionTemplate[]> {
    const { data, error } = await this.supabase
      .require()
      .from('transaction_templates')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('sort_order')
      .order('name');
    if (error) {
      throw error;
    }
    return (data as TransactionTemplateRow[]).map(toTransactionTemplate);
  }

  async create(input: NewTransactionTemplate): Promise<TransactionTemplate> {
    const userId = await this.supabase.requireUserId();
    const { data, error } = await this.supabase
      .require()
      .from('transaction_templates')
      .insert({ ...toRow(input), user_id: userId })
      .select()
      .single();
    if (error) {
      throw error;
    }
    return toTransactionTemplate(data as TransactionTemplateRow);
  }

  async update(id: string, patch: Partial<NewTransactionTemplate>): Promise<TransactionTemplate> {
    const { data, error } = await this.supabase
      .require()
      .from('transaction_templates')
      .update(toRow(patch))
      .eq('id', id)
      .select()
      .single();
    if (error) {
      throw error;
    }
    return toTransactionTemplate(data as TransactionTemplateRow);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.require().from('transaction_templates').delete().eq('id', id);
    if (error) {
      throw error;
    }
  }
}
