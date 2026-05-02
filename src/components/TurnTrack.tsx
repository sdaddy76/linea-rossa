// =============================================
// LINEA ROSSA — Tracciata Turni
// Conta gli spazi avanzati dal segnalino turno.
// Limite: 40 (breve) / 70 (media) / 100 (lunga)
// =============================================
import type { Faction } from '@/types/game';

const FACTION_FLAGS: Record<string, string> = {
  Iran: '🇮🇷', Coalizione: '🏳️', Russia: '🇷🇺', Cina: '🇨🇳', Europa: '🇪🇺',
};
const FACTION_COLORS: Record<string, string> = {
  Iran: '#22c55e', Coalizione: '#3b82f6', Russia: '#ef4444', Cina: '#f59e0b', Europa: '#8b5cf6',
};

interface TurnTrackProps {
  position: number;           // posizione attuale segnalino (0–trackLimit)
  trackLimit: number;         // 40 | 70 | 100
  gameLength: 'breve' | 'media' | 'lunga';
  currentTurnOrder?: Faction[] | null;
  currentAdvancers?: Faction[] | null;
  compact?: boolean;
}

const GAME_LENGTH_LABELS: Record<string, { label: string; color: string }> = {
  breve: { label: '⚡ Breve', color: '#f97316' },
  media: { label: '⚖️ Media', color: '#f59e0b' },
  lunga: { label: '🕰️ Lunga', color: '#22c55e' },
};

export function TurnTrack({
  position, trackLimit, gameLength,
  currentTurnOrder, currentAdvancers, compact = false,
}: TurnTrackProps) {
  const pct = Math.min(100, (position / trackLimit) * 100);
  const remaining = Math.max(0, trackLimit - position);
  const lengthInfo = GAME_LENGTH_LABELS[gameLength] ?? GAME_LENGTH_LABELS.media;

  // Segmenti visuali: raggruppa in blocchi da 10
  const segments = Math.ceil(trackLimit / 10);

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d1424] border border-[#1e3a5f]">
        <span className="text-[10px] font-mono text-[#8899aa]">📍</span>
        <div className="flex-1 h-2 rounded-full bg-[#1e2a3a] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: pct > 80 ? '#ef4444' : pct > 60 ? '#f97316' : '#00ff88',
            }}
          />
        </div>
        <span className="text-[10px] font-mono font-bold"
          style={{ color: pct > 80 ? '#ef4444' : '#00ff88' }}>
          {position}/{trackLimit}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#1e3a5f] bg-[#0d1424] p-4 space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">⏱️</span>
          <span className="font-mono text-xs font-bold text-white">Tracciata Turni</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold"
            style={{ color: lengthInfo.color, backgroundColor: `${lengthInfo.color}20`, border: `1px solid ${lengthInfo.color}40` }}>
            {lengthInfo.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#445566]">rimangono</span>
          <span className="font-mono text-lg font-bold"
            style={{ color: remaining <= 10 ? '#ef4444' : remaining <= 20 ? '#f97316' : '#00ff88' }}>
            {remaining}
          </span>
          <span className="text-[10px] font-mono text-[#334455]">/ {trackLimit}</span>
        </div>
      </div>

      {/* Barra principale */}
      <div className="relative h-5 rounded-full bg-[#0a0e1a] border border-[#1e2a3a] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: pct > 80
              ? 'linear-gradient(90deg,#ef4444,#991b1b)'
              : pct > 60
              ? 'linear-gradient(90deg,#f97316,#c2410c)'
              : 'linear-gradient(90deg,#00ff88,#00cc66)',
          }}
        />
        {/* Segnalino posizione */}
        <div
          className="absolute top-0 bottom-0 flex items-center"
          style={{ left: `${Math.min(pct, 97)}%`, transform: 'translateX(-50%)' }}>
          <div className="w-3 h-5 rounded-sm bg-white shadow-lg" style={{ boxShadow: '0 0 6px rgba(255,255,255,0.6)' }} />
        </div>
      </div>

      {/* Segmenti numerati (ogni 10) */}
      <div className="flex items-center justify-between px-1">
        {Array.from({ length: segments + 1 }, (_, i) => i * 10).filter(n => n <= trackLimit).map(n => (
          <div key={n} className="flex flex-col items-center">
            <div className="w-px h-2 bg-[#1e3a5f]" />
            <span className="text-[8px] font-mono text-[#334455]">{n}</span>
          </div>
        ))}
      </div>

      {/* Ordine turno corrente (dalla carta evento estratta) */}
      {currentTurnOrder && currentTurnOrder.length > 0 && (
        <div className="rounded-lg border border-[#1e3a5f] bg-[#060a10] p-2.5">
          <p className="text-[9px] font-mono text-[#445566] uppercase tracking-widest mb-1.5">
            Ordine turno (carta evento)
          </p>
          <div className="flex items-center gap-1">
            {currentTurnOrder.map((faction, idx) => {
              const isAdvancer = currentAdvancers?.includes(faction) ?? false;
              return (
                <div key={faction} className="flex items-center gap-0.5">
                  {idx > 0 && <span className="text-[#1e3a5f] text-xs">›</span>}
                  <div
                    className={`flex flex-col items-center px-1.5 py-1 rounded ${isAdvancer ? 'ring-1' : ''}`}
                    style={{
                      backgroundColor: isAdvancer ? `${FACTION_COLORS[faction]}20` : 'transparent',
                      ringColor: isAdvancer ? FACTION_COLORS[faction] : 'transparent',
                      border: isAdvancer ? `1px solid ${FACTION_COLORS[faction]}66` : '1px solid transparent',
                    }}>
                    <span className="text-base leading-none">{FACTION_FLAGS[faction]}</span>
                    <span className="text-[7px] font-mono mt-0.5"
                      style={{ color: isAdvancer ? FACTION_COLORS[faction] : '#334455' }}>
                      {idx + 1}°{isAdvancer ? ' ⬆' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {currentAdvancers && currentAdvancers.length > 0 && (
            <p className="text-[8px] font-mono text-[#445566] mt-1.5">
              ⬆ = avanza segnalino (valore OP carta giocata)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
