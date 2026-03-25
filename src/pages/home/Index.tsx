import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrackCard } from '@/components/TrackCard';
import { PrintTabellone } from '@/components/PrintTabellone';
import { TUTTI_TRACCIATI } from '@/data/tracciati';

// ── Status badge ───────────────────────────────────────────────────
function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#7a8a9a' }}>
      <motion.div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span>{label}</span>
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────────────
function Header({ onPrint }: { onPrint: () => void }) {
  return (
    <header
      className="w-full border-b px-4 md:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3"
      style={{ backgroundColor: '#060910', borderColor: '#1a2030', boxShadow: '0 2px 20px rgba(0,0,0,0.6)' }}
    >
      {/* Logo + titolo */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg border"
            style={{ background: 'radial-gradient(circle, #7f0000, #3a0000)', borderColor: '#cc2222', boxShadow: '0 0 18px rgba(204,34,34,0.5)' }}
          >☢️</div>
          <motion.div
            className="absolute inset-0 rounded-full border"
            style={{ borderColor: '#cc2222' }}
            animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-[0.15em]"
            style={{ color: '#e8e4d8', fontFamily: 'Share Tech Mono, monospace', textShadow: '0 0 18px rgba(204,34,34,0.35)' }}>
            LINEA ROSSA
          </h1>
          <p className="text-xs tracking-[0.1em]" style={{ color: '#4a5a6a', fontFamily: 'JetBrains Mono, monospace' }}>
            CRISI NUCLEARE IRANIANA — PANNELLO DI CONTROLLO
          </p>
        </div>
      </div>

      {/* Destra: badge + pulsanti */}
      <div className="flex items-center gap-4 flex-wrap justify-center">
        <StatusBadge label="IRAN" color="#4ade80" />
        <StatusBadge label="COALIZIONE" color="#60a5fa" />
        <StatusBadge label="ONU" color="#c8a55a" />
        <div className="w-px h-4 bg-white/10" />
        <div className="px-3 py-1 rounded border text-xs"
          style={{ backgroundColor: 'rgba(204,34,34,0.08)', borderColor: 'rgba(204,34,34,0.3)', color: '#cc2222', fontFamily: 'JetBrains Mono, monospace' }}>
          6 TRACCIATI ATTIVI
        </div>

        {/* ── PULSANTE STAMPA ── */}
        <motion.button
          onClick={onPrint}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2 rounded border text-xs font-bold tracking-widest transition-all"
          style={{
            backgroundColor: 'rgba(200,165,90,0.12)',
            borderColor: '#c8a55a',
            color: '#c8a55a',
            fontFamily: 'Share Tech Mono, monospace',
            boxShadow: '0 0 12px rgba(200,165,90,0.2)',
          }}
        >
          🖨️ STAMPA TABELLONE
        </motion.button>
      </div>
    </header>
  );
}

// ── Legenda compatta ───────────────────────────────────────────────
function LegendaZone() {
  const voci = [
    { col: '#22c55e', label: 'SICURO' },
    { col: '#eab308', label: 'ATTENZIONE' },
    { col: '#f97316', label: 'ALLERTA' },
    { col: '#ef4444', label: 'PERICOLO' },
    { col: '#dc2626', label: 'CRITICO / FINE PARTITA' },
    { col: '#94a3b8', label: 'NEUTRALE' },
    { col: '#3b82f6', label: 'VANTAGGIO COALIZIONE' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-2 border-b"
      style={{ backgroundColor: '#080b12', borderColor: '#1a2030' }}>
      <span className="text-xs mr-2" style={{ color: '#4a5a6a', fontFamily: 'JetBrains Mono, monospace' }}>LEGENDA ZONE:</span>
      {voci.map((v) => (
        <div key={v.label} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: v.col + '55', border: `1px solid ${v.col}88` }} />
          <span style={{ color: '#4a5a6a', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>{v.label}</span>
        </div>
      ))}
      <div className="ml-auto text-xs" style={{ color: '#3a4a5a', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
        ← CLICCA SU UN SEGMENTO O SU UN BADGE ZONA PER I DETTAGLI →
      </div>
    </div>
  );
}

// ── Info panel ─────────────────────────────────────────────────────
function InfoPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm border transition-all"
        style={{
          backgroundColor: open ? 'rgba(200,165,90,0.2)' : '#0d1117',
          borderColor: open ? '#c8a55a' : '#1e2a3a',
          color: '#c8a55a',
          boxShadow: open ? '0 0 14px rgba(200,165,90,0.3)' : 'none',
        }}>ℹ</button>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute bottom-12 right-0 w-64 rounded border p-4"
          style={{ backgroundColor: '#0d1117', borderColor: '#1e2a3a', boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }}>
          <p className="text-xs font-bold mb-2" style={{ color: '#c8a55a', fontFamily: 'Share Tech Mono, monospace' }}>COME USARE LA PLANCIA</p>
          <ul className="space-y-2 text-xs" style={{ color: '#7a8a9a', fontFamily: 'JetBrains Mono, monospace' }}>
            <li>◆ <span style={{ color: '#e8e4d8' }}>Clicca su un segmento</span> della barra colorata per vedere gli effetti.</li>
            <li>◆ <span style={{ color: '#e8e4d8' }}>Clicca sui badge</span> zona per accesso rapido.</li>
            <li>◆ <span style={{ color: '#e8e4d8' }}>🖨️ STAMPA TABELLONE</span> per il layout da tavolo.</li>
            <li>◆ Le zone <span style={{ color: '#dc2626' }}>CRITICHE</span> pulsano in rosso.</li>
          </ul>
        </motion.div>
      )}
    </div>
  );
}

