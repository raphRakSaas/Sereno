-- ============================================================
-- Sereno — migration : partie double, marchands, reçus, budgets avancés
--
-- Décisions produit (2026-07-02) :
--   • Angular + Supabase RPC (pas de NestJS)
--   • Pas de virements inter-comptes (type reste income | expense)
--   • OCR reçus : schéma prêt ; Edge Function Tesseract.js (open source, $0)
--
-- État distant au moment de l'écriture (via MCP Supabase) :
--   tables : profiles, accounts, categories, transactions, budgets, recurring_rules
--   données : 4 transactions, 2 budgets, 1 compte, 11 catégories globales
--   migrations déjà appliquées : init_sereno_schema, schedule_process_recurring
-- ============================================================

-- ------------------------------------------------------------
-- 1. Types énumérés
-- ------------------------------------------------------------

create type public.ledger_account_kind as enum (
  'asset',
  'liability',
  'revenue',
  'expense'
);

create type public.journal_entry_side as enum ('debit', 'credit');

create type public.transaction_status as enum ('draft', 'posted', 'void');

create type public.budget_period as enum (
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
  'custom'
);

create type public.budget_alert_level as enum (
  'none',
  'approaching',
  'exceeded',
  'predicted_overrun'
);

create type public.receipt_status as enum (
  'pending',
  'processing',
  'extracted',
  'confirmed',
  'failed'
);

-- ------------------------------------------------------------
-- 2. Plan comptable (ledger_accounts)
--    Chaque compte utilisateur et chaque catégorie utilisée
--    possède un compte du grand livre dédié.
-- ------------------------------------------------------------

create table public.ledger_accounts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  code                text not null,
  name                text not null,
  kind                public.ledger_account_kind not null,
  normal_balance      public.journal_entry_side not null,
  currency            text not null default 'EUR',
  linked_account_id   uuid references public.accounts (id) on delete cascade,
  linked_category_id  uuid references public.categories (id) on delete cascade,
  is_system           boolean not null default false,
  created_at          timestamptz not null default now(),

  unique (user_id, code),
  unique (user_id, linked_account_id),
  unique (user_id, linked_category_id),
  check (
    (linked_account_id is not null)::int +
    (linked_category_id is not null)::int <= 1
  )
);

create index ledger_accounts_user_id_idx on public.ledger_accounts (user_id);
create index ledger_accounts_linked_account_idx on public.ledger_accounts (linked_account_id);
create index ledger_accounts_linked_category_idx on public.ledger_accounts (linked_category_id);

alter table public.accounts
  add column if not exists is_archived boolean not null default false,
  add column if not exists ledger_account_id uuid references public.ledger_accounts (id) on delete set null;

alter table public.categories
  add column if not exists parent_id uuid references public.categories (id) on delete set null,
  add column if not exists is_archived boolean not null default false,
  add column if not exists ledger_account_id uuid references public.ledger_accounts (id) on delete set null;

-- ------------------------------------------------------------
-- 3. Marchands (Smart Suggestions)
-- ------------------------------------------------------------

create table public.merchants (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  name                text not null,
  normalized_name     text not null,
  default_category_id uuid references public.categories (id) on delete set null,
  usage_count         integer not null default 1 check (usage_count >= 0),
  last_used_at        timestamptz not null default now(),
  created_at          timestamptz not null default now(),

  unique (user_id, normalized_name)
);

create index merchants_user_usage_idx
  on public.merchants (user_id, usage_count desc, last_used_at desc);

-- ------------------------------------------------------------
-- 4. Transactions — colonnes complémentaires
--    (type reste income | expense — pas de transfer)
-- ------------------------------------------------------------

alter table public.transactions
  add column if not exists merchant_id uuid references public.merchants (id) on delete set null,
  add column if not exists status public.transaction_status not null default 'posted',
  add column if not exists idempotency_key text;

create unique index transactions_idempotency_idx
  on public.transactions (user_id, idempotency_key)
  where idempotency_key is not null;

create index transactions_merchant_id_idx on public.transactions (merchant_id);
create index transactions_status_idx on public.transactions (user_id, status);

-- ------------------------------------------------------------
-- 5. Écritures comptables (journal_entries)
-- ------------------------------------------------------------

create table public.journal_entries (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  transaction_id    uuid not null references public.transactions (id) on delete cascade,
  ledger_account_id uuid not null references public.ledger_accounts (id),
  side              public.journal_entry_side not null,
  amount            numeric(12, 2) not null check (amount > 0),
  memo              text,
  created_at        timestamptz not null default now()
);

