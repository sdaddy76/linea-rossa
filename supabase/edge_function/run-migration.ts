// Edge Function temporanea per eseguire la migration dei tracciati per-fazione
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase    = createClient(supabaseUrl, serviceKey);

  // Esegui ciascuna ALTER TABLE come operazione separata
  const statements = [
    // ─── IRAN ─────────────────────────────────────────────────
    `ALTER TABLE game_state ADD COLUMN IF NOT EXISTS tecnologia_nucleare_iran INTEGER NOT NULL DEFAULT 1`,

    // ─── COALIZIONE ───────────────────────────────────────────
    `ALTER TABLE game_state ADD COLUMN IF NOT EXISTS influenza_diplomatica_coalizione INTEGER NOT NULL DEFAULT 5`,
    `ALTER TABLE game_state ADD COLUMN IF NOT EXISTS tecnologia_avanzata_coalizione   INTEGER NOT NULL DEFAULT 5`,
    `ALTER TABLE game_state ADD COLUMN IF NOT EXISTS supporto_pubblico_coalizione     INTEGER NOT NULL DEFAULT 7`,

    // ─── RUSSIA ───────────────────────────────────────────────
    `ALTER TABLE game_state ADD COLUMN IF NOT EXISTS influenza_militare_russia    INTEGER NOT NULL DEFAULT 5`,
    `ALTER TABLE game_state ADD COLUMN IF NOT EXISTS veto_onu_russia              INTEGER NOT NULL DEFAULT 3`,
    `ALTER TABLE game_state ADD COLUMN IF NOT EXISTS stabilita_economica_russia   INTEGER NOT NULL DEFAULT 6`,

    // ─── CINA ─────────────────────────────────────────────────
    `ALTER TABLE game_state ADD COLUMN IF NOT EXISTS influenza_commerciale_cina   INTEGER NOT NULL DEFAULT 5`,
    `ALTER TABLE game_state ADD COLUMN IF NOT EXISTS cyber_warfare_cina           INTEGER NOT NULL DEFAULT 3`,
    `ALTER TABLE game_state ADD COLUMN IF NOT EXISTS stabilita_rotte_cina         INTEGER NOT NULL DEFAULT 7`,

    // ─── EUROPA ───────────────────────────────────────────────
    `ALTER TABLE game_state ADD COLUMN IF NOT EXISTS influenza_diplomatica_europa  INTEGER NOT NULL DEFAULT 6`,
    `ALTER TABLE game_state ADD COLUMN IF NOT EXISTS aiuti_umanitari_europa        INTEGER NOT NULL DEFAULT 5`,
    `ALTER TABLE game_state ADD COLUMN IF NOT EXISTS coesione_ue_europa            INTEGER NOT NULL DEFAULT 7`,

    // ─── Fix range risorse_coalizione (max 15) ─────────────────
    `ALTER TABLE game_state DROP CONSTRAINT IF EXISTS game_state_risorse_coalizione_check`,
    `ALTER TABLE game_state ADD  CONSTRAINT game_state_risorse_coalizione_check CHECK (risorse_coalizione BETWEEN 1 AND 15)`,

    // ─── Fix range risorse_cina (max 12) ──────────────────────
    `ALTER TABLE game_state DROP CONSTRAINT IF EXISTS game_state_risorse_cina_check`,
    `ALTER TABLE game_state ADD  CONSTRAINT game_state_risorse_cina_check CHECK (risorse_cina BETWEEN 1 AND 12)`,
  ];

  const results: { sql: string; ok: boolean; error?: string }[] = [];

  for (const sql of statements) {
    const { error } = await supabase.rpc('exec_ddl', { statement: sql }).single();
    if (error) {
      // Tenta direttamente via fetch alla Management API interna
      results.push({ sql: sql.slice(0, 60), ok: false, error: error.message });
    } else {
      results.push({ sql: sql.slice(0, 60), ok: true });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
