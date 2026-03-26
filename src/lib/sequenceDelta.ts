// =============================================
// LINEA ROSSA — Sequenza Delta per Tracciati
//
// Permette di esprimere un delta variabile in base
// al valore corrente del tracciato, usando la notazione
// semicolonne nel file Excel.
//
// Esempi validi (tracciato 1-10):
//   "1;1;1;1;1;2;2;2;2;2"
//     → delta=1 se tracciato è 1-5, delta=2 se 6-10
//
//   "0;0;1;1;2;2;3;3;4;4"
//     → delta cresce progressivamente col valore
//
//   "-1;-1;0;0;0;1;1;1;2;2"
//     → negativo a bassi livelli, positivo ad alti
//
//   "3"  oppure  3
//     → delta fisso indipendente dal valore (compatibilità)
//
// Tracciati con range non-1:
//   DEFCON:  1-5  → sequenza di 5 valori
//   Opinione: -10..+10 → sequenza di 21 valori (indice = valore+10)
//   Nucleare: 1-15 → sequenza di 15 valori
//   Sanzioni: 1-10 → sequenza di 10 valori
//   Risorse/Stabilità: 1-10 → sequenza di 10 valori
// =============================================

export type SeqDelta = string | number;

// ─── Normalizza qualsiasi input → SeqDelta ──
export function normalizeSeq(raw: unknown): SeqDelta {
  if (raw == null || raw === '') return 0;
  if (typeof raw === 'number') return isNaN(raw) ? 0 : raw;
  const s = String(raw).trim();
  // Se contiene ';' è una sequenza, altrimenti è un numero
  if (s.includes(';')) return s;
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

// ─── Analizza la stringa e restituisce l'array di delta ──
export function parseSeq(seq: SeqDelta): number[] {
  if (typeof seq === 'number') return [seq];
  const parts = seq.split(';').map(p => {
    const n = Number(p.trim());
    return isNaN(n) ? 0 : n;
  });
  return parts.length > 0 ? parts : [0];
}

// ─── Risolve il delta per il valore corrente del tracciato ──
//
// La sequenza è indicizzata a partire da `minValue`.
// Esempio: tracciato 1-10, minValue=1
//   seq = [1,1,1,1,1,2,2,2,2,2]
//   currentValue=3 → indice=2 → delta=1
//   currentValue=7 → indice=6 → delta=2
//
// Opinione: minValue=-10
//   currentValue=0  → indice=10
//   currentValue=-5 → indice=5
//
export function resolveSeq(seq: SeqDelta, currentValue: number, minValue = 1): number {
  if (typeof seq === 'number') return seq;
  if (seq === '' || seq === '0') return 0;

  const parts = parseSeq(seq);
  if (parts.length === 1) return parts[0]; // numero singolo
  if (parts.length === 0) return 0;

  const idx = currentValue - minValue;
  // Clamp: se il valore è fuori range usa il primo o l'ultimo elemento
  if (idx < 0)              return parts[0];
  if (idx >= parts.length)  return parts[parts.length - 1];
  return parts[idx];
}

// ─── minValue per ogni tracciato ────────────
export const TRACK_MIN: Record<string, number> = {
  nucleare:  1,
  sanzioni:  1,
  defcon:    1,
  opinione:  -10,
  risorse:   1,
  stabilita: 1,
  // Plance fazione
  iran_risorse_eco:    1,
  iran_forze_mil:      1,
  iran_stab_int:       1,
  iran_tech_nucleare:  1,
  iran_asse_resist:    1,
  coal_risorse_mil:    1,
  coal_infl_dipl:      1,
  coal_tech_avanz:     1,
  coal_supp_pubblico:  1,
  coal_alleanze:       1,
  ue_infl_dipl:        1,
  ue_aiuti_uman:       1,
  ue_stab_energ:       1,
  ue_coesione_int:     1,
  ue_pol_multilat:     1,
  cina_pot_eco:        1,
  cina_infl_comm:      1,
  cina_cyber:          1,
  cina_stab_rotte:     1,
  cina_progetti_bri:   1,
  russia_infl_mil:     1,
  russia_energia:      1,
  russia_veto_onu:     1,
  russia_stab_eco:     1,
  russia_op_spec:      1,
};

// ─── Converte SeqDelta → funzione effetto GameCard ──
// Restituisce (currentValue: number) => number
export function seqToEffect(seq: SeqDelta, trackKey: string): (v: number) => number {
  if (!seq && seq !== 0) return () => 0;
  const minV = TRACK_MIN[trackKey] ?? 1;
  return (v: number) => resolveSeq(seq, v, minV);
}

// ─── Descrizione leggibile di una sequenza ──────
// Raggruppa valori consecutivi uguali:
//   "1;1;1;2;2" → "1–3: +1, 4–5: +2"
export function describeSeq(seq: SeqDelta, minValue = 1): string {
  if (typeof seq === 'number') {
    return seq === 0 ? '—' : (seq > 0 ? `+${seq}` : `${seq}`);
  }
  const parts = parseSeq(seq);
  if (parts.length === 0) return '—';
  if (parts.length === 1) {
    const v = parts[0];
    return v === 0 ? '—' : (v > 0 ? `+${v}` : `${v}`);
  }

  // Raggruppa range consecutivi con lo stesso valore
  const groups: { from: number; to: number; val: number }[] = [];
  let start = 0;
  for (let i = 1; i <= parts.length; i++) {
    if (i === parts.length || parts[i] !== parts[i - 1]) {
      groups.push({ from: minValue + start, to: minValue + i - 1, val: parts[start] });
      start = i;
    }
  }

  return groups
    .filter(g => g.val !== 0)
    .map(g => {
      const sign = g.val > 0 ? '+' : '';
      const range = g.from === g.to ? `${g.from}` : `${g.from}–${g.to}`;
      return `${range}: ${sign}${g.val}`;
    })
    .join(', ') || '—';
}

// ─── Verifica se una stringa è una sequenza valida ─
export function isValidSeq(raw: unknown, expectedLength?: number): boolean {
  if (typeof raw === 'number') return !isNaN(raw);
  if (typeof raw !== 'string') return false;
  const s = raw.trim();
  if (!s.includes(';')) {
    return !isNaN(Number(s));
  }
  const parts = s.split(';');
  if (expectedLength !== undefined && parts.length !== expectedLength) return false;
  return parts.every(p => !isNaN(Number(p.trim())));
}
