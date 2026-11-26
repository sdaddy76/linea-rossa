import type { CSSProperties } from 'react';
import type { Faction } from '../catalog';
import { BOARD_ART, EVENT_BACK, botBackArt, botFrontArt, eventFrontArt, factionBoardArt, unitBackArt, unitFrontArt } from '../art';
import { getFactionCardFront, getObjectiveCardBack, getObjectiveCardFront } from '../../data/card-graphics';
import { FULL, FlipCard, Framed, IntroPlayer, type IntroScene, type IntroStep, type PlayerProps } from './IntroPlayer';
export { MUSIC_SRC, framing, stepMs } from './IntroPlayer';

/** Introduzione animata ai componenti, mostrata prima della partita guidata. */
export const INTRO_SEEN_KEY = 'linea-rossa.guided-components.v1';

type Visual = 'welcome' | 'board' | 'plancia' | 'faction-card' | 'event' | 'bot' | 'objective' | 'units' | 'influence' | 'victory' | 'ready';
interface Scene extends IntroScene { visual: Visual; steps: IntroStep[] }

const FACTIONS: { name: Faction; color: string }[] = [
  { name: 'Iran', color: '#1f8a4c' }, { name: 'Coalizione', color: '#2457b8' }, { name: 'Russia', color: '#b3261e' },
  { name: 'Cina', color: '#d48a00' }, { name: 'Europa', color: '#5a3fb5' },
];
export const emblemArt = (faction: Faction) => `/assets/tabletop-v3/emblems/${faction}.png?v=2026-11-26`;
const IRAN_UNITS = ['IR-U01', 'IR-U02', 'IR-U03', 'IR-U04', 'IR-U05', 'IR-U06', 'IR-U07'];

