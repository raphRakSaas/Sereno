import { inject, Injectable } from '@angular/core';
import { NewTransaction, Transaction, isTransfer } from '../../domain/models/transaction.model';
import { TransactionFilter, TransactionRepository } from '../../domain/ports/transaction.repository';
import { toTransaction, TransactionRow } from './rows';
import { SupabaseClientService } from './supabase-client.service';

function nextMonth(month: string): string {
  const date = new Date(month + 'T00:00:00');
  date.setMonth(date.getMonth() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

/** Payload snake_case attendu par les RPC Postgres. */
function toRpcPayload(input: Partial<NewTransaction>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (input.accountId !== undefined) payload['account_id'] = input.accountId;
  if (input.categoryId !== undefined) payload['category_id'] = input.categoryId;
  if (input.transferToAccountId !== undefined) {
    payload['transfer_to_account_id'] = input.transferToAccountId;
  }
  if (input.amount !== undefined) payload['amount'] = input.amount;
  if (input.type !== undefined) payload['type'] = input.type;
  if (input.date !== undefined) payload['date'] = input.date;
  if (input.note !== undefined) payload['note'] = input.note;
  if (input.status !== undefined) payload['status'] = input.status;
  if (input.markerColor !== undefined) payload['marker_color'] = input.markerColor;
  if (input.recurringRuleId !== undefined) payload['recurring_rule_id'] = input.recurringRuleId;
  return payload;
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
      query = query.or(
        `account_id.eq.${filter.accountId},transfer_to_account_id.eq.${filter.accountId}`,
      );
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
    const idempotencyKey = crypto.randomUUID();
    const rpcName = isTransfer(input) ? 'create_transfer_with_entries' : 'create_transaction_with_entries';
    const { data: transactionId, error } = await this.supabase.require().rpc(rpcName, {
      payload: toRpcPayload(input),
      idempotency_key: idempotencyKey,
    });
    if (error) throw error;

    const created = await this.getById(transactionId as string);
    if (!created) {
      throw new Error('Transaction créée mais introuvable.');
    }
    if (input.markerColor !== undefined && input.markerColor !== created.markerColor) {
      await this.syncMarkerColor(created.id, input.markerColor);
      return (await this.getById(created.id))!;
    }
    return created;
  }

  async update(id: string, patch: Partial<NewTransaction>): Promise<Transaction> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Transaction introuvable.');
    }
    const merged = { ...existing, ...patch };
    const rpcName = isTransfer(merged) ? 'update_transfer_with_entries' : 'update_transaction_with_entries';
    const { data: transactionId, error } = await this.supabase.require().rpc(rpcName, {
      transaction_id: id,
      payload: toRpcPayload(patch),
    });
    if (error) throw error;

    const updated = await this.getById(transactionId as string);
    if (!updated) {
      throw new Error('Transaction mise à jour mais introuvable.');
    }
    if (patch.markerColor !== undefined && patch.markerColor !== updated.markerColor) {
      await this.syncMarkerColor(updated.id, patch.markerColor);
      return (await this.getById(updated.id))!;
    }
    return updated;
  }

  private async syncMarkerColor(transactionId: string, markerColor: string | null): Promise<void> {
    const { error } = await this.supabase
      .require()
      .from('transactions')
      .update({ marker_color: markerColor })
      .eq('id', transactionId);
    if (error) {
      throw error;
    }
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
