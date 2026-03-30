// =============================================
// LINEA ROSSA — Gestore Libreria Carte
// Upload Excel → preview → salva su Supabase
// =============================================
import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { normalizeSeq, describeSeq, type SeqDelta } from '@/lib/sequenceDelta';
import { serializeRowForDb } from '@/lib/libraryToGameCard';

// ─── Tipi ────────────────────────────────────
export interface CardLibraryRow {
  card_id: string;
  card_name: string;
  faction: string;
  card_type: string;
  deck_type: string;
  op_points: number;
  description: string;
  // Tracciati globali — accettano numero fisso o sequenza semicolon es. "1;1;2;2;3"
  delta_nucleare: SeqDelta;
  delta_sanzioni: SeqDelta;
  delta_opinione: SeqDelta;
  delta_defcon: SeqDelta;
  delta_risorse: SeqDelta;
  delta_stabilita: SeqDelta;
  // Plancia Iran
  iran_risorse_eco: SeqDelta;
  iran_forze_mil: SeqDelta;
  iran_stab_int: SeqDelta;
  iran_tech_nucleare: SeqDelta;
  iran_asse_resist: SeqDelta;
  // Plancia Coalizione
  coal_risorse_mil: SeqDelta;
  coal_infl_dipl: SeqDelta;
  coal_tech_avanz: SeqDelta;
  coal_supp_pubblico: SeqDelta;
  coal_alleanze: SeqDelta;
  // Plancia Europa
  ue_infl_dipl: SeqDelta;
  ue_aiuti_uman: SeqDelta;
  ue_stab_energ: SeqDelta;
  ue_coesione_int: SeqDelta;
  ue_pol_multilat: SeqDelta;
  // Plancia Cina
  cina_pot_eco: SeqDelta;
  cina_infl_comm: SeqDelta;
  cina_cyber: SeqDelta;
  cina_stab_rotte: SeqDelta;
  cina_progetti_bri: SeqDelta;
  // Plancia Russia
  russia_infl_mil: SeqDelta;
  russia_energia: SeqDelta;
  russia_veto_onu: SeqDelta;
  russia_stab_eco: SeqDelta;
  russia_op_spec: SeqDelta;
  // Carte collegate
  linked_card_id: string;
  linked_effect: string;
}

// ─── Colonne del template ─────────────────────
// L'ordine corrisponde alle colonne del file Excel
const EXCEL_COLUMNS: { key: keyof CardLibraryRow; label: string; example: string }[] = [
  // INFO CARTA
  { key: 'card_id',          label: 'Codice',           example: 'C001'         },
  { key: 'card_name',        label: 'Nome Carta',        example: 'Arricchimento Uranio 60%' },
  { key: 'faction',          label: 'Fazione',           example: 'Iran'         },
  { key: 'card_type',        label: 'Tipo Carta',        example: 'Militare'     },
  { key: 'deck_type',        label: 'Mazzo',             example: 'base'         },
  { key: 'op_points',        label: 'Punti OP',          example: '3'            },
  { key: 'description',      label: 'Descrizione',       example: 'Accelerazione programma nucleare' },
  // TRACCIATI GLOBALI
  { key: 'delta_nucleare',   label: 'Δ Nucleare (1-15)',  example: '2'            },
  { key: 'delta_sanzioni',   label: 'Δ Sanzioni (1-10)',  example: ''             },
  { key: 'delta_opinione',   label: 'Δ Opinione (-10/+10)', example: ''           },
  { key: 'delta_defcon',     label: 'Δ DEFCON (10-1)',    example: ''             },
  { key: 'delta_risorse',    label: 'Δ Risorse (1-10)',   example: ''             },
  { key: 'delta_stabilita',  label: 'Δ Stab.Int (1-10)', example: ''             },
  // IRAN
  { key: 'iran_risorse_eco',  label: 'Risorse Eco',       example: ''   },
  { key: 'iran_forze_mil',    label: 'Forze Mil',         example: '+1' },
  { key: 'iran_stab_int',     label: 'Stab Int',          example: ''   },
  { key: 'iran_tech_nucleare',label: 'Tech Nucleare',     example: ''   },
  { key: 'iran_asse_resist',  label: 'Asse Resist',       example: '+1' },
  // COALIZIONE
  { key: 'coal_risorse_mil',  label: 'Risorse Mil',       example: '-1' },
  { key: 'coal_infl_dipl',    label: 'Infl Dipl',         example: ''   },
  { key: 'coal_tech_avanz',   label: 'Tech Avanz',        example: ''   },
  { key: 'coal_supp_pubblico',label: 'Supp Pubblico',     example: ''   },
  { key: 'coal_alleanze',     label: 'Alleanze',          example: ''   },
  // EUROPA
  { key: 'ue_infl_dipl',      label: 'Infl Dipl',         example: ''   },
  { key: 'ue_aiuti_uman',     label: 'Aiuti Uman',        example: ''   },
  { key: 'ue_stab_energ',     label: 'Stab Energ',        example: ''   },
  { key: 'ue_coesione_int',   label: 'Coesione Int',      example: ''   },
  { key: 'ue_pol_multilat',   label: 'Pol Multilat',      example: ''   },
  // CINA
  { key: 'cina_pot_eco',      label: 'Pot Eco',           example: ''   },
  { key: 'cina_infl_comm',    label: 'Infl Comm',         example: ''   },
  { key: 'cina_cyber',        label: 'Cyber',             example: ''   },
  { key: 'cina_stab_rotte',   label: 'Stab Rotte',        example: ''   },
  { key: 'cina_progetti_bri', label: 'Progetti BRI',      example: ''   },
  // RUSSIA
  { key: 'russia_infl_mil',   label: 'Infl Mil',          example: ''   },
  { key: 'russia_energia',    label: 'Energia',           example: ''   },
  { key: 'russia_veto_onu',   label: 'Veto ONU',          example: ''   },
  { key: 'russia_stab_eco',   label: 'Stab Eco',          example: ''   },
  { key: 'russia_op_spec',    label: 'Op Spec',           example: ''   },
  // CARTE COLLEGATE
  { key: 'linked_card_id',    label: 'Codice Carta Coll.', example: 'C025' },
  { key: 'linked_effect',     label: 'Effetto Collegato',  example: 'Se giocata con C025: +1 TNI' },
];