// ── Modal tabellone stampabile ─────────────────────────────────────
function PrintModal({ onClose }: { onClose: () => void }) {
  const handlePrint = () => window.print();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ backgroundColor: '#040608' }}
    >
      {/* Toolbar stampa */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b no-print"
        style={{ backgroundColor: '#060910', borderColor: '#1a2030' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-base" style={{ color: '#e8e4d8', fontFamily: 'Share Tech Mono, monospace', fontSize: '13px', letterSpacing: '0.1em' }}>
            🖨️ ANTEPRIMA TABELLONE — PRONTO PER LA STAMPA
          </span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(200,165,90,0.12)', color: '#c8a55a', fontFamily: 'JetBrains Mono, monospace' }}>
            FORMATO CONSIGLIATO: A2 LANDSCAPE
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Istruzioni stampa */}
          <div className="text-xs" style={{ color: '#4a5a6a', fontFamily: 'JetBrains Mono, monospace' }}>
            Usa Ctrl+P (o ⌘+P su Mac) · Imposta: A2 landscape · Scala: Adatta pagina · Colori di sfondo: ON
          </div>

          {/* Pulsante stampa */}
          <motion.button
            onClick={handlePrint}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2 rounded border font-bold text-xs tracking-widest"
            style={{
              backgroundColor: 'rgba(204,34,34,0.15)',
              borderColor: '#cc2222',
              color: '#ff6b6b',
              fontFamily: 'Share Tech Mono, monospace',
              boxShadow: '0 0 14px rgba(204,34,34,0.3)',
            }}
          >
            🖨️ STAMPA / SALVA PDF
          </motion.button>

          {/* Chiudi */}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded border text-sm transition-colors hover:bg-white/5"
            style={{ borderColor: '#1e2a3a', color: '#7a8a9a' }}
          >✕</button>
        </div>
      </div>

      {/* Preview scrollabile */}
      <div className="flex-1 overflow-auto p-4" style={{ backgroundColor: '#1a1a2e' }}>
        <div
          className="mx-auto rounded shadow-2xl"
          style={{
            minWidth: 1100,
            maxWidth: 1600,
            boxShadow: '0 0 60px rgba(0,0,0,0.8)',
          }}
        >
          <PrintTabellone />
        </div>
      </div>
    </motion.div>
  );
}

// ── Pagina principale ──────────────────────────────────────────────
export default function Dashboard() {
  const [showPrint, setShowPrint] = useState(false);

  return (
    <>
      {/* ── CSS DI STAMPA ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-tabellone, #print-tabellone * { visibility: visible !important; }
          #print-tabellone { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; }
          .no-print { display: none !important; }
          @page { size: A2 landscape; margin: 8mm; }
        }
      `}</style>

      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#070a10' }}>
        <Header onPrint={() => setShowPrint(true)} />
        <LegendaZone />

        <main className="flex-1 px-4 md:px-6 py-6">
          {/* Titolo sezione */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, #1e2a3a, transparent)' }} />
            <span className="text-xs tracking-[0.2em]" style={{ color: '#4a5a6a', fontFamily: 'JetBrains Mono, monospace' }}>
              ● TRACCIATI ATTIVI — CLICCA SUI SEGMENTI PER I DETTAGLI ●
            </span>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, #1e2a3a)' }} />
          </div>

          {/* Griglia tracciati */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {TUTTI_TRACCIATI.map((tracciato, i) => (
              <motion.div
                key={tracciato.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.28, ease: 'easeOut' }}
              >
                <TrackCard tracciato={tracciato} />
              </motion.div>
            ))}
          </div>

          <div className="mt-8 p-4 rounded border text-center"
            style={{ backgroundColor: '#0a0e16', borderColor: '#1a2030' }}>
            <p className="text-xs" style={{ color: '#2a3a4a', fontFamily: 'JetBrains Mono, monospace' }}>
              LINEA ROSSA · TNI ◆ TSE ◆ TOG ◆ DEFCON ◆ RE ◆ SI
              · 🖨️ USA IL PULSANTE "STAMPA TABELLONE" PER IL FORMATO FISICO
            </p>
          </div>
        </main>

        <InfoPanel />
      </div>

      {/* Modal tabellone */}
      <AnimatePresence>
        {showPrint && <PrintModal onClose={() => setShowPrint(false)} />}
      </AnimatePresence>
    </>
  );
}
