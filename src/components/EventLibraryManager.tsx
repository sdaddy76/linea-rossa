// =============================================
// LINEA ROSSA — Gestore Libreria Eventi
// Upload Excel → preview → salva su Supabase (events_deck)
// Simile a CardLibraryManager ma per le carte evento
// =============================================
import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  TUTTI_GLI_EVENTI,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  SEVERITY_COLORS,
  type EventoCard,
  type EventCategory,
} from '@/data/eventi';

// ─── Colonne del template Excel ───────────────────────────────────────────────
export const EVENTO_EXCEL_COLUMNS = [
  { key: 'event_id',            label: 'Codice',             example: 'E01' },
  { key: 'event_name',          label: 'Nome Evento',         example: 'Scoperta Sito Nucleare Segreto' },
  { key: 'category',            label: 'Categoria',           example: 'Nucleare' },
  { key: 'severity',            label: 'Gravità',             example: 'high' },
  { key: 'description',         label: 'Descrizione',         example: 'Breve descrizione narrativa...' },
  { key: 'flavor_text',         label: 'Citazione',           example: '"Frase citazione." — Fonte' },
  { key: 'effects_description', label: 'Effetti (testo)',     example: '☢️ Nucleare +2 · 💰 Sanzioni +2' },
  { key: 'delta_nucleare',      label: 'Δ Nucleare',          example: '2' },
  { key: 'delta_sanzioni',      label: 'Δ Sanzioni',          example: '2' },
  { key: 'delta_opinione',      label: 'Δ Opinione',          example: '-1' },
  { key: 'delta_defcon',        label: 'Δ DEFCON',            example: '-1' },
  { key: 'delta_risorse_iran',  label: 'Δ Risorse Iran',      example: '0' },
  { key: 'delta_risorse_coalizione', label: 'Δ Risorse Coalizione', example: '0' },
  { key: 'delta_risorse_russia', label: 'Δ Risorse Russia',   example: '0' },
  { key: 'delta_risorse_cina',  label: 'Δ Risorse Cina',      example: '0' },
  { key: 'delta_risorse_europa', label: 'Δ Risorse Europa',   example: '0' },
  { key: 'delta_stabilita_iran', label: 'Δ Stab. Iran',       example: '-1' },
  { key: 'blocca_avanzamento',  label: 'Blocca avanzamento',  example: 'false' },
  { key: 'vittoria_iran',       label: 'Vittoria Iran',       example: 'false' },
] as const;

type ExcelRow = Record<string, string | number>;

interface ParsedEvento {
  event_id: string;
  event_name: string;
  category: EventCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  flavor_text: string;
  effects_description: string;
  delta_nucleare: number;
  delta_sanzioni: number;
  delta_opinione: number;
  delta_defcon: number;
  delta_risorse_iran: number;
  delta_risorse_coalizione: number;
  delta_risorse_russia: number;
  delta_risorse_cina: number;
  delta_risorse_europa: number;
  delta_stabilita_iran: number;
  blocca_avanzamento: boolean;
  vittoria_iran: boolean;
}

type UploadStep = 'idle' | 'parsing' | 'preview' | 'saving' | 'done' | 'error';

interface UploadStats { total: number; saved: number; errors: string[]; warnings: string[]; }

