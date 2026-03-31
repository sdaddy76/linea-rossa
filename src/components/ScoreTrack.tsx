// =============================================
// LINEA ROSSA — Score Track
// Mostra i punteggi in tempo reale per fazione:
//   • Punti obiettivi: somma dei `punti` di ogni obiettivo con completato=true
//   • Punti territorio: +1 per ogni territorio dove la fazione ha la maggioranza
// =============================================
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TUTTI_GLI_OBIETTIVI } from '@/data/obiettivi';

// ── Tipi ──────────────────────────────────────────────────────────────
interface FactionScore {
  faction: string;
  flag: string;
  color: string;
  puntiObiettivi: number;
  obiettiviCompletati: number;
  obiettiviTotali: number;
  puntiTerritorio: number;
  totale: number;
}

// ── Costanti fazione ──────────────────────────────────────────────────
const FACTION_INFO: Record<string, { flag: string; color: string }> = {
  'Iran':      { flag: '🇮🇷', color: '#2d8a4e' },
  'Coalizione':{ flag: '🇺🇸', color: '#1a6eb5' },
  'Russia':    { flag: '🇷🇺', color: '#c0392b' },
  'Cina':      { flag: '🇨🇳', color: '#e74c3c' },
  'Europa':    { flag: '🇪🇺', color: '#2980b9' },
};

// Mappa fazione → colonna influenza in `territories`
const FACTION_INF_KEY: Record<string, string> = {
  'Iran':      'inf_iran',
  'Coalizione':'inf_coalizione',
  'Russia':    'inf_russia',
  'Cina':      'inf_cina',
  'Europa':    'inf_europa',
};

const ALL_INF_KEYS = ['inf_iran', 'inf_coalizione', 'inf_russia', 'inf_cina', 'inf_europa'];

// ── Tipi DB ────────────────────────────────────────────────────────────
interface GameObjectiveRow {
  faction: string;
  obj_id: string;
  completato: boolean;
}

interface TerritoryRow {
  [key: string]: number;
}

// ── Props ──────────────────────────────────────────────────────────────
interface Props {
  /** ID univoco della partita (game.id) */
  gameId: string;
  /** Lista delle fazioni presenti in questa partita */
  factions: string[];
}

