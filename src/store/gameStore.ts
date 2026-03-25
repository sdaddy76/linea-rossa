import { create } from 'zustand';
import { TUTTI_TRACCIATI, getZonaAttiva, isGameOver } from '@/data/tracciati';

// ── Tipi store ──────────────────────────────────────────────────────
export interface LogEntry {
  id: string;
  turno: number;
  timestamp: number;
  tracciatoId: string;
  tracciatoNome: string;
  vecchioValore: number;
  nuovoValore: number;
  vecchiaZona: string;
  nuovaZona: string;
  cambioZona: boolean;
  fazione: 'iran' | 'coalizione' | 'evento';
  nota?: string;
}

export interface GameState {
  // Stato partita
  turnoCorrente: number;
  partitaAttiva: boolean;
  gameOver: boolean;
  gameOverMotivo: string;
  dataInizio: number;

  // Valori tracciati
  valori: Record<string, number>;

  // Log mosse
  log: LogEntry[];

  // Punteggi
  punteggioIran: number;
  punteggioCoalizione: number;

  // UI
  tracciatoSelezionato: string | null;
}

export interface GameActions {
  aggiornaTracciato: (tracciatoId: string, nuovoValore: number, fazione: LogEntry['fazione'], nota?: string) => void;
  nuovoTurno: () => void;
  nuovaPartita: () => void;
  selezionaTracciato: (id: string | null) => void;
  aggiungiNota: (logId: string, nota: string) => void;
}

// ── Valori iniziali ─────────────────────────────────────────────────
function valoriDefault(): Record<string, number> {
  return Object.fromEntries(TUTTI_TRACCIATI.map(t => [t.id, t.defaultVal]));
}

function calcolaPunteggi(valori: Record<string, number>): { iran: number; coal: number } {
  let iran = 0, coal = 0;
  // TNI: più alto = meglio per Iran
  const tni = valori['TNI'] ?? 3;
  iran += Math.floor((tni - 1) / 2);
  coal += Math.floor((15 - tni) / 3);
  // TSE: più alto = peggio per Coalizione
  const tse = valori['TSE'] ?? 4;
  iran += tse >= 7 ? 2 : tse >= 5 ? 1 : 0;
  coal += tse <= 3 ? 2 : tse <= 5 ? 1 : 0;
  // TOG: negativo = Iran, positivo = Coalizione
  const tog = valori['TOG'] ?? 0;
  if (tog < 0) iran += Math.abs(Math.floor(tog / 3));
  if (tog > 0) coal += Math.floor(tog / 3);
  // DEFCON: basso = male per tutti, ma favorisce Iran se vuole escalation
  const defcon = valori['DEFCON'] ?? 4;
  if (defcon <= 2) iran += 1;
  if (defcon >= 4) coal += 1;
  // RE: alto = bene per chi ce l'ha
  const re = valori['RE'] ?? 6;
  if (re >= 8) iran += 1; if (re <= 3) coal += 1;
  // SI: alto = Iran stabile
  const si = valori['SI'] ?? 6;
  iran += si >= 8 ? 2 : si >= 6 ? 1 : 0;
  coal += si <= 3 ? 2 : si <= 4 ? 1 : 0;
  return { iran, coal };
}

// ── Store ───────────────────────────────────────────────────────────
export const useGameStore = create<GameState & GameActions>((set, get) => ({
  turnoCorrente: 1,
  partitaAttiva: true,
  gameOver: false,
  gameOverMotivo: '',
  dataInizio: Date.now(),
  valori: valoriDefault(),
  log: [],
  punteggioIran: 0,
  punteggioCoalizione: 0,
  tracciatoSelezionato: null,

  aggiornaTracciato: (tracciatoId, nuovoValore, fazione, nota) => {
    const state = get();
    const tracciato = TUTTI_TRACCIATI.find(t => t.id === tracciatoId);
    if (!tracciato || state.gameOver) return;

    const valoreClamp = Math.max(tracciato.min, Math.min(tracciato.max, nuovoValore));
    const vecchioValore = state.valori[tracciatoId];
    const vecchiaZona = getZonaAttiva(tracciato, vecchioValore).label;
    const nuovaZona = getZonaAttiva(tracciato, valoreClamp).label;

    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      turno: state.turnoCorrente,
      timestamp: Date.now(),
      tracciatoId,
      tracciatoNome: tracciato.nome,
      vecchioValore,
      nuovoValore: valoreClamp,
      vecchiaZona,
      nuovaZona,
      cambioZona: vecchiaZona !== nuovaZona,
      fazione,
      nota,
    };

    const nuoviValori = { ...state.valori, [tracciatoId]: valoreClamp };
    const punteggi = calcolaPunteggi(nuoviValori);
    const over = isGameOver(tracciato, valoreClamp);
    let motivo = '';
    if (over) {
      if (tracciatoId === 'TNI') motivo = '☢️ BREAKOUT NUCLEARE — L\'Iran ha ottenuto la Bomba!';
      if (tracciatoId === 'DEFCON') motivo = '💀 DEFCON 1 — LA GUERRA È SCOPPIATA! Tutti perdono.';
    }

    set({
      valori: nuoviValori,
      log: [entry, ...state.log],
      punteggioIran: punteggi.iran,
      punteggioCoalizione: punteggi.coal,
      gameOver: over,
      gameOverMotivo: motivo,
    });
  },

  nuovoTurno: () => set(s => ({ turnoCorrente: s.turnoCorrente + 1 })),

  nuovaPartita: () => set({
    turnoCorrente: 1,
    partitaAttiva: true,
    gameOver: false,
    gameOverMotivo: '',
    dataInizio: Date.now(),
    valori: valoriDefault(),
    log: [],
    punteggioIran: 0,
    punteggioCoalizione: 0,
    tracciatoSelezionato: null,
  }),

  selezionaTracciato: (id) => set({ tracciatoSelezionato: id }),

  aggiungiNota: (logId, nota) => set(s => ({
    log: s.log.map(e => e.id === logId ? { ...e, nota } : e),
  })),
}));