// ─── Parser Excel → ParsedEvento ─────────────────────────────────────────────
function parseEventiExcel(data: ArrayBuffer): ParsedEvento[] {
  const wb = XLSX.read(data, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(ws, { defval: '' });

  return rows
    .filter((r: ExcelRow) => String(r['Codice'] ?? '').startsWith('E'))
    .map((r: ExcelRow) => ({
      event_id:            String(r['Codice'] ?? '').trim(),
      event_name:          String(r['Nome Evento'] ?? '').trim(),
      category:            (String(r['Categoria'] ?? 'Militare').trim()) as EventCategory,
      severity:            (String(r['Gravità'] ?? 'medium').trim()) as 'low' | 'medium' | 'high' | 'critical',
      description:         String(r['Descrizione'] ?? '').trim(),
      flavor_text:         String(r['Citazione'] ?? '').trim(),
      effects_description: String(r['Effetti (testo)'] ?? '').trim(),
      delta_nucleare:      Number(r['Δ Nucleare'] ?? 0),
      delta_sanzioni:      Number(r['Δ Sanzioni'] ?? 0),
      delta_opinione:      Number(r['Δ Opinione'] ?? 0),
      delta_defcon:        Number(r['Δ DEFCON'] ?? 0),
      delta_risorse_iran:  Number(r['Δ Risorse Iran'] ?? 0),
      delta_risorse_coalizione: Number(r['Δ Risorse Coalizione'] ?? 0),
      delta_risorse_russia:Number(r['Δ Risorse Russia'] ?? 0),
      delta_risorse_cina:  Number(r['Δ Risorse Cina'] ?? 0),
      delta_risorse_europa:Number(r['Δ Risorse Europa'] ?? 0),
      delta_stabilita_iran:Number(r['Δ Stab. Iran'] ?? 0),
      blocca_avanzamento:  String(r['Blocca avanzamento'] ?? '').toLowerCase() === 'true',
      vittoria_iran:       String(r['Vittoria Iran'] ?? '').toLowerCase() === 'true',
    }));
}

// ─── Download template Excel ───────────────────────────────────────────────────
function downloadTemplate() {
  const headers = EVENTO_EXCEL_COLUMNS.map(c => c.label);
  const exampleRow = EVENTO_EXCEL_COLUMNS.map(c => c.example);

  // Prima riga: header, seconda riga: esempio, poi tutti i 75 eventi
  const dataRows = TUTTI_GLI_EVENTI.map(e => [
    e.event_id,
    e.event_name,
    e.category,
    e.severity,
    e.description,
    e.flavor_text ?? '',
    e.effects_description,
    e.effects.delta_nucleare ?? 0,
    e.effects.delta_sanzioni ?? 0,
    e.effects.delta_opinione ?? 0,
    e.effects.delta_defcon ?? 0,
    e.effects.delta_risorse_iran ?? 0,
    e.effects.delta_risorse_coalizione ?? 0,
    e.effects.delta_risorse_russia ?? 0,
    e.effects.delta_risorse_cina ?? 0,
    e.effects.delta_risorse_europa ?? 0,
    e.effects.delta_stabilita_iran ?? 0,
    e.effects.blocca_avanzamento ? 'true' : 'false',
    e.effects.vittoria_iran ? 'true' : 'false',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow, ...dataRows]);

  // Larghezze colonne
  ws['!cols'] = headers.map((h, i) => ({
    wch: i === 4 ? 50 : i === 6 ? 40 : Math.max(h.length + 4, 15),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Eventi');
  XLSX.writeFile(wb, 'template_eventi_linea_rossa.xlsx');
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function EventLibraryManager({ onClose }: { onClose: () => void }) {
  const [step, setStep]   = useState<UploadStep>('idle');
  const [eventi, setEventi] = useState<ParsedEvento[]>([]);
  const [stats, setStats] = useState<UploadStats | null>(null);
  const [filterCat, setFilterCat] = useState<string>('Tutte');
  const [filterSev, setFilterSev] = useState<string>('Tutte');
  const [showBuiltin, setShowBuiltin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Parse file ────────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    setStep('parsing');
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseEventiExcel(buf);
      setEventi(parsed);
      setStep('preview');
    } catch (err) {
      console.error(err);
      setStep('error');
    }
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  // ── Carica eventi built-in (senza upload) ─────────────────────────────────
  const loadBuiltin = () => {
    const mapped: ParsedEvento[] = TUTTI_GLI_EVENTI.map(e => ({
      event_id:            e.event_id,
      event_name:          e.event_name,
      category:            e.category,
      severity:            e.severity,
      description:         e.description,
      flavor_text:         e.flavor_text ?? '',
      effects_description: e.effects_description,
      delta_nucleare:      e.effects.delta_nucleare ?? 0,
      delta_sanzioni:      e.effects.delta_sanzioni ?? 0,
      delta_opinione:      e.effects.delta_opinione ?? 0,
      delta_defcon:        e.effects.delta_defcon ?? 0,
      delta_risorse_iran:  e.effects.delta_risorse_iran ?? 0,
      delta_risorse_coalizione: e.effects.delta_risorse_coalizione ?? 0,
      delta_risorse_russia: e.effects.delta_risorse_russia ?? 0,
      delta_risorse_cina:  e.effects.delta_risorse_cina ?? 0,
      delta_risorse_europa: e.effects.delta_risorse_europa ?? 0,
      delta_stabilita_iran: e.effects.delta_stabilita_iran ?? 0,
      blocca_avanzamento:  e.effects.blocca_avanzamento ?? false,
      vittoria_iran:       e.effects.vittoria_iran ?? false,
    }));
    setEventi(mapped);
    setStep('preview');
  };

  // ── Salva su Supabase ─────────────────────────────────────────────────────
  const saveToDb = async () => {
    setStep('saving');
    const { supabase } = await import('@/integrations/supabase/client');
    const errors: string[] = [];
    const warnings: string[] = [];
    let saved = 0;

    // Prima svuota la tabella esistente (upsert basato su event_id)
    const rows = eventi.map(e => ({
      event_id:            e.event_id,
      event_name:          e.event_name,
      category:            e.category,
      severity:            e.severity,
      description:         e.description,
      flavor_text:         e.flavor_text || null,
      effects_description: e.effects_description,
      delta_nucleare:      e.delta_nucleare,
      delta_sanzioni:      e.delta_sanzioni,
      delta_opinione:      e.delta_opinione,
      delta_defcon:        e.delta_defcon,
      delta_risorse_iran:  e.delta_risorse_iran,
      delta_risorse_coalizione: e.delta_risorse_coalizione,
      delta_risorse_russia: e.delta_risorse_russia,
      delta_risorse_cina:  e.delta_risorse_cina,
      delta_risorse_europa: e.delta_risorse_europa,
      delta_stabilita_iran: e.delta_stabilita_iran,
      blocca_avanzamento:  e.blocca_avanzamento,
      vittoria_iran:       e.vittoria_iran,
    }));

    // Salva in batch da 50
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error } = await supabase
        .from('events_library')
        .upsert(batch, { onConflict: 'event_id', ignoreDuplicates: false });
      if (error) {
        errors.push(`Batch ${Math.floor(i / 50) + 1}: ${error.message}`);
      } else {
        saved += batch.length;
      }
    }

    setStats({ total: eventi.length, saved, errors, warnings });
    setStep(errors.length > 0 ? 'error' : 'done');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const filtrati = eventi.filter(e =>
    (filterCat === 'Tutte' || e.category === filterCat) &&
    (filterSev === 'Tutte' || e.severity === filterSev)
  );

  const categories = ['Tutte', 'Nucleare', 'Militare', 'Diplomatico', 'Economico', 'Politico'];
  const severities = ['Tutte', 'critical', 'high', 'medium', 'low'];
  const SEVI_LABEL: Record<string, string> = { critical: '🔴 Critico', high: '🟠 Alto', medium: '🟡 Medio', low: '🟢 Basso', Tutte: 'Tutte' };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#0d1424] border border-[#1e3a5f] rounded-2xl shadow-2xl
        w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="sticky top-0 bg-[#0d1424] border-b border-[#1e3a5f] px-5 py-3
          flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎴</span>
            <div>
              <h2 className="font-bold text-white font-mono text-sm">Gestione Libreria EVENTI</h2>
              <p className="text-[10px] text-[#8899aa] font-mono">
                Carica Excel o usa i 75 eventi del regolamento
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-[#8899aa] hover:text-white text-xl font-bold transition-colors">×</button>
        </div>

        {/* ── Corpo scrollabile ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ─── STEP: IDLE ─── */}
          {step === 'idle' && (
            <div className="space-y-4">
              {/* Info */}
              <div className="p-3 rounded-xl border border-[#f97316] bg-[#f9731610]">
                <p className="text-xs font-mono text-[#f97316] font-bold mb-1">🎴 Sistema Eventi — Regolamento</p>
                <p className="text-[11px] text-[#8899aa] font-mono">
                  All'inizio di ogni turno Iran viene pescata una carta evento casuale.
                  Usa gli eventi del regolamento (built-in) oppure carica un file Excel personalizzato.
                </p>
              </div>

              {/* Opzione 1: eventi built-in */}
              <div className="p-4 rounded-xl border border-[#22c55e] bg-[#22c55e08] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono font-bold text-[#22c55e]">💵 Usa eventi built-in</p>
                    <p className="text-[11px] text-[#8899aa] font-mono mt-0.5">
                      75 eventi già codificati dal regolamento ufficiale
                    </p>
                  </div>
                  <span className="text-[10px] font-mono bg-[#22c55e20] text-[#22c55e] px-2 py-1 rounded border border-[#22c55e40]">
                    75 EVENTI
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={loadBuiltin}
                    className="flex-1 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0e1a]
                      font-bold font-mono text-sm rounded-lg transition-colors">
                    ✅ Carica Built-in
                  </button>
                  <button onClick={() => setShowBuiltin(v => !v)}
                    className="px-3 py-2 border border-[#22c55e40] text-[#22c55e]
                      font-mono text-xs rounded-lg hover:bg-[#22c55e10] transition-colors">
                    {showBuiltin ? '▲ Nascondi' : '▼ Anteprima'}
                  </button>
                </div>
                {showBuiltin && (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {TUTTI_GLI_EVENTI.slice(0, 10).map(e => (
                      <div key={e.event_id} className="flex items-center gap-2 text-[10px] font-mono py-0.5">
                        <span style={{ color: CATEGORY_COLORS[e.category] }}>
                          {CATEGORY_ICONS[e.category]}
                        </span>
                        <span className="text-[#8899aa]">{e.event_id}</span>
                        <span className="text-white truncate">{e.event_name}</span>
                        <span style={{ color: SEVERITY_COLORS[e.severity] }} className="ml-auto shrink-0">
                          {e.severity}
                        </span>
                      </div>
                    ))}
                    <p className="text-[10px] text-[#334455] font-mono text-center py-1">
                      … e altri {TUTTI_GLI_EVENTI.length - 10} eventi
                    </p>
                  </div>
                )}
              </div>

              {/* Opzione 2: upload Excel */}
              <div className="p-4 rounded-xl border border-[#1e3a5f] bg-[#060d18] space-y-3">
                <div>
                  <p className="text-sm font-mono font-bold text-white">📂 Carica file Excel personalizzato</p>
                  <p className="text-[11px] text-[#8899aa] font-mono mt-0.5">
                    Modifica il template e reimporta per personalizzare gli eventi
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={downloadTemplate}
                    className="flex-1 py-2 border border-[#f59e0b60] text-[#f59e0b] hover:bg-[#f59e0b10]
                      font-mono text-sm rounded-lg transition-colors">
                    ⬇️ Scarica Template Excel
                  </button>
                  <button onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 border border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f610]
                      font-mono text-sm rounded-lg transition-colors">
                    📤 Upload .xlsx
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls"
                  onChange={onInputChange} className="hidden" />
              </div>
            </div>
          )}

          {/* ─── STEP: PARSING ─── */}
          {step === 'parsing' && (
            <div className="py-12 text-center">
              <div className="text-4xl animate-pulse mb-3">🎴</div>
              <p className="text-[#00ff88] font-mono">Parsing file Excel...</p>
            </div>
          )}

          {/* ─── STEP: PREVIEW ─── */}
          {step === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-mono text-sm text-white">
                  <span className="text-[#00ff88] font-bold">{eventi.length}</span> eventi trovati
                </p>
                <div className="flex gap-2 flex-wrap">
                  {/* Filtro categoria */}
                  {categories.map(c => (
                    <button key={c} onClick={() => setFilterCat(c)}
                      className="text-[10px] font-mono px-2 py-1 rounded transition-colors"
                      style={{
                        backgroundColor: filterCat === c
                          ? (c === 'Tutte' ? '#334455' : `${CATEGORY_COLORS[c as EventCategory]}25`)
                          : 'transparent',
                        color: filterCat === c
                          ? (c === 'Tutte' ? 'white' : CATEGORY_COLORS[c as EventCategory])
                          : '#556677',
                        border: `1px solid ${filterCat === c
                          ? (c === 'Tutte' ? '#556677' : CATEGORY_COLORS[c as EventCategory] + '60')
                          : '#1e2a3a'}`,
                      }}>
                      {c !== 'Tutte' ? CATEGORY_ICONS[c as EventCategory] : ''} {c}
                    </button>
                  ))}
                  {/* Filtro gravità */}
                  {severities.map(s => (
                    <button key={s} onClick={() => setFilterSev(s)}
                      className="text-[10px] font-mono px-2 py-1 rounded transition-colors"
                      style={{
                        backgroundColor: filterSev === s ? `${SEVERITY_COLORS[s] ?? '#334455'}25` : 'transparent',
                        color: filterSev === s ? (SEVERITY_COLORS[s] ?? 'white') : '#556677',
                        border: `1px solid ${filterSev === s ? `${SEVERITY_COLORS[s] ?? '#556677'}60` : '#1e2a3a'}`,
                      }}>
                      {SEVI_LABEL[s] ?? s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Griglia eventi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                {filtrati.map(e => {
                  const catColor = CATEGORY_COLORS[e.category] ?? '#8899aa';
                  const sevColor = SEVERITY_COLORS[e.severity] ?? '#8899aa';
                  return (
                    <div key={e.event_id}
                      className="p-3 rounded-xl border text-left"
                      style={{ borderColor: `${catColor}33`, backgroundColor: `${catColor}06` }}>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="text-sm">{CATEGORY_ICONS[e.category]}</span>
                          <span className="font-mono text-[10px] font-bold" style={{ color: catColor }}>
                            {e.event_id}
                          </span>
                          <span className="font-mono text-xs font-bold text-white truncate">
                            {e.event_name}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
                          style={{ color: sevColor, backgroundColor: `${sevColor}20`, border: `1px solid ${sevColor}40` }}>
                          {e.severity}
                        </span>
                      </div>
                      {/* Descrizione */}
                      <p className="text-[10px] text-[#8899aa] font-mono line-clamp-2 mb-1.5">
                        {e.description}
                      </p>
                      {/* Effetti */}
                      {e.effects_description && (
                        <p className="text-[9px] font-mono text-[#556677]">
                          {e.effects_description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Azioni */}
              <div className="flex gap-2 pt-2 border-t border-[#1e3a5f]">
                <button onClick={() => { setStep('idle'); setEventi([]); }}
                  className="px-4 py-2 border border-[#334455] text-[#8899aa] hover:text-white
                    font-mono text-xs rounded-lg transition-colors">
                  ← Indietro
                </button>
                <button onClick={saveToDb}
                  className="flex-1 py-2 bg-[#f97316] hover:bg-[#ea580c] text-white
                    font-bold font-mono text-sm rounded-lg transition-colors">
                  💾 Salva {eventi.length} eventi su DB
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP: SAVING ─── */}
          {step === 'saving' && (
            <div className="py-12 text-center">
              <div className="text-4xl animate-spin mb-3">⚙️</div>
              <p className="text-[#f97316] font-mono animate-pulse">Salvataggio in corso...</p>
            </div>
          )}

          {/* ─── STEP: DONE ─── */}
          {step === 'done' && stats && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-[#22c55e] bg-[#22c55e10] text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="font-mono font-bold text-[#22c55e] text-lg">Salvati con successo!</p>
                <p className="text-[#8899aa] font-mono text-sm mt-1">
                  {stats.saved}/{stats.total} eventi nel database
                </p>
              </div>
              {stats.warnings.length > 0 && (
                <div className="p-3 rounded-lg border border-[#f59e0b40] bg-[#f59e0b08]">
                  {stats.warnings.map((w, i) => (
                    <p key={i} className="text-[#f59e0b] font-mono text-xs">⚠️ {w}</p>
                  ))}
                </div>
              )}
              <button onClick={onClose}
                className="w-full py-3 bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0e1a]
                  font-bold font-mono rounded-xl transition-colors">
                ✓ Chiudi
              </button>
            </div>
          )}

          {/* ─── STEP: ERROR ─── */}
          {step === 'error' && stats && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-[#ef4444] bg-[#ef444410]">
                <p className="font-mono font-bold text-[#ef4444] mb-2">⚠️ Errori durante il salvataggio</p>
                <p className="text-[#8899aa] font-mono text-xs mb-2">
                  Salvati {stats.saved}/{stats.total} — {stats.errors.length} errori
                </p>
                {stats.errors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-[#ff6666] font-mono text-[10px]">• {e}</p>
                ))}
                {stats.errors.length > 5 && (
                  <p className="text-[#556677] font-mono text-[10px]">
                    …e altri {stats.errors.length - 5} errori
                  </p>
                )}
                <p className="text-[11px] text-[#f59e0b] font-mono mt-2">
                  Nota: la tabella <code>events_library</code> potrebbe non esistere ancora nel DB.
                  Contatta l'admin per eseguire la migration.
                </p>
              </div>
              <button onClick={() => { setStep('idle'); setStats(null); setEventi([]); }}
                className="w-full py-3 border border-[#334455] text-[#8899aa] font-mono rounded-xl
                  hover:text-white transition-colors">
                ← Riprova
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
