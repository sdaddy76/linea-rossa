import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { TUTTI_TRACCIATI, getZonaAttiva, ZONA_COLORS } from '@/data/tracciati';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// ── Punteggi Iran vs Coalizione ─────────────────────────────────────
function ScorePanel() {
  const { punteggioIran, punteggioCoalizione, turnoCorrente } = useGameStore();
  const tot = punteggioIran + punteggioCoalizione || 1;
  const iranPct = (punteggioIran / tot) * 100;

  return (
    <div className="p-3 rounded border" style={{ backgroundColor: '#0d1117', borderColor: '#1e2a3a' }}>
      <div className="text-xs font-bold tracking-widest mb-3 flex items-center gap-2" style={{ color: '#c8a55a', fontFamily: 'Share Tech Mono, monospace' }}>
        <span>⚡</span> PUNTEGGI — TURNO {turnoCorrente}
      </div>

      {/* Bar confronto */}
      <div className="flex h-5 rounded overflow-hidden mb-2 gap-0.5">
        <motion.div animate={{ width: `${iranPct}%` }} transition={{ duration: 0.4 }}
          className="flex items-center justify-end pr-2 text-xs font-bold rounded-l"
          style={{ backgroundColor: '#14532d', color: '#4ade80', fontFamily: 'JetBrains Mono, monospace', minWidth: '30px' }}>
          {punteggioIran}
        </motion.div>
        <motion.div animate={{ width: `${100 - iranPct}%` }} transition={{ duration: 0.4 }}
          className="flex items-center justify-start pl-2 text-xs font-bold rounded-r"
          style={{ backgroundColor: '#1e3a5f', color: '#60a5fa', fontFamily: 'JetBrains Mono, monospace', minWidth: '30px' }}>
          {punteggioCoalizione}
        </motion.div>
      </div>

      <div className="flex justify-between text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        <span style={{ color: '#4ade80' }}>🇮🇷 IRAN</span>
        <span style={{ color: '#60a5fa' }}>COALIZIONE 🌐</span>
      </div>
    </div>
  );
}