create index journal_entries_transaction_idx
  on public.journal_entries (transaction_id);

create index journal_entries_ledger_account_idx
  on public.journal_entries (ledger_account_id);

create index journal_entries_user_created_idx
  on public.journal_entries (user_id, created_at desc);

-- ------------------------------------------------------------
-- 6. Budgets avancés + snapshots prédictifs
-- ------------------------------------------------------------

alter table public.budgets
  add column if not exists period_type public.budget_period not null default 'monthly',
  add column if not exists period_start date,
  add column if not exists period_end date,
  add column if not exists rollover_unused boolean not null default false,
  add column if not exists alert_threshold_pct numeric(5, 2) not null default 80.00
    check (alert_threshold_pct between 0 and 100);

update public.budgets
set
  period_start = month,
  period_end = (month + interval '1 month' - interval '1 day')::date
where period_start is null;

alter table public.budgets
  alter column period_start set not null,
  alter column period_end set not null;

create table public.budget_snapshots (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  budget_id        uuid not null references public.budgets (id) on delete cascade,
  computed_at      timestamptz not null default now(),
  spent_amount     numeric(12, 2) not null default 0,
  projected_amount numeric(12, 2) not null,
  historical_avg   numeric(12, 2) not null,
  days_elapsed     integer not null check (days_elapsed >= 0),
  days_remaining   integer not null check (days_remaining >= 0),
  alert_level      public.budget_alert_level not null default 'none'
);

create index budget_snapshots_budget_idx on public.budget_snapshots (budget_id, computed_at desc);
create index budget_snapshots_user_alert_idx
  on public.budget_snapshots (user_id, alert_level)
  where alert_level <> 'none';

-- ------------------------------------------------------------
-- 7. Reçus (OCR via Edge Function — Tesseract.js, open source, $0)
--    Bucket Storage à créer séparément : `receipts` (privé, RLS)
-- ------------------------------------------------------------

create table public.receipts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  transaction_id   uuid references public.transactions (id) on delete set null,
  storage_path     text not null,
  mime_type        text not null,
  file_size_bytes  integer not null check (file_size_bytes > 0),
  status           public.receipt_status not null default 'pending',
  extracted_data   jsonb,
  ocr_provider     text not null default 'tesseract',
  ocr_processed_at timestamptz,
  created_at       timestamptz not null default now()
);

create index receipts_user_status_idx on public.receipts (user_id, status);
create index receipts_transaction_id_idx on public.receipts (transaction_id);

-- ------------------------------------------------------------
-- 8. Utilitaires
-- ------------------------------------------------------------

