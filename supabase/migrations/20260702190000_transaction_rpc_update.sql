-- Sereno — RPC update + cœur partagé (Edge Function récurrente)
-- Refactor ensure_* pour accepter un user_id explicite (service_role).

drop function if exists public.ensure_ledger_account_for_user_account(uuid);
drop function if exists public.ensure_ledger_account_for_category(uuid, uuid);
drop function if exists public.upsert_merchant_from_note(uuid, text, uuid);

create or replace function public.ensure_ledger_account_for_user_account(
  target_account_id uuid,
  p_caller_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_row public.accounts%rowtype;
  ledger_id uuid;
begin
  select * into account_row from public.accounts where id = target_account_id;
  if not found then raise exception 'Compte introuvable : %', target_account_id; end if;
  if account_row.user_id is distinct from p_caller_user_id then
    raise exception 'Accès refusé au compte %', target_account_id;
  end if;
  select id into ledger_id from public.ledger_accounts
  where user_id = account_row.user_id and linked_account_id = account_row.id;
  if found then return ledger_id; end if;
  insert into public.ledger_accounts (user_id, code, name, kind, normal_balance, currency, linked_account_id, is_system)
  values (account_row.user_id, 'A-' || replace(account_row.id::text, '-', ''), account_row.name,
    public.map_account_to_ledger_kind(account_row.type), public.map_account_to_normal_balance(account_row.type),
    account_row.currency, account_row.id, true)
  returning id into ledger_id;
  update public.accounts set ledger_account_id = ledger_id where id = account_row.id;
  return ledger_id;
end;
$$;

create or replace function public.ensure_ledger_account_for_category(
  p_caller_user_id uuid,
  target_category_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  category_row public.categories%rowtype;
  ledger_id uuid;
  ledger_kind public.ledger_account_kind;
  ledger_normal public.journal_entry_side;
begin
  select * into category_row from public.categories where id = target_category_id;
  if not found then raise exception 'Catégorie introuvable : %', target_category_id; end if;
  if category_row.user_id is not null and category_row.user_id <> p_caller_user_id then
    raise exception 'Catégorie privée d''un autre utilisateur';
  end if;
  select id into ledger_id from public.ledger_accounts
  where user_id = p_caller_user_id and linked_category_id = target_category_id;
  if found then return ledger_id; end if;
  ledger_kind := case category_row.type when 'income' then 'revenue'::public.ledger_account_kind else 'expense'::public.ledger_account_kind end;
  ledger_normal := case category_row.type when 'income' then 'credit'::public.journal_entry_side else 'debit'::public.journal_entry_side end;
  insert into public.ledger_accounts (user_id, code, name, kind, normal_balance, currency, linked_category_id, is_system)
  values (p_caller_user_id, 'C-' || replace(category_row.id::text, '-', ''), category_row.name, ledger_kind, ledger_normal, 'EUR', target_category_id, true)
  returning id into ledger_id;
  return ledger_id;
end;
$$;

create or replace function public.upsert_merchant_from_note(
  p_caller_user_id uuid,
  merchant_name text,
  suggested_category_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text;
  merchant_id uuid;
begin
  normalized := public.normalize_merchant_name(merchant_name);
  if normalized = '' then return null; end if;
  insert into public.merchants (user_id, name, normalized_name, default_category_id, usage_count, last_used_at)
  values (p_caller_user_id, trim(merchant_name), normalized, suggested_category_id, 1, now())
  on conflict (user_id, normalized_name) do update
    set usage_count = public.merchants.usage_count + 1, last_used_at = now(),
        default_category_id = coalesce(excluded.default_category_id, public.merchants.default_category_id), name = excluded.name
  returning id into merchant_id;
  return merchant_id;
end;
$$;

revoke execute on function public.ensure_ledger_account_for_user_account(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.ensure_ledger_account_for_category(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.upsert_merchant_from_note(uuid, text, uuid) from public, anon, authenticated;

create or replace function public.create_transaction_with_entries_core(
  p_user_id uuid,
  payload jsonb,
  idempotency_key text default null,
  p_recurring_rule_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_tx_id uuid;
  new_tx_id uuid;
  asset_ledger_id uuid;
  category_ledger_id uuid;
  merchant_id uuid;
  tx_type text;
  tx_amount numeric(12, 2);
  tx_account_id uuid;
  tx_category_id uuid;
  tx_date date;
  tx_note text;
  merchant_name text;
begin
  if p_user_id is null then
    raise exception 'user_id requis';
  end if;

  if idempotency_key is not null then
    select id into existing_tx_id
    from public.transactions
    where user_id = p_user_id
      and transactions.idempotency_key = create_transaction_with_entries_core.idempotency_key;

    if found then
      return existing_tx_id;
    end if;
  end if;

  tx_account_id := (payload ->> 'account_id')::uuid;
  tx_category_id := (payload ->> 'category_id')::uuid;
  tx_amount := (payload ->> 'amount')::numeric(12, 2);
  tx_type := payload ->> 'type';
  tx_date := coalesce((payload ->> 'date')::date, current_date);
  tx_note := nullif(trim(payload ->> 'note'), '');
  merchant_name := nullif(trim(payload ->> 'merchant_name'), '');

  if tx_account_id is null or tx_category_id is null then
    raise exception 'account_id et category_id sont obligatoires';
  end if;

  if tx_amount is null or tx_amount <= 0 then
    raise exception 'amount doit être strictement positif';
  end if;

  if tx_type not in ('income', 'expense') then
    raise exception 'type invalide (income | expense uniquement)';
  end if;

  asset_ledger_id := public.ensure_ledger_account_for_user_account(tx_account_id, p_user_id);
  category_ledger_id := public.ensure_ledger_account_for_category(p_user_id, tx_category_id);

  if merchant_name is not null then
    merchant_id := public.upsert_merchant_from_note(p_user_id, merchant_name, tx_category_id);
  end if;

  insert into public.transactions (
    user_id,
    account_id,
    category_id,
    amount,
    type,
    date,
    note,
    merchant_id,
    status,
    idempotency_key,
    recurring_rule_id
  )
  values (
    p_user_id,
    tx_account_id,
    tx_category_id,
    tx_amount,
    tx_type,
    tx_date,
    tx_note,
    merchant_id,
    'posted',
    idempotency_key,
    p_recurring_rule_id
  )
  returning id into new_tx_id;

  if tx_type = 'expense' then
    insert into public.journal_entries (user_id, transaction_id, ledger_account_id, side, amount, memo)
    values
      (p_user_id, new_tx_id, category_ledger_id, 'debit', tx_amount, tx_note),
      (p_user_id, new_tx_id, asset_ledger_id, 'credit', tx_amount, tx_note);
  else
    insert into public.journal_entries (user_id, transaction_id, ledger_account_id, side, amount, memo)
    values
      (p_user_id, new_tx_id, asset_ledger_id, 'debit', tx_amount, tx_note),
      (p_user_id, new_tx_id, category_ledger_id, 'credit', tx_amount, tx_note);
  end if;

  return new_tx_id;
end;
$$;

create or replace function public.create_transaction_with_entries(
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
begin
  if current_user_id is null then
    raise exception 'Authentification requise';
  end if;

  return public.create_transaction_with_entries_core(
    current_user_id,
    payload,
    idempotency_key,
    null
  );
end;
$$;

create or replace function public.update_transaction_with_entries(
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
  asset_ledger_id uuid;
  category_ledger_id uuid;
  merchant_id uuid;
  tx_type text;
  tx_amount numeric(12, 2);
  tx_account_id uuid;
  tx_category_id uuid;
  tx_date date;
  tx_note text;
  merchant_name text;
begin
  if current_user_id is null then
    raise exception 'Authentification requise';
  end if;

  select * into existing
  from public.transactions
  where id = transaction_id and user_id = current_user_id;

  if not found then
    raise exception 'Transaction introuvable';
  end if;

  tx_account_id := coalesce((payload ->> 'account_id')::uuid, existing.account_id);
  tx_category_id := coalesce((payload ->> 'category_id')::uuid, existing.category_id);
  tx_amount := coalesce((payload ->> 'amount')::numeric(12, 2), existing.amount);
  tx_type := coalesce(payload ->> 'type', existing.type);
  tx_date := coalesce((payload ->> 'date')::date, existing.date);
  tx_note := case
    when payload ? 'note' then nullif(trim(payload ->> 'note'), '')
    else existing.note
  end;
  merchant_name := nullif(trim(payload ->> 'merchant_name'), '');

  if tx_amount <= 0 then
    raise exception 'amount doit être strictement positif';
  end if;

  if tx_type not in ('income', 'expense') then
    raise exception 'type invalide (income | expense uniquement)';
  end if;

  asset_ledger_id := public.ensure_ledger_account_for_user_account(tx_account_id, current_user_id);
  category_ledger_id := public.ensure_ledger_account_for_category(current_user_id, tx_category_id);

  if merchant_name is not null then
    merchant_id := public.upsert_merchant_from_note(current_user_id, merchant_name, tx_category_id);
  else
    merchant_id := existing.merchant_id;
  end if;

  delete from public.journal_entries where journal_entries.transaction_id = update_transaction_with_entries.transaction_id;

  update public.transactions
  set
    account_id = tx_account_id,
    category_id = tx_category_id,
    amount = tx_amount,
    type = tx_type,
    date = tx_date,
    note = tx_note,
    merchant_id = merchant_id
  where id = update_transaction_with_entries.transaction_id;

  if tx_type = 'expense' then
    insert into public.journal_entries (user_id, transaction_id, ledger_account_id, side, amount, memo)
    values
      (current_user_id, transaction_id, category_ledger_id, 'debit', tx_amount, tx_note),
      (current_user_id, transaction_id, asset_ledger_id, 'credit', tx_amount, tx_note);
  else
    insert into public.journal_entries (user_id, transaction_id, ledger_account_id, side, amount, memo)
    values
      (current_user_id, transaction_id, asset_ledger_id, 'debit', tx_amount, tx_note),
      (current_user_id, transaction_id, category_ledger_id, 'credit', tx_amount, tx_note);
  end if;

  return transaction_id;
end;
$$;

revoke execute on function public.create_transaction_with_entries_core(uuid, jsonb, text, uuid) from public, anon, authenticated;
grant execute on function public.create_transaction_with_entries_core(uuid, jsonb, text, uuid) to service_role;

revoke execute on function public.create_transaction_with_entries(jsonb, text) from public, anon;
grant execute on function public.create_transaction_with_entries(jsonb, text) to authenticated;

revoke execute on function public.update_transaction_with_entries(uuid, jsonb) from public, anon;
grant execute on function public.update_transaction_with_entries(uuid, jsonb) to authenticated;