// ── Stato corrente tutti i tracciati (mini) ─────────────────────────
function TrackMiniGrid() {
  const { valori } = useGameStore();

  return (
    <div className="p-3 rounded border" style={{ backgroundColor: '#0d1117', borderColor: '#1e2a3a' }}>
      <div className="text-xs font-bold tracking-widest mb-3" style={{ color: '#c8a55a', fontFamily: 'Share Tech Mono, monospace' }}>
        📊 STATO TRACCIATI
      </div>
      <div className="flex flex-col gap-2">
        {TUTTI_TRACCIATI.map(t => {
          const v = valori[t.id] ?? t.defaultVal;
          const zona = getZonaAttiva(t, v);
          const c = ZONA_COLORS[zona.colore];
          const pct = ((v - t.min) / (t.max - t.min)) * 100;
          return (
            <div key={t.id} className="flex items-center gap-2">
              <span className="text-sm w-5 text-center">{t.icona}</span>
              <div className="w-10 text-xs font-bold" style={{ color: '#4a5a6a', fontFamily: 'JetBrains Mono, monospace' }}>{t.sigla}</div>
              <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1e2a3a' }}>
                <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.35 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: c.barFill, boxShadow: zona.colore === 'critical' ? c.glow : 'none' }} />
              </div>
              <div className="w-8 text-right text-xs font-bold" style={{ color: c.text, fontFamily: 'JetBrains Mono, monospace' }}>
                {v > 0 && t.min < 0 ? `+${v}` : v}
              </div>
              <div className="w-14 text-xs truncate" style={{ color: c.text, fontFamily: 'JetBrains Mono, monospace', fontSize: '9px' }}>
                {zona.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Alert critici ───────────────────────────────────────────────────
function AlertPanel() {
  const { valori } = useGameStore();

  const alerts: { msg: string; color: string; icon: string }[] = [];
  const tni = valori['TNI'] ?? 3;
  const defcon = valori['DEFCON'] ?? 4;
  const tse = valori['TSE'] ?? 4;
  const si = valori['SI'] ?? 6;

  if (tni >= 13) alerts.push({ icon: '☢️', msg: 'TNI CRITICO — Test nucleare imminente!', color: '#ff4444' });
  else if (tni >= 9) alerts.push({ icon: '⚠️', msg: 'TNI ALTO — Soglia critica superata', color: '#f97316' });
  if (defcon <= 1) alerts.push({ icon: '💀', msg: 'DEFCON 1 — GUERRA APERTA!', color: '#ff0000' });
  else if (defcon <= 2) alerts.push({ icon: '💥', msg: 'DEFCON 2 — Guerra imminente!', color: '#ef4444' });
  else if (defcon <= 3) alerts.push({ icon: '🚨', msg: 'DEFCON 3 — Alta tensione', color: '#f97316' });
  if (tse <= 2) alerts.push({ icon: '📉', msg: 'ECONOMIA COLLASSATA — Regime sotto pressione', color: '#cc2222' });
  if (si <= 2) alerts.push({ icon: '🔥', msg: 'STABILITÀ CRITICA — Rischio cambio regime', color: '#cc2222' });

  if (alerts.length === 0) return (
    <div className="p-3 rounded border text-center" style={{ backgroundColor: '#0d1117', borderColor: '#1e2a3a' }}>
      <div className="text-xs" style={{ color: '#2a4a2a' }}>✅ Nessun alert critico</div>
    </div>
  );

  return (
    <div className="p-3 rounded border" style={{ backgroundColor: '#0d1117', borderColor: '#cc222244' }}>
      <div className="text-xs font-bold tracking-widest mb-2" style={{ color: '#ff4444', fontFamily: 'Share Tech Mono, monospace' }}>
        🚨 ALERT ATTIVI
      </div>
      <div className="flex flex-col gap-1.5">
        {alerts.map((a, i) => (
          <motion.div key={i} initial={{ x: -8 }} animate={{ x: 0 }}
            className="flex items-center gap-2 p-2 rounded text-xs"
            style={{ backgroundColor: `${a.color}11`, border: `1px solid ${a.color}33` }}>
            <span>{a.icon}</span>
            <span style={{ color: a.color, fontFamily: 'JetBrains Mono, monospace' }}>{a.msg}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Proiezione tendenza (grafico) ───────────────────────────────────
function ProjectionChart() {
  const { log } = useGameStore();

  // Aggreghiamo i punti per turno su TNI e DEFCON (i più importanti)
  const turniMap: Record<number, { tni: number; defcon: number }> = {};
  [...log].reverse().forEach(e => {
    if (!turniMap[e.turno]) turniMap[e.turno] = { tni: 3, defcon: 4 };
    if (e.tracciatoId === 'TNI') turniMap[e.turno].tni = e.nuovoValore;
    if (e.tracciatoId === 'DEFCON') turniMap[e.turno].defcon = e.nuovoValore;
  });

  const data = Object.entries(turniMap).sort((a, b) => Number(a[0]) - Number(b[0])).map(([t, v]) => ({
    turno: `T${t}`, ...v,
  }));

  if (data.length < 2) return (
    <div className="p-3 rounded border text-center" style={{ backgroundColor: '#0d1117', borderColor: '#1e2a3a' }}>
      <div className="text-xs mb-1" style={{ color: '#4a5a6a' }}>📈 PROIEZIONE TENDENZA</div>
      <div className="text-xs" style={{ color: '#2a3a4a' }}>Effettua almeno 2 modifiche per vedere il grafico</div>
    </div>
  );

  return (
    <div className="p-3 rounded border" style={{ backgroundColor: '#0d1117', borderColor: '#1e2a3a' }}>
      <div className="text-xs font-bold tracking-widest mb-2" style={{ color: '#c8a55a', fontFamily: 'Share Tech Mono, monospace' }}>
        📈 PROIEZIONE TENDENZA
      </div>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="turno" tick={{ fill: '#4a5a6a', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#4a5a6a', fontSize: 9 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0d1117', border: '1px solid #1e2a3a', borderRadius: 4, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
            labelStyle={{ color: '#c8a55a' }}
          />
          <ReferenceLine y={8} stroke="#cc222233" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="tni" stroke="#ef4444" strokeWidth={2} dot={false} name="TNI" />
          <Line type="monotone" dataKey="defcon" stroke="#3b82f6" strokeWidth={2} dot={false} name="DEFCON" />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-3 mt-1">
        <span className="text-xs flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px' }}>
          <span className="w-4 h-0.5 inline-block" style={{ backgroundColor: '#ef4444' }} /> TNI
        </span>
        <span className="text-xs flex items-center gap-1" style={{ color: '#3b82f6', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px' }}>
          <span className="w-4 h-0.5 inline-block" style={{ backgroundColor: '#3b82f6' }} /> DEFCON
        </span>
      </div>
    </div>
  );
}

// ── Sidebar principale ───────────────────────────────────────────────
export function Sidebar() {
  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      <ScorePanel />
      <AlertPanel />
      <TrackMiniGrid />
      <ProjectionChart />
    </div>
  );
}
