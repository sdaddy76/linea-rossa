
// =============================================
// LINEA ROSSA — Edge Function: Bot Turn
// Chiamata dal frontend quando è il turno di un bot
// Sceglie la carta migliore e aggiorna lo stato
// =============================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GameState {
  id: string; game_id: string;
  nucleare: number; sanzioni: number; opinione: number; defcon: number;
  risorse_iran: number; risorse_coalizione: number; risorse_russia: number;
  risorse_cina: number; risorse_europa: number;
  stabilita_iran: number; stabilita_coalizione: number; stabilita_russia: number;
  stabilita_cina: number; stabilita_europa: number;
  active_faction: string;
}

type Faction = 'Iran' | 'Coalizione' | 'Russia' | 'Cina' | 'Europa';
type Difficulty = 'easy' | 'normal' | 'hard';

// Scoring della carta per la fazione bot
function scoreCard(
  card: { op_points: number; effects_json: Record<string, number> },
  state: GameState,
  faction: Faction
): number {
  const e = card.effects_json ?? {};
  const dN = e.nucleare ?? 0;
  const dS = e.sanzioni ?? 0;
  const dD = e.defcon ?? 0;
  const dO = e.opinione ?? 0;
  const dR = e.risorse ?? 0;
  let score = card.op_points * 10;

  const risorseKey = `risorse_${faction.toLowerCase()}` as keyof GameState;
  const mieRisorse = state[risorseKey] as number;

  if (faction === 'Iran') {
    score += dN * 20 + dS * 15;
    if (dD < 0) score += Math.abs(dD) * 8;
    if (state.nucleare >= 10) score += dN * 15;
    if (state.sanzioni >= 8) score += dS * 20;
    if (mieRisorse <= 2 && dR > 0) score += dR * 25;
  } else if (faction === 'Coalizione') {
    score += dS * 20;
    if (dN < 0) score += Math.abs(dN) * 20;
    if (dO > 0) score += dO * 10;
    if (state.nucleare >= 13 && dN < 0) score += 100;
    if (state.sanzioni >= 7) score += dS * 25;
    if (state.defcon <= 2 && dD > 0) score += dD * 30;
  } else if (faction === 'Russia' || faction === 'Cina') {
    score += dS * 15;
    if (dN > 0) score += dN * 6;
    if (dR > 0) score += dR * 12;
    if (state.defcon <= 2 && dD > 0) score += 30;
  } else if (faction === 'Europa') {
    if (dD > 0) score += dD * 20;
    score += dO * 8;
    if (dD > 0 && state.defcon <= 2) score += 50;
  }

  if (state.defcon === 1 && dD < 0) score -= 200;
  if (state.defcon === 2 && dD < 0) score -= 80;
  return score;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { game_id, faction, difficulty = 'normal' } = await req.json();
    if (!game_id || !faction) {
      return new Response(JSON.stringify({ error: 'game_id e faction richiesti' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Recupera stato partita
    const { data: state, error: stateError } = await supabase
      .from('game_state').select('*').eq('game_id', game_id).single();
    if (stateError || !state) throw new Error('Stato partita non trovato');
    if ((state as GameState).active_faction !== faction) throw new Error('Non è il turno di questo bot');

    // 2. Recupera carte disponibili del bot
    const { data: available } = await supabase
      .from('cards_deck').select('*')
      .eq('game_id', game_id).eq('faction', faction).eq('status', 'available').limit(10);

    if (!available || available.length === 0) {
      // Mazzo esaurito: passa il turno
      const order: Faction[] = ['Iran','Coalizione','Russia','Cina','Europa'];
      const idx = order.indexOf(faction as Faction);
      const nextFaction = order[(idx + 1) % 5];
      await supabase.from('game_state').update({ active_faction: nextFaction }).eq('game_id', game_id);
      return new Response(JSON.stringify({ action: 'pass', reason: 'Mazzo esaurito' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Score delle carte e scelta
    const scored = available.map((c: Record<string, unknown>) => ({
      card: c,
      score: scoreCard(
        { op_points: c.op_points as number, effects_json: (c.effects_json as Record<string, number>) ?? {} },
        state as unknown as GameState,
        faction as Faction
      )
    })).sort((a, b) => b.score - a.score);

    let chosen = scored[0].card;
    if (difficulty === 'easy' && scored.length > 1) {
      const pool = scored.slice(0, Math.min(5, scored.length));
      chosen = pool[Math.floor(Math.random() * pool.length)].card;
    } else if (difficulty === 'normal' && scored.length > 1 && Math.random() > 0.7) {
      chosen = scored[1].card;
    }

    // 4. Ritorna la carta scelta (il frontend applica gli effetti)
    return new Response(JSON.stringify({
      action: 'play',
      card_id: chosen.card_id,
      card_name: chosen.card_name,
      reason: `Bot ${faction}: OP=${chosen.op_points}, punteggio=${scored[0].score}`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Errore' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
