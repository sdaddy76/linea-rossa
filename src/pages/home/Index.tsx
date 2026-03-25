import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { TUTTI_TRACCIATI } from '@/data/tracciati';
import { TrackCard } from '@/components/TrackCard';
import { Sidebar } from '@/components/Sidebar';
import { TurnLog } from '@/components/TurnLog';
import { useState } from 'react';

// ── Game Over Overlay ────────────────────────────────────────────────
function GameOverOverlay() {
  const { gameOver, gameOverMotivo, nuovaPartita, punteggioIran, punteggioCoalizione, turnoCorrente, log } = useGameStore();

  if (!gameOver) return null;

  const isCatastrofe = gameOverMotivo.includes('DEFCON');
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0.35 }}
        className="max-w-lg w-full mx-4 p-8 rounded border text-center"
        style={{ backgroundColor: '#0a0c10', borderColor: isCatastrofe ? '#cc2222' : '#c8a55a', boxShadow: isCatastrofe ? '0 0 60px rgba(204,34,34,0.4)' : '0 0 60px rgba(200,165,90,0.3)' }}
      >
        <div className="text-5xl mb-4">{isCatastrofe ? '💀' : '☢️'}</div>
        <div className="text-2xl font-black mb-2" style={{ color: isCatastrofe ? '#ff4444' : '#c8a55a', fontFamily: 'Share Tech Mono, monospace', letterSpacing: '0.1em' }}>
          PARTITA TERMINATA
        </div>
        <div className="text-sm mb-6 leading-relaxed" style={{ color: '#d0c8b4', fontFamily: 'JetBrains Mono, monospace' }}>
          {gameOverMotivo}
        </div>

        {/* Riepilogo */}
        <div className="grid grid-cols-3 gap-3 mb-6 text-center">
          <div className="p-3 rounded" style={{ backgroundColor: '#14532d33', border: '1px solid #22c55e44' }}>
            <div className="text-2xl font-black" style={{ color: '#4ade80', fontFamily: 'JetBrains Mono, monospace' }}>{punteggioIran}</div>
            <div className="text-xs" style={{ color: '#4ade80' }}>🇮🇷 Iran</div>
          </div>
          <div className="p-3 rounded" style={{ backgroundColor: '#c8a55a11', border: '1px solid #c8a55a44' }}>
            <div className="text-xl font-black" style={{ color: '#c8a55a', fontFamily: 'JetBrains Mono, monospace' }}>{turnoCorrente}</div>
            <div className="text-xs" style={{ color: '#c8a55a' }}>Turni</div>
          </div>
          <div className="p-3 rounded" style={{ backgroundColor: '#1e3a5f33', border: '1px solid #3b82f644' }}>
            <div className="text-2xl font-black" style={{ color: '#60a5fa', fontFamily: 'JetBrains Mono, monospace' }}>{punteggioCoalizione}</div>
            <div className="text-xs" style={{ color: '#60a5fa' }}>🌐 Coaliz.</div>
          </div>
        </div>

        <div className="text-xs mb-6" style={{ color: '#4a5a6a', fontFamily: 'JetBrains Mono, monospace' }}>
          {log.length} azioni registrate in {turnoCorrente} turni
        </div>

        <button onClick={nuovaPartita}
          className="py-3 px-8 rounded border font-bold tracking-widest text-sm transition-all hover:scale-105"
          style={{ borderColor: '#c8a55a', color: '#c8a55a', backgroundColor: '#c8a55a11', fontFamily: 'Share Tech Mono, monospace' }}>
          ↺ NUOVA PARTITA
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Header ───────────────────────────────────────────────────────────
function AppHeader() {
  const { turnoCorrente, nuovaPartita, gameOver, log } = useGameStore();
  const [confirmNew, setConfirmNew] = useState(false);

  return (
    <header className="flex items-center gap-4 px-4 py-2.5 border-b"
      style={{ backgroundColor: '#08090d', borderColor: '#1e2a3a' }}>
      <div className="flex items-center gap-2">
        <span className="text-xl">☢️</span>
        <div>
          <div className="font-black tracking-widest text-sm" style={{ color: '#e8e4d8', fontFamily: 'Share Tech Mono, monospace' }}>
            LINEA ROSSA
          </div>
          <div className="text-xs" style={{ color: '#4a5a6a', fontFamily: 'JetBrains Mono, monospace' }}>
            Crisis Tracker — Tracciato Nucleare Iraniano
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="px-3 py-1 rounded border text-xs" style={{ borderColor: '#c8a55a44', color: '#c8a55a', fontFamily: 'JetBrains Mono, monospace' }}>
          TURNO {turnoCorrente}
        </div>
        <div className="px-3 py-1 rounded border text-xs" style={{ borderColor: '#1e2a3a', color: '#4a5a6a', fontFamily: 'JetBrains Mono, monospace' }}>
          {log.length} azioni
        </div>
        {gameOver && (
          <div className="px-3 py-1 rounded border text-xs" style={{ borderColor: '#cc222244', color: '#ff4444', fontFamily: 'JetBrains Mono, monospace' }}>
            ● GAME OVER
          </div>
        )}
        {confirmNew ? (
          <div className="flex gap-1 items-center">
            <span className="text-xs" style={{ color: '#f87171', fontFamily: 'JetBrains Mono, monospace' }}>Sei sicuro?</span>
            <button onClick={() => { nuovaPartita(); setConfirmNew(false); }}
              className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', fontFamily: 'JetBrains Mono, monospace' }}>Sì</button>
            <button onClick={() => setConfirmNew(false)}
              className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#1e2a3a', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>No</button>
          </div>
        ) : (
          <button onClick={() => setConfirmNew(true)}
            className="px-3 py-1.5 rounded border text-xs font-bold tracking-wider transition-all hover:bg-red-950/40"
            style={{ borderColor: '#cc222244', color: '#f87171', fontFamily: 'JetBrains Mono, monospace' }}>
            ↺ Nuova Partita
          </button>
        )}
      </div>
    </header>
  );
}

