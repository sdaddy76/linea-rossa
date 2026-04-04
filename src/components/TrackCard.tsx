import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronUp, ChevronDown, Minus, Plus } from 'lucide-react';
import type { Tracciato } from '@/data/tracciati';
import { getZonaAttiva, ZONA_COLORS } from '@/data/tracciati';
import { useGameStore, type LogEntry } from '@/store/gameStore';
import { TRACK_TOOLTIPS } from '@/lib/tooltips';

// ── Barra segmentata interattiva ────────────────────────────────────
function SegmentBar({ tracciato, valore }: { tracciato: Tracciato; valore: number }) {
  const { aggiornaTracciato } = useGameStore();
  const total = tracciato.max - tracciato.min || 1;

  return (
    <div className="flex gap-0.5 h-5 mt-2">
      {tracciato.zone.map(zona => {
        const n = zona.a - zona.da + 1;
        const pct = (n / total) * 100;
        const c = ZONA_COLORS[zona.colore];
        const isActive = valore >= zona.da && valore <= zona.a;
        return (
          <div
            key={zona.da}
            onClick={() => {
              const mid = Math.round((zona.da + zona.a) / 2);
              aggiornaTracciato(tracciato.id, mid, 'evento');
            }}
            title={`${zona.label} (${zona.da === zona.a ? zona.da : `${zona.da}–${zona.a}`})`}
            className="cursor-pointer rounded-sm relative overflow-hidden transition-all duration-200"
            style={{
              width: `${pct}%`,
              backgroundColor: isActive ? c.barFill : c.barBg,
              border: `1px solid ${isActive ? c.text : c.border}`,
              boxShadow: isActive ? c.glow : 'none',
              opacity: isActive ? 1 : 0.55,
            }}
          >
            {isActive && (
              <motion.div
                className="absolute inset-0"
                style={{ backgroundColor: c.text }}
                animate={zona.colore === 'critical' ? { opacity: [0.15, 0.32, 0.15] } : { opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Dettaglio zona ──────────────────────────────────────────────────
function ZonaDetail({ tracciato, valore, onClose }: {
  tracciato: Tracciato; valore: number; onClose: () => void;
}) {
  const zona = getZonaAttiva(tracciato, valore);
  const c = ZONA_COLORS[zona.colore];
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="mt-3 rounded border p-3 relative"
      style={{ backgroundColor: c.bg, borderColor: c.border, boxShadow: c.glow }}
    >
      <button onClick={onClose}
        className="absolute top-2 right-2 w-6 h-6 text-xs flex items-center justify-center rounded hover:bg-white/10 transition-colors"
        style={{ color: '#6a7a8a' }}>✕</button>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{zona.icona}</span>
        <div>
          <div className="font-bold text-sm tracking-wide" style={{ color: c.text, fontFamily: 'Share Tech Mono, monospace' }}>
            {zona.label.toUpperCase()}
          </div>
          <div className="text-xs" style={{ color: '#6a7a8a', fontFamily: 'JetBrains Mono, monospace' }}>{zona.sottotitolo}</div>
        </div>
        <span className="ml-auto text-xs px-2 py-0.5 rounded" style={{ backgroundColor: c.badge, color: c.badgeText, fontFamily: 'JetBrains Mono, monospace' }}>
          LIV. {zona.da === zona.a ? zona.da : `${zona.da}–${zona.a}`}
        </span>
      </div>

      <p className="text-xs leading-relaxed mb-3" style={{ color: '#d0c8b4' }}>{zona.scenario}</p>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="p-2 rounded border text-xs" style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderColor: '#1e2a3a' }}>
          <div className="font-bold mb-1" style={{ color: c.text, fontFamily: 'JetBrains Mono, monospace' }}>🃏 Carte chiave</div>
          {zona.carteChiave.map((c2, i) => <div key={i} style={{ color: '#a0a8b8' }}>› {c2}</div>)}
        </div>
        <div className="p-2 rounded border text-xs" style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderColor: '#1e2a3a' }}>
          <div className="font-bold mb-1" style={{ color: '#fbbf24', fontFamily: 'JetBrains Mono, monospace' }}>🏆 Vittoria</div>
          <div style={{ color: '#a0a8b8' }}>{zona.condizioniVittoria}</div>
        </div>
        <div className="p-2 rounded border text-xs" style={{ backgroundColor: 'rgba(74,222,128,0.05)', borderColor: 'rgba(74,222,128,0.2)' }}>
          <div className="font-bold mb-1" style={{ color: '#4ade80', fontFamily: 'JetBrains Mono, monospace' }}>🇮🇷 Iran</div>
          <div style={{ color: '#a0a8b8' }}>{zona.costoIran}</div>
        </div>
        <div className="p-2 rounded border text-xs" style={{ backgroundColor: 'rgba(96,165,250,0.05)', borderColor: 'rgba(96,165,250,0.2)' }}>
          <div className="font-bold mb-1" style={{ color: '#60a5fa', fontFamily: 'JetBrains Mono, monospace' }}>🌐 Coalizione</div>
          <div style={{ color: '#a0a8b8' }}>{zona.costoCoalizione}</div>
        </div>
      </div>

      <div className="p-2 rounded text-xs leading-relaxed" style={{ backgroundColor: 'rgba(200,165,90,0.08)', borderLeft: '2px solid #c8a55a', paddingLeft: '8px' }}>
        <span style={{ color: '#c8a55a', fontFamily: 'JetBrains Mono, monospace' }}>⚡ {zona.noteStrategiche}</span>
      </div>
    </motion.div>
  );
}

// ── Card tracciato principale ───────────────────────────────────────
export function TrackCard({ tracciato }: { tracciato: Tracciato }) {
  const { valori, aggiornaTracciato, gameOver } = useGameStore();
  const [showDetail, setShowDetail] = useState(false);
  const valore = valori[tracciato.id] ?? tracciato.defaultVal;
  const zona = getZonaAttiva(tracciato, valore);
  const c = ZONA_COLORS[zona.colore];
  const isCritical = zona.colore === 'critical';

  const step = (delta: number, fazione: LogEntry['fazione']) => {
    if (!gameOver) aggiornaTracciato(tracciato.id, valore + delta, fazione);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded border p-3 relative"
      style={{
        backgroundColor: '#0d1117',
        borderColor: isCritical ? '#cc222288' : '#1e2a3a',
        boxShadow: isCritical ? '0 0 20px rgba(204,34,34,0.25)' : 'none',
      }}
    >
      {/* Pulse critico */}
      {isCritical && (
        <motion.div className="absolute inset-0 rounded" style={{ border: '1px solid #cc2222' }}
          animate={{ opacity: [0.4, 0, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg" title={TRACK_TOOLTIPS[tracciato.id] ?? tracciato.nome}>{tracciato.icona}</span>
          <div>
            <div className="font-bold text-xs tracking-wider" style={{ color: '#e8e4d8', fontFamily: 'Share Tech Mono, monospace' }}>
              {tracciato.sigla}
            </div>
            <div className="text-xs" style={{ color: '#4a5a6a', fontFamily: 'JetBrains Mono, monospace' }}>
              {tracciato.nome}
            </div>
          </div>
        </div>

        {/* Zona badge */}
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer transition-all"
          style={{ backgroundColor: c.badge, color: c.text, border: `1px solid ${c.border}`, fontFamily: 'JetBrains Mono, monospace' }}
          onClick={() => setShowDetail(d => !d)}
        >
          <span>{zona.icona}</span>
          <span className="font-bold">{zona.label}</span>
          {showDetail ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </div>
      </div>

      {/* Controlli valore */}
      <div className="flex items-center gap-2 mb-1">
        {/* Bottone Iran –1 */}
        <button onClick={() => step(-1, 'iran')} disabled={gameOver || valore <= tracciato.min}
          className="w-7 h-7 flex items-center justify-center rounded border text-xs transition-all hover:bg-green-900/30 disabled:opacity-30"
          style={{ borderColor: '#22c55e44', color: '#4ade80' }} title={`🇮🇷 Iran: diminuisci ${tracciato.nome} di 1`}>
          <Minus size={11} />
        </button>

        {/* Display valore */}
        <div className="flex-1 flex flex-col items-center">
          <motion.div
            key={valore}
            initial={{ scale: 1.25, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="text-3xl font-black"
            title={`${tracciato.nome}: valore attuale ${valore} (range ${tracciato.min}–${tracciato.max})`}
            style={{ color: c.text, fontFamily: 'JetBrains Mono, monospace', textShadow: c.glow, lineHeight: 1 }}
          >
            {valore > 0 && tracciato.min < 0 ? `+${valore}` : valore}
          </motion.div>
          <div className="text-xs mt-0.5" style={{ color: '#3a4a5a', fontFamily: 'JetBrains Mono, monospace' }}>
            {tracciato.min} — {tracciato.max}
          </div>
        </div>

        {/* Bottone Iran +1 */}
        <button onClick={() => step(1, 'iran')} disabled={gameOver || valore >= tracciato.max}
          className="w-7 h-7 flex items-center justify-center rounded border text-xs transition-all hover:bg-green-900/30 disabled:opacity-30"
          style={{ borderColor: '#22c55e44', color: '#4ade80' }} title={`🇮🇷 Iran: aumenta ${tracciato.nome} di 1`}>
          <Plus size={11} />
        </button>
      </div>

      {/* Barra segmentata */}
      <SegmentBar tracciato={tracciato} valore={valore} />

      {/* Label zona attiva + direzioni */}
      <div className="flex items-center justify-between mt-1.5 text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        <span style={{ color: '#4ade80', fontSize: '9px' }}>🇮🇷 {tracciato.direzioneIran.split('→')[0]}→</span>
        <span style={{ color: '#60a5fa', fontSize: '9px' }}>←🌐 {tracciato.direzioneCoalizione.split('→')[0]}</span>
      </div>

      {/* Bottoni Coalizione */}
      <div className="flex gap-1 mt-2">
        <button onClick={() => step(-1, 'coalizione')} disabled={gameOver || valore <= tracciato.min}
          className="flex-1 py-1 rounded border text-xs flex items-center justify-center gap-1 transition-all hover:bg-blue-900/20 disabled:opacity-30"
          style={{ borderColor: '#3b82f644', color: '#60a5fa', fontFamily: 'JetBrains Mono, monospace' }}>
          <ChevronDown size={10} /> Coalizione –
        </button>
        <button onClick={() => step(1, 'coalizione')} disabled={gameOver || valore >= tracciato.max}
          className="flex-1 py-1 rounded border text-xs flex items-center justify-center gap-1 transition-all hover:bg-blue-900/20 disabled:opacity-30"
          style={{ borderColor: '#3b82f644', color: '#60a5fa', fontFamily: 'JetBrains Mono, monospace' }}>
          Coalizione + <ChevronUp size={10} />
        </button>
      </div>

      {/* Pannello dettaglio */}
      <AnimatePresence>
        {showDetail && (
          <ZonaDetail tracciato={tracciato} valore={valore} onClose={() => setShowDetail(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