export const SCENES: Scene[] = [
  { id: 'welcome', kicker: 'Prima di giocare', title: 'Cinque potenze, una crisi', visual: 'welcome', steps: [
    { text: 'Linea Rossa racconta una crisi nel Golfo Persico. Ogni giocatore guida una potenza: Iran, Coalizione, Russia, Cina o Europa.' },
    { text: 'Le potenze senza giocatore non spariscono: le muovono i BOT, con un mazzo di carte dedicato.' },
    { text: 'In pochi minuti vediamo i componenti: tabellone, plance, quattro tipi di carte, unità e segnalini.' },
  ] },
  { id: 'board', kicker: 'Componente 1', title: 'Il tabellone', visual: 'board', steps: [
    { text: 'Al centro la mappa: gli Stati della regione e lo Stretto di Hormuz.', focus: { x: 16, y: 14, w: 68, h: 74 } },
    { text: 'Accanto a ogni Stato ci sono i riquadri per l’Influenza. Il numero tra parentesi dice quanti segnalini ci stanno.', focus: { x: 47, y: 27, w: 24, h: 15 } },
    { text: 'Accanto al nome c’è una fila di cinque stemmi: è l’allineamento dello Stato verso ogni potenza, nell’ordine Iran, Coalizione, Russia, Cina, Europa.', focus: { x: 56, y: 29, w: 10.5, h: 6 } },
    { text: 'Spunta verde: amico. Trattino: neutrale. X rossa: nemico. Più lo Stato è ostile, più costa entrarci: +0, +1 o +2 OP, sia per l’Influenza sia per le unità.', focus: { x: 17.3, y: 75.8, w: 21.2, h: 8.4 } },
    { text: 'In cambio vale di più: a fine partita ogni segnalino Influenza dà 1, 2 o 3 punti. In Iraq l’Iran (amico) piazza con 1 OP e prende 1 punto, la Coalizione (neutrale) paga 2 OP e ne prende 2.', focus: { x: 50.5, y: 28, w: 16, h: 13 } },
    { text: 'A sinistra il Nucleare iraniano, da 1 a 15: se arriva a 15 vince subito l’Iran.', focus: { x: 5, y: 16, w: 11, h: 62 } },
    { text: 'A destra Sanzioni (a 10 vince subito la Coalizione) e Crisi Bellica: se scende a 1 scoppia la guerra totale.', focus: { x: 83, y: 16, w: 11, h: 71 } },
    { text: 'In basso l’Opinione globale, da −10 a +10: misura da che parte sta il mondo.', focus: { x: 5, y: 86, w: 90, h: 9 } },
    { text: 'Lo Stretto di Hormuz: con 2 Flotte veloci iraniane scatta il Blocco, che colpisce le economie di Europa e Cina.', focus: { x: 70, y: 46, w: 15, h: 12 } },
    { text: 'Il bordo è il tracciato dei punti e del segna-turni. Le linee Breve 30, Media 60 e Lunga 80 decidono quando finisce la partita.', focus: FULL },
  ] },
  { id: 'plancia', kicker: 'Componente 2', title: 'Le plance fazione', visual: 'plancia', steps: [
    { text: 'Ogni potenza ha la sua plancia. Le cinque plance hanno la stessa struttura: qui vedi quella dell’Iran.', focus: FULL },
    { text: 'Quattro tracciati, da 1 a 10: Economia, Militare, Diplomazia e Consenso.', focus: { x: 1.5, y: 14, w: 97, h: 37 } },
    { text: 'Ogni tracciato ha tre zone. Crisi (1–3): −1 punto a fine round. Stabile (4–7). Forte (8–10): +1 punto. Le zone cambiano anche costi e poteri.', focus: { x: 1.5, y: 14, w: 48.5, h: 17 } },
    { text: 'Sotto ogni tracciato ci sono le correlazioni: quando il tuo tracciato sale, si muove anche quello di un’altra potenza.', focus: { x: 1.5, y: 26, w: 48.5, h: 8 } },
    { text: 'In basso le unità che puoi schierare, con costo, attacco e difesa, e il riepilogo del turno e del fine round.', focus: { x: 1.5, y: 52, w: 97, h: 47 } },
  ] },
  { id: 'faction-card', kicker: 'Componente 3', title: 'Il Mazzo Fazioni', visual: 'faction-card', steps: [
    { text: 'È il mazzo principale: 347 carte comuni a tutte le potenze. Ne tieni 5 in mano e ogni round ne giochi due.' },
    { text: 'Puoi giocarla come Evento: scegli una delle 3 opzioni. La potenza indicata alza un tracciato e poi si applica la correlazione.' },
    { text: 'Se scegli un’opzione che favorisce un’altra potenza guadagni +1 punto: il dividendo diplomatico, una volta per round.' },
    { text: 'Oppure giocala per i suoi OP, il numero in alto: sono il budget per Sviluppo, Pressione, Schieramento, Influenza e Attacco.' },
  ] },
  { id: 'event', kicker: 'Componente 4', title: 'Le carte Evento', visual: 'event', steps: [
    { text: 'All’inizio di ogni round si rivela una carta Evento.' },
    { text: 'L’Evento cambia subito i tracciati globali e quelli di alcune potenze.' },
    { text: 'Stabilisce anche l’ordine di turno e quali potenze Avanzano: solo le loro carte fanno avanzare il segna-turni.' },
  ] },
  { id: 'bot', kicker: 'Componente 5', title: 'Le carte BOT', visual: 'bot', steps: [
    { text: 'Ogni potenza senza giocatore ha 4 mazzi BOT, uno per tracciato.' },
    { text: 'Il BOT pesca dal mazzo del suo tracciato più debole: se la condizione è vera esegue la priorità P1, altrimenti la P2.' },
    { text: 'Lo Stato stampato indica dove il BOT piazza Influenza a fine round. Se non ha unità sul tabellone, ci schiera la sua unità base.' },
  ] },
  { id: 'objective', kicker: 'Componente 6', title: 'Gli obiettivi segreti', visual: 'objective', steps: [
    { text: 'All’inizio ogni potenza pesca 3 obiettivi segreti dal proprio mazzo e li tiene coperti.' },
    { text: 'Si verificano a fine partita e danno punti: Facile +3, Media +4, Difficile +6.' },
  ] },
  { id: 'units', kicker: 'Componente 7', title: 'Le unità', visual: 'units', steps: [
    { text: 'Le unità sono segnalini quadrati: si schierano accanto a uno Stato e non occupano i riquadri dell’Influenza.' },
    { text: 'Ognuna ha costo, attacco, difesa e un bonus che vale finché resta sul tabellone.' },
    { text: 'Restano 2 round: alla prima fine round si ruotano, alla seconda tornano in riserva.' },
    { text: 'Con il Mantenimento, pagando 1 OP, un’unità ruotata resta un altro round.' },
    { text: 'Solo Iran e Coalizione attaccano. Russia, Cina ed Europa sostengono una delle due parti.' },
  ] },
  { id: 'influence', kicker: 'Componente 8', title: 'Influenza e controllo', visual: 'influence', steps: [
    { text: 'I segnalini Influenza rappresentano la presenza politica ed economica. Occupano un riquadro e restano fino a fine partita.', focus: { x: 47, y: 27, w: 24, h: 15 } },
    { text: 'Controlla uno Stato chi ha più elementi, unità più Influenza. A fine round prende il bonus stampato sul tabellone.', focus: { x: 17, y: 59, w: 22, h: 21 } },
    { text: 'Ricorda l’allineamento: a fine partita ogni segnalino vale 1 punto negli Stati amici, 2 nei neutrali e 3 nei nemici.', focus: { x: 17.3, y: 75.8, w: 21.2, h: 8.4 } },
  ] },
  { id: 'victory', kicker: 'Come si vince', title: 'Quattro finali possibili', visual: 'victory', steps: [
    { text: 'Nucleare a 15: vince subito l’Iran. Sanzioni a 10: vince subito la Coalizione.' },
    { text: 'Crisi Bellica a 1: scoppia la guerra totale e la partita finisce subito. Si vince ai punti: vince chi ne ha di più, ma chi ha provocato la crisi non può vincere.' },
    { text: 'Altrimenti la partita finisce alla linea della modalità: vince chi ha più punti, sommando tracciati, Influenza e obiettivi.' },
  ] },
  { id: 'ready', kicker: 'Pronto', title: 'Ora tocca a te', visual: 'ready', steps: [
    { text: 'Hai visto tutti i componenti. Nella partita guidata giochi due round, passo per passo, con il motore vero del gioco.' },
  ] },
];

