import { inject, Injectable } from '@angular/core';
import { Account, NewAccount } from '../../domain/models/account.model';
import { AccountRepository } from '../../domain/ports/account.repository';
import { AccountRow, toAccount } from './rows';
import { SupabaseClientService } from './supabase-client.service';

function toRow(input: Partial<NewAccount>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row['name'] = input.name;
  if (input.type !== undefined) row['type'] = input.type;
  if (input.initialBalance !== undefined) row['initial_balance'] = input.initialBalance;
  if (input.currency !== undefined) row['currency'] = input.currency;
  if (input.isArchived !== undefined) row['is_archived'] = input.isArchived;
  if (input.excludeFromTotal !== undefined) row['exclude_from_total'] = input.excludeFromTotal;
  if (input.sortOrder !== undefined) row['sort_order'] = input.sortOrder;
  if (input.groupId !== undefined) row['group_id'] = input.groupId;
  if (input.cardLimit !== undefined) row['card_limit'] = input.cardLimit;
  if (input.cardPaymentDay !== undefined) row['card_payment_day'] = input.cardPaymentDay;
  return row;
}

@Injectable({ providedIn: 'root' })
export class SupabaseAccountRepository implements AccountRepository {
  private readonly supabase = inject(SupabaseClientService);

  async list(): Promise<Account[]> {
    const { data, error } = await this.supabase
      .require()
      .from('accounts')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data as AccountRow[]).map(toAccount);
  }

  async getById(id: string): Promise<Account | null> {
    const { data, error } = await this.supabase
      .require()
      .from('accounts')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? toAccount(data as AccountRow) : null;
  }

  async create(input: NewAccount): Promise<Account> {
    const userId = await this.supabase.requireUserId();
    const { data, error } = await this.supabase
      .require()
      .from('accounts')
      .insert({ ...toRow(input), user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return toAccount(data as AccountRow);
  }

  async update(id: string, patch: Partial<NewAccount>): Promise<Account> {
    const { data, error } = await this.supabase
      .require()
      .from('accounts')
      .update(toRow(patch))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return toAccount(data as AccountRow);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.require().from('accounts').delete().eq('id', id);
    if (error) throw error;
  }
}
