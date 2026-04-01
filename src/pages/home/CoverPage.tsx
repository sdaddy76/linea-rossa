// =============================================
// LINEA ROSSA — Copertina del gioco
// Prima schermata: titolo, ambientazione, accesso
// =============================================

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  onPlay: () => void;
}

interface LiveStats {
  partiteInCorso: number;
  partiteTerminate: number;
  giocatoriRegistrati: number;
  giocatoriOnline: number;
}

function useLiveStats(): LiveStats {
  const [stats, setStats] = useState<LiveStats>({
    partiteInCorso: 0, partiteTerminate: 0,
    giocatoriRegistrati: 0, giocatoriOnline: 0,
  });

  useEffect(() => {
    async function load() {
      const [active, finished, profiles] = await Promise.all([
        supabase.from('games').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('games').select('id', { count: 'exact', head: true }).eq('status', 'finished'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      // "Online ora" non disponibile senza colonna updated_at accessibile → non mostrare
      const onlineCount = 0;

      setStats({
        partiteInCorso:      active.count    ?? 0,
        partiteTerminate:    finished.count  ?? 0,
        giocatoriRegistrati: profiles.count  ?? 0,
        giocatoriOnline:     onlineCount,
      });
    }
    load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, []);

  return stats;
}

// ── Bandiera Coalizione: metà israeliana + metà americana ─────────────
function CoalizioneFlagSVG({ size = 64 }: { size?: number }) {
  const w = size * 1.5;
  const h = size;
  const half = w / 2;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}
      style={{ borderRadius: 4, overflow: 'hidden', display: 'block' }}>
      <defs>
        <clipPath id="left-half">
          <rect x={0} y={0} width={half} height={h} />
        </clipPath>
        <clipPath id="right-half">
          <rect x={half} y={0} width={half} height={h} />
        </clipPath>
      </defs>

      {/* ── Metà sinistra: Bandiera Israeliana ── */}
      <g clipPath="url(#left-half)">
        {/* Sfondo bianco */}
        <rect x={0} y={0} width={half} height={h} fill="#fff" />
        {/* Striscia blu superiore */}
        <rect x={0} y={h * 0.18} width={half} height={h * 0.13} fill="#0038b8" />
        {/* Striscia blu inferiore */}
        <rect x={0} y={h * 0.69} width={half} height={h * 0.13} fill="#0038b8" />
        {/* Stella di David (Magen David) */}
        <g transform={`translate(${half / 2}, ${h / 2})`}>
          {/* Triangolo su */}
          <polygon
            points={`0,${-h * 0.22} ${h * 0.19},${h * 0.11} ${-h * 0.19},${h * 0.11}`}
            fill="none" stroke="#0038b8" strokeWidth={h * 0.04}
          />
          {/* Triangolo giù */}
          <polygon
            points={`0,${h * 0.22} ${h * 0.19},${-h * 0.11} ${-h * 0.19},${-h * 0.11}`}
            fill="none" stroke="#0038b8" strokeWidth={h * 0.04}
          />
        </g>
      </g>

      {/* ── Metà destra: Bandiera Americana ── */}
      <g clipPath="url(#right-half)">
        {/* Strisce rosse e bianche (13 strisce) */}
        {Array.from({ length: 13 }, (_, i) => (
          <rect key={i}
            x={half} y={i * (h / 13)}
            width={half} height={h / 13}
            fill={i % 2 === 0 ? '#B22234' : '#fff'}
          />
        ))}
        {/* Canton blu */}
        <rect x={half} y={0} width={half * 0.54} height={h * (7 / 13)} fill="#3C3B6E" />
        {/* Stelle (semplificate) — 5×4 + 4×5 = 50 stelle */}
        {Array.from({ length: 9 }, (_, row) =>
          Array.from({ length: row % 2 === 0 ? 6 : 5 }, (_, col) => {
            const sx = half + (row % 2 === 0
              ? (col + 0.5) * (half * 0.54 / 6)
              : (col + 1) * (half * 0.54 / 6));
            const sy = (row + 0.5) * (h * (7 / 13) / 9);
            const r = h * 0.028;
            // stella a 5 punte
            const pts = Array.from({ length: 5 }, (_, k) => {
              const ang = (k * 4 * Math.PI / 5) - Math.PI / 2;
              return `${sx + r * Math.cos(ang)},${sy + r * Math.sin(ang)}`;
            }).join(' ');
            return <polygon key={`${row}-${col}`} points={pts} fill="#fff" />;
          })
        )}
      </g>

      {/* Linea di divisione centrale */}
      <line x1={half} y1={0} x2={half} y2={h} stroke="#00000030" strokeWidth={1} />
    </svg>
  );
}

// ── Bandiere fazioni ───────────────────────────────────────────────────
const FACTION_FLAGS = [
  { emoji: '🇮🇷', label: 'Iran',         color: '#ef4444', sub: 'Casa Iran' },
  { emoji: null,  label: 'Coalizione',   color: '#3b82f6', sub: 'USA · Israele' },
  { emoji: '🇷🇺', label: 'Russia',       color: '#a855f7', sub: '' },
  { emoji: '🇨🇳', label: 'Cina',         color: '#f59e0b', sub: '' },
  { emoji: '🇪🇺', label: 'Europa',       color: '#10b981', sub: '' },
];

export default function CoverPage({ onPlay }: Props) {
  const stats = useLiveStats();
  return (
    <div
      className="min-h-screen w-full flex flex-col relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 60% 40%, #0e1a2e 0%, #05080f 100%)' }}
    >
      {/* ── Griglia decorativa ── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />

      {/* ── Vignetta bordi ── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, #00000099 100%)' }} />

      {/* ── Linea decorativa in alto ── */}
      <div className="w-full h-px" style={{ background: 'linear-gradient(90deg, transparent, #ef4444, #3b82f6, transparent)' }} />

      {/* ── Contenuto principale ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative z-10">

        {/* Sottotitolo ambientazione */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, #ef4444)' }} />
          <span className="text-xs tracking-[0.35em] font-mono uppercase" style={{ color: '#ef444499' }}>
            Gioco di strategia geopolitica
          </span>
          <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, #ef4444, transparent)' }} />
        </div>

        {/* ── TITOLO ── */}
        <div className="text-center mb-4 select-none">
          <h1
            className="font-black tracking-[0.15em] leading-none"
            style={{
              fontSize: 'clamp(4rem, 12vw, 9rem)',
              fontFamily: 'monospace',
              color: '#fff',
              textShadow: '0 0 60px rgba(239,68,68,0.5), 0 0 120px rgba(239,68,68,0.2)',
              letterSpacing: '0.12em',
            }}>
            LINEA
          </h1>
          <h1
            className="font-black tracking-[0.15em] leading-none"
            style={{
              fontSize: 'clamp(4rem, 12vw, 9rem)',
              fontFamily: 'monospace',
              color: '#ef4444',
              textShadow: '0 0 60px rgba(239,68,68,0.8), 0 0 120px rgba(239,68,68,0.4)',
              letterSpacing: '0.12em',
            }}>
            ROSSA
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-center mb-12 max-w-lg font-mono"
          style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.7 }}>
          Il Medio Oriente è in fiamme. Cinque potenze si contendono il controllo
          di una regione al limite del collasso nucleare.
          <br />
          <span style={{ color: '#94a3b8' }}>Chi disegnerà la storia?</span>
        </p>

        {/* ── BANDIERE FAZIONI ── */}
        <div className="flex flex-wrap justify-center gap-6 mb-14">
          {FACTION_FLAGS.map(({ emoji, label, color, sub }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              {/* Bandiera */}
              <div
                className="rounded-lg overflow-hidden shadow-lg"
                style={{
                  boxShadow: `0 0 20px ${color}44`,
                  border: `2px solid ${color}66`,
                }}>
                {emoji ? (
                  <div style={{
                    width: 72, height: 48,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 36, background: '#0a0e1a',
                  }}>
                    {emoji}
                  </div>
                ) : (
                  <CoalizioneFlagSVG size={48} />
                )}
              </div>
              {/* Label */}
              <span className="text-xs font-mono font-bold tracking-widest uppercase"
                style={{ color }}>
                {label}
              </span>
              {sub && (
                <span className="text-xs font-mono" style={{ color: '#475569' }}>{sub}</span>
              )}
            </div>
          ))}
        </div>

        {/* ── PULSANTE GIOCA ── */}
        <button
          onClick={onPlay}
          className="group relative px-12 py-4 rounded-xl font-black tracking-widest text-sm font-mono
            transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
            color: '#fff',
            boxShadow: '0 0 40px rgba(239,68,68,0.4), 0 4px 20px rgba(0,0,0,0.5)',
            border: '1px solid #ef444488',
            letterSpacing: '0.25em',
          }}>
          ▶ &nbsp;INIZIA LA PARTITA
        </button>

        <p className="mt-4 text-xs font-mono" style={{ color: '#334155' }}>
          Multiplayer online · fino a 5 fazioni
        </p>

        {/* ── CONTATORI LIVE ── */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
          {[
            { label: 'Partite in corso',    value: stats.partiteInCorso,      icon: '⚔️',  color: '#ef4444' },
            { label: 'Partite terminate',   value: stats.partiteTerminate,    icon: '🏁',  color: '#64748b' },
            { label: 'Giocatori registrati',value: stats.giocatoriRegistrati, icon: '👤',  color: '#3b82f6' },
            { label: 'Online ora',          value: stats.giocatoriOnline,     icon: '🟢',  color: '#22c55e' },
          ].map(({ label, value, icon, color }) => (
            <div key={label}
              className="flex flex-col items-center gap-1 p-3 rounded-xl"
              style={{ background: '#0a0e1a', border: `1px solid ${color}33` }}>
              <span className="text-lg">{icon}</span>
              <span className="text-xl font-black font-mono" style={{ color }}>{value}</span>
              <span className="text-[10px] font-mono text-center leading-tight" style={{ color: '#475569' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Info versione ── */}
      <div className="w-full flex justify-between items-center px-6 py-3 relative z-10"
        style={{ borderTop: '1px solid #0f172a' }}>
        <span className="text-xs font-mono" style={{ color: '#1e293b' }}>☢️ LINEA ROSSA</span>
        <span className="text-xs font-mono" style={{ color: '#1e293b' }}>v1.0 · 2026</span>
      </div>
    </div>
  );
}
