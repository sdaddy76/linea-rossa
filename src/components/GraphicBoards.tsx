import type { Faction, GameState } from '@/types/game';
import type { TerritoryState } from '@/components/TerritoryMap';
import { FACTION_COLORS, FACTION_FLAGS } from '@/lib/factionColors';
import { UNIT_MAP } from '@/lib/territoriesData';
import type { UnitType } from '@/lib/territoriesData';

const MAIN_BOARD_ASSET = '/assets/linea-rossa/plancia-generale-alleanze.png';

const FACTION_BOARD_ASSETS: Record<Faction, string> = {
  Iran: '/assets/linea-rossa/plancia-iran-costi.png',
  Coalizione: '/assets/linea-rossa/plancia-coalizione-costi.png',
  Europa: '/assets/linea-rossa/plancia-europa-costi.png',
  Russia: '/assets/linea-rossa/plancia-russia-costi.png',
  Cina: '/assets/linea-rossa/plancia-cina-costi.png',
};

const TERRITORY_SPOTS: Record<string, { left: number; top: number }> = {
  // Coordinate centrate sulle file dei quadrati influenza stampate sulla plancia.
  Turchia: { left: 30, top: 29 },
  Siria: { left: 44, top: 39 },
  Libano: { left: 30, top: 45 },
  Israele: { left: 35, top: 54 },
  Giordania: { left: 45, top: 53 },
  Egitto: { left: 28, top: 68 },
  Iraq: { left: 57, top: 39 },
  Iran: { left: 77, top: 43 },
  Kuwait: { left: 70, top: 55 },
  Bahrain: { left: 76, top: 63 },
  Qatar: { left: 80, top: 67 },
  'EmiratiArabi': { left: 72, top: 76 },
  Oman: { left: 85, top: 81 },
  ArabiaSaudita: { left: 55, top: 69 },
  StrettoHormuz: { left: 87, top: 64 },
  Yemen: { left: 61, top: 87 },
};

type TrackTokenConfig = {
  label: string;
  icon: string;
  color: string;
  min: number;
  max: number;
  left: (value: number) => number;
  top: (value: number) => number;
};

// Coordinate percentuali riferite alla grafica della plancia generale.
// I tracciati sono già stampati sull'immagine: qui si muove solo il token.
const TRACK_TOKEN_CONFIG: TrackTokenConfig[] = [
  {
    label: 'Nucleare iraniano',
    icon: '☢️',
    color: '#facc15',
    min: 1,
    max: 15,
    left: () => 8.9,
    top: value => 78 - ((value - 1) / 14) * 56,
  },
  {
    label: 'Sanzioni / Stabilità',
    icon: '💰',
    color: '#fb923c',
    min: 1,
    max: 10,
    left: () => 89.1,
    top: value => 51 - ((value - 1) / 9) * 24,
  },
  {
    label: 'DEFCON',
    icon: '⚔️',
    color: '#ef4444',
    min: 1,
    max: 10,
    left: () => 89.1,
    top: value => 55 + ((value - 1) / 9) * 24,
  },
  {
    label: 'Opinione globale',
    icon: '🌐',
    color: '#a78bfa',
    min: -10,
    max: 10,
    left: value => 17 + ((value + 10) / 20) * 66,
    top: () => 92.1,
  },
];

const FACTIONS: Faction[] = ['Iran', 'Coalizione', 'Russia', 'Cina', 'Europa'];

const shortFaction: Record<Faction, string> = {
  Iran: 'IR',
  Coalizione: 'CO',
  Russia: 'RU',
  Cina: 'CN',
  Europa: 'EU',
};

function readTrack(gameState: GameState, key: keyof GameState, fallback: number) {
  const value = gameState[key];
  return typeof value === 'number' ? value : fallback;
}