// ── Componente ─────────────────────────────────────────────────────────
export const ScoreTrack: React.FC<Props> = ({ gameId, factions }) => {
  const [scores, setScores] = useState<FactionScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  // ── Calcola e aggiorna i punteggi ────────────────────────────────────
  const loadScores = async () => {
    try {
      // 1. Obiettivi assegnati (tutti, non solo i miei)
      const { data: goData, error: goErr } = await supabase
        .from('game_objectives')
        .select('faction, obj_id, completato')
        .eq('game_id', gameId);

      if (goErr && goErr.code !== 'PGRST205' && goErr.code !== '42P01') {
        console.warn('[ScoreTrack] game_objectives:', goErr.message);
      }

      // 2. Territori con influenze
      const { data: terrData, error: terrErr } = await supabase
        .from('territories')
        .select('inf_iran, inf_coalizione, inf_russia, inf_cina, inf_europa')
        .eq('game_id', gameId);

      if (terrErr && terrErr.code !== 'PGRST205' && terrErr.code !== '42P01') {
        console.warn('[ScoreTrack] territories:', terrErr.message);
      }

      // 3. Calcola punteggio per ogni fazione
      const result: FactionScore[] = factions.map(faction => {
        // ── Punti obiettivi ──────────────────────────────────────────
        const myRows = ((goData ?? []) as GameObjectiveRow[]).filter(
          r => r.faction === faction
        );
        const completati = myRows.filter(r => r.completato);

        // Obiettivi SEGRETI: non mostrare i punti pubblicamente
        const puntiObiettivi = 0; // nascosto

        // ── Punti territorio ─────────────────────────────────────────
        let puntiTerritorio = 0;
        const myKey = FACTION_INF_KEY[faction];
        if (myKey && terrData) {
          for (const t of terrData as TerritoryRow[]) {
            const mine = t[myKey] ?? 0;
            if (mine === 0) continue;
            const total = ALL_INF_KEYS.reduce((s, k) => s + (t[k] ?? 0), 0);
            // Maggioranza: più della metà dei cubi presenti
            if (total > 0 && mine * 2 > total) {
              puntiTerritorio++;
            }
          }
        }

        const info = FACTION_INFO[faction] ?? { flag: '🏳️', color: '#8899aa' };
        return {
          faction,
          flag: info.flag,
          color: info.color,
          puntiObiettivi,
          obiettiviCompletati: completati.length,
          obiettiviTotali:     myRows.length,
          puntiTerritorio,
          totale: puntiTerritorio, // solo punti visibili (territori)
        };
      });

      // Ordina per punteggio decrescente, a parità per nome
      result.sort((a, b) => b.totale - a.totale || a.faction.localeCompare(b.faction));
      setScores(result);
    } catch (e) {
      console.warn('[ScoreTrack] loadScores error:', e);
    } finally {
      setLoading(false);
    }
  };

  // ── Effetto: caricamento iniziale + real-time ─────────────────────────
  useEffect(() => {
    if (!gameId || factions.length === 0) return;
    setLoading(true);
    loadScores();

    // Ascolta cambiamenti in tempo reale su game_objectives e territories
    const channel = supabase
      .channel(`score-track-${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_objectives', filter: `game_id=eq.${gameId}` },
        () => { loadScores(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'territories', filter: `game_id=eq.${gameId}` },
        () => { loadScores(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, factions.join(',')]);

  // ── Non renderizzare mentre carica la prima volta ─────────────────────
  if (loading && scores.length === 0) return null;

  const maxScore = Math.max(...scores.map(s => s.totale), 1);
  const leader   = scores[0];

  return (
    <div className="bg-[#050d18] border border-[#1e3a5f] rounded-xl overflow-hidden">
      {/* Intestazione collassabile */}
      <button
        className="w-full flex items-center justify-between px-4 py-2.5
          border-b border-[#1e3a5f] hover:bg-[#0a1628] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">🏆</span>
          <span className="font-mono text-xs font-bold text-[#4a9eff] uppercase tracking-widest">
            Punteggi
          </span>
          {leader && leader.totale > 0 && (
            <span className="text-[10px] font-mono text-yellow-400 bg-yellow-500/15 px-1.5 py-0.5 rounded">
              {leader.flag} {leader.faction} in testa
            </span>
          )}
        </div>
        <span className="text-[#8899aa] font-mono text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {/* Contenuto */}
      {open && (
        <div className="p-4 space-y-3">
          {scores.map((s, i) => (
            <div key={s.faction} className="space-y-1">
              {/* Riga principale: fazione + punteggio */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{s.flag}</span>
                  <span className="font-mono font-bold" style={{ color: s.color }}>
                    {s.faction}
                  </span>
                  {i === 0 && s.totale > 0 && (
                    <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1 rounded font-mono">
                      👑 1°
                    </span>
                  )}
                </div>
                <span className="font-bold font-mono text-white tabular-nums">
                  {s.totale} pt
                </span>
              </div>

              {/* Barra progresso */}
              <div className="h-1.5 bg-[#0a1628] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(s.totale / maxScore) * 100}%`,
                    background: s.color,
                    minWidth: s.totale > 0 ? '4px' : '0',
                  }}
                />
              </div>

              {/* Dettaglio — solo punti visibili, obiettivi segreti nascosti */}
              <div className="flex flex-wrap gap-3 text-[10px] text-[#556677]">
                <span>
                  🗺️ Territori controllati:{' '}
                  <span className="text-[#8899aa]">{s.puntiTerritorio} pt</span>
                </span>
                <span className="text-[#334455] italic">🎯 Obiettivi: segreti</span>
              </div>
            </div>
          ))}

          {scores.length === 0 && (
            <p className="text-[10px] text-[#556677] font-mono text-center py-2">
              Nessun dato disponibile
            </p>
          )}
        </div>
      )}
    </div>
  );
};
