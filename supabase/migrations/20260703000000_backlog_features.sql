-- Backlog features: comptes avancés, catégories ordre, budgets globaux, récurrences fin, groupes, échéances.

-- Comptes
alter table public.accounts
  add column if not exists exclude_from_total boolean not null default false,
  add column if not exists sort_order integer not null default 0,
  add column if not exists group_id uuid,
  add column if not exists card_limit numeric(12, 2),
  add column if not exists card_payment_day smallint check (card_payment_day between 1 and 28);

alter table public.accounts drop constraint if exists accounts_type_check;
alter table public.accounts add constraint accounts_type_check check (
  type in (
    'cash', 'bank', 'savings', 'credit_card', 'debit_card',
    'investment', 'insurance', 'loan', 'overdraft', 'real_estate', 'other'
  )
);

-- is_archived = masquer le compte
comment on column public.accounts.is_archived is 'Compte masqué dans les listes courantes';

-- Catégories
alter table public.categories
  add column if not exists display_order integer not null default 0;

-- Budget global (category_id nullable)
alter table public.budgets alter column category_id drop not null;

alter table public.budgets drop constraint if exists budgets_user_id_category_id_month_key;
create unique index budgets_user_category_month_idx
  on public.budgets (user_id, coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid), month);

-- Récurrences : date de fin
alter table public.recurring_rules
  add column if not exists end_date date;

-- Groupes de comptes
create table if not exists public.account_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind text not null default 'custom' check (kind in ('bank', 'cash', 'cards', 'savings', 'investment', 'other', 'custom')),
  is_visible boolean not null default true,
  include_in_total boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists account_groups_user_idx on public.account_groups (user_id, sort_order);

alter table public.accounts
  drop constraint if exists accounts_group_id_fkey;
alter table public.accounts
  add constraint accounts_group_id_fkey
  foreign key (group_id) references public.account_groups (id) on delete set null;

-- Plans de paiement fractionné
create table if not exists public.installment_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  total_amount numeric(12, 2) not null check (total_amount > 0),
  installment_count integer not null check (installment_count > 0),
  frequency text not null default 'monthly' check (frequency in ('weekly', 'monthly')),
  start_date date not null,
  account_id uuid not null references public.accounts (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.installment_occurrences (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.installment_plans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  due_date date not null,
  amount numeric(12, 2) not null check (amount > 0),
  transaction_id uuid references public.transactions (id) on delete set null,
  unique (plan_id, due_date)
);

alter table public.account_groups enable row level security;
alter table public.installment_plans enable row level security;
alter table public.installment_occurrences enable row level security;

create policy account_groups_own on public.account_groups for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy installment_plans_own on public.installment_plans for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy installment_occurrences_own on public.installment_occurrences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
