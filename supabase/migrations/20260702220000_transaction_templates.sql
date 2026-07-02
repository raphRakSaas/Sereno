-- Modèles de transaction réutilisables (saisie rapide).
create table public.transaction_templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (char_length(trim(name)) > 0),
  type        text not null check (type in ('income', 'expense')),
  amount      numeric not null check (amount > 0),
  category_id uuid references public.categories (id) on delete set null,
  account_id  uuid references public.accounts (id) on delete set null,
  note        text,
  is_pinned   boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index transaction_templates_user_pinned_idx
  on public.transaction_templates (user_id, is_pinned desc, sort_order);

alter table public.transaction_templates enable row level security;

create policy "Chacun gère ses modèles"
  on public.transaction_templates for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.transaction_templates to authenticated;