// ── Legenda ─────────────────────────────────────────────────────────
function Legenda() {
  const items = [
    { c: '#22c55e', label: 'Sicuro' },
    { c: '#eab308', label: 'Attenzione' },
    { c: '#f97316', label: 'Allerta' },
    { c: '#ef4444', label: 'Pericolo' },
    { c: '#cc2222', label: 'Critico' },
    { c: '#64748b', label: 'Neutro' },
    { c: '#3b82f6', label: 'Coalizione' },
  ];
  return (
    <div className="flex flex-wrap gap-3 px-4 py-2 border-b" style={{ borderColor: '#131820', backgroundColor: '#08090d' }}>
      {items.map(it => (
        <div key={it.label} className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: it.c }} />
          <span className="text-xs" style={{ color: '#4a5a6a', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px' }}>{it.label}</span>
        </div>
      ))}
      <span className="ml-auto text-xs" style={{ color: '#2a3a4a', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px' }}>
        🇮🇷 = Iran ± tracciato | 🌐 = Coalizione ± tracciato | clic su zona → dettagli
      </span>
    </div>
  );
}

// ── Tab Log mobile ────────────────────────────────────────────────────
type Tab = 'tracker' | 'sidebar' | 'log';

// ── Layout principale ────────────────────────────────────────────────
export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>('tracker');

  return (
    <div className="min-h-screen flex flex-col dark" style={{ backgroundColor: '#08090d', color: '#e8e4d8' }}>
      <AppHeader />
      <Legenda />

      {/* Tab mobile */}
      <div className="flex lg:hidden border-b" style={{ borderColor: '#1e2a3a', backgroundColor: '#0a0c10' }}>
        {([['tracker', '📊 Tracciati'], ['sidebar', '⚡ Stato'], ['log', '📋 Log']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className="flex-1 py-2 text-xs font-bold tracking-wider transition-all"
            style={{
              fontFamily: 'Share Tech Mono, monospace',
              color: activeTab === t ? '#c8a55a' : '#3a4a5a',
              backgroundColor: activeTab === t ? '#c8a55a11' : 'transparent',
              borderBottom: activeTab === t ? '2px solid #c8a55a' : '2px solid transparent',
            }}>{label}</button>
        ))}
      </div>

      {/* Layout desktop 3 colonne */}
      <div className="flex-1 flex overflow-hidden">
        {/* Colonna sinistra: tracciati (2 colonne su schermi larghi) */}
        <div className={`flex-1 overflow-y-auto p-3 ${activeTab !== 'tracker' ? 'hidden lg:block' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-3">
            {TUTTI_TRACCIATI.map(t => (
              <TrackCard key={t.id} tracciato={t} />
            ))}
          </div>
        </div>

        {/* Colonna centrale: sidebar punteggi/alert */}
        <div className={`w-72 border-l overflow-y-auto p-3 flex-shrink-0 ${activeTab !== 'sidebar' ? 'hidden lg:block' : 'w-full'}`}
          style={{ borderColor: '#1e2a3a', backgroundColor: '#0a0c10' }}>
          <Sidebar />
        </div>

        {/* Colonna destra: turn log */}
        <div className={`w-80 border-l overflow-hidden p-3 flex flex-col flex-shrink-0 ${activeTab !== 'log' ? 'hidden lg:flex' : 'flex w-full'}`}
          style={{ borderColor: '#1e2a3a', backgroundColor: '#0a0c10' }}>
          <TurnLog />
        </div>
      </div>

      {/* Game Over overlay */}
      <GameOverOverlay />
    </div>
  );
}
