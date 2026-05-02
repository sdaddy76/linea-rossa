// =============================================
// LINEA ROSSA — EventoModal
// Modale che appare all'inizio del turno Iran
// mostrando la carta evento pescata.
// Include: ordine turno variabile + segnalino avanzatori.
// =============================================
import { useEffect, useState } from 'react';
import type { EventoCard } from '@/data/eventi';
import { CATEGORY_COLORS, CATEGORY_ICONS, SEVERITY_COLORS } from '@/data/eventi';

const FACTION_FLAGS: Record<string, string> = {
  Iran: '🇮🇷', Coalizione: '🏳️', Russia: '🇷🇺', Cina: '🇨🇳', Europa: '🇪🇺',
};
const FACTION_COLORS: Record<string, string> = {
  Iran: '#22c55e', Coalizione: '#3b82f6', Russia: '#ef4444', Cina: '#f59e0b', Europa: '#8b5cf6',
};
const FACTION_SHORT: Record<string, string> = {
  Iran: 'IR', Coalizione: 'CO', Russia: 'RU', Cina: 'CN', Europa: 'EU',
};

interface EventoModalProps {
  evento: EventoCard;
  onConfirm: () => void;        // conferma e applica gli effetti
  isMyTurn: boolean;
  currentFaction: string;
}

// ─── Delta pill ───────────────────────────────────────────────────────────────
function DeltaPill({ icon, label, value }: { icon: string; label: string; value: number }) {
  if (value === 0) return null;
  const pos = value > 0;
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
      style={{
        backgroundColor: pos ? '#22c55e15' : '#ef444415',
        border: `1px solid ${pos ? '#22c55e40' : '#ef444440'}`,
      }}>
      <span className="text-sm">{icon}</span>
      <span className="font-mono text-xs text-[#8899aa]">{label}</span>
      <span className="font-mono text-sm font-bold" style={{ color: pos ? '#22c55e' : '#ef4444' }}>
        {pos ? '+' : ''}{value}
      </span>
    </div>
  );
}

