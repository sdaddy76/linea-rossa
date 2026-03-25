import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tracciato, ZonaTracciato } from '@/data/tracciati';
import { ZONA_COLORS } from '@/lib/colors';

interface TrackSegmentProps {
  zona: ZonaTracciato;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
  widthPct: number;
  label?: string;
}

function TrackSegment({ zona, isActive, isSelected, onClick, widthPct, label }: TrackSegmentProps) {
  const [hovered, setHovered] = useState(false);
  const colors = ZONA_COLORS[zona.colore];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative cursor-pointer transition-all duration-200 flex flex-col items-center"
      style={{
        width: `${widthPct}%`,
        minWidth: '2px',
      }}
      title={zona.label}
    >
      {/* Segmento barra */}
      <div
        className="h-10 w-full relative overflow-hidden transition-all duration-200"
        style={{
          backgroundColor: isSelected
            ? colors.text
            : hovered
              ? colors.segHover
              : colors.segBg,
          boxShadow: isSelected ? colors.glow : hovered ? `0 0 10px ${colors.text}55` : 'none',
          border: isSelected ? `1px solid ${colors.text}` : hovered ? `1px solid ${colors.text}88` : '1px solid transparent',
        }}
      >
        {/* Scan line effect */}
        {(isSelected || hovered) && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${colors.text}06 2px, ${colors.text}06 4px)`,
            }}
          />
        )}
        {/* Pulse per zone critiche */}
        {zona.colore === 'critical' && (
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: colors.text }}
            animate={{ opacity: [0, 0.12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>

      {/* Label sotto il segmento */}
      {label && (
        <span
          className="mt-1 text-center leading-tight select-none"
          style={{
            fontSize: '9px',
            color: isSelected ? colors.text : hovered ? colors.text : colors.text + '88',
            fontFamily: 'JetBrains Mono, monospace',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            transition: 'color 0.2s',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Pannello dettaglio zona selezionata
// ───────────────────────────────────────────────────────────────────
interface ZonaDetailProps {
  zona: ZonaTracciato;
  onClose: () => void;
}

function ZonaDetail({ zona, onClose }: ZonaDetailProps) {
  const colors = ZONA_COLORS[zona.colore];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="mt-3 rounded border p-4 relative"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        boxShadow: colors.glow,
      }}
    >
      {/* Chiudi */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded text-xs transition-colors hover:bg-white/10"
        style={{ color: '#7a8a9a', fontFamily: 'JetBrains Mono, monospace' }}
        aria-label="Chiudi pannello"
      >
        ✕
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-4 pr-6">
        <span className="text-2xl leading-none mt-0.5">{zona.icona}</span>
        <div>
          <h3
            className="font-bold text-base tracking-wide leading-tight"
            style={{ color: colors.text, fontFamily: 'Share Tech Mono, monospace' }}
          >
            {zona.label}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: '#7a8a9a', fontFamily: 'JetBrains Mono, monospace' }}>
            {zona.sottotitolo}
          </p>
        </div>
      </div>

      {/* Range */}
      <div className="mb-3 inline-block px-2 py-0.5 rounded text-xs" style={{ backgroundColor: colors.badge, color: colors.badgeText, fontFamily: 'JetBrains Mono, monospace' }}>
        LIVELLI {zona.da === zona.a ? zona.da : `${zona.da} → ${zona.a}`}
      </div>

      {/* Scenario */}
      <p className="text-xs mb-4 leading-relaxed" style={{ color: '#c5cdd8' }}>
        {zona.scenario}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Carte chiave */}
        <DetailBlock
          titolo="🃏 Carte Chiave Attivate"
          colore={colors.text}
          borderColore={colors.border}
        >
          <ul className="space-y-1">
            {zona.carteChiave.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: '#b0bec5' }}>
                <span style={{ color: colors.badgeText, flexShrink: 0 }}>›</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </DetailBlock>

        {/* Condizioni vittoria */}
        <DetailBlock
          titolo="🏆 Condizioni Vittoria / Sconfitta"
          colore={colors.text}
          borderColore={colors.border}
        >
          <p className="text-xs leading-relaxed" style={{ color: '#b0bec5' }}>
            {zona.condizioniVittoria}
          </p>
        </DetailBlock>

        {/* Impatto Iran */}
        <DetailBlock
          titolo="🇮🇷 Impatto su Iran"
          colore="#4ade80"
          borderColore="rgba(74,222,128,0.3)"
        >
          <p className="text-xs leading-relaxed" style={{ color: '#b0bec5' }}>
            {zona.costoIran}
          </p>
        </DetailBlock>

        {/* Impatto Coalizione */}
        <DetailBlock
          titolo="🌐 Impatto su Coalizione"
          colore="#60a5fa"
          borderColore="rgba(96,165,250,0.3)"
        >
          <p className="text-xs leading-relaxed" style={{ color: '#b0bec5' }}>
            {zona.costoCoalizione}
          </p>
        </DetailBlock>
      </div>

      {/* Note strategiche */}
      <div
        className="mt-3 p-3 rounded border-l-2 text-xs leading-relaxed"
        style={{
          backgroundColor: 'rgba(200,165,90,0.08)',
          borderLeftColor: '#c8a55a',
          color: '#c8a55a',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        <span className="font-bold">⚡ NOTA STRATEGICA: </span>
        {zona.noteStrategiche}
      </div>
    </motion.div>
  );
}

interface DetailBlockProps {
  titolo: string;
  colore: string;
  borderColore: string;
  children: React.ReactNode;
}

function DetailBlock({ titolo, colore, borderColore, children }: DetailBlockProps) {
  return (
    <div
      className="p-3 rounded border"
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: borderColore,
      }}
    >
      <p className="text-xs font-bold mb-2" style={{ color: colore, fontFamily: 'Share Tech Mono, monospace' }}>
        {titolo}
      </p>
      {children}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// TrackCard principale
// ───────────────────────────────────────────────────────────────────
interface TrackCardProps {
  tracciato: Tracciato;
}

export function TrackCard({ tracciato }: TrackCardProps) {
  const [selectedZona, setSelectedZona] = useState<ZonaTracciato | null>(null);

  const handleZonaClick = useCallback((zona: ZonaTracciato) => {
    setSelectedZona(prev => (prev?.da === zona.da ? null : zona));
  }, []);

  const totalRange = tracciato.max - tracciato.min;
  const totalRange2 = totalRange === 0 ? 1 : totalRange;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="rounded border p-4"
      style={{
        backgroundColor: '#0d1117',
        borderColor: '#1e2a3a',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header tracciato */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{tracciato.icona}</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm tracking-wider" style={{ color: '#e8e4d8', fontFamily: 'Share Tech Mono, monospace' }}>
                {tracciato.nome.toUpperCase()}
              </h2>
              <span
                className="px-2 py-0.5 rounded text-xs font-bold"
                style={{ backgroundColor: 'rgba(200,165,90,0.15)', color: '#c8a55a', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {tracciato.sigla}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: '#4a5a6a', fontFamily: 'JetBrains Mono, monospace' }}>
              {tracciato.descrizione}
            </p>
          </div>
        </div>
        {/* Range */}
        <div className="text-right">
          <span className="text-xs" style={{ color: '#4a5a6a', fontFamily: 'JetBrains Mono, monospace' }}>
            {tracciato.min} — {tracciato.max}
          </span>
        </div>
      </div>

      {/* Direzioni */}
      <div className="flex items-center justify-between mb-3 text-xs gap-2">
        <div className="flex items-center gap-1.5" style={{ color: '#4ade80' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>🇮🇷</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{tracciato.direzioneIran}</span>
        </div>
        <div className="w-px h-4 bg-white/10 flex-shrink-0" />
        <div className="flex items-center gap-1.5 text-right" style={{ color: '#60a5fa' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{tracciato.direzioneCoalizione}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>🌐</span>
        </div>
      </div>

      {/* Separatore */}
      <div className="mb-3 h-px" style={{ background: 'linear-gradient(90deg, transparent, #1e2a3a, transparent)' }} />

      {/* Barra tracciato con segmenti */}
      <div className="mb-1">
        {/* Scala numerica sopra */}
        <div className="flex items-end mb-1">
          {tracciato.zone.map((zona) => {
            const zoneRange = zona.a - zona.da + 1;
            const widthPct = (zoneRange / totalRange2) * 100;
            const midVal = zona.da === zona.a ? zona.da : Math.round((zona.da + zona.a) / 2);
            return (
              <div key={zona.da} className="flex flex-col items-center" style={{ width: `${widthPct}%` }}>
                <span
                  className="text-center"
                  style={{
                    fontSize: '9px',
                    color: '#4a5a6a',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {midVal}
                </span>
              </div>
            );
          })}
        </div>

        {/* Barra segmentata */}
        <div className="flex gap-0.5 items-stretch">
          {tracciato.zone.map((zona) => {
            const zoneRange = zona.a - zona.da + 1;
            const widthPct = (zoneRange / totalRange2) * 100;
            return (
              <TrackSegment
                key={zona.da}
                zona={zona}
                isActive={false}
                isSelected={selectedZona?.da === zona.da}
                onClick={() => handleZonaClick(zona)}
                widthPct={widthPct}
                label={zona.da === zona.a ? `${zona.da}` : `${zona.da}-${zona.a}`}
              />
            );
          })}
        </div>
      </div>

      {/* Legenda zone compatta */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {tracciato.zone.map((zona) => {
          const colors = ZONA_COLORS[zona.colore];
          const isSelected = selectedZona?.da === zona.da;
          return (
            <button
              key={zona.da}
              onClick={() => handleZonaClick(zona)}
              className="px-2 py-0.5 rounded text-xs transition-all duration-150 border"
              style={{
                backgroundColor: isSelected ? colors.badge : 'transparent',
                borderColor: isSelected ? colors.text : colors.border,
                color: isSelected ? colors.text : colors.text + '88',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                boxShadow: isSelected ? colors.glow : 'none',
              }}
            >
              {zona.icona} {zona.label}
            </button>
          );
        })}
      </div>

      {/* Pannello dettaglio */}
      <AnimatePresence>
        {selectedZona && (
          <ZonaDetail zona={selectedZona} onClose={() => setSelectedZona(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default TrackCard;
