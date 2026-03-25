import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, type LogEntry } from '@/store/gameStore';
import { ZONA_COLORS } from '@/data/tracciati';

function FazioneTag({ fazione }: { fazione: LogEntry['fazione'] }) {
  const cfg = {
    iran: { bg: '#14532d', text: '#4ade80', label: '🇮🇷 Iran' },
    coalizione: { bg: '#1e3a5f', text: '#60a5fa', label: '🌐 Coaliz.' },
    evento: { bg: '#312e1a', text: '#fbbf24', label: '⚡ Evento' },
  }[fazione];
  return (
    <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: cfg.bg, color: cfg.text, fontFamily: 'JetBrains Mono, monospace', fontSize: '9px' }}>
      {cfg.label}
    </span>
  );
}

function DeltaBadge({ old: o, nw }: { old: number; nw: number }) {
  const d = nw - o;
  if (d === 0) return null;
  const color = d > 0 ? '#4ade80' : '#f87171';
  return (
    <span style={{ color, fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 700 }}>
      {d > 0 ? `+${d}` : d}
    </span>
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  const [editing, setEditing] = useState(false);
  const [nota, setNota] = useState(entry.nota ?? '');
  const { aggiungiNota } = useGameStore();

  // cerca il colore zona nuova
  const zoneKeys = ['safe', 'watch', 'caution', 'danger', 'critical', 'neutral', 'coalition'] as const;
  const allTracciati = ['TNI', 'TSE', 'TOG', 'DEFCON', 'RE', 'SI'];
  // ignoriamo la ricerca zona qui, usiamo testo semplice e data

  const saveNota = () => {
    aggiungiNota(entry.id, nota);
    setEditing(false);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
      className="p-2 rounded border flex flex-col gap-1" style={{ backgroundColor: '#0d1117', borderColor: entry.cambioZona ? '#c8a55a44' : '#1e2a3a' }}>
      <div className="flex items-center gap-2 flex-wrap">
        <span style={{ color: '#3a4a5a', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px' }}>T{entry.turno}</span>
        <FazioneTag fazione={entry.fazione} />
        <span className="font-bold text-xs" style={{ color: '#d0c8b4', fontFamily: 'Share Tech Mono, monospace' }}>{entry.tracciatoId}</span>
        <span style={{ color: '#4a5a6a', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
          {entry.vecchioValore} → {entry.nuovoValore}
        </span>
        <DeltaBadge old={entry.vecchioValore} nw={entry.nuovoValore} />
        {entry.cambioZona && (
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#312e1a', color: '#c8a55a', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px' }}>
            ⚡ {entry.vecchiaZona} → {entry.nuovaZona}
          </span>
        )}
      </div>
      {/* Nota */}
      {editing ? (
        <div className="flex gap-1 mt-1">
          <input
            className="flex-1 text-xs px-2 py-0.5 rounded border bg-transparent outline-none"
            style={{ borderColor: '#c8a55a44', color: '#e8e4d8', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}
            value={nota} onChange={e => setNota(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveNota(); if (e.key === 'Escape') setEditing(false); }}
            autoFocus placeholder="Aggiungi nota…" />
          <button onClick={saveNota} className="text-xs px-2 rounded" style={{ backgroundColor: '#c8a55a22', color: '#c8a55a', fontFamily: 'JetBrains Mono, monospace' }}>✓</button>
          <button onClick={() => setEditing(false)} className="text-xs px-2 rounded" style={{ color: '#6a7a8a', fontFamily: 'JetBrains Mono, monospace' }}>✕</button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {entry.nota && <span style={{ color: '#6a7a8a', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px' }}>📝 {entry.nota}</span>}
          <button onClick={() => setEditing(true)} className="text-xs ml-auto" style={{ color: '#2a3a4a', fontFamily: 'JetBrains Mono, monospace' }}>
            {entry.nota ? '✎' : '+ nota'}
          </button>
        </div>
      )}
    </motion.div>
  );
}

export function TurnLog() {
  const { log, turnoCorrente, nuovoTurno, gameOver } = useGameStore();
  const [filter, setFilter] = useState<'all' | 'iran' | 'coalizione' | 'evento'>('all');
  const [soloZona, setSoloZona] = useState(false);

  const filtered = log.filter(e => {
    if (filter !== 'all' && e.fazione !== filter) return false;
    if (soloZona && !e.cambioZona) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="font-bold text-xs tracking-widest" style={{ color: '#c8a55a', fontFamily: 'Share Tech Mono, monospace' }}>
          📋 LOG MOSSE — {log.length} azioni
        </div>
        <div className="ml-auto flex gap-1 flex-wrap">
          {(['all','iran','coalizione','evento'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="text-xs px-2 py-0.5 rounded border transition-all"
              style={{
                borderColor: filter === f ? '#c8a55a' : '#1e2a3a',
                backgroundColor: filter === f ? '#c8a55a22' : 'transparent',
                color: filter === f ? '#c8a55a' : '#4a5a6a',
                fontFamily: 'JetBrains Mono, monospace', fontSize: '9px',
              }}>{f === 'all' ? 'Tutti' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
          <button onClick={() => setSoloZona(s => !s)}
            className="text-xs px-2 py-0.5 rounded border transition-all"
            style={{
              borderColor: soloZona ? '#f97316' : '#1e2a3a',
              backgroundColor: soloZona ? '#f9731622' : 'transparent',
              color: soloZona ? '#f97316' : '#4a5a6a',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '9px',
            }}>⚡ Solo cambio zona</button>
        </div>
      </div>

      {/* Nuovo turno */}
      {!gameOver && (
        <button onClick={nuovoTurno}
          className="mb-3 py-2 rounded border text-xs font-bold tracking-widest transition-all hover:bg-yellow-900/20"
          style={{ borderColor: '#c8a55a44', color: '#c8a55a', fontFamily: 'Share Tech Mono, monospace' }}>
          ▶ TURNO {turnoCorrente} COMPLETATO — Avanza al Turno {turnoCorrente + 1}
        </button>
      )}

      {/* Lista log */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5" style={{ scrollbarWidth: 'thin' }}>
        <AnimatePresence>
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs" style={{ color: '#2a3a4a' }}>
              Nessuna mossa registrata.<br />Modifica un tracciato per iniziare.
            </div>
          ) : (
            filtered.map(entry => <LogRow key={entry.id} entry={entry} />)
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
