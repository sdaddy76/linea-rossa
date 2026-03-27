// =============================================
// LINEA ROSSA — Gestore Libreria Carte BOT
// Upload Excel → preview → salva su Supabase (bot_cards)
// =============================================
import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parseBotCardsExcel, type BotCard } from '@/lib/botCardParser';

// ─── Colori per fazione ───────────────────────────────────────────────────
const FACTION_COLORS: Record<string, string> = {
  'Iran':                         'bg-green-100 text-green-900 border-green-300',
  'Coalizione Occidentale (USA)': 'bg-blue-100 text-blue-900 border-blue-300',
  'Unione Europea':               'bg-purple-100 text-purple-900 border-purple-300',
  'Russia-Cina':                  'bg-orange-100 text-orange-900 border-orange-300',
  'Israele':                      'bg-yellow-100 text-yellow-900 border-yellow-300',
};

const FACTION_EMOJI: Record<string, string> = {
  'Iran':                         '🇮🇷',
  'Coalizione Occidentale (USA)': '🇺🇸',
  'Unione Europea':               '🇪🇺',
  'Russia-Cina':                  '🇷🇺🇨🇳',
  'Israele':                      '🇮🇱',
};

type UploadStep = 'idle' | 'parsing' | 'preview' | 'saving' | 'done' | 'error';

interface UploadStats {
  total: number;
  saved: number;
  errors: string[];
  warnings: string[];
}

