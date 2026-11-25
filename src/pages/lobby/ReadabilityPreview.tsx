import { useState } from 'react';
import { ReadabilityFrame, useReadability } from './Readability';
import SalaPartite from './SalaPartite';
import type { RoomGame } from './sala';

// Explicitly fictional metadata; this page never reads or writes game records.
const opened = '2026-11-25T17:30:00+01:00';
const waiting: RoomGame = {
  id: 'preview-waiting', code: 'ESEMPIO-01', name: 'Un tavolo in attesa',
  status: 'lobby', is_public: true, created_by: 'preview-host',
  created_at: opened, current_turn: 1, max_turns: 60,
  _players: [
    { faction: 'Iran', player_id: 'preview-host', is_bot: false, profile: { username: 'Stefano (esempio)' } },
    { faction: 'Europa', player_id: 'preview-other', is_bot: false, profile: { username: 'Giulia (esempio)' } },
  ],
};
const games: RoomGame[] = [
  waiting,
  { ...waiting, id: 'preview-active', code: 'ESEMPIO-02', name: 'Una partita in corso', status: 'active',
    _players: [...waiting._players,
      { faction: 'Coalizione', player_id: null, is_bot: true },
      { faction: 'Russia', player_id: null, is_bot: true },
      { faction: 'Cina', player_id: null, is_bot: true },
    ],
  },
];

export default function ReadabilityPreview({ onBack }: { onBack: () => void }) {
  const { high, toggle } = useReadability(true);
  const [notice, setNotice] = useState('');
  return <ReadabilityFrame high={high} onToggle={toggle}>
    <main className="readability-content p-4 text-slate-100">
      <div className="lobby-container max-w-2xl mx-auto space-y-6">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold text-white">Esempio di leggibilità</h1>
          <p className="text-sm text-slate-300">Questa è l’anteprima della sala con dati dimostrativi: non sono partite reali. Usa “Alta leggibilità” per confrontare tema chiaro e versione scura.</p>
          <button onClick={onBack} className="min-h-11 px-4 py-2 rounded-lg border border-slate-600 text-slate-200">Torna a Linea Rossa</button>
        </header>
        {notice && <p role="status" className="border border-cyan-400 bg-cyan-950 text-cyan-100 p-4 rounded-lg">{notice}</p>}
        <SalaPartite games={games} userId="preview-visitor" loading={false} error="" updatedAt={null}
          onRefresh={() => setNotice('Questa anteprima usa soltanto dati dimostrativi.')}
          onEnter={() => setNotice('Nel gioco, questo pulsante apre il tavolo. Nell’anteprima non viene salvata alcuna iscrizione.')}
          onCreate={() => setNotice('Accedi al gioco per aprire un tavolo reale.')}
          onCode={() => setNotice('Accedi al gioco per usare un codice invito reale.')} />
      </div>
    </main>
  </ReadabilityFrame>;
}
