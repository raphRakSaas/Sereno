-- ============================================================
-- Sereno — planification de la génération des récurrences.
-- À exécuter APRÈS avoir déployé l'Edge Function :
--   supabase functions deploy process-recurring
-- Remplace <PROJECT_REF> et <ANON_KEY> par les valeurs de ton
-- projet (Dashboard > Settings > API). La clé anon ne sert qu'à
-- passer verify_jwt ; les écritures se font dans la fonction
-- avec la clé service, jamais exposée ici.
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Rejouable : on déprogramme l'éventuel job existant avant de recréer.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'sereno-process-recurring') then
    perform cron.unschedule('sereno-process-recurring');
  end if;
end
$$;

-- Chaque nuit à 03h05 UTC.
select cron.schedule(
  'sereno-process-recurring',
  '5 3 * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/process-recurring',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <ANON_KEY>'
    ),
    body := '{}'::jsonb
  );
  $$
);
