// Sereno — génération quotidienne des transactions récurrentes.
// Appelée chaque nuit par pg_cron (voir supabase/cron.sql). Idempotente :
// une occurrence (règle, date) déjà insérée n'est jamais dupliquée, la
// fonction peut donc être rejouée sans risque.
import { createClient } from 'npm:@supabase/supabase-js@2';

type Frequency = 'weekly' | 'monthly' | 'yearly';

/** Avance une date ISO (yyyy-MM-dd) d'un pas de fréquence.
    Mensuel/annuel : le jour est borné à la fin du mois cible (31 → 28 février). */
function advance(date: string, frequency: Frequency): string {
  const [y, m, d] = date.split('-').map(Number);
  if (frequency === 'weekly') {
    const next = new Date(Date.UTC(y, m - 1, d + 7));
    return next.toISOString().slice(0, 10);
  }
  const targetYear = frequency === 'yearly' ? y + 1 : m === 12 ? y + 1 : y;
  const targetMonth = frequency === 'yearly' ? m : m === 12 ? 1 : m + 1;
  const daysInTarget = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const day = Math.min(d, daysInTarget);
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

Deno.serve(async () => {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const today = new Date().toISOString().slice(0, 10);
  const { data: rules, error } = await admin
    .from('recurring_rules')
    .select('*, categories(type)')
    .eq('active', true)
    .lte('next_run_date', today);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let created = 0;
  const failures: string[] = [];

  for (const rule of rules ?? []) {
    const type = (rule.categories as { type?: string } | null)?.type ?? 'expense';
    // Rattrapage : si des échéances ont été manquées, chacune est générée.
    const due: string[] = [];
    let next = rule.next_run_date as string;
    const endDate = rule.end_date as string | null;
    while (next <= today) {
      if (endDate && next > endDate) {
        break;
      }
      due.push(next);
      next = advance(next, rule.frequency as Frequency);
    }
    if (due.length === 0) continue;

    const { data: existing, error: existingError } = await admin
      .from('transactions')
      .select('date')
      .eq('recurring_rule_id', rule.id)
      .in('date', due);
    if (existingError) {
      failures.push(rule.id);
      continue;
    }
    const already = new Set((existing ?? []).map((t) => t.date));
    const pendingDates = due.filter((date) => !already.has(date));

    for (const date of pendingDates) {
      const { error: rpcError } = await admin.rpc('create_transaction_with_entries_core', {
        p_user_id: rule.user_id,
        payload: {
          account_id: rule.account_id,
          category_id: rule.category_id,
          amount: rule.amount,
          type,
          date,
          note: null,
        },
        idempotency_key: `${rule.id}:${date}`,
        p_recurring_rule_id: rule.id,
      });
      if (rpcError) {
        failures.push(rule.id);
        break;
      }
      created += 1;
    }

    if (failures.includes(rule.id)) {
      continue;
    }

    const reachedEnd = endDate && next > endDate;
    const { error: updateError } = await admin
      .from('recurring_rules')
      .update(reachedEnd ? { next_run_date: next, active: false } : { next_run_date: next })
      .eq('id', rule.id);
    if (updateError) {
      failures.push(rule.id);
    }
  }

  return new Response(
    JSON.stringify({ processed: rules?.length ?? 0, created, failures }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