function TerritoryMarker({
  territory,
  state,
  selected,
  onSelect,
}: {
  territory: string;
  state: TerritoryState[string] | undefined;
  selected?: boolean;
  onSelect?: (territory: string) => void;
}) {
  const spot = TERRITORY_SPOTS[territory];
  if (!spot) return null;

  const influences = state?.influences ?? {};
  const entries = FACTIONS
    .map(faction => ({ faction, count: influences[faction] ?? 0 }))
    .filter(entry => entry.count > 0);
  const unitEntries = FACTIONS.flatMap(faction =>
    Object.entries(state?.units?.[faction] ?? {})
      .filter(([, quantity]) => Number(quantity) > 0)
      .map(([unitType, quantity]) => ({
        faction,
        unitType: unitType as UnitType,
        quantity: Number(quantity),
        definition: UNIT_MAP[unitType as UnitType],
      })),
  ).filter(entry => entry.definition);

  return (
    <button
      type="button"
      aria-label={`Seleziona ${territory}`}
      onClick={() => onSelect?.(territory)}
      className={`absolute z-20 flex min-h-8 min-w-14 max-w-[132px] -translate-x-1/2 -translate-y-1/2 flex-wrap items-center justify-center gap-0.5 rounded-md border px-1 py-0.5 shadow-lg backdrop-blur-sm transition-all ${
        selected ? 'scale-110 ring-2 ring-[#00ff88]' : 'hover:scale-110'
      }`}
      style={{
        left: `${spot.left}%`,
        top: `${spot.top}%`,
        background: entries.length || unitEntries.length ? '#050b14e8' : '#050b1466',
        borderColor: selected ? '#00ff88' : '#ffffff66',
      }}
      title={`${territory}: ${entries.map(e => `${e.faction} ${e.count}`).join(' · ')}${unitEntries.length ? ` · ${unitEntries.map(e => `${e.definition?.label} ×${e.quantity}`).join(' · ')}` : ''}`}
    >
      {!entries.length && !unitEntries.length && (
        <span className="font-mono text-[8px] font-bold text-white/70">{territory}</span>
      )}
      {entries.map(({ faction, count }) => (
        <span
          key={faction}
          className="inline-flex h-4 min-w-4 items-center justify-center rounded px-0.5 text-[8px] font-black leading-none text-white"
          style={{ backgroundColor: FACTION_COLORS[faction] ?? '#64748b' }}
        >
          {shortFaction[faction]}{count > 1 ? `×${count}` : ''}
        </span>
      ))}
      {unitEntries.map(({ faction, unitType, quantity, definition }) => (
        <span
          key={`${territory}-${faction}-${unitType}`}
          className="inline-flex h-4 items-center gap-0.5 rounded border px-1 text-[8px] font-black leading-none text-white"
          style={{
            borderColor: `${FACTION_COLORS[faction] ?? '#64748b'}cc`,
            backgroundColor: `${FACTION_COLORS[faction] ?? '#64748b'}55`,
          }}
        >
          <span aria-hidden="true">{definition?.icon}</span>
          <span>{quantity > 1 ? `×${quantity}` : ''}</span>
        </span>
      ))}
    </button>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      className="rounded-lg border bg-[#060d18]/90 px-2.5 py-1.5 shadow-lg backdrop-blur-sm"
      style={{ borderColor: `${color}80` }}
    >
      <div className="text-[8px] font-mono uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="font-mono text-sm font-black leading-none" style={{ color }}>{value}</div>
    </div>
  );
}

function TrackToken({ config, value }: { config: TrackTokenConfig; value: number }) {
  const clamped = Math.max(config.min, Math.min(config.max, value));
  return (
    <div
      className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${config.left(clamped)}%`, top: `${config.top(clamped)}%` }}
      title={`${config.label}: ${clamped}`}
    >
      <div
        className="flex h-7 min-w-7 items-center justify-center rounded-full border-2 bg-[#050b14]/95 px-1 text-[12px] shadow-[0_0_14px_rgba(0,0,0,0.8)]"
        style={{ borderColor: config.color, boxShadow: `0 0 14px ${config.color}aa` }}
      >
        <span aria-hidden="true">{config.icon}</span>
      </div>
      <div
        className="mt-0.5 rounded border bg-[#050b14]/95 px-1 py-0.5 text-center font-mono text-[7px] font-black leading-none"
        style={{ color: config.color, borderColor: `${config.color}99` }}
      >
        {clamped}
      </div>
    </div>
  );
}

function TurnToken({ position, limit }: { position: number; limit: number }) {
  const normalized = Math.max(0, Math.min(99, ((position || 0) / Math.max(1, limit - 1)) * 99));
  let left = 4;
  let top = 3;
  if (normalized <= 25) {
    left = 4 + (normalized / 25) * 88;
    top = 3;
  } else if (normalized <= 50) {
    left = 92;
    top = 3 + ((normalized - 25) / 25) * 84;
  } else if (normalized <= 75) {
    left = 92 - ((normalized - 50) / 25) * 88;
    top = 87;
  } else {
    left = 4;
    top = 87 - ((normalized - 75) / 24) * 84;
  }

  return (
    <div
      className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${left}%`, top: `${top}%` }}
      title={`Tracciato turni: ${position}/${limit}`}
    >
      <div className="flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-[#38bdf8] bg-[#07101de8] px-1 font-mono text-[9px] font-black text-[#38bdf8] shadow-[0_0_14px_rgba(56,189,248,0.75)]">
        {position}
      </div>
    </div>
  );
}

