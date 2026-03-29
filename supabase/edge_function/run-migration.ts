// Edge Function — esegui migration completa (tabelle mancanti + colonne)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase    = createClient(supabaseUrl, serviceKey);

  // Usa la service role per eseguire SQL via pg_query (Supabase internal)
  const sqlStatements = [
    // Tabella territories
    `CREATE TABLE IF NOT EXISTS public.territories (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
      territory text NOT NULL,
      inf_iran integer NOT NULL DEFAULT 0,
      inf_coalizione integer NOT NULL DEFAULT 0,
      inf_russia integer NOT NULL DEFAULT 0,
      inf_cina integer NOT NULL DEFAULT 0,
      inf_europa integer NOT NULL DEFAULT 0,
      updated_at timestamptz DEFAULT now(),
      UNIQUE(game_id, territory)
    )`,
    // Tabella military_units
    `CREATE TABLE IF NOT EXISTS public.military_units (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
      faction text NOT NULL,
      territory text NOT NULL,
      unit_type text NOT NULL,
      quantity integer NOT NULL DEFAULT 0,
      updated_at timestamptz DEFAULT now(),
      UNIQUE(game_id, faction, territory, unit_type)
    )`,
    // RLS territories
    `ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='territories' AND policyname='territories_rw')
      THEN CREATE POLICY "territories_rw" ON public.territories FOR ALL USING (true); END IF;
    END $$`,
    // RLS military_units
    `ALTER TABLE public.military_units ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='military_units' AND policyname='mil_units_rw')
      THEN CREATE POLICY "mil_units_rw" ON public.military_units FOR ALL USING (true); END IF;
    END $$`,
    // game_state opzionali
    `ALTER TABLE public.game_state ADD COLUMN IF NOT EXISTS forze_militari_iran integer NOT NULL DEFAULT 5`,
    `ALTER TABLE public.game_state ADD COLUMN IF NOT EXISTS forze_militari_coalizione integer NOT NULL DEFAULT 5`,
    `ALTER TABLE public.game_state ADD COLUMN IF NOT EXISTS forze_militari_russia integer NOT NULL DEFAULT 5`,
    `ALTER TABLE public.game_state ADD COLUMN IF NOT EXISTS forze_militari_cina integer NOT NULL DEFAULT 5`,
    `ALTER TABLE public.game_state ADD COLUMN IF NOT EXISTS forze_militari_europa integer NOT NULL DEFAULT 5`,
    `ALTER TABLE public.game_state ADD COLUMN IF NOT EXISTS units_iran jsonb DEFAULT '{}'::jsonb`,
    `ALTER TABLE public.game_state ADD COLUMN IF NOT EXISTS units_coalizione jsonb DEFAULT '{}'::jsonb`,
    `ALTER TABLE public.game_state ADD COLUMN IF NOT EXISTS units_russia jsonb DEFAULT '{}'::jsonb`,
    `ALTER TABLE public.game_state ADD COLUMN IF NOT EXISTS units_cina jsonb DEFAULT '{}'::jsonb`,
    `ALTER TABLE public.game_state ADD COLUMN IF NOT EXISTS units_europa jsonb DEFAULT '{}'::jsonb`,
    `ALTER TABLE public.game_state ADD COLUMN IF NOT EXISTS special_uses jsonb DEFAULT '{"veto_russia":3,"hormuz_iran":false,"superiorita_aerea":false}'::jsonb`,
    `ALTER TABLE public.game_state ADD COLUMN IF NOT EXISTS active_alliances jsonb DEFAULT '[]'::jsonb`,
    `ALTER TABLE public.game_state ADD COLUMN IF NOT EXISTS last_event_turn integer`,
    `ALTER TABLE public.game_state ADD COLUMN IF NOT EXISTS last_event_id text`,
    // games.game_mode
    `ALTER TABLE public.games ADD COLUMN IF NOT EXISTS game_mode text NOT NULL DEFAULT 'classic'`,
    // cards_deck
    `ALTER TABLE public.cards_deck ADD COLUMN IF NOT EXISTS owner_faction text`,
    `ALTER TABLE public.cards_deck ADD COLUMN IF NOT EXISTS play_mode text`,
    // Reload schema cache
    `NOTIFY pgrst, 'reload schema'`,
  ];

  const results: { sql: string; ok: boolean; error?: string }[] = [];

  for (const sql of sqlStatements) {
    try {
      // Usa fetch diretto alla REST API interna con service key (bypassa RLS)
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/run_sql`, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      });
      const body = await res.json();
      if (body.error || (body.code && body.code !== '00000')) {
        results.push({ sql: sql.slice(0, 80).replace(/\s+/g, ' '), ok: false, error: body.message ?? JSON.stringify(body) });
      } else {
        results.push({ sql: sql.slice(0, 80).replace(/\s+/g, ' '), ok: true });
      }
    } catch (e: unknown) {
      results.push({ sql: sql.slice(0, 80).replace(/\s+/g, ' '), ok: false, error: String(e) });
    }
  }

  const allOk = results.every(r => r.ok);
  return new Response(JSON.stringify({ allOk, results }), {
    status: allOk ? 200 : 207,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