function SceneVisual({ scene, step }: { scene: Scene; step: number }) {
  const focus = scene.steps[step]?.focus;
  switch (scene.visual) {
    case 'welcome':
      return <div className="intro-welcome">
        <img className="intro-welcome-board" src={BOARD_ART} alt="Il tabellone di Linea Rossa" />
        <div className="intro-powers">{FACTIONS.map((f, i) => <span key={f.name} style={{ '--c': f.color, '--i': i } as CSSProperties}
          className={step >= 1 && i > 1 && step < 2 ? 'is-bot' : ''}><img src={emblemArt(f.name)} alt="" /><b>{f.name}{step === 1 && i > 1 && <small>BOT</small>}</b></span>)}</div>
      </div>;
    case 'board': case 'influence':
      return <Framed src={BOARD_ART} alt="Il tabellone" focus={focus} ratio={3072 / 2048} />;
    case 'plancia':
      return <Framed src={factionBoardArt('Iran')} alt="La plancia dell’Iran" focus={focus} ratio={3309 / 2339} />;
    case 'faction-card':
      return <div className="intro-card-row">
        <img className="intro-card intro-card-main" src={getFactionCardFront('C097', 'Europa') ?? ''} alt="Una carta del Mazzo Fazioni: Mediazione UE" />
        <div className="intro-card-notes">
          <span className={step === 1 || step === 2 ? 'is-on' : ''}>Evento · 1 di 3 opzioni</span>
          <span className={step === 2 ? 'is-on' : ''}>Altra potenza · +1 punto</span>
          <span className={step === 3 ? 'is-on' : ''}>OP · budget per le azioni</span>
        </div>
      </div>;
    case 'event':
      return <div className="intro-card-row"><FlipCard back={EVENT_BACK} front={eventFrontArt('E01')} alt="Carta Evento E01" flipped={step >= 1} /></div>;
    case 'bot':
      return <div className="intro-card-row"><FlipCard back={botBackArt('Iran', 'Economia')} front={botFrontArt('BOT-IR-E1')} alt="Carta BOT dell’Iran" flipped={step >= 1} /></div>;
    case 'objective':
      return <div className="intro-card-row"><FlipCard back={getObjectiveCardBack('Russia') ?? ''} front={getObjectiveCardFront('OBJ-RU-09') ?? ''} alt="Un obiettivo segreto della Russia" flipped={step >= 1} /></div>;
    case 'units':
      return <div className="intro-units">
        <div className="intro-unit-row">{IRAN_UNITS.map((id, i) => <img key={id} src={unitFrontArt(id)} alt="" style={{ '--i': i } as CSSProperties}
          className={`${step === 1 && i === 2 ? 'is-picked' : ''} ${(step === 2 || step === 3) && i === 1 ? 'is-rotated' : ''} ${step === 3 && i === 1 ? 'is-kept' : ''}`} />)}</div>
        <p className="intro-unit-caption">{step === 2 ? 'Ruotata: ultimo round sul tabellone' : step === 3 ? 'Mantenimento: torna dritta, resta un altro round' : step === 4 ? 'Attacca · Sostiene' : 'Le 7 unità dell’Iran'}</p>
        <img className="intro-unit-back" src={unitBackArt('Iran')} alt="" />
      </div>;
    case 'victory':
      return <div className="intro-victory">
        {[['Nucleare 15', 'Vince l’Iran', 0], ['Sanzioni 10', 'Vince la Coalizione', 0], ['Crisi Bellica 1', 'Guerra totale: vince chi ha più punti, ma non chi l’ha provocata', 1], ['Linea della modalità', 'Vince chi ha più punti', 2]].map(([a, b, s]) =>
          <div key={String(a)} className={step >= Number(s) ? 'is-on' : ''}><strong>{a}</strong><span>{b}</span></div>)}
      </div>;
    default:
      return <div className="intro-ready"><img src={BOARD_ART} alt="" /></div>;
  }
}

export default function ComponentsIntro(props: PlayerProps & { onFinish?: () => void; finalLabel?: string }) {
  return <IntroPlayer {...props} scenes={SCENES} label="Componenti" render={(scene, step) => <SceneVisual scene={scene} step={step} />} />;
}
