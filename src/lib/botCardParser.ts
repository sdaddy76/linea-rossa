// =============================================
// LINEA ROSSA — Parser Carte BOT v2
// Colonne attese nel foglio Excel:
//   ID Carta | Fazione | Priorità Mazzo | Nome Mazzo
//   Condizione Mazzo | Condizione Carta | Azione Priorità 1 | Azione Priorità 2
// =============================================

import * as XLSX from 'xlsx';

export interface BotCard {
  id: string;
  faction: string;
  deck_priority: number;
  deck_name: string;
  deck_condition: string;
  card_condition: string;
  priority_1: string;
  priority_2: string;
}

export interface BotCardParseResult {
  cards: BotCard[];
  errors: string[];
  warnings: string[];
}

// ─── Fazioni valide ──────────────────────────────────────────────────────────
const VALID_FACTIONS = new Set([
  'Iran', 'Coalizione Occidentale (USA)', 'Coalizione',
  'Unione Europea', 'Europa', 'Russia-Cina', 'Israele',
]);

function normalizeFaction(raw: string): string {
  const s = raw.trim();
  const map: Record<string, string> = {
    'Coalizione':  'Coalizione Occidentale (USA)',
    'Europa':      'Unione Europea',
    'Russia':      'Russia-Cina',
    'Cina':        'Russia-Cina',
  };
  return map[s] ?? s;
}

// ─── Riconosce righe separatore (non sono carte) ─────────────────────────────
const SEP_REGEX = /^(🇮🇷|🇺🇸|🇪🇺|🇷🇺|🇨🇳|🇮🇱|📦|\s*(IRAN|COALIZIONE|EUROPA|RUSSIA|CINA|ISRAELE))/i;
const ID_REGEX  = /^[A-Z]{2,4}-[A-Z]{2,5}-\d{2,3}$/;

// ─── Header lookup (cerca per parola chiave, tollerante alle varianti) ───────
function findCol(headers: string[], ...keywords: string[]): number {
  return headers.findIndex((h) =>
    keywords.some((kw) => h.toLowerCase().includes(kw.toLowerCase()))
  );
}

export function parseBotCardsExcel(file: File): Promise<BotCardParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) { resolve({ cards: [], errors: ['File vuoto.'], warnings: [] }); return; }

        const wb = XLSX.read(data, { type: 'binary' });
        const sheetName =
          wb.SheetNames.find((n) => n.toLowerCase().includes('carte') || n.toLowerCase().includes('bot'))
          ?? wb.SheetNames[0];

        if (!sheetName) { resolve({ cards: [], errors: ['Nessun foglio trovato.'], warnings: [] }); return; }

        const ws = wb.Sheets[sheetName];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // Trova riga header (contiene "ID" come prima colonna)
        let headerRow = -1;
        for (let i = 0; i < Math.min(6, rows.length); i++) {
          const first = String((rows[i] as string[])[0] ?? '').trim().toUpperCase();
          if (first === 'ID' || first === 'ID CARTA') { headerRow = i; break; }
        }
        if (headerRow === -1) {
          resolve({ cards: [], errors: ['Intestazione "ID Carta" non trovata nelle prime 6 righe.'], warnings: [] });
          return;
        }

        const headers = (rows[headerRow] as string[]).map((h) => String(h ?? '').trim());

        const idx = {
          id:             findCol(headers, 'id carta', 'id'),
          faction:        findCol(headers, 'fazione'),
          deck_priority:  findCol(headers, 'priorità mazzo', 'priorita mazzo', 'priorità', 'deck_priority'),
          deck_name:      findCol(headers, 'nome mazzo', 'mazzo'),
          deck_condition: findCol(headers, 'condizione mazzo', 'deck_condition'),
          card_condition: findCol(headers, 'condizione carta', 'card_condition', 'condizione'),
          priority_1:     findCol(headers, 'azione priorità 1', 'priorità 1', 'priority_1', 'p1'),
          priority_2:     findCol(headers, 'azione priorità 2', 'priorità 2', 'priority_2', 'p2'),
        };

        const missing = Object.entries(idx).filter(([, v]) => v === -1).map(([k]) => k);
        if (missing.length > 0) {
          resolve({ cards: [], errors: [`Colonne mancanti: ${missing.join(', ')}`], warnings: [] });
          return;
        }

        const cards: BotCard[] = [];
        const errors: string[] = [];
        const warnings: string[] = [];

        for (let r = headerRow + 1; r < rows.length; r++) {
          const row = rows[r] as string[];
          const rawId = String(row[idx.id] ?? '').trim();

          if (!rawId) continue;
          if (SEP_REGEX.test(rawId) || rawId.startsWith('⬆') || rawId.startsWith('📦')) continue;
          if (!ID_REGEX.test(rawId)) {
            warnings.push(`Riga ${r + 1}: ID "${rawId}" non valido — saltato.`);
            continue;
          }

          const faction = normalizeFaction(String(row[idx.faction] ?? '').trim());
          const deck_priority = parseInt(String(row[idx.deck_priority] ?? '0')) || 0;
          const deck_name      = String(row[idx.deck_name]      ?? '').trim();
          const deck_condition = String(row[idx.deck_condition]  ?? '').trim();
          const card_condition = String(row[idx.card_condition]  ?? '').trim();
          const priority_1     = String(row[idx.priority_1]      ?? '').trim();
          const priority_2     = String(row[idx.priority_2]      ?? '').trim();

          if (!VALID_FACTIONS.has(faction)) warnings.push(`Carta ${rawId}: fazione "${faction}" non riconosciuta.`);
          if (!deck_condition) warnings.push(`Carta ${rawId}: Condizione Mazzo vuota.`);
          if (!card_condition) warnings.push(`Carta ${rawId}: Condizione Carta vuota.`);
          if (!priority_1) { errors.push(`Carta ${rawId}: Azione P1 obbligatoria mancante — saltato.`); continue; }

          cards.push({ id: rawId, faction, deck_priority, deck_name, deck_condition, card_condition, priority_1, priority_2 });
        }

        resolve({ cards, errors, warnings });
      } catch (err) {
        resolve({ cards: [], errors: [`Parsing fallito: ${err instanceof Error ? err.message : String(err)}`], warnings: [] });
      }
    };

    reader.onerror = () => resolve({ cards: [], errors: ['Impossibile leggere il file.'], warnings: [] });
    reader.readAsBinaryString(file);
  });
}