create or replace function public.normalize_merchant_name(raw_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(trim(regexp_replace(raw_name, '\s+', ' ', 'g')));
$$;

revoke execute on function public.normalize_merchant_name(text) from public, anon;

-- ------------------------------------------------------------
-- 9. Provisionnement automatique des comptes du grand livre
-- ------------------------------------------------------------

create or replace function public.map_account_to_ledger_kind(account_type text)
returns public.ledger_account_kind
language sql
immutable
set search_path = ''
as $$
  select case account_type
    when 'credit_card' then 'liability'::public.ledger_account_kind
    else 'asset'::public.ledger_account_kind
  end;
$$;

create or replace function public.map_account_to_normal_balance(account_type text)
returns public.journal_entry_side
language sql
immutable
set search_path = ''
as $$
  select case account_type
    when 'credit_card' then 'credit'::public.journal_entry_side
    else 'debit'::public.journal_entry_side
  end;
$$;

create or replace function public.ensure_ledger_account_for_user_account(target_account_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_row public.accounts%rowtype;
  ledger_id uuid;
begin
  select * into account_row
  from public.accounts
  where id = target_account_id;

  if not found then
    raise exception 'Compte introuvable : %', target_account_id;
  end if;

  if account_row.user_id is distinct from (select auth.uid()) then
    raise exception 'Accès refusé au compte %', target_account_id;
  end if;

  select id into ledger_id
  from public.ledger_accounts
  where user_id = account_row.user_id
    and linked_account_id = account_row.id;

  if found then
    return ledger_id;
  end if;

  insert into public.ledger_accounts (
    user_id,
    code,
    name,
    kind,
    normal_balance,
    currency,
    linked_account_id,
    is_system
  )
  values (
    account_row.user_id,
    'A-' || replace(account_row.id::text, '-', ''),
    account_row.name,
    public.map_account_to_ledger_kind(account_row.type),
    public.map_account_to_normal_balance(account_row.type),
    account_row.currency,
    account_row.id,
    true
  )
  returning id into ledger_id;

  update public.accounts
  set ledger_account_id = ledger_id
  where id = account_row.id;

  return ledger_id;
end;
$$;

create or replace function public.ensure_ledger_account_for_category(
  target_user_id uuid,
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
  if target_user_id is distinct from (select auth.uid()) then
    raise exception 'Accès refusé';
  end if;

  select * into category_row
  from public.categories
  where id = target_category_id;

  if not found then
    raise exception 'Catégorie introuvable : %', target_category_id;
  end if;

  if category_row.user_id is not null and category_row.user_id <> target_user_id then
    raise exception 'Catégorie privée d''un autre utilisateur';
  end if;

  select id into ledger_id
  from public.ledger_accounts
  where user_id = target_user_id
    and linked_category_id = target_category_id;

  if found then
    return ledger_id;
  end if;

  ledger_kind := case category_row.type
    when 'income' then 'revenue'::public.ledger_account_kind
    else 'expense'::public.ledger_account_kind
  end;

  ledger_normal := case category_row.type
    when 'income' then 'credit'::public.journal_entry_side
    else 'debit'::public.journal_entry_side
  end;

  insert into public.ledger_accounts (
    user_id,
    code,
    name,
    kind,
    normal_balance,
    currency,
    linked_category_id,
    is_system
  )
  values (
    target_user_id,
    'C-' || replace(category_row.id::text, '-', ''),
    category_row.name,
    ledger_kind,
    ledger_normal,
    'EUR',
    target_category_id,
    true
  )
  returning id into ledger_id;

  return ledger_id;
end;
$$;

create or replace function public.upsert_merchant_from_note(
  target_user_id uuid,
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
  if target_user_id is distinct from (select auth.uid()) then
    raise exception 'Accès refusé';
  end if;

  normalized := public.normalize_merchant_name(merchant_name);

  if normalized = '' then
    return null;
  end if;

  insert into public.merchants (
    user_id,
    name,
    normalized_name,
    default_category_id,
    usage_count,
    last_used_at
  )
  values (
    target_user_id,
    trim(merchant_name),
    normalized,
    suggested_category_id,
    1,
    now()
  )
  on conflict (user_id, normalized_name) do update
    set usage_count = public.merchants.usage_count + 1,
        last_used_at = now(),
        default_category_id = coalesce(excluded.default_category_id, public.merchants.default_category_id),
        name = excluded.name
  returning id into merchant_id;

  return merchant_id;
end;
$$;

-- ------------------------------------------------------------
-- 10. Contrainte d'équilibre comptable (déclenchée en fin de TX)
-- ------------------------------------------------------------

create or replace function public.assert_journal_balanced()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  total_debits numeric(12, 2);
  total_credits numeric(12, 2);
  target_tx_id uuid;
begin
  target_tx_id := coalesce(new.transaction_id, old.transaction_id);

  select
    coalesce(sum(amount) filter (where side = 'debit'), 0),
    coalesce(sum(amount) filter (where side = 'credit'), 0)
  into total_debits, total_credits
  from public.journal_entries
  where transaction_id = target_tx_id;

  if total_debits <> total_credits then
    raise exception
      'Écriture déséquilibrée pour transaction % : débits=%, crédits=%',
      target_tx_id, total_debits, total_credits;
  end if;

  return coalesce(new, old);
end;
$$;

create constraint trigger journal_balance_check
  after insert or update or delete on public.journal_entries
  deferrable initially deferred
  for each row
  execute function public.assert_journal_balanced();

-- ------------------------------------------------------------
-- 11. RPC ACID : création transaction + écritures équilibrées
-- ------------------------------------------------------------

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
  if current_user_id is null then
    raise exception 'Authentification requise';
  end if;

  if idempotency_key is not null then
    select id into existing_tx_id
    from public.transactions
    where user_id = current_user_id
      and transactions.idempotency_key = create_transaction_with_entries.idempotency_key;

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

  asset_ledger_id := public.ensure_ledger_account_for_user_account(tx_account_id);
  category_ledger_id := public.ensure_ledger_account_for_category(current_user_id, tx_category_id);

  if merchant_name is not null then
    merchant_id := public.upsert_merchant_from_note(current_user_id, merchant_name, tx_category_id);
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
    idempotency_key
  )
  values (
    current_user_id,
    tx_account_id,
    tx_category_id,
    tx_amount,
    tx_type,
    tx_date,
    tx_note,
    merchant_id,
    'posted',
    idempotency_key
  )
  returning id into new_tx_id;

  if tx_type = 'expense' then
    insert into public.journal_entries (user_id, transaction_id, ledger_account_id, side, amount, memo)
    values
      (current_user_id, new_tx_id, category_ledger_id, 'debit', tx_amount, tx_note),
      (current_user_id, new_tx_id, asset_ledger_id, 'credit', tx_amount, tx_note);
  else
    insert into public.journal_entries (user_id, transaction_id, ledger_account_id, side, amount, memo)
    values
      (current_user_id, new_tx_id, asset_ledger_id, 'debit', tx_amount, tx_note),
      (current_user_id, new_tx_id, category_ledger_id, 'credit', tx_amount, tx_note);
  end if;

  return new_tx_id;
end;
$$;

revoke execute on function public.create_transaction_with_entries(jsonb, text) from public, anon;
grant execute on function public.create_transaction_with_entries(jsonb, text) to authenticated;

revoke execute on function public.ensure_ledger_account_for_user_account(uuid) from public, anon, authenticated;
revoke execute on function public.ensure_ledger_account_for_category(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.upsert_merchant_from_note(uuid, text, uuid) from public, anon, authenticated;

-- ------------------------------------------------------------
-- 12. Trigger : créer le compte du grand livre à l'ajout d'un compte
-- ------------------------------------------------------------

create or replace function public.handle_new_account_ledger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ledger_id uuid;
begin
  insert into public.ledger_accounts (
    user_id,
    code,
    name,
    kind,
    normal_balance,
    currency,
    linked_account_id,
    is_system
  )
  values (
    new.user_id,
    'A-' || replace(new.id::text, '-', ''),
    new.name,
    public.map_account_to_ledger_kind(new.type),
    public.map_account_to_normal_balance(new.type),
    new.currency,
    new.id,
    true
  )
  returning id into ledger_id;

  new.ledger_account_id := ledger_id;
  return new;
end;
$$;

create trigger on_account_created_ledger
  before insert on public.accounts
  for each row
  execute function public.handle_new_account_ledger();

-- ------------------------------------------------------------
-- 13. Vue patrimoine (Asset Trends)
-- ------------------------------------------------------------

create or replace view public.net_worth_daily
with (security_invoker = true) as
select
  journal_entries.user_id,
  transactions.date,
  sum(
    case
      when ledger_accounts.kind in ('asset')
        then case when journal_entries.side = 'debit' then journal_entries.amount else -journal_entries.amount end
      when ledger_accounts.kind in ('liability')
        then case when journal_entries.side = 'credit' then journal_entries.amount else -journal_entries.amount end
      else 0
    end
  ) as net_worth_delta
from public.journal_entries
join public.transactions on transactions.id = journal_entries.transaction_id
join public.ledger_accounts on ledger_accounts.id = journal_entries.ledger_account_id
where transactions.status = 'posted'
group by journal_entries.user_id, transactions.date;

-- ------------------------------------------------------------
-- 14. RLS
-- ------------------------------------------------------------

alter table public.ledger_accounts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.merchants enable row level security;
alter table public.receipts enable row level security;
alter table public.budget_snapshots enable row level security;

create policy "Chacun gère ses comptes du grand livre"
  on public.ledger_accounts for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Chacun gère ses écritures"
  on public.journal_entries for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Chacun gère ses marchands"
  on public.merchants for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Chacun gère ses reçus"
  on public.receipts for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Chacun gère ses snapshots budget"
  on public.budget_snapshots for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ------------------------------------------------------------
-- 15. Rétro-migration des données existantes
-- ------------------------------------------------------------

-- 15a. Comptes du grand livre pour les comptes existants
insert into public.ledger_accounts (
  user_id,
  code,
  name,
  kind,
  normal_balance,
  currency,
  linked_account_id,
  is_system
)
select
  accounts.user_id,
  'A-' || replace(accounts.id::text, '-', ''),
  accounts.name,
  public.map_account_to_ledger_kind(accounts.type),
  public.map_account_to_normal_balance(accounts.type),
  accounts.currency,
  accounts.id,
  true
from public.accounts
where not exists (
  select 1
  from public.ledger_accounts
  where ledger_accounts.linked_account_id = accounts.id
    and ledger_accounts.user_id = accounts.user_id
);

update public.accounts
set ledger_account_id = ledger_accounts.id
from public.ledger_accounts
where ledger_accounts.linked_account_id = accounts.id
  and ledger_accounts.user_id = accounts.user_id
  and accounts.ledger_account_id is null;

-- 15b. Comptes du grand livre pour les catégories déjà utilisées
insert into public.ledger_accounts (
  user_id,
  code,
  name,
  kind,
  normal_balance,
  currency,
  linked_category_id,
  is_system
)
select distinct
  transactions.user_id,
  'C-' || replace(categories.id::text, '-', ''),
  categories.name,
  case categories.type
    when 'income' then 'revenue'::public.ledger_account_kind
    else 'expense'::public.ledger_account_kind
  end,
  case categories.type
    when 'income' then 'credit'::public.journal_entry_side
    else 'debit'::public.journal_entry_side
  end,
  'EUR',
  categories.id,
  true
from public.transactions
join public.categories on categories.id = transactions.category_id
where not exists (
  select 1
  from public.ledger_accounts
  where ledger_accounts.user_id = transactions.user_id
    and ledger_accounts.linked_category_id = categories.id
);

-- 15c. Écritures pour les transactions existantes (déséquilibre = 0)
insert into public.journal_entries (user_id, transaction_id, ledger_account_id, side, amount, memo)
select
  transactions.user_id,
  transactions.id,
  category_ledger.id,
  'debit'::public.journal_entry_side,
  transactions.amount,
  transactions.note
from public.transactions
join public.ledger_accounts category_ledger
  on category_ledger.user_id = transactions.user_id
 and category_ledger.linked_category_id = transactions.category_id
where transactions.type = 'expense'
  and transactions.status = 'posted'
  and not exists (
    select 1 from public.journal_entries where transaction_id = transactions.id
  );

insert into public.journal_entries (user_id, transaction_id, ledger_account_id, side, amount, memo)
select
  transactions.user_id,
  transactions.id,
  asset_ledger.id,
  'credit'::public.journal_entry_side,
  transactions.amount,
  transactions.note
from public.transactions
join public.ledger_accounts asset_ledger
  on asset_ledger.user_id = transactions.user_id
 and asset_ledger.linked_account_id = transactions.account_id
where transactions.type = 'expense'
  and transactions.status = 'posted'
  and not exists (
    select 1
    from public.journal_entries
    where transaction_id = transactions.id
      and side = 'credit'
  );

insert into public.journal_entries (user_id, transaction_id, ledger_account_id, side, amount, memo)
select
  transactions.user_id,
  transactions.id,
  asset_ledger.id,
  'debit'::public.journal_entry_side,
  transactions.amount,
  transactions.note
from public.transactions
join public.ledger_accounts asset_ledger
  on asset_ledger.user_id = transactions.user_id
 and asset_ledger.linked_account_id = transactions.account_id
where transactions.type = 'income'
  and transactions.status = 'posted'
  and not exists (
    select 1 from public.journal_entries where transaction_id = transactions.id
  );

insert into public.journal_entries (user_id, transaction_id, ledger_account_id, side, amount, memo)
select
  transactions.user_id,
  transactions.id,
  category_ledger.id,
  'credit'::public.journal_entry_side,
  transactions.amount,
  transactions.note
from public.transactions
join public.ledger_accounts category_ledger
  on category_ledger.user_id = transactions.user_id
 and category_ledger.linked_category_id = transactions.category_id
where transactions.type = 'income'
  and transactions.status = 'posted'
  and not exists (
    select 1
    from public.journal_entries
    where transaction_id = transactions.id
      and side = 'credit'
  );

-- ------------------------------------------------------------
-- 16. Vérification post-migration (lève une exception si déséquilibre)
-- ------------------------------------------------------------

do $$
declare
  unbalanced_count integer;
begin
  select count(*) into unbalanced_count
  from (
    select transaction_id
    from public.journal_entries
    group by transaction_id
    having
      coalesce(sum(amount) filter (where side = 'debit'), 0)
      <> coalesce(sum(amount) filter (where side = 'credit'), 0)
  ) unbalanced;

  if unbalanced_count > 0 then
    raise exception 'Migration invalide : % transaction(s) déséquilibrée(s)', unbalanced_count;
  end if;
end;
$$;
