import type { Tracciato, ZonaTracciato } from '@/data/tracciati';
import { TUTTI_TRACCIATI } from '@/data/tracciati';
import { ZONA_COLORS } from '@/lib/colors';

// ── Barra visiva del tracciato ─────────────────────────────────────
function PrintTrackBar({ tracciato }: { tracciato: Tracciato }) {
  const total = tracciato.max - tracciato.min || 1;
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'stretch', height: 22 }}>
      {tracciato.zone.map((zona) => {
        const w = ((zona.a - zona.da + 1) / total) * 100;
        const c = ZONA_COLORS[zona.colore];
        return (
          <div
            key={zona.da}
            style={{
              width: `${w}%`,
              backgroundColor: c.segBg,
              border: `1px solid ${c.text}55`,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 8, fontFamily: 'monospace', color: c.badgeText, fontWeight: 700, letterSpacing: '0.05em' }}>
              {zona.da === zona.a ? zona.da : `${zona.da}-${zona.a}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Card zona singola ──────────────────────────────────────────────
function PrintZonaCard({ zona }: { zona: ZonaTracciato }) {
  const c = ZONA_COLORS[zona.colore];
  return (
    <div
      style={{
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 4,
        padding: '6px 8px',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {/* Header zona */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 13 }}>{zona.icona}</span>
        <div>
          <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 9, color: c.text, letterSpacing: '0.08em' }}>
            {zona.label.toUpperCase()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontFamily: 'monospace', fontSize: 8, color: '#888',
              backgroundColor: c.badge, padding: '1px 4px', borderRadius: 2,
            }}>
              LIV. {zona.da === zona.a ? zona.da : `${zona.da}–${zona.a}`}
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: 8, color: '#666' }}>{zona.sottotitolo}</span>
          </div>
        </div>
      </div>

      {/* Scenario */}
      <p style={{ fontFamily: 'serif', fontSize: 8, color: '#ccc', lineHeight: 1.45, marginBottom: 4, marginTop: 0 }}>
        {zona.scenario}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {/* Carte */}
        <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 3, padding: '4px 5px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 7.5, color: c.text, fontWeight: 700, marginBottom: 2 }}>🃏 CARTE CHIAVE</div>
          {zona.carteChiave.map((carta, i) => (
            <div key={i} style={{ fontFamily: 'monospace', fontSize: 7.5, color: '#aaa', lineHeight: 1.4, display: 'flex', gap: 3 }}>
              <span style={{ color: c.badgeText, flexShrink: 0 }}>›</span>
              <span>{carta}</span>
            </div>
          ))}
        </div>

        {/* Vittoria + note */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 3, padding: '4px 5px', flex: 1 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 7.5, color: '#e8c55e', fontWeight: 700, marginBottom: 2 }}>🏆 VITTORIA</div>
            <p style={{ fontFamily: 'monospace', fontSize: 7.5, color: '#aaa', margin: 0, lineHeight: 1.4 }}>{zona.condizioniVittoria}</p>
          </div>
          <div style={{ backgroundColor: 'rgba(200,165,90,0.1)', borderLeft: '2px solid #c8a55a', padding: '3px 5px', borderRadius: '0 3px 3px 0' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 7, color: '#c8a55a', lineHeight: 1.4 }}>
              <strong>⚡ </strong>{zona.noteStrategiche}
            </div>
          </div>
        </div>
      </div>

      {/* Iran / Coalizione */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, marginTop: 4 }}>
        <div style={{ backgroundColor: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 3, padding: '3px 5px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 7, color: '#4ade80', fontWeight: 700, marginBottom: 2 }}>🇮🇷 IRAN</div>
          <p style={{ fontFamily: 'monospace', fontSize: 7, color: '#aaa', margin: 0, lineHeight: 1.4 }}>{zona.costoIran}</p>
        </div>
        <div style={{ backgroundColor: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 3, padding: '3px 5px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 7, color: '#60a5fa', fontWeight: 700, marginBottom: 2 }}>🌐 COALIZIONE</div>
          <p style={{ fontFamily: 'monospace', fontSize: 7, color: '#aaa', margin: 0, lineHeight: 1.4 }}>{zona.costoCoalizione}</p>
        </div>
      </div>
    </div>
  );
}

// ── Pannello tracciato completo ────────────────────────────────────
function PrintTrackPanel({ tracciato }: { tracciato: Tracciato }) {
  return (
    <div
      style={{
        backgroundColor: '#0d1117',
        border: '1px solid #1e2a3a',
        borderRadius: 6,
        padding: '8px 10px',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, paddingBottom: 5, borderBottom: '1px solid #1e2a3a' }}>
        <span style={{ fontSize: 18 }}>{tracciato.icona}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 10, color: '#e8e4d8', letterSpacing: '0.1em' }}>
              {tracciato.nome.toUpperCase()}
            </span>
            <span style={{
              fontFamily: 'monospace', fontSize: 8, fontWeight: 700,
              backgroundColor: 'rgba(200,165,90,0.15)', color: '#c8a55a',
              padding: '1px 5px', borderRadius: 3,
            }}>
              {tracciato.sigla}
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: 8, color: '#3a4a5a' }}>
              {tracciato.min} → {tracciato.max}
            </span>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 7.5, color: '#4a5a6a', marginTop: 2 }}>
            {tracciato.descrizione}
          </div>
        </div>
        {/* Direzioni */}
        <div style={{ textAlign: 'right', fontSize: 7.5, fontFamily: 'monospace', lineHeight: 1.6 }}>
          <div style={{ color: '#4ade80' }}>🇮🇷 {tracciato.direzioneIran}</div>
          <div style={{ color: '#60a5fa' }}>🌐 {tracciato.direzioneCoalizione}</div>
        </div>
      </div>

      {/* Barra visiva */}
      <div style={{ marginBottom: 6 }}>
        <PrintTrackBar tracciato={tracciato} />
        {/* Etichette zone sotto la barra */}
        <div style={{ display: 'flex', marginTop: 2 }}>
          {tracciato.zone.map((zona) => {
            const total = tracciato.max - tracciato.min || 1;
            const w = ((zona.a - zona.da + 1) / total) * 100;
            const c = ZONA_COLORS[zona.colore];
            return (
              <div key={zona.da} style={{ width: `${w}%`, textAlign: 'center' }}>
                <span style={{ fontSize: 7, fontFamily: 'monospace', color: c.text + 'bb' }}>
                  {zona.icona}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda zone inline */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 7 }}>
        {tracciato.zone.map((zona) => {
          const c = ZONA_COLORS[zona.colore];
          return (
            <div key={zona.da} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: 1, backgroundColor: c.segBg, border: `1px solid ${c.text}66` }} />
              <span style={{ fontFamily: 'monospace', fontSize: 7, color: c.text }}>
                {zona.label} ({zona.da === zona.a ? zona.da : `${zona.da}-${zona.a}`})
              </span>
            </div>
          );
        })}
      </div>

      {/* Zone cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(tracciato.zone.length, 3)}, 1fr)`, gap: 5 }}>
        {tracciato.zone.map((zona) => (
          <PrintZonaCard key={zona.da} zona={zona} />
        ))}
      </div>
    </div>
  );
}

// ── Componente principale tabellone stampabile ─────────────────────
export function PrintTabellone() {
  return (
    <div
      id="print-tabellone"
      style={{
        backgroundColor: '#070a10',
        color: '#e8e4d8',
        padding: '12mm',
        fontFamily: 'monospace',
        width: '100%',
      }}
    >
      {/* ── HEADER TABELLONE ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        backgroundColor: '#060910',
        border: '1px solid #1e2a3a',
        borderRadius: 6,
        marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'radial-gradient(circle, #7f0000, #3a0000)',
            border: '2px solid #cc2222',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>☢️</div>
          <div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 18, color: '#e8e4d8', letterSpacing: '0.2em' }}>
              LINEA ROSSA — TABELLONE TRACCIATI
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#4a5a6a', letterSpacing: '0.1em' }}>
              CRISI NUCLEARE IRANIANA · PANNELLO DI CONTROLLO · 6 TRACCIATI ATTIVI
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {[
            { label: 'TNI', desc: 'Nucleare 1-15' },
            { label: 'TSE', desc: 'Sanzioni 1-10' },
            { label: 'TOG', desc: 'Opinione ±10' },
            { label: 'DEFCON', desc: 'Tensione 5-1' },
            { label: 'RE', desc: 'Risorse 1-10' },
            { label: 'SI', desc: 'Stabilità 1-10' },
          ].map(({ label, desc }) => (
            <div key={label} style={{ textAlign: 'center', backgroundColor: 'rgba(200,165,90,0.1)', border: '1px solid rgba(200,165,90,0.25)', borderRadius: 4, padding: '3px 6px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 8, fontWeight: 700, color: '#c8a55a' }}>{label}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 6.5, color: '#5a6a7a' }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── LEGENDA COLORI ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        padding: '4px 10px', marginBottom: 10,
        backgroundColor: '#080b12', border: '1px solid #1a2030', borderRadius: 4,
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: 7.5, color: '#4a5a6a', fontWeight: 700 }}>LEGENDA:</span>
        {[
          { col: '#22c55e', label: 'SICURO' },
          { col: '#eab308', label: 'ATTENZIONE' },
          { col: '#f97316', label: 'ALLERTA' },
          { col: '#ef4444', label: 'PERICOLO' },
          { col: '#dc2626', label: 'CRITICO / FINE PARTITA' },
          { col: '#94a3b8', label: 'NEUTRALE' },
          { col: '#3b82f6', label: 'VANTAGGIO COALIZIONE' },
        ].map(v => (
          <div key={v.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: v.col + '44', border: `1px solid ${v.col}` }} />
            <span style={{ fontFamily: 'monospace', fontSize: 7.5, color: '#5a6a7a' }}>{v.label}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 7, color: '#2a3a4a' }}>
          🇮🇷 IRAN = Verde · 🌐 COALIZIONE = Blu
        </div>
      </div>

      {/* ── GRIGLIA 2 COLONNE TRACCIATI ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {TUTTI_TRACCIATI.map((tracciato) => (
          <PrintTrackPanel key={tracciato.id} tracciato={tracciato} />
        ))}
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        marginTop: 10, padding: '5px 10px', textAlign: 'center',
        borderTop: '1px solid #1a2030',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: 7, color: '#2a3a4a', letterSpacing: '0.1em' }}>
          LINEA ROSSA · GIOCO DA TAVOLO GEOPOLITICO · TNI ◆ TSE ◆ TOG ◆ DEFCON ◆ RE ◆ SI
          · STAMPA IN FORMATO A2 LANDSCAPE PER QUALITÀ OTTIMALE
        </span>
      </div>
    </div>
  );
}

export default PrintTabellone;