// ─── Valori validi per fazione e tipo ─────────
const VALID_FACTIONS  = new Set(['Iran','Coalizione','Russia','Cina','Europa','Neutrale']);
const VALID_TYPES     = new Set(['Militare','Diplomatico','Economico','Segreto','Media','Evento','Politico']);
const VALID_DECK      = new Set(['base','speciale']);
const FACTION_COLORS: Record<string, string> = {
  Iran:'#22c55e', Coalizione:'#3b82f6', Russia:'#ef4444', Cina:'#f59e0b', Europa:'#8b5cf6', Neutrale:'#8899aa',
};
const TYPE_COLORS: Record<string, string> = {
  Militare:'#ef4444', Diplomatico:'#3b82f6', Economico:'#f59e0b',
  Segreto:'#8b5cf6', Media:'#ec4899', Evento:'#f97316', Politico:'#6b7280',
};

// ─── Helper: parsing sicuro numero ────────────
const toInt = (v: unknown): number => {
  const n = Number(v);
  return isNaN(n) ? 0 : Math.trunc(n);
};
const toStr = (v: unknown): string =>
  v == null ? '' : String(v).trim();
// toSeq: accetta sia numero che stringa con ';' (es. "1;1;2;2;3")
const toSeq = (v: unknown): SeqDelta => normalizeSeq(v);