export default function BotCardLibraryManager() {
  const [step, setStep]           = useState<UploadStep>('idle');
  const [cards, setCards]         = useState<BotCard[]>([]);
  const [stats, setStats]         = useState<UploadStats | null>(null);
  const [dbCount, setDbCount]     = useState<number | null>(null);
  const [filterFaction, setFilterFaction] = useState<string>('Tutte');
  const [parseErrors, setParseErrors]     = useState<string[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Carica conteggio DB ────────────────────────────────────────────────
  const loadDbCount = useCallback(async () => {
    const { count } = await (supabase as any)
      .from('bot_cards')
      .select('id', { count: 'exact', head: true });
    setDbCount(count ?? 0);
  }, []);

  // ── Gestione file ──────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    setStep('parsing');
    setCards([]);
    setParseErrors([]);
    setParseWarnings([]);
    setStats(null);

    const result = await parseBotCardsExcel(file);

    if (result.errors.length > 0 && result.cards.length === 0) {
      setParseErrors(result.errors);
      setStep('error');
      return;
    }

    setCards(result.cards);
    setParseErrors(result.errors);
    setParseWarnings(result.warnings);
    setStep('preview');
    await loadDbCount();
  }, [loadDbCount]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ── Salvataggio su Supabase ────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setStep('saving');
    const errors: string[] = [];
    let saved = 0;
    const BATCH = 50;

    for (let i = 0; i < cards.length; i += BATCH) {
      const batch = cards.slice(i, i + BATCH).map((c) => ({
        id:         c.id,
        faction:    c.faction,
        deck:       c.deck,
        condition:  c.condition,
        priority_1: c.priority_1,
        priority_2: c.priority_2 || null,
      }));

      const { error } = await (supabase as any)
        .from('bot_cards')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        errors.push(`Batch ${Math.floor(i / BATCH) + 1}: ${error.message}`);
      } else {
        saved += batch.length;
      }
    }

    setStats({ total: cards.length, saved, errors, warnings: parseWarnings });
    setStep('done');
    await loadDbCount();
  }, [cards, parseWarnings, loadDbCount]);

  // ── Reset ──────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStep('idle');
    setCards([]);
    setStats(null);
    setParseErrors([]);
    setParseWarnings([]);
    setFilterFaction('Tutte');
  };

  // ── Cancella tutto il DB ───────────────────────────────────────────────
  const handleClearDb = async () => {
    if (!confirm('⚠️ Eliminare TUTTE le carte BOT dal database?')) return;
    await (supabase as any).from('bot_cards').delete().neq('id', '___never___');
    await loadDbCount();
    alert('Database carte BOT svuotato.');
  };

  // ── Fazioni disponibili nel caricamento ───────────────────────────────
  const factions = ['Tutte', ...Array.from(new Set(cards.map((c) => c.faction))).sort()];
  const filtered = filterFaction === 'Tutte' ? cards : cards.filter((c) => c.faction === filterFaction);

  // ─────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">🤖 Libreria Carte BOT</h2>
          <p className="text-sm text-gray-500 mt-1">
            Carica il file Excel con le carte BOT per gestione automatica delle fazioni
          </p>
        </div>
        {dbCount !== null && (
          <div className="flex items-center gap-3">
            <span className="text-sm bg-gray-100 px-3 py-1 rounded-full font-medium">
              💾 {dbCount} carte nel DB
            </span>
            {dbCount > 0 && (
              <button
                onClick={handleClearDb}
                className="text-xs text-red-600 underline hover:text-red-800"
              >
                Svuota DB
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── STEP: IDLE / DROP ZONE ─────────────────────────────────────── */}
      {(step === 'idle' || step === 'error') && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-blue-400 transition-colors cursor-pointer bg-gray-50"
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
        >
          <div className="text-4xl mb-3">📂</div>
          <p className="text-gray-600 font-medium">Trascina qui il file Excel BOT</p>
          <p className="text-sm text-gray-400 mt-1">oppure clicca per selezionare</p>
          <p className="text-xs text-gray-400 mt-2">
            Formato: <code className="bg-gray-200 px-1 rounded">Template_Upload_BOT.xlsx</code>
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      )}

      {/* Errori di parsing */}
      {parseErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="font-semibold text-red-700 mb-2">❌ Errori di parsing:</p>
          <ul className="text-sm text-red-600 list-disc list-inside space-y-1">
            {parseErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* ── STEP: PARSING ─────────────────────────────────────────────── */}
      {step === 'parsing' && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3 animate-pulse">⏳</div>
          <p className="text-gray-600">Lettura file in corso…</p>
        </div>
      )}

      {/* ── STEP: PREVIEW ─────────────────────────────────────────────── */}
      {step === 'preview' && cards.length > 0 && (
        <div className="space-y-4">
          {/* Riepilogo + warning */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-800">
                ✅ {cards.length} carte pronte per il caricamento
              </p>
              <p className="text-sm text-blue-600 mt-1">
                {Array.from(new Set(cards.map((c) => c.faction))).map((f) => {
                  const count = cards.filter((c) => c.faction === f).length;
                  return `${FACTION_EMOJI[f] ?? ''} ${f.split(' ')[0]}: ${count}`;
                }).join('  |  ')}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                💾 Salva nel DB ({cards.length} carte)
              </button>
            </div>
          </div>

          {parseWarnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-yellow-700 mb-1">⚠️ Avvisi ({parseWarnings.length}):</p>
              <ul className="text-xs text-yellow-600 list-disc list-inside space-y-0.5">
                {parseWarnings.slice(0, 5).map((w, i) => <li key={i}>{w}</li>)}
                {parseWarnings.length > 5 && <li>…e altri {parseWarnings.length - 5}</li>}
              </ul>
            </div>
          )}

          {/* Filtro fazione */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 font-medium">Filtra:</span>
            {factions.map((f) => (
              <button
                key={f}
                onClick={() => setFilterFaction(f)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  filterFaction === f
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {FACTION_EMOJI[f] ?? ''} {f} {f !== 'Tutte' ? `(${cards.filter(c => c.faction === f).length})` : `(${cards.length})`}
              </button>
            ))}
          </div>

          {/* Tabella preview */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[500px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-100 z-10">
                <tr>
                  {['ID', 'Fazione', 'Mazzo', 'Condizione', 'Priorità 1', 'Priorità 2'].map((h) => (
                    <th key={h} className="text-left px-3 py-2 font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((card, idx) => {
                  const color = FACTION_COLORS[card.faction] ?? 'bg-gray-50 text-gray-900 border-gray-200';
                  return (
                    <tr key={card.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 font-mono font-bold whitespace-nowrap">{card.id}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${color}`}>
                          {FACTION_EMOJI[card.faction] ?? ''} {card.faction.split(' ')[0]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{card.deck}</td>
                      <td className="px-3 py-2 max-w-[200px]">{card.condition}</td>
                      <td className="px-3 py-2 max-w-[260px] text-blue-700">{card.priority_1}</td>
                      <td className="px-3 py-2 max-w-[260px] text-gray-500">{card.priority_2 || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── STEP: SAVING ──────────────────────────────────────────────── */}
      {step === 'saving' && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3 animate-spin">⚙️</div>
          <p className="text-gray-600">Salvataggio in corso…</p>
          <p className="text-sm text-gray-400 mt-1">{cards.length} carte da salvare</p>
        </div>
      )}

      {/* ── STEP: DONE ────────────────────────────────────────────────── */}
      {step === 'done' && stats && (
        <div className="space-y-4">
          <div className={`rounded-lg p-5 border ${stats.errors.length === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <p className={`text-lg font-bold ${stats.errors.length === 0 ? 'text-green-800' : 'text-yellow-800'}`}>
              {stats.errors.length === 0 ? '✅' : '⚠️'} Caricamento completato
            </p>
            <div className="mt-2 space-y-1 text-sm">
              <p className="text-gray-700">🃏 Carte salvate: <strong>{stats.saved}</strong> / {stats.total}</p>
              {dbCount !== null && <p className="text-gray-700">💾 Totale nel DB: <strong>{dbCount}</strong></p>}
              {stats.errors.length > 0 && (
                <div className="mt-3">
                  <p className="font-semibold text-red-700">Errori ({stats.errors.length}):</p>
                  <ul className="text-xs text-red-600 list-disc list-inside mt-1">
                    {stats.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            📂 Carica un altro file
          </button>
        </div>
      )}
    </div>
  );
}
