// =============================================
// LINEA ROSSA — Gestore Libreria Obiettivi Segreti
// Upload Excel → preview → salva su Supabase (objectives)
// Ispirato a CardLibraryManager / EventLibraryManager
// =============================================
import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  TUTTI_GLI_OBIETTIVI,
  OBJ_FACTION_COLORS,
  OBJ_FACTION_FLAGS,
  OBJ_DIFFICOLTA_COLORS,
  OBJ_DIFFICOLTA_ICONS,
  type ObiettivoSegreto,
  type ObjFazione,
  type ObjDifficolta,
} from '@/data/obiettivi';

// ─── Colonne del template Excel ───────────────────────────────────────────────
export const OBJ_EXCEL_COLUMNS = [
  { key: 'obj_id',             label: 'Codice',             example: 'OBJ_IRAN_04' },
  { key: 'faction',            label: 'Fazione',            example: 'Iran' },
  { key: 'nome',               label: 'Nome Obiettivo',     example: 'Nome strategico' },
  { key: 'descrizione',        label: 'Descrizione',        example: 'Descrizione completa della condizione di vittoria...' },
  { key: 'punti',              label: 'Punti Fine Partita', example: '6' },
  { key: 'difficolta',         label: 'Difficoltà',         example: 'media' },
  { key: 'condizione_tipo',    label: 'Tipo Condizione',    example: 'tracciato' },
  { key: 'condizione_campo',   label: 'Campo Condizione',   example: 'nucleare' },
  { key: 'condizione_op',      label: 'Operatore',          example: '>=' },
  { key: 'condizione_valore',  label: 'Valore Soglia',      example: '10' },
  { key: 'condizione_note',    label: 'Note Condizione',    example: 'Verifica manuale: ...' },
  { key: 'attivo',             label: 'Attivo',             example: 'true' },
] as const;

type ExcelRow = Record<string, string | number>;

interface ParsedObiettivo {
  obj_id:            string;
  faction:           ObjFazione;
  nome:              string;
  descrizione:       string;
  punti:             number;
  difficolta:        ObjDifficolta;
  condizione_tipo:   string;
  condizione_campo:  string;
  condizione_op:     string;
  condizione_valore: number | null;
  condizione_note:   string;
  attivo:            boolean;
}

type UploadStep = 'idle' | 'parsing' | 'preview' | 'saving' | 'done' | 'error';
interface UploadStats { total: number; saved: number; errors: string[]; warnings: string[]; }

