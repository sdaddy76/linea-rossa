import ComponentsIntro, { SCENES as COMPONENT_SCENES } from './ComponentsIntro';
import RoundIntro, { ROUND_SCENES } from './RoundIntro';
import CombatIntro, { COMBAT_SCENES } from './CombatIntro';
import RuleIntro, { RULE_INTROS, type RuleIntroId } from './RulesIntros';
import { stepMs, type IntroScene } from './IntroPlayer';
import { BOARD_ART, EVENT_BACK, botFrontArt, eventFrontArt, factionBoardArt, unitFrontArt } from '../art';
import { getFactionCardFront, getObjectiveCardFront } from '../../data/card-graphics';

/** Elenco unico delle animazioni sulle regole, usato dalla partita guidata e dalla pagina "Regole animate". */
export type AnimationId = 'components' | 'round' | 'combat' | RuleIntroId;
export interface AnimationInfo { id: AnimationId; title: string; text: string; art: string; scenes: IntroScene[] }

export const ANIMATION_LIST: AnimationInfo[] = [
  { id: 'setup', title: 'La preparazione della partita', text: 'Durata, giocatori e BOT, carte, obiettivi e valori di partenza.', art: BOARD_ART, scenes: RULE_INTROS.setup.scenes },
  { id: 'components', title: 'I componenti del gioco', text: 'Tabellone, plance, i quattro tipi di carte, unità e segnalini.', art: factionBoardArt('Iran'), scenes: COMPONENT_SCENES },
  { id: 'round', title: 'Come si gioca un round', text: 'Si scopre l’Evento, poi l’Europa gioca una carta passo per passo.', art: eventFrontArt('E01'), scenes: ROUND_SCENES },
  { id: 'actions', title: 'Le azioni con gli OP', text: 'Influenza, Destabilizzare, Pressione, Schieramento, Mantenimento e Attacco.', art: getFactionCardFront('C009', 'Coalizione') ?? EVENT_BACK, scenes: RULE_INTROS.actions.scenes },
  { id: 'develop', title: 'Sviluppo e Veto', text: 'Alzare un tracciato, scegliere la correlazione, annullarla con il Veto.', art: factionBoardArt('Europa'), scenes: RULE_INTROS.develop.scenes },
  { id: 'units', title: 'Le unità e i loro bonus', text: 'Tutte le unità delle cinque potenze e cosa fanno sul tabellone.', art: unitFrontArt('IR-U02'), scenes: RULE_INTROS.units.scenes },
  { id: 'combat', title: 'Il combattimento', text: 'Dichiarazione, sostegno, dadi, totali e perdite di uno scontro vero.', art: unitFrontArt('CO-U03'), scenes: COMBAT_SCENES },
  { id: 'endRound', title: 'La fine del round', text: 'Tensione, Influenza dei BOT, controllo, punti, unità e nuove carte.', art: factionBoardArt('Cina'), scenes: RULE_INTROS.endRound.scenes },
  { id: 'bot', title: 'Il turno di un BOT', text: 'Come gioca una potenza senza giocatore, carta per carta.', art: botFrontArt('BOT-IR-E1'), scenes: RULE_INTROS.bot.scenes },
  { id: 'hormuz', title: 'Il Blocco di Hormuz', text: 'Come si attiva, cosa cambia a ogni round e come finisce.', art: unitFrontArt('IR-U05'), scenes: RULE_INTROS.hormuz.scenes },
  { id: 'scoring', title: 'Il punteggio finale', text: 'Quando finisce la partita, come si contano i punti e gli spareggi.', art: getObjectiveCardFront('OBJ-EU-01') ?? EVENT_BACK, scenes: RULE_INTROS.scoring.scenes },
];
/** Durata in minuti, arrotondata, se l'animazione scorre da sola. */
export const animationMinutes = (a: AnimationInfo) =>
  Math.max(1, Math.round(a.scenes.flatMap(s => s.steps).reduce((n, s) => n + stepMs(s.text), 0) / 60000));

export function AnimationOverlay({ id, onClose, reduced, finalLabel = 'Torna all’elenco', onFinish }: {
  id: AnimationId; onClose: () => void; reduced?: boolean; finalLabel?: string; onFinish?: () => void;
}) {
  const common = { onClose, reduced, finalLabel, onFinish, closeLabel: 'Chiudi' };
  if (id === 'components') return <ComponentsIntro {...common} />;
  if (id === 'round') return <RoundIntro {...common} />;
  if (id === 'combat') return <CombatIntro {...common} />;
  return <RuleIntro key={id} id={id} {...common} />;
}
