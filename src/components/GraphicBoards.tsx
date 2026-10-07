import { useEffect, useState, type MouseEvent } from 'react';
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

export type AreaPoint = [number, number];
export type BoardAreas = Record<string, AreaPoint[]>;

export const BOARD_AREAS_STORAGE_KEY = 'linea-rossa-board-areas-v1';

// Coordinate definitive fornite dall'Admin per la grafica della plancia.
// Restano nel codice come configurazione condivisa; il localStorage può
// sovrascriverle temporaneamente durante le successive calibrazioni.
const DEFAULT_BOARD_AREAS: BoardAreas = {
  Turchia: [[19.45, 15.96], [36.16, 15.76], [40.08, 18.9], [44.65, 16.94], [49.48, 23.01], [43.08, 25.75], [37.6, 27.32], [34.6, 27.51], [32.64, 27.32], [30.29, 28.49], [26.37, 26.93], [22.06, 27.32], [19.19, 25.36], [19.32, 15.96]],
  Siria: [[31.59, 28.49], [33.94, 27.91], [37.6, 27.12], [41.91, 25.75], [44.65, 32.61], [40.86, 37.3], [35.9, 37.89], [35.25, 35.15], [33.42, 33.39], [31.33, 29.08]],
  Libano: [[27.94, 31.04], [29.5, 28.69], [31.07, 29.08], [33.94, 33.58], [33.16, 38.87], [31.33, 40.05], [27.68, 40.63], [27.02, 37.11], [24.8, 37.7], [23.89, 36.33], [24.28, 31.82], [25.33, 29.28], [27.42, 28.88], [27.81, 31.04]],
  Israele: [[33.03, 39.65], [33.03, 42.4], [32.64, 46.51], [32.11, 49.64], [33.94, 49.05], [36.03, 47.49], [35.51, 42.4], [35.38, 38.09], [34.99, 34.96], [34.33, 36.52], [33.16, 40.05]],
  Giordania: [[36.42, 47.29], [35.9, 42.79], [35.9, 38.87], [38.38, 38.28], [40.73, 37.89], [44.91, 40.83], [44.26, 43.38], [42.82, 45.73], [40.73, 46.9], [37.99, 46.31], [36.29, 47.1]],
  Egitto: [[18.02, 45.14], [24.28, 45.92], [28.2, 50.03], [31.85, 58.26], [32.51, 61], [30.55, 62.17], [17.62, 63.35], [16.97, 52.78], [17.75, 45.14]],
  Iraq: [[61.49, 38.28], [61.1, 39.46], [59.4, 39.26], [57.44, 39.65], [55.35, 43.38], [51.31, 45.14], [45.56, 41.22], [41.51, 37.89], [44.26, 34.76], [45.3, 32.61], [43.21, 27.12], [46.74, 23.21], [50, 24.18], [50.52, 26.53], [53.66, 29.47], [57.05, 31.43], [59.14, 33.78], [60.44, 36.91], [61.36, 37.89]],
  Iran: [[50.78, 24.38], [55.09, 23.6], [58.36, 20.07], [62.53, 19.88], [65.67, 23.99], [69.58, 21.64], [73.63, 26.34], [79.24, 30.65], [82.9, 30.06], [82.77, 46.9], [78.07, 46.51], [74.8, 48.27], [71.41, 47.1], [69.06, 45.92], [66.71, 44.94], [65.54, 42.2], [62.79, 40.24], [61.49, 37.89], [60.44, 34.37], [57.96, 29.86], [53.26, 28.49], [51.04, 25.16], [50.78, 24.38]],
  Kuwait: [[59.53, 39.65], [57.31, 39.85], [55.61, 43.57], [57.18, 47.1], [59.01, 48.86], [60.31, 49.05], [61.75, 47.1], [59.79, 39.85]],
  Bahrain: [[56.53, 49.45], [59.66, 49.64], [63.05, 49.64], [62.14, 54.54], [62.14, 54.54], [60.7, 56.3], [59.4, 56.89], [56.53, 50.03]],
  Qatar: [[60.57, 57.08], [63.05, 55.13], [69.19, 54.54], [69.58, 59.04], [65.27, 60.41], [62.66, 61.59], [61.88, 62.17], [61.49, 60.02], [60.18, 57.48]],
  EmiratiArabi: [[62.27, 63.74], [65.4, 61.39], [72.58, 60.41], [74.67, 57.87], [74.67, 61.39], [73.37, 65.31], [71.54, 68.83], [68.54, 69.62], [63.05, 67.46], [62.01, 63.94]],
  Oman: [[72.98, 69.22], [75.33, 63.55], [75.72, 59.43], [81.07, 65.9], [81.98, 70.6], [79.37, 74.71], [76.11, 78.04], [72.85, 69.42]],
  ArabiaSaudita: [[46.21, 73.53], [50.52, 68.83], [53.79, 68.44], [57.44, 68.25], [61.36, 68.44], [61.23, 61.39], [57.7, 57.08], [56.92, 53.17], [55.48, 49.84], [53.66, 49.05], [52.22, 45.73], [51.04, 46.12], [45.43, 42.2], [42.04, 47.49], [38.12, 47.68], [35.51, 48.86], [32.9, 50.23], [33.29, 52.78], [38.38, 61], [42.82, 69.42], [45.82, 73.73]],
  StrettoHormuz: [[74.41, 55.91], [76.76, 56.1], [81.59, 55.52], [82.51, 52.19], [82.25, 50.03], [76.63, 49.84], [74.15, 48.66], [71.8, 47.68], [70.76, 50.62], [71.02, 53.56], [72.98, 54.15], [74.02, 55.91]],
  Yemen: [[48.3, 73.53], [51.04, 78.43], [54.31, 78.82], [59.79, 83.32], [61.88, 83.32], [73.24, 74.71], [71.54, 70.4], [68.28, 70.6], [62.53, 68.44], [60.44, 69.81], [55.09, 69.81], [51.44, 70.01], [48.17, 73.73]],
};

