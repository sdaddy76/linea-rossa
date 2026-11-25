import { useState } from 'react';
import { createGame } from './engine';
import { FACTION_CARDS } from './catalog';
import TabletopGamePage from './TabletopGamePage';

/** Uses the actual game UI, isolated fictional state and no database requests. */
export default function GameReadabilityPreview({ onBack }: { onBack: () => void }) {
  const [state] = useState(() => {
    const demo = createGame({
      bots: [], mode: 'media', rulesRevision: '2026-11-21', botInfluenceEdition: '2026-11-22',
    }, () => 0.3);
    demo.order = ['Iran', 'Coalizione', 'Russia', 'Cina', 'Europa'];
    demo.turnIndex = 0;
    demo.players.Iran.hand = FACTION_CARDS.filter(c => c.origin === 'Iran').slice(0, 5).map(c => c.id);
    demo.log = ['Anteprima locale: seleziona un territorio o una carta per provare la leggibilità.'];
    return demo;
  });
  return <TabletopGamePage onBack={onBack} previewState={state} />;
}