export default function EventoModal({ evento, onConfirm, isMyTurn, currentFaction }: EventoModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const catColor  = CATEGORY_COLORS[evento.category]  ?? '#f97316';
  const sevColor  = SEVERITY_COLORS[evento.severity]  ?? '#f59e0b';
  const catIcon   = CATEGORY_ICONS[evento.category]   ?? '🎴';

  // Animazione ingresso
  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const ef = evento.effects;
  const deltas: { icon: string; label: string; value: number }[] = [
    { icon: '☢️',  label: 'Nucleare',  value: ef.delta_nucleare ?? 0 },
    { icon: '💰',  label: 'Sanzioni',  value: ef.delta_sanzioni ?? 0 },
    { icon: '📣',  label: 'Opinione',  value: ef.delta_opinione ?? 0 },
    { icon: '🚨',  label: 'DEFCON',    value: ef.delta_defcon ?? 0 },
    { icon: '🇮🇷',  label: 'Ris. Iran', value: ef.delta_risorse_iran ?? 0 },
    { icon: '🏳️',  label: 'Ris. Coal.', value: ef.delta_risorse_coalizione ?? 0 },
    { icon: '🇷🇺',  label: 'Ris. Russia', value: ef.delta_risorse_russia ?? 0 },
    { icon: '🇨🇳',  label: 'Ris. Cina', value: ef.delta_risorse_cina ?? 0 },
    { icon: '🇪🇺',  label: 'Ris. Europa', value: ef.delta_risorse_europa ?? 0 },
    { icon: '⚖️',  label: 'Stab. Iran', value: ef.delta_stabilita_iran ?? 0 },
  ].filter(d => d.value !== 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <div
        className="w-full max-w-lg transition-all duration-500"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(20px)',
        }}>
        {/* Card evento */}
        <div className="rounded-2xl overflow-hidden shadow-2xl"
          style={{
            border: `2px solid ${catColor}66`,
            backgroundColor: '#0d1424',
            boxShadow: `0 0 40px ${catColor}30`,
          }}>

          {/* ── Header categoria / gravità ── */}
          <div className="px-5 pt-5 pb-3 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${catColor}22` }}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{catIcon}</span>
              <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest"
                  style={{ color: catColor }}>
                  {evento.category} · Carta Evento
                </p>
                <p className="text-[10px] font-mono text-[#556677]">
                  ☢️ Turno {currentFaction} — evento pescato
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg"
              style={{
                color: sevColor,
                backgroundColor: `${sevColor}20`,
                border: `1px solid ${sevColor}40`,
              }}>
              {evento.severity === 'critical' ? '🔴 CRITICO' :
               evento.severity === 'high'     ? '🟠 ALTO' :
               evento.severity === 'medium'   ? '🟡 MEDIO' : '🟢 BASSO'}
            </span>
          </div>

          {/* ── Ordine turno variabile (nuovo) ── */}
          {evento.turn_order && evento.turn_order.length > 0 && (
            <div className="px-5 py-3 border-b"
              style={{ borderColor: `${catColor}22`, backgroundColor: '#06090f' }}>
              <p className="text-[9px] font-mono font-bold text-[#445566] uppercase tracking-widest mb-2">
                🔀 Ordine di Turno — questo round
              </p>
              <div className="flex items-center gap-1 flex-wrap">
                {evento.turn_order.map((faction, idx) => {
                  const isAdvancer = evento.turn_advancers?.includes(faction) ?? false;
                  return (
                    <div key={faction} className="flex items-center gap-0.5">
                      {idx > 0 && <span className="text-[#1e3a5f] text-sm font-bold">→</span>}
                      <div
                        className="flex flex-col items-center px-2 py-1.5 rounded-lg min-w-[44px]"
                        style={{
                          backgroundColor: isAdvancer ? `${FACTION_COLORS[faction]}25` : '#0d1424',
                          border: `1px solid ${isAdvancer ? FACTION_COLORS[faction] : '#1e2a3a'}`,
                          boxShadow: isAdvancer ? `0 0 8px ${FACTION_COLORS[faction]}40` : 'none',
                        }}>
                        <span className="text-lg leading-none">{FACTION_FLAGS[faction]}</span>
                        <span className="text-[8px] font-mono font-bold mt-0.5"
                          style={{ color: isAdvancer ? FACTION_COLORS[faction] : '#334455' }}>
                          {FACTION_SHORT[faction]} {idx + 1}°
                        </span>
                        {isAdvancer && (
                          <span className="text-[7px] font-mono mt-0.5 px-1 rounded"
                            style={{ backgroundColor: `${FACTION_COLORS[faction]}30`, color: FACTION_COLORS[faction] }}>
                            ⬆ AVANZA
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {evento.turn_advancers && evento.turn_advancers.length > 0 && (
                <p className="text-[9px] font-mono text-[#445566] mt-2">
                  ⬆ = avanza il segnalino turni di tanti spazi quanti sono gli OP della carta giocata
                </p>
              )}
            </div>
          )}

          {/* ── Corpo ── */}
          <div className="px-5 py-4 space-y-4">
            {/* ID + Nome */}
            <div>
              <p className="text-[11px] font-mono text-[#556677] mb-0.5">{evento.event_id}</p>
              <h2 className="text-xl font-black font-mono text-white leading-tight">
                {evento.event_name}
              </h2>
            </div>

            {/* Descrizione */}
            <div className="p-3 rounded-xl"
              style={{ backgroundColor: `${catColor}10`, border: `1px solid ${catColor}25` }}>
              <p className="font-mono text-sm text-[#c0cce0] leading-relaxed">
                {evento.description}
              </p>
              {evento.flavor_text && (
                <p className="font-mono text-[11px] text-[#556677] mt-2 italic">
                  {evento.flavor_text}
                </p>
              )}
            </div>

            {/* Effetti meccanici */}
            {deltas.length > 0 && (
              <div>
                <p className="text-[10px] font-mono font-bold text-[#8899aa] uppercase tracking-widest mb-2">
                  ⚙️ Effetti applicati automaticamente
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {deltas.map((d, i) => (
                    <DeltaPill key={i} {...d} />
                  ))}
                  {ef.blocca_avanzamento && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#f59e0b15] border border-[#f59e0b40]">
                      <span>⏸</span>
                      <span className="font-mono text-xs text-[#f59e0b]">Blocca avanzamento</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nessun effetto meccanico */}
            {deltas.length === 0 && !ef.blocca_avanzamento && (
              <div className="flex items-center gap-2 text-[#556677] font-mono text-xs">
                <span>📋</span>
                <span>Evento narrativo — nessun effetto meccanico automatico</span>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-5 pb-5 space-y-2">
            {/* Banner effetti già applicati */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#22c55e10] border border-[#22c55e30]">
              <span className="text-xs">✅</span>
              <p className="font-mono text-[10px] text-[#22c55e]">
                Effetti applicati automaticamente — il turno può iniziare
              </p>
            </div>
            <button
              onClick={onConfirm}
              className="w-full py-3 rounded-xl font-black font-mono text-sm tracking-wider
                transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${catColor}, ${catColor}aa)`,
                color: '#0a0e1a',
                boxShadow: `0 0 20px ${catColor}40`,
              }}>
              ▶ HO CAPITO — INIZIA IL TURNO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
