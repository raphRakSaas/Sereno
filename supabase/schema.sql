-- ============================================================
-- Sereno — schéma Supabase
-- À exécuter dans l'éditeur SQL du projet (ou via migration).
-- Postgres 15+. Toutes les tables sont protégées par RLS ;
-- les catégories globales (user_id null) sont lisibles par tous
-- les utilisateurs connectés.
-- ============================================================

-- ------------------------------------------------------------
-- profiles : 1 ligne par utilisateur (id = auth.uid())
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  currency text not null default 'EUR',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- accounts
-- ------------------------------------------------------------
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('cash', 'bank', 'savings', 'credit_card')),
  initial_balance numeric(12, 2) not null default 0,
  currency text not null default 'EUR',
  created_at timestamptz not null default now()
);

create index accounts_user_id_idx on public.accounts (user_id);

-- ------------------------------------------------------------
-- categories : user_id null = catégorie globale fournie par Sereno
-- ------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text not null default 'dots',
  color text not null default '#8B948C'
);

create index categories_user_id_idx on public.categories (user_id);

-- ------------------------------------------------------------
-- recurring_rules (avant transactions : référencée par celle-ci)
-- ------------------------------------------------------------
create table public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  next_run_date date not null,
  active boolean not null default true
);

create index recurring_rules_user_id_idx on public.recurring_rules (user_id);
create index recurring_rules_due_idx on public.recurring_rules (next_run_date) where active;
create index recurring_rules_account_id_idx on public.recurring_rules (account_id);
create index recurring_rules_category_id_idx on public.recurring_rules (category_id);

-- ------------------------------------------------------------
-- transactions : amount toujours positif, le sens est porté par type
-- ------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  amount numeric(12, 2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  date date not null,
  note text,
  marker_color text check (
    marker_color is null
    or marker_color ~ '^#[0-9A-Fa-f]{6}$'
  ),
  recurring_rule_id uuid references public.recurring_rules (id) on delete set null,
  created_at timestamptz not null default now()
);

create index transactions_user_date_idx on public.transactions (user_id, date desc);
create index transactions_account_id_idx on public.transactions (account_id);
create index transactions_category_id_idx on public.transactions (category_id);
create index transactions_recurring_rule_id_idx on public.transactions (recurring_rule_id);
create index transactions_marker_color_idx on public.transactions (user_id, marker_color)
  where marker_color is not null;

-- ------------------------------------------------------------
-- budgets : une limite mensuelle par (utilisateur, catégorie, mois)
-- ------------------------------------------------------------
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  limit_amount numeric(12, 2) not null check (limit_amount > 0),
  unique (user_id, category_id, month)
);

create index budgets_user_month_idx on public.budgets (user_id, month);
create index budgets_category_id_idx on public.budgets (category_id);

-- ============================================================
-- RLS : chaque table, policy standard "auth.uid() = user_id".
-- `(select auth.uid())` est mis en cache par requête (perf).
-- ============================================================

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_rules enable row level security;
alter table public.budgets enable row level security;

create policy "Chacun gère son profil"
  on public.profiles for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Chacun gère ses comptes"
  on public.accounts for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Chacun gère ses catégories"
  on public.categories for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Policy additionnelle : les catégories globales sont lisibles par tous.
create policy "Les catégories globales sont lisibles"
  on public.categories for select to authenticated
  using (user_id is null);

create policy "Chacun gère ses transactions"
  on public.transactions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Chacun gère ses récurrences"
  on public.recurring_rules for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Chacun gère ses budgets"
  on public.budgets for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================
-- Création automatique du profil à l'inscription
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, currency)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'EUR'
  );
  return new;
end;
$$;

-- Fonction technique : pas d'appel direct par les clients.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================
-- Seed : catégories globales de Sereno.
-- Les UUID sont FIXES et identiques à ceux du mode invité
-- (src/app/domain/data/default-categories.ts) : la migration
-- Dexie → Supabase n'a aucun remappage à faire.
-- ============================================================

insert into public.categories (id, user_id, name, type, icon, color, display_order, is_archived) values
  ('c0000000-0000-4000-8000-000000000001', null, 'Salaire', 'income', 'work', '#1E6D9C', 0, false),
  ('c0000000-0000-4000-8000-000000000012', null, 'Freelance & indépendant', 'income', 'pencil', '#3694BC', 1, false),
  ('c0000000-0000-4000-8000-000000000013', null, 'Allocations & aides familiales', 'income', 'gift', '#5F7E93', 2, false),
  ('c0000000-0000-4000-8000-000000000014', null, 'APL & aide au logement', 'income', 'home', '#018472', 3, false),
  ('c0000000-0000-4000-8000-000000000015', null, 'Prestations sociales', 'income', 'health', '#6D9755', 4, false),
  ('c0000000-0000-4000-8000-000000000016', null, 'Pension & retraite', 'income', 'wallet', '#7D8F3A', 5, false),
  ('c0000000-0000-4000-8000-000000000017', null, 'Revenus locatifs', 'income', 'building', '#7B6CBF', 6, false),
  ('c0000000-0000-4000-8000-000000000018', null, 'Dividendes & intérêts', 'income', 'chart', '#8FA9B8', 7, false),
  ('c0000000-0000-4000-8000-000000000019', null, 'Plus-values & placements', 'income', 'sparkle', '#A07417', 8, false),
  ('c0000000-0000-4000-8000-00000000001a', null, 'Remboursements reçus', 'income', 'arrow-in', '#A85769', 9, false),
  ('c0000000-0000-4000-8000-000000000002', null, 'Autres revenus', 'income', 'dots', '#945818', 10, false),
  ('c0000000-0000-4000-8000-000000000003', null, 'Logement', 'expense', 'home', '#196E44', 20, false),
  ('c0000000-0000-4000-8000-000000000004', null, 'Courses', 'expense', 'basket', '#018472', 21, false),
  ('c0000000-0000-4000-8000-000000000005', null, 'Transports', 'expense', 'transit', '#7D8F3A', 22, false),
  ('c0000000-0000-4000-8000-000000000006', null, 'Restaurants & cafés', 'expense', 'dining', '#A07417', 23, false),
  ('c0000000-0000-4000-8000-000000000007', null, 'Santé', 'expense', 'health', '#6D9755', 24, false),
  ('c0000000-0000-4000-8000-000000000008', null, 'Loisirs', 'expense', 'leisure', '#7B6CBF', 25, false),
  ('c0000000-0000-4000-8000-000000000009', null, 'Abonnements', 'expense', 'repeat', '#8D4826', 26, false),
  ('c0000000-0000-4000-8000-000000000010', null, 'Vêtements', 'expense', 'clothing', '#A85769', 27, false),
  ('c0000000-0000-4000-8000-000000000011', null, 'Autres dépenses', 'expense', 'dots', '#945818', 28, false)
on conflict (id) do update
  set name = excluded.name,
      type = excluded.type,
      icon = excluded.icon,
      color = excluded.color,
      display_order = excluded.display_order,
      is_archived = excluded.is_archived;