export function GraphicMainBoard({
  territories,
  gameState,
  trackPosition,
  trackLimit,
  selectedTerritory,
  onSelectTerritory,
}: {
  territories: TerritoryState;
  gameState: GameState;
  trackPosition?: number;
  trackLimit?: number;
  selectedTerritory?: string | null;
  onSelectTerritory?: (territory: string) => void;
}) {
  const turn = trackPosition ?? 0;
  const limit = trackLimit ?? 70;
  const nuclear = readTrack(gameState, 'nucleare', 1);
  const sanctions = readTrack(gameState, 'sanzioni', 1);
  const defcon = readTrack(gameState, 'defcon', 10);
  const opinion = readTrack(gameState, 'opinione', 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#334155] bg-[#050b14] shadow-2xl shadow-black/40">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e3a5f] bg-[#091321] px-3 py-2">
        <div>
          <div className="font-mono text-xs font-black uppercase tracking-[0.16em] text-white">Plancia generale</div>
          <div className="font-mono text-[10px] text-slate-500">Grafica Linea Rossa · stato dinamico della partita</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <StatPill label="Turno" value={`${turn}/${limit}`} color="#38bdf8" />
          <StatPill label="Nucleare" value={nuclear} color="#facc15" />
          <StatPill label="Sanzioni" value={sanctions} color="#fb923c" />
          <StatPill label="DEFCON" value={defcon} color="#ef4444" />
          <StatPill label="Opinione" value={opinion > 0 ? `+${opinion}` : opinion} color="#a78bfa" />
        </div>
      </div>

      <div className="relative w-full bg-black">
        <img
          src={MAIN_BOARD_ASSET}
          alt="Plancia generale Linea Rossa con alleanze, tracciati e territori"
          className="block h-auto w-full"
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0">
          <TurnToken position={turn} limit={limit} />
          {TRACK_TOKEN_CONFIG.map(config => {
            const value = config.label.startsWith('Nucleare')
              ? nuclear
              : config.label.startsWith('Sanzioni')
                ? sanctions
                : config.label === 'DEFCON'
                  ? defcon
                  : opinion;
            return <TrackToken key={config.label} config={config} value={value} />;
          })}
        </div>
        <div className="absolute inset-0">
          {Object.keys(TERRITORY_SPOTS).map(territory => (
            <TerritoryMarker
              key={territory}
              territory={territory}
              state={territories[territory]}
              selected={selectedTerritory === territory}
              onSelect={onSelectTerritory}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-[#1e3a5f] bg-[#07101d] px-3 py-2">
        <span className="font-mono text-[9px] text-slate-500">
          Clicca sui quadrati influenza della plancia per selezionare uno stato e usarlo nell’azione OP.
        </span>
        {selectedTerritory && (
          <span className="shrink-0 rounded border border-[#00ff88] bg-[#00ff8815] px-2 py-1 font-mono text-[9px] font-bold text-[#00ff88]">
            STATO: {selectedTerritory}
          </span>
        )}
      </div>
    </section>
  );
}

export function GraphicFactionBoard({
  faction,
  gameState,
}: {
  faction: Faction;
  gameState: GameState;
}) {
  const color = FACTION_COLORS[faction] ?? '#94a3b8';
  const flag = FACTION_FLAGS[faction] ?? '🎭';

  return (
    <section
      className="overflow-hidden rounded-xl border bg-[#050b14] shadow-xl shadow-black/20"
      style={{ borderColor: `${color}66` }}
    >
      <div className="flex items-center justify-between gap-2 border-b bg-[#091321] px-2.5 py-1.5" style={{ borderColor: `${color}33` }}>
        <div className="flex items-center gap-1.5">
          <span className="text-base">{flag}</span>
          <span className="font-mono text-[11px] font-black uppercase tracking-[0.12em]" style={{ color }}>
            Plancia {faction}
          </span>
        </div>
        <span className="rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold" style={{ color, borderColor: `${color}66` }}>
          TRACCIATI LIVE
        </span>
      </div>
      <div className="bg-black p-1.5">
        <img
          src={FACTION_BOARD_ASSETS[faction]}
          alt={`Plancia fazione ${faction}`}
          className="block h-auto w-full"
          draggable={false}
        />
      </div>
      <div className="grid grid-cols-2 gap-1 border-t border-[#1e3a5f] bg-[#07101d] p-2 sm:grid-cols-3">
        <FactionSnapshot faction={faction} gameState={gameState} />
      </div>
    </section>
  );
}

function FactionSnapshot({ faction, gameState }: { faction: Faction; gameState: GameState }) {
  const keysByFaction: Record<Faction, Array<[string, keyof GameState]>> = {
    Iran: [['Risorse', 'risorse_iran'], ['Forze', 'forze_militari_iran'], ['Stabilità', 'stabilita_iran']],
    Coalizione: [['Risorse', 'risorse_coalizione'], ['Influenza', 'influenza_diplomatica_coalizione'], ['Tecnologia', 'tecnologia_avanzata_coalizione']],
    Russia: [['Energia', 'risorse_russia'], ['Influenza', 'influenza_militare_russia'], ['Veto ONU', 'veto_onu_russia']],
    Cina: [['Economia', 'risorse_cina'], ['Commercio', 'influenza_commerciale_cina'], ['Cyber', 'cyber_warfare_cina']],
    Europa: [['Energia', 'risorse_europa'], ['Diplomazia', 'influenza_diplomatica_europa'], ['Aiuti', 'aiuti_umanitari_europa']],
  };
  const color = FACTION_COLORS[faction] ?? '#94a3b8';

  return (
    <>
      {keysByFaction[faction].map(([label, key]) => (
        <div key={key} className="rounded border border-[#1e3a5f] bg-[#0a1422] px-2 py-1">
          <div className="truncate font-mono text-[8px] uppercase tracking-wide text-slate-500">{label}</div>
          <div className="font-mono text-xs font-bold" style={{ color }}>{readTrack(gameState, key, 0)}</div>
        </div>
      ))}
    </>
  );
}

export { FACTION_BOARD_ASSETS };
