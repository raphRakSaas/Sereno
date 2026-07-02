-- Marqueur visuel optionnel sur les transactions (hors grand livre).
alter table public.transactions
  add column if not exists marker_color text;

alter table public.transactions
  drop constraint if exists transactions_marker_color_check;

alter table public.transactions
  add constraint transactions_marker_color_check
  check (
    marker_color is null
    or marker_color ~ '^#[0-9A-Fa-f]{6}$'
  );

create index if not exists transactions_marker_color_idx
  on public.transactions (user_id, marker_color)
  where marker_color is not null;