// ─── Parse riga Excel → CardLibraryRow ────────
function parseRow(row: Record<string, unknown>): CardLibraryRow {
  // g() cerca prima per label italiano, poi per key
  const g = (label: string, key: string = '') => {
    if (row[label] !== undefined && row[label] !== '') return row[label];
    if (key && row[key] !== undefined) return row[key];
    return '';
  };
  return {
    card_id:             toStr(g('Codice',              'card_id')),
    card_name:           toStr(g('Nome Carta',          'card_name')),
    faction:             toStr(g('Fazione',             'faction')),
    card_type:           toStr(g('Tipo Carta',          'card_type')),
    deck_type:           toStr(g('Mazzo',               'deck_type')) || 'base',
    op_points:           toInt(g('Punti OP',            'op_points')),
    description:         toStr(g('Descrizione',         'description')),
    // Globali
    delta_nucleare:      toSeq(g('Δ Nucleare (1-15)',   'delta_nucleare')),
    delta_sanzioni:      toSeq(g('Δ Sanzioni (1-10)',   'delta_sanzioni')),
    delta_opinione:      toSeq(g('Δ Opinione (-10/+10)','delta_opinione')),
    delta_defcon:        toSeq(g('Δ DEFCON (10-1)',     'delta_defcon')),
    delta_risorse:       toSeq(g('Δ Risorse (1-10)',    'delta_risorse')),
    delta_stabilita:     toSeq(g('Δ Stab.Int (1-10)',   'delta_stabilita')),
    // Iran
    iran_risorse_eco:    toSeq(g('Risorse Eco',         'iran_risorse_eco') || g('Risorse Economiche', '')),
    iran_forze_mil:      toSeq(g('Forze Mil',           'iran_forze_mil')),
    iran_stab_int:       toSeq(g('Stab Int',            'iran_stab_int')    || g('Indicatore Stabilità interna', '')),
    iran_tech_nucleare:  toSeq(g('Tech Nucleare',       'iran_tech_nucleare')),
    iran_asse_resist:    toSeq(g('Asse Resist',         'iran_asse_resist')),
    // Coalizione
    coal_risorse_mil:    toSeq(g('Risorse Mil',         'coal_risorse_mil')),
    coal_infl_dipl:      toSeq(g('Infl Dipl',           'coal_infl_dipl')),
    coal_tech_avanz:     toSeq(g('Tech Avanz',          'coal_tech_avanz')),
    coal_supp_pubblico:  toSeq(g('Supp Pubblico',       'coal_supp_pubblico')),
    coal_alleanze:       toSeq(g('Alleanze',            'coal_alleanze')),
    // Europa — accetta sia 'Infl Dipl UE' (file compilato) sia 'Infl Dipl' (template sito)
    ue_infl_dipl:        toSeq(g('Infl Dipl UE', '') || g('Infl Dipl', 'ue_infl_dipl')),
    ue_aiuti_uman:       toSeq(g('Aiuti Uman',          'ue_aiuti_uman')),
    ue_stab_energ:       toSeq(g('Stab Energ',          'ue_stab_energ')),
    ue_coesione_int:     toSeq(g('Coesione Int',        'ue_coesione_int')),
    ue_pol_multilat:     toSeq(g('Pol Multilat',        'ue_pol_multilat')),
    // Cina
    cina_pot_eco:        toSeq(g('Pot Eco',             'cina_pot_eco')),
    cina_infl_comm:      toSeq(g('Infl Comm',           'cina_infl_comm')),
    cina_cyber:          toSeq(g('Cyber',               'cina_cyber') || g('Cyber Warfare', '')),
    cina_stab_rotte:     toSeq(g('Stab Rotte',          'cina_stab_rotte')),
    cina_progetti_bri:   toSeq(g('Progetti BRI',        'cina_progetti_bri')),
    // Russia
    russia_infl_mil:     toSeq(g('Infl Mil',            'russia_infl_mil') || g('Influenza Militare', '')),
    russia_energia:      toSeq(g('Energia',             'russia_energia')   || g('Energia/Risorse', '')),
    russia_veto_onu:     toSeq(g('Veto ONU',            'russia_veto_onu')  || g('Vero Onu', '')),
    russia_stab_eco:     toSeq(g('Stab Eco',            'russia_stab_eco')  || g('Stab. Econo.', '')),
    russia_op_spec:      toSeq(g('Op Spec',             'russia_op_spec')),
    // Collegate
    linked_card_id:      toStr(g('Codice Carta Coll.',  'linked_card_id')),
    linked_effect:       toStr(g('Effetto Collegato',   'linked_effect')),
  };
}

// ─── Validazione riga ──────────────────────────
interface RowError { row: number; field: string; msg: string }
function validateRow(r: CardLibraryRow, idx: number): RowError[] {
  const errors: RowError[] = [];
  const row = idx + 2; // +2 perché idx 0 = riga 2 Excel (riga 1 = intestazioni)
  if (!r.card_id)                         errors.push({ row, field:'Codice Carta',   msg:'obbligatorio' });
  if (!r.card_name)                       errors.push({ row, field:'Nome Carta',     msg:'obbligatorio' });
  if (!VALID_FACTIONS.has(r.faction))     errors.push({ row, field:'Fazione',        msg:`"${r.faction}" non valido. Usa: ${[...VALID_FACTIONS].join(', ')}` });
  if (!VALID_TYPES.has(r.card_type))      errors.push({ row, field:'Tipo Carta',     msg:`"${r.card_type}" non valido. Usa: ${[...VALID_TYPES].join(', ')}` });
  if (!VALID_DECK.has(r.deck_type))       errors.push({ row, field:'Mazzo',          msg:`"${r.deck_type}" non valido. Usa: base o speciale` });
  if (r.op_points < 1 || r.op_points > 5) errors.push({ row, field:'Punti Op.',     msg:`${r.op_points} fuori range 1-5` });
  return errors;
}

