import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RECEIPT_REPOSITORY, TRANSACTION_REPOSITORY } from '../../domain/ports/tokens';
import { TransactionRepository } from '../../domain/ports/transaction.repository';
import { ReceiptRepository } from '../../domain/ports/receipt.repository';
import { NewTransaction, Transaction } from '../../domain/models/transaction.model';
import { TransactionsStore } from './transactions.store';

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: overrides.id ?? 'tx-1',
    accountId: 'acc-1',
    categoryId: 'cat-1',
    transferToAccountId: null,
    amount: 10,
    type: 'expense',
    date: '2026-07-01',
    note: null,
    markerColor: null,
    status: 'posted',
    recurringRuleId: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

function newTransaction(overrides: Partial<NewTransaction> = {}): NewTransaction {
  const { id: _id, createdAt: _createdAt, ...rest } = tx(overrides);
  return rest;
}

describe('TransactionsStore', () => {
  let repo: TransactionRepository;
  let receipts: ReceiptRepository;

  beforeEach(() => {
    repo = {
      list: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      count: vi.fn(),
    };
    receipts = {
      listByTransaction: vi.fn(),
      listTransactionIds: vi.fn(),
      attach: vi.fn(),
      replace: vi.fn(),
      remove: vi.fn(),
      removeByTransaction: vi.fn(),
      getPreviewUrl: vi.fn(),
      releasePreviewUrl: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: TRANSACTION_REPOSITORY, useValue: repo },
        { provide: RECEIPT_REPOSITORY, useValue: receipts },
      ],
    });
  });

  it('load() trie par date puis par création décroissantes', async () => {
    vi.mocked(repo.list).mockResolvedValue([
      tx({ id: 'a', date: '2026-07-01', createdAt: '2026-07-01T10:00:00.000Z' }),
      tx({ id: 'b', date: '2026-07-02', createdAt: '2026-07-02T09:00:00.000Z' }),
      tx({ id: 'c', date: '2026-07-01', createdAt: '2026-07-01T12:00:00.000Z' }),
    ]);
    const store = TestBed.inject(TransactionsStore);

    await store.load();

    expect(store.items().map((t) => t.id)).toEqual(['b', 'c', 'a']);
    expect(store.loaded()).toBe(true);
    expect(store.error()).toBeNull();
  });

  it('load() pose une erreur calme si le dépôt échoue, sans jeter', async () => {
    vi.mocked(repo.list).mockRejectedValue(new Error('boom'));
    const store = TestBed.inject(TransactionsStore);

    await store.load();

    expect(store.items()).toEqual([]);
    expect(store.error()).toContain('transactions ne se chargent pas');
  });

  it('add() insère la transaction créée en tête après tri', async () => {
    const created = tx({ id: 'new', date: '2026-07-05', createdAt: '2026-07-05T00:00:00.000Z' });
    vi.mocked(repo.create).mockResolvedValue(created);
    const store = TestBed.inject(TransactionsStore);

    const result = await store.add(newTransaction());

    expect(result).toEqual(created);
    expect(store.items()).toEqual([created]);
    expect(store.count()).toBe(1);
  });

  it('add() pose CALM_ERROR et ne modifie pas l’état si le dépôt échoue', async () => {
    vi.mocked(repo.create).mockRejectedValue(new Error('boom'));
    const store = TestBed.inject(TransactionsStore);

    const result = await store.add(newTransaction());

    expect(result).toBeNull();
    expect(store.items()).toEqual([]);
    expect(store.error()).toContain("n'a pas abouti");
  });

  it('remove() supprime d’abord les reçus, puis la transaction, puis la retire de l’état', async () => {
    vi.mocked(repo.list).mockResolvedValue([tx({ id: 'a' }), tx({ id: 'b' })]);
    vi.mocked(receipts.removeByTransaction).mockResolvedValue(undefined);
    vi.mocked(repo.remove).mockResolvedValue(undefined);
    const store = TestBed.inject(TransactionsStore);
    await store.load();

    await store.remove('a');

    expect(receipts.removeByTransaction).toHaveBeenCalledWith('a');
    expect(repo.remove).toHaveBeenCalledWith('a');
    expect(store.items().map((t) => t.id)).toEqual(['b']);
  });

  it('remove() pose une erreur calme et garde les données si la suppression échoue', async () => {
    vi.mocked(repo.list).mockResolvedValue([tx({ id: 'a' })]);
    vi.mocked(receipts.removeByTransaction).mockResolvedValue(undefined);
    vi.mocked(repo.remove).mockRejectedValue(new Error('boom'));
    const store = TestBed.inject(TransactionsStore);
    await store.load();

    await store.remove('a');

    expect(store.items().map((t) => t.id)).toEqual(['a']);
    expect(store.error()).toContain("n'a pas abouti");
  });

  it('dismissError() efface le message d’erreur', async () => {
    vi.mocked(repo.create).mockRejectedValue(new Error('boom'));
    const store = TestBed.inject(TransactionsStore);
    await store.add(newTransaction());
    expect(store.error()).not.toBeNull();

    store.dismissError();

    expect(store.error()).toBeNull();
  });
});
