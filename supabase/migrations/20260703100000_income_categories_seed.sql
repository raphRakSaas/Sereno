-- Catégories de revenus enrichies (alignées sur default-categories.ts).

insert into public.categories (id, user_id, name, type, icon, color, display_order, is_archived) values
  ('c0000000-0000-4000-8000-000000000012', null, 'Freelance & indépendant', 'income', 'pencil', '#3694BC', 1, false),
  ('c0000000-0000-4000-8000-000000000013', null, 'Allocations & aides familiales', 'income', 'gift', '#5F7E93', 2, false),
  ('c0000000-0000-4000-8000-000000000014', null, 'APL & aide au logement', 'income', 'home', '#018472', 3, false),
  ('c0000000-0000-4000-8000-000000000015', null, 'Prestations sociales', 'income', 'health', '#6D9755', 4, false),
  ('c0000000-0000-4000-8000-000000000016', null, 'Pension & retraite', 'income', 'wallet', '#7D8F3A', 5, false),
  ('c0000000-0000-4000-8000-000000000017', null, 'Revenus locatifs', 'income', 'building', '#7B6CBF', 6, false),
  ('c0000000-0000-4000-8000-000000000018', null, 'Dividendes & intérêts', 'income', 'chart', '#8FA9B8', 7, false),
  ('c0000000-0000-4000-8000-000000000019', null, 'Plus-values & placements', 'income', 'sparkle', '#A07417', 8, false),
  ('c0000000-0000-4000-8000-00000000001a', null, 'Remboursements reçus', 'income', 'arrow-in', '#A85769', 9, false)
on conflict (id) do update
  set name = excluded.name,
      type = excluded.type,
      icon = excluded.icon,
      color = excluded.color,
      display_order = excluded.display_order,
      is_archived = excluded.is_archived;

update public.categories set display_order = 0 where id = 'c0000000-0000-4000-8000-000000000001';
update public.categories set display_order = 10, icon = 'dots', color = '#945818' where id = 'c0000000-0000-4000-8000-000000000002';

update public.categories set display_order = 20 where id = 'c0000000-0000-4000-8000-000000000003';
update public.categories set display_order = 21 where id = 'c0000000-0000-4000-8000-000000000004';
update public.categories set display_order = 22 where id = 'c0000000-0000-4000-8000-000000000005';
update public.categories set display_order = 23 where id = 'c0000000-0000-4000-8000-000000000006';
update public.categories set display_order = 24 where id = 'c0000000-0000-4000-8000-000000000007';
update public.categories set display_order = 25 where id = 'c0000000-0000-4000-8000-000000000008';
update public.categories set display_order = 26 where id = 'c0000000-0000-4000-8000-000000000009';
update public.categories set display_order = 27 where id = 'c0000000-0000-4000-8000-000000000010';
update public.categories set display_order = 28 where id = 'c0000000-0000-4000-8000-000000000011';