function readBoardAreas(): BoardAreas {
  try {
    const stored = window.localStorage.getItem(BOARD_AREAS_STORAGE_KEY);
    if (!stored) return DEFAULT_BOARD_AREAS;
    const parsed = JSON.parse(stored) as BoardAreas;
    return parsed && typeof parsed === 'object'
      ? { ...DEFAULT_BOARD_AREAS, ...parsed }
      : DEFAULT_BOARD_AREAS;
  } catch {
    return DEFAULT_BOARD_AREAS;
  }
}

const areaPoints = (points: AreaPoint[]) =>
  points.map(([x, y]) => `${x},${y}`).join(' ');

function BoardAreasOverlay({
  areas,
  draft,
  selectedTerritory,
  editMode,
  onAddPoint,
}: {
  areas: BoardAreas;
  draft: AreaPoint[];
  selectedTerritory?: string | null;
  editMode: boolean;
  onAddPoint: (point: AreaPoint) => void;
}) {
  const handleClick = (event: MouseEvent<SVGSVGElement>) => {
    if (!editMode) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    onAddPoint([Number(x.toFixed(2)), Number(y.toFixed(2))]);
  };

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`absolute inset-0 h-full w-full ${editMode ? 'z-40 cursor-crosshair' : 'z-10 pointer-events-none'}`}
      onClick={handleClick}
      aria-label={editMode ? 'Editor aree della plancia' : 'Aree territoriali della plancia'}
    >
      {Object.entries(areas).map(([territory, points]) => {
        if (points.length < 3) return null;
        const selected = selectedTerritory === territory;
        return (
          <g key={territory}>
            <polygon
              points={areaPoints(points)}
              fill={selected ? '#00ff8810' : 'transparent'}
              stroke={selected ? '#00ff88' : '#00ff8844'}
              strokeWidth={selected ? 0.75 : 0.35}
              vectorEffect="non-scaling-stroke"
              style={{ pointerEvents: 'none' }}
            />
          </g>
        );
      })}
      {editMode && draft.length > 0 && (
        <>
          <polyline
            points={areaPoints(draft)}
            fill="none"
            stroke="#00ff88"
            strokeWidth="0.7"
            vectorEffect="non-scaling-stroke"
          />
          {draft.map(([x, y], index) => (
            <circle
              key={`${x}-${y}-${index}`}
              cx={x}
              cy={y}
              r="0.85"
              fill={index === 0 ? '#facc15' : '#00ff88'}
              stroke="#06111e"
              strokeWidth="0.3"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </>
      )}
    </svg>
  );
}

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
  minimal = false,
}: {
  territory: string;
  state: TerritoryState[string] | undefined;
  selected?: boolean;
  onSelect?: (territory: string) => void;
  minimal?: boolean;
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
      className={`absolute z-20 flex min-h-8 min-w-14 max-w-[132px] -translate-x-1/2 -translate-y-1/2 flex-wrap items-center justify-center gap-0.5 rounded-md border px-1 py-0.5 transition-all ${
        selected ? 'scale-110 ring-2 ring-[#00ff88]' : 'hover:scale-110'
      }`}
      style={{
        left: `${spot.left}%`,
        top: `${spot.top}%`,
        background: minimal ? 'transparent' : (entries.length || unitEntries.length ? '#050b14e8' : '#050b1466'),
        borderColor: selected ? '#00ff88' : minimal ? 'transparent' : '#ffffff66',
        boxShadow: minimal ? 'none' : undefined,
      }}
      title={`${territory}: ${entries.map(e => `${e.faction} ${e.count}`).join(' · ')}${unitEntries.length ? ` · ${unitEntries.map(e => `${e.definition?.label} ×${e.quantity}`).join(' · ')}` : ''}`}
    >
      {!minimal && !entries.length && !unitEntries.length && (
        <span className="font-mono text-[8px] font-bold text-white/70">{territory}</span>
      )}
      {!minimal && entries.map(({ faction, count }) => (
        <span
          key={faction}
          className="inline-flex h-4 min-w-4 items-center justify-center rounded px-0.5 text-[8px] font-black leading-none text-white"
          style={{ backgroundColor: FACTION_COLORS[faction] ?? '#64748b' }}
        >
          {shortFaction[faction]}{count > 1 ? `×${count}` : ''}
        </span>
      ))}
      {!minimal && unitEntries.map(({ faction, unitType, quantity, definition }) => (
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
        className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 bg-[#050b14]/95 text-[11px] shadow-[0_0_14px_rgba(0,0,0,0.8)]"
        style={{ borderColor: config.color, boxShadow: `0 0 14px ${config.color}aa` }}
      >
        <span aria-hidden="true">{config.icon}</span>
        <span
          className="absolute -bottom-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full border bg-[#050b14] px-0.5 font-mono text-[7px] font-black leading-none"
          style={{ color: config.color, borderColor: `${config.color}99` }}
        >
          {clamped}
        </span>
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

export function BoardAreaSettings() {
  const territoryIds = Object.keys(TERRITORY_SPOTS);
  const [areas, setAreas] = useState<BoardAreas>({});
  const [areaTerritory, setAreaTerritory] = useState(territoryIds[0] ?? '');
  const [draft, setDraft] = useState<AreaPoint[]>([]);
  const [areaExport, setAreaExport] = useState('');

  useEffect(() => {
    setAreas(readBoardAreas());
  }, []);

  const persistAreas = (next: BoardAreas) => {
    setAreas(next);
    window.localStorage.setItem(BOARD_AREAS_STORAGE_KEY, JSON.stringify(next));
  };

  const finishArea = () => {
    if (!areaTerritory || draft.length < 3) return;
    persistAreas({ ...areas, [areaTerritory]: draft });
    setDraft([]);
  };

  const removeArea = () => {
    if (!areaTerritory) return;
    const next = { ...areas };
    delete next[areaTerritory];
    persistAreas(next);
    setDraft([]);
  };

  const exportAreas = async () => {
    const output = JSON.stringify(areas, null, 2);
    setAreaExport(output);
    try {
      await navigator.clipboard?.writeText(output);
    } catch {
      // Il JSON resta comunque disponibile nella textarea.
    }
  };

  const resetAreas = () => {
    persistAreas({});
    setDraft([]);
    setAreaExport('');
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#f59e0b66] bg-[#050b14] shadow-2xl shadow-black/40">
      <div className="border-b border-[#f59e0b44] bg-[#111827] px-4 py-3">
        <div className="font-mono text-sm font-black uppercase tracking-[0.14em] text-[#f59e0b]">
          🗺️ Impostazioni aree della plancia
        </div>
        <p className="mt-1 font-mono text-[10px] leading-relaxed text-slate-400">
          Seleziona uno stato, clicca i vertici direttamente sulla grafica e salva il poligono. La configurazione viene salvata in questo browser e può essere copiata per renderla definitiva nel gioco.
        </p>
      </div>

      <div className="relative w-full bg-black">
        <img
          src={MAIN_BOARD_ASSET}
          alt="Grafica della plancia principale per la delimitazione delle aree"
          className="block h-auto w-full"
          draggable={false}
        />
        <BoardAreasOverlay
          areas={areas}
          draft={draft}
          editMode
          onAddPoint={point => setDraft(points => [...points, point])}
        />
      </div>

      <div className="border-t border-[#f59e0b44] bg-[#111827] px-4 py-3">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex min-w-[210px] flex-1 flex-col gap-1 font-mono text-[9px] font-bold uppercase tracking-wide text-[#facc15]">
            Stato / nazione da delimitare
            <select
              value={areaTerritory}
              onChange={event => {
                setAreaTerritory(event.target.value);
                setDraft([]);
              }}
              className="rounded border border-[#475569] bg-[#050b14] px-2 py-2 font-mono text-[11px] font-bold text-white outline-none focus:border-[#00ff88]"
            >
              {territoryIds.map(territory => (
                <option key={territory} value={territory}>{territory}</option>
              ))}
            </select>
          </label>
          <span className="font-mono text-[10px] text-slate-400">
            Vertici: <b className="text-white">{draft.length}</b> · Aree salvate: <b className="text-[#00ff88]">{Object.keys(areas).length}/{territoryIds.length}</b>
          </span>
          <button
            type="button"
            disabled={draft.length < 3}
            onClick={finishArea}
            className="rounded border border-[#00ff88] bg-[#00ff8815] px-2.5 py-2 font-mono text-[10px] font-bold text-[#00ff88] disabled:cursor-not-allowed disabled:opacity-40"
          >
            SALVA AREA
          </button>
          <button
            type="button"
            onClick={() => setDraft([])}
            className="rounded border border-[#64748b] px-2.5 py-2 font-mono text-[10px] font-bold text-slate-300 hover:border-white hover:text-white"
          >
            ANNULLA PUNTI
          </button>
          <button
            type="button"
            onClick={removeArea}
            disabled={!areas[areaTerritory]}
            className="rounded border border-[#ef444466] px-2.5 py-2 font-mono text-[10px] font-bold text-[#f87171] disabled:cursor-not-allowed disabled:opacity-40"
          >
            RIMUOVI AREA
          </button>
          <button
            type="button"
            onClick={exportAreas}
            className="rounded border border-[#38bdf8] px-2.5 py-2 font-mono text-[10px] font-bold text-[#38bdf8] hover:bg-[#38bdf815]"
          >
            COPIA COORDINATE
          </button>
          <button
            type="button"
            onClick={resetAreas}
            className="rounded border border-[#ef444466] px-2.5 py-2 font-mono text-[10px] font-bold text-[#fca5a5] hover:bg-[#ef444415]"
          >
            RESET TUTTE
          </button>
        </div>
        {areaExport && (
          <textarea
            readOnly
            value={areaExport}
            className="mt-3 h-36 w-full rounded border border-[#334155] bg-[#050b14] p-2 font-mono text-[9px] text-slate-300 outline-none"
            aria-label="Coordinate esportate delle aree"
          />
        )}
      </div>
    </section>
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
  const territoryIds = Object.keys(TERRITORY_SPOTS);
  const [areas, setAreas] = useState<BoardAreas>({});

  useEffect(() => {
    setAreas(readBoardAreas());
  }, []);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#334155] bg-[#050b14] shadow-2xl shadow-black/40">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e3a5f] bg-[#091321] px-3 py-2">
        <div>
          <div className="font-mono text-xs font-black uppercase tracking-[0.16em] text-white">Plancia generale</div>
          <div className="font-mono text-[10px] text-slate-500">Grafica Linea Rossa · stato dinamico della partita</div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
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
        <BoardAreasOverlay
          areas={areas}
          selectedTerritory={selectedTerritory}
          draft={[]}
          editMode={false}
          onAddPoint={() => undefined}
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
          {territoryIds.map(territory => (
            <TerritoryMarker
              key={territory}
              territory={territory}
              state={territories[territory]}
              selected={selectedTerritory === territory}
              onSelect={onSelectTerritory}
              minimal
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
