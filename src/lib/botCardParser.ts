// =============================================
// LINEA ROSSA — Parser Carte BOT
// Legge un file Excel e restituisce BotCard[]
// Colonne attese: ID | Fazione | Mazzo | Condizione | Priorità 1 | Priorità 2
// =============================================

import * as XLSX from 'xlsx';

// ─── Tipo pubblico ─────────────────────────────────────────────────────────
export interface BotCard {
  id: string;
  faction: string;
  deck: string;
  condition: string;
  priority_1: string;
  priority_2: string;
}

export interface BotCardParseResult {
  cards: BotCard[];
  errors: string[];
  warnings: string[];
}

// ─── Fazioni valide ────────────────────────────────────────────────────────
const VALID_FACTIONS = new Set([
  'Iran',
  'Coalizione Occidentale (USA)',
  'Coalizione',
  'Unione Europea',
  'Europa',
  'Russia-Cina',
  'Russia',
  'Cina',
  'Israele',
]);

// Normalizza nomi fazione verso il formato DB
function normalizeFaction(raw: string): string {
  const s = raw.trim();
  if (s === 'Coalizione') return 'Coalizione Occidentale (USA)';
  if (s === 'Europa')     return 'Unione Europea';
  if (s === 'Russia')     return 'Russia-Cina';
  if (s === 'Cina')       return 'Russia-Cina';
  return s;
}

// ─── Regex per riconoscere righe separatore (non sono carte) ──────────────
const SEP_REGEX = /^(🇮🇷|🇺🇸|🇪🇺|🇷🇺|🇨🇳|🇮🇱|\s*(IRAN|COALIZIONE|EUROPA|RUSSIA|CINA|ISRAELE))/i;
const ID_REGEX  = /^[A-Z]{2,4}-[A-Z]{2,5}-\d{2,3}$/;

// ─── Parser principale ─────────────────────────────────────────────────────
export function parseBotCardsExcel(file: File): Promise<BotCardParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({ cards: [], errors: ['File vuoto o non leggibile.'], warnings: [] });
          return;
        }

        const wb = XLSX.read(data, { type: 'binary' });

        // Cerca foglio "Carte BOT" o il primo foglio disponibile
        const sheetName =
          wb.SheetNames.find((n) => n.toLowerCase().includes('carte') || n.toLowerCase().includes('bot')) ??
          wb.SheetNames[0];

        if (!sheetName) {
          resolve({ cards: [], errors: ['Nessun foglio trovato nel file.'], warnings: [] });
          return;
        }

        const ws = wb.Sheets[sheetName];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (!rows || rows.length < 3) {
          resolve({ cards: [], errors: ['Il foglio è vuoto o ha meno di 3 righe.'], warnings: [] });
          return;
        }

        // Trova la riga di intestazione (contiene "ID" nella prima colonna)
        let headerRow = -1;
        for (let i = 0; i < Math.min(5, rows.length); i++) {
          const first = String((rows[i] as string[])[0] ?? '').trim().toUpperCase();
          if (first === 'ID') { headerRow = i; break; }
        }

        if (headerRow === -1) {
          resolve({ cards: [], errors: ['Intestazione "ID" non trovata nelle prime 5 righe.'], warnings: [] });
          return;
        }

        // Mappa indici colonne
        const headers = (rows[headerRow] as string[]).map((h) => String(h).trim().toLowerCase());
        const idx = {
          id:         headers.findIndex((h) => h === 'id'),
          faction:    headers.findIndex((h) => h.includes('fazione')),
          deck:       headers.findIndex((h) => h.includes('mazzo')),
          condition:  headers.findIndex((h) => h.includes('condizione')),
          priority_1: headers.findIndex((h) => h.includes('priorit') && (h.includes('1') || h.endsWith('à 1'))),
          priority_2: headers.findIndex((h) => h.includes('priorit') && (h.includes('2') || h.endsWith('à 2'))),
        };

        const missing = Object.entries(idx)
          .filter(([, v]) => v === -1)
          .map(([k]) => k);
        if (missing.length > 0) {
          resolve({
            cards: [],
            errors: [`Colonne mancanti: ${missing.join(', ')}. Verifica il formato del file.`],
            warnings: [],
          });
          return;
        }

        const cards: BotCard[] = [];
        const errors: string[] = [];
        const warnings: string[] = [];

        for (let r = headerRow + 1; r < rows.length; r++) {
          const row = rows[r] as string[];
          const rawId = String(row[idx.id] ?? '').trim();

          // Salta righe vuote o separatori
          if (!rawId) continue;
          if (SEP_REGEX.test(rawId)) continue;
          if (rawId.startsWith('⬆') || rawId.startsWith('📦')) continue;

          // Validazione ID
          if (!ID_REGEX.test(rawId)) {
            warnings.push(`Riga ${r + 1}: ID "${rawId}" non rispetta il formato atteso (es. IR-ECO-01) — riga saltata.`);
            continue;
          }

          const rawFaction = String(row[idx.faction] ?? '').trim();
          const faction = normalizeFaction(rawFaction);

          if (!VALID_FACTIONS.has(faction) && !VALID_FACTIONS.has(rawFaction)) {
            warnings.push(`Riga ${r + 1}: fazione "${rawFaction}" non riconosciuta — carta inclusa comunque.`);
          }

          const deck       = String(row[idx.deck]       ?? '').trim();
          const condition  = String(row[idx.condition]  ?? '').trim();
          const priority_1 = String(row[idx.priority_1] ?? '').trim();
          const priority_2 = String(row[idx.priority_2] ?? '').trim();

          if (!condition) {
            warnings.push(`Carta ${rawId}: campo "Condizione" vuoto.`);
          }
          if (!priority_1) {
            errors.push(`Carta ${rawId}: "Priorità 1" obbligatoria è vuota — carta saltata.`);
            continue;
          }

          cards.push({ id: rawId, faction, deck, condition, priority_1, priority_2 });
        }

        resolve({ cards, errors, warnings });
      } catch (err) {
        resolve({
          cards: [],
          errors: [`Errore durante il parsing: ${err instanceof Error ? err.message : String(err)}`],
          warnings: [],
        });
      }
    };

    reader.onerror = () => {
      resolve({ cards: [], errors: ['Impossibile leggere il file.'], warnings: [] });
    };

    reader.readAsBinaryString(file);
  });
}