// ─── Download template Excel ──────────────────
function downloadTemplate() {
  // Riga intestazioni
  const headers = EXCEL_COLUMNS.map(c => c.label);
  // Riga esempio
  const example = EXCEL_COLUMNS.map(c => c.example);
  // Seconda riga esempio con carta collegata
  const example2 = [
    'C002','Proxy Hezbollah','Iran','Militare','base','3','Attivazione milizie in Libano',
    '0','0','-1','1','-1','0',
    'C001','1','0','-1','0','0','0','Bonus: +1 nucleare se C001 già giocata',
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, example, example2]);

  // Larghezze colonne
  ws['!cols'] = EXCEL_COLUMNS.map((c, i) => ({
    wch: i === 1 ? 30 : i === 6 ? 35 : i >= 14 ? 22 : 18,
  }));

  // Colore intestazioni (usando note come workaround per compatibilità)
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Carte');

  // Foglio guida valori
  const guideData = [
    ['CAMPO', 'VALORI AMMESSI', 'NOTE'],
    ['Fazione', 'Iran | Coalizione | Russia | Cina | Europa | Neutrale', 'Sensibile alle maiuscole'],
    ['Tipo Carta', 'Militare | Diplomatico | Economico | Segreto | Media | Evento | Politico', ''],
    ['Mazzo', 'base | speciale', '"speciale" per carte con effetti unici'],
    ['Punti Operazione', '1 – 5', 'Numero intero'],
    ['Δ Tracciati', 'Numero intero (positivo o negativo)', '0 = nessun effetto'],
    ['Carta Collegata', 'Codice carta (es. C001)', 'Lascia vuoto se non applicabile'],
    ['Δ Tracciati (collegata)', 'Come Δ Tracciati', 'Effetto AGGIUNTIVO quando la carta collegata è in gioco'],
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
  wsGuide['!cols'] = [{ wch: 22 }, { wch: 60 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Guida');

  // Genera il file come base64 data URI
  // (l'unico metodo che funziona sia da iframe sandbox che dal browser diretto)
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
  const dataUri =
    'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + wbout;

  // Apre il data URI in una nuova scheda tramite window.top per uscire dall'iframe sandbox
  const target = (window.top ?? window);
  target.open(dataUri, '_blank');
}

// ─── COMPONENTE PRINCIPALE ────────────────────
interface Props { onClose: () => void }

type UploadStep = 'idle' | 'preview' | 'uploading' | 'done' | 'error';

export default function CardLibraryManager({ onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<UploadStep>('idle');
  const [parsedCards, setParsedCards] = useState<CardLibraryRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<RowError[]>([]);
  const [fileName, setFileName] = useState('');
  const [uploadResult, setUploadResult] = useState({ inserted: 0, updated: 0, errors: 0 });
  const [uploadError, setUploadError] = useState('');
  const [overwrite, setOverwrite] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [filterFaction, setFilterFaction] = useState('Tutte');
  const [existingCount, setExistingCount] = useState<number | null>(null);
  const [templateDataUri, setTemplateDataUri] = useState<string>('');

  // Genera il data URI del template una volta al mount (per il link diretto)
  // e carica il conteggio carte esistenti
  useState(() => {
    supabase.from('cards_library').select('card_id', { count: 'exact', head: true })
      .then(({ count }) => setExistingCount(count ?? 0));

    // Pre-genera il template come data URI scaricabile direttamente via <a href>
    try {
      const headers = EXCEL_COLUMNS.map(c => c.label);
      const example = EXCEL_COLUMNS.map(c => c.example);
      const ws = XLSX.utils.aoa_to_sheet([headers, example]);
      ws['!cols'] = EXCEL_COLUMNS.map((_, i) => ({ wch: i === 1 ? 30 : i === 6 ? 35 : 18 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Carte');
      const guideData = [
        ['CAMPO', 'VALORI AMMESSI', 'NOTE'],
        ['Fazione', 'Iran | Coalizione | Russia | Cina | Europa | Neutrale', 'Sensibile alle maiuscole'],
        ['Tipo Carta', 'Militare | Diplomatico | Economico | Segreto | Media | Evento | Politico', ''],
        ['Mazzo', 'base | speciale', ''],
        ['Punti Operazione', '1 – 5', 'Numero intero'],
        ['Δ Tracciati', 'Numero intero (positivo o negativo)', '0 = nessun effetto'],
        ['Carta Collegata', 'Codice carta (es. C001)', 'Lascia vuoto se non applicabile'],
      ];
      const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
      wsGuide['!cols'] = [{ wch: 22 }, { wch: 60 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, wsGuide, 'Guida');
      const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      setTemplateDataUri('data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + b64);
    } catch (_) { /* silently ignore */ }
  });

  // ── Parsing file Excel ────────────────────────
  const parseFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });

        // Cerca il foglio "Carte" — altrimenti usa il primo foglio non vuoto
        const targetSheet =
          wb.SheetNames.find(n => n.toLowerCase() === 'carte') ??
          wb.SheetNames.find(n => !n.toLowerCase().includes('guida') &&
                                  !n.toLowerCase().includes('riepilogo') &&
                                  !n.toLowerCase().includes('legenda')) ??
          wb.SheetNames[0];
        const ws = wb.Sheets[targetSheet];
        const allRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: '',
          raw: true,
        });

        // Filtra le righe completamente vuote (tutte le colonne stringa vuote o zero)
        const rows = allRows.filter(row =>
          Object.values(row).some(v => v !== '' && v !== 0 && v !== null && v !== undefined)
        );

        // Filtra le righe che sembrano separatori di sezione (card_id non è formato valido)
        // oppure righe dove il Codice inizia con '━' o '─' (separatori)
        const dataRows = rows.filter(row => {
          const codice = String(row['Codice'] ?? row['card_id'] ?? '').trim();
          return codice && !codice.startsWith('━') && !codice.startsWith('─') && !codice.startsWith('=');
        });

        if (dataRows.length === 0) {
          setUploadError(`Il file non contiene righe dati valide nel foglio "${targetSheet}". Assicurati di usare il template scaricabile dal sito.`);
          setStep('error');
          return;
        }

        const cards = dataRows.map(parseRow);
        const errors: RowError[] = [];
        cards.forEach((c, i) => errors.push(...validateRow(c, i)));

        setParsedCards(cards);
        setValidationErrors(errors);
        setStep('preview');
      } catch (err) {
        setUploadError('Errore nel parsing del file. Assicurati che sia un .xlsx o .xls valido.');
        setStep('error');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      parseFile(file);
    }
  };

  // ── Upload su Supabase ───────────────────────
  const handleUpload = async () => {
    if (parsedCards.length === 0) return;
    setStep('uploading');

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    const rows = parsedCards.map(c => serializeRowForDb({
      ...c,
      uploaded_by: userId ?? null,
      // Normalizza: se linked_card_id è vuoto, metti null
      linked_card_id: c.linked_card_id || null,
    }));

    let inserted = 0, updated = 0, errors = 0;

    // Batch da 50 righe
    const BATCH = 50;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const { error } = await supabase
        .from('cards_library')
        .upsert(batch, {
          onConflict: 'card_id',
          ignoreDuplicates: false, // aggiorna se esiste
        });

      if (error) {
        console.error('Batch error:', error);
        errors += batch.length;
      } else {
        // Conta inseriti vs aggiornati non è direttamente disponibile via upsert,
        // usiamo una stima
        inserted += batch.length;
      }
    }

    setUploadResult({ inserted, updated, errors });
    setStep(errors > 0 && inserted === 0 ? 'error' : 'done');
    // Aggiorna conteggio
    const { count } = await supabase
      .from('cards_library').select('card_id', { count: 'exact', head: true });
    setExistingCount(count ?? 0);
  };

  // ── Elimina tutte le carte ────────────────────
  const handleDeleteAll = async () => {
    if (!confirm('Sei sicuro di voler eliminare TUTTE le carte dalla libreria?')) return;
    await supabase.from('cards_library').delete().neq('card_id', '___never___');
    setExistingCount(0);
    setParsedCards([]);
    setStep('idle');
  };

  // ── Filtra per anteprima ──────────────────────
  const previewCards = filterFaction === 'Tutte'
    ? parsedCards
    : parsedCards.filter(c => c.faction === filterFaction);

  const factionCounts = parsedCards.reduce<Record<string, number>>((acc, c) => {
    acc[c.faction] = (acc[c.faction] ?? 0) + 1;
    return acc;
  }, {});

  const hasErrors = validationErrors.length > 0;

  // ── Delta badge (supporta SeqDelta: numero fisso o sequenza semicolon) ──
  const DeltaBadge = ({ label, val, minVal = 1 }: { label: string; val: SeqDelta; minVal?: number }) => {
    if (!val && val !== 0) return null;
    if (val === 0 || val === '0') return null;
    const isSeq   = typeof val === 'string' && val.includes(';');
    const display = isSeq ? describeSeq(val, minVal) : (Number(val) > 0 ? `+${val}` : `${val}`);
    if (display === '—') return null;
    return (
      <span
        title={isSeq ? `Sequenza: ${val}` : undefined}
        className={`text-[10px] font-mono px-1 rounded cursor-default ${
          isSeq ? 'text-[#f59e0b] bg-[#f59e0b20] border border-[#f59e0b40]'
                : (Number(val) > 0 ? 'text-[#22c55e] bg-[#22c55e20]' : 'text-[#ef4444] bg-[#ef444420]')
        }`}>
        {label}{display}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-start justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-5xl my-4 bg-[#0d1421] border border-[#1e3a5f] rounded-2xl
        shadow-2xl shadow-[#00ff8820] overflow-hidden">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#111827] border-b border-[#1e3a5f]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🃏</span>
            <div>
              <h2 className="text-base font-bold text-white font-mono">GESTORE LIBRERIA CARTE</h2>
              <p className="text-xs text-[#8899aa] font-mono">
                Carica un file Excel per aggiornare il database delle carte
                {existingCount !== null && (
                  <span className="ml-2 text-[#00ff88]">· {existingCount} carte in DB</span>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-[#8899aa] hover:text-white text-xl leading-none px-2 py-1 rounded
              hover:bg-[#1e2a3a] transition-colors">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* ── STEP: IDLE / DRAG-DROP ── */}
          {(step === 'idle' || step === 'error') && (
            <div className="space-y-4">
              {/* Drag & drop area */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
                  transition-all duration-200 ${
                  isDragging
                    ? 'border-[#00ff88] bg-[#00ff8815] scale-[1.01]'
                    : 'border-[#1e3a5f] hover:border-[#00ff8860] hover:bg-[#111827]'
                }`}>
                <div className="text-4xl mb-3">📂</div>
                <p className="text-white font-mono font-bold text-sm">
                  Trascina il file Excel qui
                </p>
                <p className="text-[#8899aa] font-mono text-xs mt-1">
                  oppure clicca per scegliere · .xlsx / .xls
                </p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls"
                  className="hidden" onChange={handleFileChange} />
              </div>

              {step === 'error' && (
                <div className="bg-[#ef444415] border border-[#ef4444] rounded-xl p-4">
                  <p className="text-[#ef4444] font-mono text-sm">⚠️ {uploadError}</p>
                </div>
              )}

              {/* Azioni secondarie */}
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-2">
                  {/* Link diretto: click utente su <a href> non è mai bloccato dal sandbox */}
                  {templateDataUri ? (
                    <a
                      href={templateDataUri}
                      download="Template_Carte_LineaRossa.xlsx"
                      onClick={(e) => {
                        // Piano B: se il download viene bloccato, apri in nuova scheda
                        try {
                          (window.top ?? window).open(templateDataUri, '_blank');
                        } catch (_) { /* usa il comportamento default dell'<a> */ }
                        e.preventDefault();
                      }}
                      className="flex items-center gap-2 px-4 py-2 border border-[#1e3a5f]
                        hover:border-[#00ff88] text-[#8899aa] hover:text-[#00ff88]
                        font-mono text-xs rounded-lg transition-colors cursor-pointer no-underline">
                      ⬇️ Scarica Template Excel
                    </a>
                  ) : (
                    <button disabled
                      className="flex items-center gap-2 px-4 py-2 border border-[#1e3a5f]
                        text-[#334455] font-mono text-xs rounded-lg opacity-50 cursor-wait">
                      ⏳ Preparazione template...
                    </button>
                  )}
                  {existingCount !== null && existingCount > 0 && (
                    <button onClick={handleDeleteAll}
                      className="flex items-center gap-2 px-4 py-2 border border-[#ef444440]
                        hover:border-[#ef4444] text-[#ef444480] hover:text-[#ef4444]
                        font-mono text-xs rounded-lg transition-colors">
                      🗑️ Svuota DB
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="overwrite" checked={overwrite}
                    onChange={e => setOverwrite(e.target.checked)}
                    className="accent-[#00ff88]" />
                  <label htmlFor="overwrite" className="text-[#8899aa] font-mono text-xs cursor-pointer">
                    Sovrascrivi carte esistenti (stesso codice)
                  </label>
                </div>
              </div>

              {/* Guida formato */}
              <div className="bg-[#111827] border border-[#1e3a5f] rounded-xl p-4 space-y-3">
                <p className="text-xs font-mono text-[#8899aa] font-bold">📋 FORMATO ATTESO (colonne Excel)</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {EXCEL_COLUMNS.map((c, i) => (
                    <div key={c.key} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#334455] w-5 shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <div>
                        <p className="text-[10px] font-mono text-white">{c.label}</p>
                        <p className="text-[10px] font-mono text-[#445566]">es: {c.example}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: PREVIEW ── */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary barra */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#111827] border border-[#1e3a5f] rounded-lg">
                  <span className="text-sm">📄</span>
                  <span className="font-mono text-xs text-white font-bold">{fileName}</span>
                </div>
                <div className="px-3 py-1.5 bg-[#00ff8820] border border-[#00ff88] rounded-lg">
                  <span className="font-mono text-xs text-[#00ff88] font-bold">
                    {parsedCards.length} carte rilevate
                  </span>
                </div>
                {hasErrors && (
                  <div className="px-3 py-1.5 bg-[#ef444420] border border-[#ef4444] rounded-lg">
                    <span className="font-mono text-xs text-[#ef4444] font-bold">
                      ⚠️ {validationErrors.length} errori
                    </span>
                  </div>
                )}
                {/* Contatori per fazione */}
                {Object.entries(factionCounts).map(([f, n]) => (
                  <div key={f} className="px-2 py-1 rounded border text-[10px] font-mono font-bold"
                    style={{ color: FACTION_COLORS[f] ?? '#8899aa', borderColor: `${FACTION_COLORS[f] ?? '#8899aa'}40`, backgroundColor: `${FACTION_COLORS[f] ?? '#8899aa'}15` }}>
                    {f}: {n}
                  </div>
                ))}
              </div>

              {/* Errori di validazione */}
              {hasErrors && (
                <div className="bg-[#ef444415] border border-[#ef4444] rounded-xl p-4 max-h-36 overflow-y-auto">
                  <p className="text-[#ef4444] font-mono text-xs font-bold mb-2">
                    ⚠️ ERRORI DI VALIDAZIONE — Correggili nel file prima di caricare
                  </p>
                  {validationErrors.slice(0, 15).map((e, i) => (
                    <p key={i} className="text-[#ef4444] font-mono text-[10px]">
                      Riga {e.row} · {e.field}: {e.msg}
                    </p>
                  ))}
                  {validationErrors.length > 15 && (
                    <p className="text-[#ef444480] font-mono text-[10px] mt-1">
                      ...e altri {validationErrors.length - 15} errori
                    </p>
                  )}
                </div>
              )}

              {/* Filtro fazione */}
              <div className="flex flex-wrap gap-1">
                {['Tutte', ...Object.keys(factionCounts)].map(f => (
                  <button key={f} onClick={() => setFilterFaction(f)}
                    className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                      filterFaction === f
                        ? 'bg-white text-[#0a0e1a]'
                        : 'border text-[#8899aa] hover:text-white'
                    }`}
                    style={filterFaction === f ? {} : { borderColor: `${FACTION_COLORS[f] ?? '#8899aa'}40` }}>
                    {f} {f !== 'Tutte' && `(${factionCounts[f]})`}
                  </button>
                ))}
              </div>

              {/* Tabella anteprima */}
              <div className="border border-[#1e3a5f] rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-[10px] font-mono">
                    <thead className="sticky top-0 bg-[#0d1421]">
                      <tr className="border-b border-[#1e3a5f]">
                        {['#','Codice','Nome','Fazione','Tipo','Mazzo','OP','Δ☢️','Δ💰','Δ🎯','Δ🌍','Δ📦','Δ🛡','Collegata','Descrizione'].map(h => (
                          <th key={h} className="px-2 py-2 text-left text-[#8899aa] font-bold whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewCards.map((c, i) => {
                        const rowErrors = validationErrors.filter(e => e.row === i + 2);
                        const hasErr = rowErrors.length > 0;
                        return (
                          <tr key={c.card_id || i}
                            className={`border-b border-[#1e2a3a] transition-colors ${
                              hasErr ? 'bg-[#ef444410]' : 'hover:bg-[#111827]'
                            }`}>
                            <td className="px-2 py-1.5 text-[#334455]">{i + 1}</td>
                            <td className="px-2 py-1.5 text-[#00ff88] font-bold">{c.card_id || <span className="text-[#ef4444]">MANCANTE</span>}</td>
                            <td className="px-2 py-1.5 text-white max-w-[140px] truncate" title={c.card_name}>{c.card_name}</td>
                            <td className="px-2 py-1.5">
                              <span className="px-1.5 py-0.5 rounded font-bold"
                                style={{ color: FACTION_COLORS[c.faction] ?? '#8899aa', backgroundColor: `${FACTION_COLORS[c.faction] ?? '#8899aa'}20` }}>
                                {c.faction || <span className="text-[#ef4444]">!</span>}
                              </span>
                            </td>
                            <td className="px-2 py-1.5">
                              <span className="px-1.5 py-0.5 rounded"
                                style={{ color: TYPE_COLORS[c.card_type] ?? '#8899aa', backgroundColor: `${TYPE_COLORS[c.card_type] ?? '#8899aa'}20` }}>
                                {c.card_type}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-[#8899aa]">{c.deck_type}</td>
                            <td className="px-2 py-1.5 text-[#f59e0b] font-bold">{c.op_points}</td>
                            <td className="px-2 py-1.5"><DeltaBadge label="" val={c.delta_nucleare}  minVal={1}   /></td>
                            <td className="px-2 py-1.5"><DeltaBadge label="" val={c.delta_sanzioni}  minVal={1}   /></td>
                            <td className="px-2 py-1.5"><DeltaBadge label="" val={c.delta_defcon}    minVal={1}   /></td>
                            <td className="px-2 py-1.5"><DeltaBadge label="" val={c.delta_opinione}  minVal={-10} /></td>
                            <td className="px-2 py-1.5"><DeltaBadge label="" val={c.delta_risorse}   minVal={1}   /></td>
                            <td className="px-2 py-1.5"><DeltaBadge label="" val={c.delta_stabilita} minVal={1}   /></td>
                            <td className="px-2 py-1.5 text-[#8b5cf6]">{c.linked_card_id || '—'}</td>
                            <td className="px-2 py-1.5 text-[#8899aa] max-w-[140px] truncate" title={c.description}>{c.description || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pulsanti azione */}
              <div className="flex flex-wrap gap-3 items-center justify-between pt-1">
                <button onClick={() => { setStep('idle'); setParsedCards([]); setValidationErrors([]); }}
                  className="px-4 py-2 border border-[#334455] text-[#8899aa] hover:text-white
                    font-mono text-xs rounded-lg transition-colors">
                  ← Cambia file
                </button>
                <div className="flex gap-2">
                  {hasErrors && (
                    <p className="text-[#f59e0b] font-mono text-xs self-center">
                      ⚠️ Ci sono errori — puoi caricare lo stesso ma le righe errate potrebbero fallire
                    </p>
                  )}
                  <button onClick={handleUpload}
                    className={`px-6 py-2.5 font-bold font-mono rounded-lg text-sm tracking-wider
                      transition-all shadow-lg ${
                      hasErrors
                        ? 'bg-[#f59e0b] hover:bg-[#d97706] text-[#0a0e1a] shadow-[#f59e0b40]'
                        : 'bg-[#00ff88] hover:bg-[#00dd77] text-[#0a0e1a] shadow-[#00ff8840]'
                    }`}>
                    {hasErrors ? '⚠️ CARICA COMUNQUE' : `⬆️ CARICA ${parsedCards.length} CARTE`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: UPLOADING ── */}
          {step === 'uploading' && (
            <div className="text-center py-12 space-y-4">
              <div className="text-5xl animate-pulse">⬆️</div>
              <p className="text-[#00ff88] font-mono font-bold">
                Caricamento in corso...
              </p>
              <p className="text-[#8899aa] font-mono text-sm">
                Upload di {parsedCards.length} carte su Supabase
              </p>
            </div>
          )}

          {/* ── STEP: DONE ── */}
          {step === 'done' && (
            <div className="space-y-4">
              <div className="text-center py-8 space-y-3">
                <div className="text-5xl">✅</div>
                <h3 className="text-xl font-bold text-[#00ff88] font-mono">
                  Libreria aggiornata!
                </h3>
                <p className="text-[#8899aa] font-mono text-sm">
                  {uploadResult.inserted} carte caricate con successo
                  {uploadResult.errors > 0 && (
                    <span className="text-[#f59e0b]"> · {uploadResult.errors} con errori</span>
                  )}
                </p>
                {existingCount !== null && (
                  <p className="text-white font-mono text-sm font-bold">
                    📚 Totale in DB: <span className="text-[#00ff88]">{existingCount} carte</span>
                  </p>
                )}
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={() => { setStep('idle'); setParsedCards([]); setValidationErrors([]); setFileName(''); }}
                  className="px-4 py-2 border border-[#1e3a5f] text-[#8899aa] hover:text-white
                    font-mono text-xs rounded-lg transition-colors">
                  📂 Carica altro file
                </button>
                <button onClick={onClose}
                  className="px-6 py-2 bg-[#00ff88] hover:bg-[#00dd77] text-[#0a0e1a]
                    font-bold font-mono rounded-lg text-sm">
                  ✓ Chiudi
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