// ─── Parser Excel → ParsedObiettivo ──────────────────────────────────────────
function parseObiettiviExcel(data: ArrayBuffer): ParsedObiettivo[] {
  const wb = XLSX.read(data, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(ws, { defval: '' });

  return rows
    .filter((r: ExcelRow) => String(r['Codice'] ?? '').startsWith('OBJ'))
    .map((r: ExcelRow) => ({
      obj_id:            String(r['Codice'] ?? '').trim(),
      faction:           (String(r['Fazione'] ?? 'Iran').trim()) as ObjFazione,
      nome:              String(r['Nome Obiettivo'] ?? '').trim(),
      descrizione:       String(r['Descrizione'] ?? '').trim(),
      punti:             Number(r['Punti Fine Partita'] ?? 5),
      difficolta:        (String(r['Difficoltà'] ?? 'media').trim().toLowerCase()) as ObjDifficolta,
      condizione_tipo:   String(r['Tipo Condizione'] ?? '').trim(),
      condizione_campo:  String(r['Campo Condizione'] ?? '').trim(),
      condizione_op:     String(r['Operatore'] ?? '').trim(),
      condizione_valore: r['Valore Soglia'] !== '' ? Number(r['Valore Soglia']) : null,
      condizione_note:   String(r['Note Condizione'] ?? '').trim(),
      attivo:            String(r['Attivo'] ?? 'true').toLowerCase() !== 'false',
    }));
}

// ─── Generatore template Excel ────────────────────────────────────────────────
function downloadTemplate() {
  const headers = OBJ_EXCEL_COLUMNS.map(c => c.label);
  const example = OBJ_EXCEL_COLUMNS.map(c => c.example);

  // Riga di esempio per ogni fazione
  const demoRows = [
    example,
    ['OBJ_COAL_04', 'Coalizione Occidentale', 'Accerchiamento Diplomatico', 'Isola diplomaticamente l\'Iran ottenendo l\'appoggio di almeno 4 nazioni al Consiglio di Sicurezza.', 7, 'media', 'carta', 'appoggio_cs', '>=', 4, 'Contare le nazioni con voto favorevole alla Coalizione al CS ONU.', 'true'],
    ['OBJ_RUS_04', 'Russia', 'Energia come Arma', 'Usa almeno 2 carte energetiche per influenzare nazioni europee durante la partita.', 5, 'facile', 'carta', 'energia_europa', '>=', 2, 'Carte energia giocate verso nazioni UE (min 2).', 'true'],
    ['OBJ_CINA_04', 'Cina', 'Hub Logistico Regionale', 'Piazza infrastrutture BRI in almeno 2 porti strategici del Golfo Persico.', 6, 'media', 'territorio', 'porto_bri', '>=', 2, 'Contare i porti del Golfo con influenza BRI cinese.', 'true'],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...demoRows]);

  // Larghezze colonne
  ws['!cols'] = [
    { wch: 18 }, { wch: 25 }, { wch: 28 }, { wch: 60 },
    { wch: 8 },  { wch: 12 }, { wch: 16 }, { wch: 22 },
    { wch: 10 }, { wch: 14 }, { wch: 50 }, { wch: 8 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Obiettivi Segreti');

  // Foglio istruzioni
  const instrData = [
    ['ISTRUZIONI — Template Obiettivi Segreti Linea Rossa'],
    [''],
    ['CAMPO', 'VALORI AMMESSI', 'OBBLIGATORIO'],
    ['Codice', 'OBJ_FAZIONE_NN  (es. OBJ_IRAN_04)', 'Sì'],
    ['Fazione', 'Iran | Coalizione Occidentale | Russia | Cina | Unione Europea | Neutrale', 'Sì'],
    ['Nome Obiettivo', 'Testo libero (max 60 caratteri)', 'Sì'],
    ['Descrizione', 'Testo descrittivo completo della condizione di vittoria', 'Sì'],
    ['Punti Fine Partita', 'Numero intero (1-15). Tipici: 5=facile, 6-7=media, 8=difficile', 'Sì'],
    ['Difficoltà', 'facile | media | difficile', 'Sì'],
    ['Tipo Condizione', 'tracciato | territorio | carta | manuale', 'No'],
    ['Campo Condizione', 'nucleare | sanzioni | defcon | opinione | controllo | ecc.', 'No'],
    ['Operatore', '>= | <= | ==', 'No'],
    ['Valore Soglia', 'Numero intero (soglia numerica della condizione)', 'No'],
    ['Note Condizione', 'Testo libero — come verificare manualmente la condizione', 'No'],
    ['Attivo', 'true | false', 'No (default: true)'],
    [''],
    ['NOTE:'],
    ['- I codici OBJ_IRAN_01..03, OBJ_COAL_01..03, OBJ_RUS_01..03, OBJ_CINA_01..03, OBJ_EU_01..03 sono già caricati.'],
    ['- Usa codici progressivi (es. OBJ_IRAN_04) per i nuovi obiettivi.'],
    ['- Il caricamento usa UPSERT: aggiornare un obiettivo esistente è sicuro.'],
    ['- Lasciare vuoti Tipo/Campo/Operatore/Valore per condizioni verificate manualmente.'],
  ];
  const wsInstr = XLSX.utils.aoa_to_sheet(instrData);
  wsInstr['!cols'] = [{ wch: 25 }, { wch: 70 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsInstr, 'Istruzioni');

  XLSX.writeFile(wb, 'template_obiettivi_segreti.xlsx');
}

// ─── Componente principale ────────────────────────────────────────────────────
interface Props { onClose: () => void; }

export default function ObjectiveLibraryManager({ onClose }: Props) {
  const [step, setStep]       = useState<UploadStep>('idle');
  const [parsed, setParsed]   = useState<ParsedObiettivo[]>([]);
  const [stats, setStats]     = useState<UploadStats | null>(null);
  const [error, setError]     = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'libreria'>('libreria');
  const [filterFaz, setFilterFaz] = useState<string>('Tutte');
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Libreria statica (da obiettivi.ts) ──────────────────────────────
  const fazioni: string[] = ['Tutte', 'Iran', 'Coalizione Occidentale', 'Russia', 'Cina', 'Unione Europea'];
  const obiettiviVisibili = TUTTI_GLI_OBIETTIVI.filter(o =>
    filterFaz === 'Tutte' || o.faction === filterFaz
  );

  // ── Upload Excel ─────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    setStep('parsing'); setError('');
    try {
      const buf = await file.arrayBuffer();
      const rows = parseObiettiviExcel(buf);
      if (rows.length === 0) throw new Error('Nessun obiettivo trovato. Verifica che il Codice inizi con "OBJ".');
      setParsed(rows);
      setStep('preview');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Errore nel parsing');
      setStep('error');
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.xlsx') || file?.name.endsWith('.xls')) handleFile(file);
  }, [handleFile]);

  // ── Salvataggio su Supabase ──────────────────────────────────────────
  const saveToSupabase = async () => {
    setStep('saving');
    const stats: UploadStats = { total: parsed.length, saved: 0, errors: [], warnings: [] };
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      const BATCH = 20;
      for (let i = 0; i < parsed.length; i += BATCH) {
        const batch = parsed.slice(i, i + BATCH).map(o => ({
          obj_id:           o.obj_id,
          faction:          o.faction,
          nome:             o.nome,
          descrizione:      o.descrizione,
          punti:            o.punti,
          difficolta:       o.difficolta,
          condizione_tipo:  o.condizione_tipo  || null,
          condizione_campo: o.condizione_campo || null,
          condizione_op:    o.condizione_op    || null,
          condizione_valore: o.condizione_valore,
          condizione_note:  o.condizione_note  || null,
          attivo:           o.attivo,
        }));
        const { error, count } = await supabase
          .from('objectives')
          .upsert(batch, { onConflict: 'obj_id', ignoreDuplicates: false })
          .select('obj_id', { count: 'exact', head: true });
        if (error) {
          stats.errors.push(`Batch ${i}-${i + BATCH}: ${error.message}`);
        } else {
          stats.saved += count ?? batch.length;
        }
      }
      setStats(stats);
      setStep('done');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Errore imprevisto');
      setStep('error');
    }
  };

  const diffColor  = (d: ObjDifficolta) => OBJ_DIFFICOLTA_COLORS[d] ?? '#8899aa';
  const facColor   = (f: ObjFazione)    => OBJ_FACTION_COLORS[f]    ?? '#8899aa';
  const facFlag    = (f: ObjFazione)    => OBJ_FACTION_FLAGS[f]      ?? '🌐';
  const diffIcon   = (d: ObjDifficolta) => OBJ_DIFFICOLTA_ICONS[d]   ?? '⭐';

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col
        bg-[#0d1424] border border-[#8b5cf6] rounded-2xl shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4
          border-b border-[#1e3a5f] bg-[#0a0e1a]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <h2 className="font-mono font-bold text-white text-lg">Obiettivi Segreti</h2>
              <p className="font-mono text-[#8899aa] text-xs">
                {TUTTI_GLI_OBIETTIVI.length} obiettivi caricati · 5 fazioni
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-[#8899aa] hover:text-white font-mono text-lg px-2">✕</button>
        </div>

        {/* ── Tab nav ── */}
        <div className="flex border-b border-[#1e3a5f]">
          {(['libreria', 'upload'] as const).map(t => (
            <button key={t}
              onClick={() => setActiveTab(t)}
              className={`px-5 py-3 font-mono text-xs font-bold transition-colors ${
                activeTab === t
                  ? 'text-[#8b5cf6] border-b-2 border-[#8b5cf6] bg-[#8b5cf610]'
                  : 'text-[#8899aa] hover:text-white'
              }`}>
              {t === 'libreria' ? '📚 LIBRERIA' : '⬆️ CARICA EXCEL'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">

          {/* ══════════════ TAB LIBRERIA ══════════════ */}
          {activeTab === 'libreria' && (
            <div className="space-y-4">
              {/* Filtro fazione */}
              <div className="flex gap-2 flex-wrap">
                {fazioni.map(f => (
                  <button key={f}
                    onClick={() => setFilterFaz(f)}
                    className={`px-3 py-1 rounded-full font-mono text-[10px] font-bold border transition-colors ${
                      filterFaz === f
                        ? 'border-[#8b5cf6] bg-[#8b5cf620] text-[#8b5cf6]'
                        : 'border-[#1e3a5f] text-[#8899aa] hover:border-[#8b5cf6] hover:text-white'
                    }`}>
                    {f !== 'Tutte' && facFlag(f as ObjFazione)}{' '}{f}
                    {f !== 'Tutte' && (
                      <span className="ml-1 opacity-60">
                        ({TUTTI_GLI_OBIETTIVI.filter(o => o.faction === f).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Cards obiettivi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {obiettiviVisibili.map(obj => (
                  <ObjCard key={obj.obj_id} obj={obj}
                    facColor={facColor} facFlag={facFlag}
                    diffColor={diffColor} diffIcon={diffIcon} />
                ))}
              </div>
            </div>
          )}

          {/* ══════════════ TAB UPLOAD ══════════════ */}
          {activeTab === 'upload' && (
            <div className="space-y-4">

              {/* Download template */}
              <div className="bg-[#111827] border border-[#1e3a5f] rounded-xl p-4
                flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-white text-sm font-bold">📥 Template Excel</p>
                  <p className="font-mono text-[#8899aa] text-xs mt-0.5">
                    Scarica il template pre-compilato con istruzioni e righe di esempio
                  </p>
                </div>
                <button onClick={downloadTemplate}
                  className="px-4 py-2 bg-[#8b5cf620] border border-[#8b5cf6]
                    text-[#8b5cf6] hover:bg-[#8b5cf640] rounded-lg font-mono text-xs font-bold
                    transition-colors whitespace-nowrap">
                  ⬇️ Scarica Template
                </button>
              </div>

              {/* Drop zone */}
              {(step === 'idle' || step === 'error') && (
                <div
                  className="border-2 border-dashed border-[#8b5cf6] border-opacity-40
                    rounded-xl p-8 text-center cursor-pointer hover:border-opacity-80 transition-all
                    bg-[#8b5cf605]"
                  onDrop={onDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  <p className="text-4xl mb-3">🚨</p>
                  <p className="font-mono text-white text-sm font-bold">
                    Trascina il file Excel o clicca per selezionarlo
                  </p>
                  <p className="font-mono text-[#8899aa] text-xs mt-1">
                    Formato: .xlsx — Colonna Codice deve iniziare con "OBJ"
                  </p>
                  {step === 'error' && (
                    <p className="mt-3 text-[#ef4444] font-mono text-xs bg-[#ef444415] px-3 py-2 rounded-lg">
                      ⚠️ {error}
                    </p>
                  )}
                </div>
              )}

              {/* Parsing */}
              {step === 'parsing' && (
                <div className="text-center py-10">
                  <div className="inline-block w-8 h-8 border-2 border-[#8b5cf6] border-t-transparent
                    rounded-full animate-spin mb-3" />
                  <p className="font-mono text-[#8899aa] text-sm">Analisi del file in corso…</p>
                </div>
              )}

              {/* Preview */}
              {step === 'preview' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-white text-sm font-bold">
                      ✅ Trovati <span className="text-[#8b5cf6]">{parsed.length}</span> obiettivi
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => { setStep('idle'); setParsed([]); }}
                        className="px-3 py-1.5 border border-[#334455] text-[#8899aa]
                          hover:text-white rounded-lg font-mono text-xs">
                        ✕ Annulla
                      </button>
                      <button onClick={saveToSupabase}
                        className="px-4 py-1.5 bg-[#8b5cf6] hover:bg-[#7c3aed]
                          text-white rounded-lg font-mono text-xs font-bold transition-colors">
                        💾 Salva su Supabase ({parsed.length})
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                    {parsed.map(obj => (
                      <div key={obj.obj_id}
                        className="bg-[#111827] border border-[#1e3a5f] rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <span className="font-mono text-[10px] text-[#8899aa]">{obj.obj_id}</span>
                            <p className="font-mono text-white text-xs font-bold">{obj.nome}</p>
                          </div>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ color: facColor(obj.faction), backgroundColor: facColor(obj.faction) + '20' }}>
                            {facFlag(obj.faction)} {obj.faction}
                          </span>
                        </div>
                        <p className="font-mono text-[#8899aa] text-[10px] leading-relaxed">
                          {obj.descrizione.slice(0, 100)}…
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[10px] text-[#f59e0b]">
                            🏆 {obj.punti} pt
                          </span>
                          <span className="font-mono text-[10px]"
                            style={{ color: diffColor(obj.difficolta) }}>
                            {diffIcon(obj.difficolta)} {obj.difficolta}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saving */}
              {step === 'saving' && (
                <div className="text-center py-10">
                  <div className="inline-block w-8 h-8 border-2 border-[#8b5cf6] border-t-transparent
                    rounded-full animate-spin mb-3" />
                  <p className="font-mono text-[#8899aa] text-sm">Salvataggio su Supabase…</p>
                </div>
              )}

              {/* Done */}
              {step === 'done' && stats && (
                <div className="bg-[#111827] border border-[#22c55e] rounded-xl p-5 text-center space-y-3">
                  <p className="text-3xl">✅</p>
                  <p className="font-mono text-[#22c55e] font-bold text-base">
                    Caricamento completato!
                  </p>
                  <div className="flex justify-center gap-6 font-mono text-sm">
                    <span className="text-white">Tot: <b>{stats.total}</b></span>
                    <span className="text-[#22c55e]">Salvati: <b>{stats.saved}</b></span>
                    {stats.errors.length > 0 && (
                      <span className="text-[#ef4444]">Errori: <b>{stats.errors.length}</b></span>
                    )}
                  </div>
                  {stats.errors.length > 0 && (
                    <div className="text-left bg-[#ef444415] border border-[#ef4444] rounded-lg p-3">
                      {stats.errors.map((e, i) => (
                        <p key={i} className="font-mono text-[#ef4444] text-[10px]">⚠️ {e}</p>
                      ))}
                    </div>
                  )}
                  <button onClick={() => { setStep('idle'); setParsed([]); setStats(null); }}
                    className="px-4 py-2 bg-[#22c55e20] border border-[#22c55e] text-[#22c55e]
                      hover:bg-[#22c55e40] rounded-lg font-mono text-xs font-bold transition-colors">
                    ↩ Carica altro file
                  </button>
                </div>
              )}

              {/* Formato colonne */}
              <div className="bg-[#111827] border border-[#1e3a5f] rounded-xl p-4">
                <p className="font-mono text-[#8899aa] text-xs font-bold mb-2">
                  📋 Colonne del template (ordine obbligatorio)
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {OBJ_EXCEL_COLUMNS.map(col => (
                    <div key={col.key}
                      className="flex items-center gap-2 font-mono text-[10px]">
                      <span className="text-[#8b5cf6] font-bold w-[160px] shrink-0">
                        {col.label}
                      </span>
                      <span className="text-[#8899aa] truncate">{col.example}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Card singolo obiettivo ───────────────────────────────────────────────────
interface ObjCardProps {
  obj: ObiettivoSegreto;
  facColor: (f: ObjFazione) => string;
  facFlag: (f: ObjFazione) => string;
  diffColor: (d: ObjDifficolta) => string;
  diffIcon: (d: ObjDifficolta) => string;
}

function ObjCard({ obj, facColor, facFlag, diffColor, diffIcon }: ObjCardProps) {
  const [expanded, setExpanded] = useState(false);
  const fColor = facColor(obj.faction);

  return (
    <div
      className="bg-[#111827] rounded-xl border transition-all cursor-pointer"
      style={{ borderColor: fColor + '40' }}
      onClick={() => setExpanded(!expanded)}>

      {/* Header card */}
      <div className="p-3 flex items-start gap-3">
        {/* Icona fazione */}
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: fColor + '20', border: `1px solid ${fColor}40` }}>
          {facFlag(obj.faction)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Nome + punti */}
          <div className="flex items-start justify-between gap-2">
            <p className="font-mono text-white text-xs font-bold leading-snug">
              {obj.nome}
            </p>
            <span className="font-mono text-[11px] font-black shrink-0 px-1.5 py-0.5 rounded-md"
              style={{ color: '#f59e0b', backgroundColor: '#f59e0b20' }}>
              🏆 {obj.punti}
            </span>
          </div>

          {/* Fazione + difficoltà */}
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ color: fColor, backgroundColor: fColor + '20' }}>
              {obj.faction}
            </span>
            <span className="font-mono text-[9px]"
              style={{ color: diffColor(obj.difficolta) }}>
              {diffIcon(obj.difficolta)} {obj.difficolta}
            </span>
            <span className="font-mono text-[9px] text-[#8899aa] ml-auto">
              {obj.obj_id}
            </span>
          </div>

          {/* Descrizione (compatta) */}
          <p className="font-mono text-[#8899aa] text-[10px] mt-1.5 leading-relaxed">
            {expanded ? obj.descrizione : obj.descrizione.slice(0, 80) + (obj.descrizione.length > 80 ? '…' : '')}
          </p>

          {/* Dettagli espansi */}
          {expanded && obj.condizione_note && (
            <div className="mt-2 bg-[#0d1424] border border-[#1e3a5f] rounded-lg p-2">
              <p className="font-mono text-[9px] text-[#f59e0b] font-bold mb-0.5">📋 Come verificare</p>
              <p className="font-mono text-[#8899aa] text-[9px] leading-relaxed">
                {obj.condizione_note}
              </p>
              {obj.condizione_tipo && (
                <div className="flex gap-2 mt-1">
                  <span className="font-mono text-[8px] text-[#8b5cf6] bg-[#8b5cf620] px-1.5 py-0.5 rounded">
                    {obj.condizione_tipo}
                  </span>
                  {obj.condizione_campo && (
                    <span className="font-mono text-[8px] text-[#8899aa] bg-[#ffffff10] px-1.5 py-0.5 rounded">
                      {obj.condizione_campo} {obj.condizione_op} {obj.condizione_valore}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <span className="text-[#8899aa] font-mono text-xs shrink-0 pt-0.5">
          {expanded ? '▲' : '▼'}
        </span>
      </div>
    </div>
  );
}
