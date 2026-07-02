-- Sereno — virements inter-comptes (type transfer + RPC partie double)

alter table public.transactions
  alter column category_id drop not null;

alter table public.transactions
  add column if not exists transfer_to_account_id uuid references public.accounts (id) on delete restrict;

alter table public.transactions
  drop constraint if exists transactions_type_check;

alter table public.transactions
  add constraint transactions_type_check
  check (type in ('income', 'expense', 'transfer'));

alter table public.transactions
  drop constraint if exists transactions_category_required;

alter table public.transactions
  add constraint transactions_category_required check (
    (type = 'transfer' and category_id is null and transfer_to_account_id is not null)
    or (type in ('income', 'expense') and category_id is not null and transfer_to_account_id is null)
  );

create index if not exists transactions_transfer_to_account_idx
  on public.transactions (transfer_to_account_id);

-- ------------------------------------------------------------
-- Création d'un virement (écritures miroir entre comptes asset)
-- ------------------------------------------------------------

create or replace function public.create_transfer_with_entries(
  payload jsonb,
  idempotency_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  existing_tx_id uuid;
  new_tx_id uuid;
  from_account_id uuid;
  to_account_id uuid;
  from_ledger_id uuid;
  to_ledger_id uuid;
  tx_amount numeric(12, 2);
  tx_date date;
  tx_note text;
begin
  if current_user_id is null then
    raise exception 'Authentification requise';
  end if;

  if idempotency_key is not null then
    select id into existing_tx_id
    from public.transactions
    where user_id = current_user_id
      and transactions.idempotency_key = create_transfer_with_entries.idempotency_key;

    if found then
      return existing_tx_id;
    end if;
  end if;

  from_account_id := (payload ->> 'account_id')::uuid;
  to_account_id := (payload ->> 'transfer_to_account_id')::uuid;
  tx_amount := (payload ->> 'amount')::numeric(12, 2);
  tx_date := coalesce((payload ->> 'date')::date, current_date);
  tx_note := nullif(trim(payload ->> 'note'), '');

  if from_account_id is null or to_account_id is null then
    raise exception 'account_id et transfer_to_account_id sont obligatoires';
  end if;

  if from_account_id = to_account_id then
    raise exception 'Les comptes source et destination doivent être différents';
  end if;

  if tx_amount is null or tx_amount <= 0 then
    raise exception 'amount doit être strictement positif';
  end if;

  if not exists (
    select 1 from public.accounts
    where id = from_account_id and user_id = current_user_id
  ) or not exists (
    select 1 from public.accounts
    where id = to_account_id and user_id = current_user_id
  ) then
    raise exception 'Compte source ou destination introuvable';
  end if;

  from_ledger_id := public.ensure_ledger_account_for_user_account(from_account_id, current_user_id);
  to_ledger_id := public.ensure_ledger_account_for_user_account(to_account_id, current_user_id);

  insert into public.transactions (
    user_id,
    account_id,
    category_id,
    transfer_to_account_id,
    amount,
    type,
    date,
    note,
    status,
    idempotency_key
  )
  values (
    current_user_id,
    from_account_id,
    null,
    to_account_id,
    tx_amount,
    'transfer',
    tx_date,
    tx_note,
    'posted',
    idempotency_key
  )
  returning id into new_tx_id;

  insert into public.journal_entries (user_id, transaction_id, ledger_account_id, side, amount, memo)
  values
    (current_user_id, new_tx_id, from_ledger_id, 'credit', tx_amount, tx_note),
    (current_user_id, new_tx_id, to_ledger_id, 'debit', tx_amount, tx_note);

  return new_tx_id;
end;
$$;

create or replace function public.update_transfer_with_entries(
  transaction_id uuid,
  payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  existing public.transactions%rowtype;
  from_account_id uuid;
  to_account_id uuid;
  from_ledger_id uuid;
  to_ledger_id uuid;
  tx_amount numeric(12, 2);
  tx_date date;
  tx_note text;
begin
  if current_user_id is null then
    raise exception 'Authentification requise';
  end if;

  select * into existing
  from public.transactions
  where id = transaction_id and user_id = current_user_id;

  if not found then
    raise exception 'Transfert introuvable';
  end if;

  if existing.type <> 'transfer' then
    raise exception 'Cette transaction n''est pas un virement';
  end if;

  from_account_id := coalesce((payload ->> 'account_id')::uuid, existing.account_id);
  to_account_id := coalesce((payload ->> 'transfer_to_account_id')::uuid, existing.transfer_to_account_id);
  tx_amount := coalesce((payload ->> 'amount')::numeric(12, 2), existing.amount);
  tx_date := coalesce((payload ->> 'date')::date, existing.date);
  tx_note := case
    when payload ? 'note' then nullif(trim(payload ->> 'note'), '')
    else existing.note
  end;

  if from_account_id = to_account_id then
    raise exception 'Les comptes source et destination doivent être différents';
  end if;

  if tx_amount <= 0 then
    raise exception 'amount doit être strictement positif';
  end if;

  from_ledger_id := public.ensure_ledger_account_for_user_account(from_account_id, current_user_id);
  to_ledger_id := public.ensure_ledger_account_for_user_account(to_account_id, current_user_id);

  update public.transactions
  set
    account_id = from_account_id,
    transfer_to_account_id = to_account_id,
    amount = tx_amount,
    date = tx_date,
    note = tx_note
  where id = transaction_id;

  delete from public.journal_entries where transaction_id = update_transfer_with_entries.transaction_id;

  insert into public.journal_entries (user_id, transaction_id, ledger_account_id, side, amount, memo)
  values
    (current_user_id, transaction_id, from_ledger_id, 'credit', tx_amount, tx_note),
    (current_user_id, transaction_id, to_ledger_id, 'debit', tx_amount, tx_note);

  return transaction_id;
end;
$$;

revoke execute on function public.create_transfer_with_entries(jsonb, text) from public, anon;
grant execute on function public.create_transfer_with_entries(jsonb, text) to authenticated;

revoke execute on function public.update_transfer_with_entries(uuid, jsonb) from public, anon;
grant execute on function public.update_transfer_with_entries(uuid, jsonb) to authenticated;
