import type { CSSProperties, ReactNode } from 'react';
import { BOT_CARDS, BOT_INFLUENCE, CORRELATIONS, FACTION_CARDS, FACTIONS, INITIAL_TRACKS, OBJECTIVES, TERRITORIES, TRACKS, UNITS, type Faction, type Track } from '../catalog';
import { BOARD_ART, EVENT_BACK, botBackArt, botFrontArt, factionBoardArt, unitBackArt, unitFrontArt } from '../art';
import { FACTION_CARD_BACK, getFactionCardFront, getObjectiveCardBack, getObjectiveCardFront } from '../../data/card-graphics';
import { Framed, IntroPlayer, type Focus, type IntroScene, type PlayerProps } from './IntroPlayer';
import { emblemArt } from './ComponentsIntro';
import { Meter } from './RoundIntro';

/** Cinque animazioni brevi sulle regole: fine round, BOT, punteggio finale, Blocco di Hormuz, Sviluppo e Veto. */
export interface RuleScene extends IntroScene { view: (step: number, focus?: Focus) => ReactNode }

const BOARD = 3072 / 2048, PLANCIA = 3309 / 2339, CARD = 900 / 1260;
const unit = (id: string) => UNITS.find(u => u.id === id)!;
const alignment = (territory: string, f: Faction) => TERRITORIES.find(t => t.id === territory)!.alignment[f];
const territoryName = (id: string) => TERRITORIES.find(t => t.id === id)!.name;
const objective = (id: string) => OBJECTIVES.find(o => o.id === id)!;

function Rows({ items, step, from = 0 }: { items: [string, string][]; step: number; from?: number }) {
  return <div className="rules-rows">{items.map(([a, b], i) =>
    <div key={a} className={i + from <= step ? 'is-on' : ''} style={{ '--i': i } as CSSProperties}><strong>{a}</strong><span>{b}</span></div>)}</div>;
}
function Split({ left, right }: { left: ReactNode; right: ReactNode }) {
  return <div className="round-split"><div className="round-card">{left}</div><div className="round-side">{right}</div></div>;
}
function Tile({ id, label, className = '' }: { id: string; label?: string; className?: string }) {
  return <figure className={`combat-tile ${className}`}><img src={unitFrontArt(id)} alt="" />{label && <figcaption>{label}</figcaption>}</figure>;
}
function Badge({ faction, note }: { faction: Faction; note?: string }) {
  return <span className="rules-badge"><img src={emblemArt(faction)} alt="" />{faction}{note && <small>{note}</small>}</span>;
}

/* ---------------- Fine del round ---------------- */
const SCORE_EXAMPLE: Record<Track, number> = { Economia: 9, Militare: 5, Diplomazia: 8, Consenso: 3 };
export const SCORE_DELTA = Object.values(SCORE_EXAMPLE).reduce((n, v) => n + (v >= 8 ? 1 : v <= 3 ? -1 : 0), 0);
export const END_ROUND_SCENES: RuleScene[] = [
  { id: 'when', kicker: 'Fine del round', title: 'Quando si chiude il round', steps: [
    { text: 'Quando tutte le potenze hanno giocato le loro due carte, il round si chiude. Le fasi sono sempre le stesse e sono riassunte su ogni plancia, nel riquadro Fine round.', focus: { x: 59, y: 81.5, w: 26, h: 17 } },
  ], view: (_, focus) => <Framed src={factionBoardArt('Iran')} alt="Plancia dell’Iran" focus={focus} ratio={PLANCIA} /> },
  { id: 'tension', kicker: 'Fine round · 1', title: 'Tensione', steps: [
    { text: 'Si controllano le soglie dei tracciati globali. Sanzioni a 8 o più: l’Iran perde 1 Economia.' },
    { text: 'Nucleare a 12 o più: la Crisi Bellica scende di 1. Attenzione, può far scoppiare la guerra.' },
    { text: 'Opinione a −6 o meno: l’Iran guadagna 1 Diplomazia. Opinione a +6 o più: la guadagna la Coalizione.' },
    { text: 'Se la Coalizione ha unità in Iran: Iran +1 Consenso, Coalizione −1 Consenso, Russia e Cina +1 Diplomazia. Se il Blocco di Hormuz è attivo, si applicano anche i suoi effetti.' },
  ], view: step => <Rows step={step} items={[['Sanzioni ≥ 8', 'Iran Economia −1'], ['Nucleare ≥ 12', 'Crisi Bellica −1'], ['Opinione ≤ −6 · ≥ +6', 'Diplomazia +1 a Iran · Coalizione'], ['Coalizione in Iran · Blocco', 'effetti speciali']]} /> },
  { id: 'bot', kicker: 'Fine round · 2', title: 'Influenza dei BOT', steps: [
    { text: 'Ogni BOT piazza 1 segnalino Influenza nello Stato stampato in alto sull’ultima carta BOT che ha rivelato nel round.', focus: { x: 4, y: 43, w: 92, h: 8.5 } },
    { text: 'Se quello Stato è pieno, il BOT toglie il segnalino più a sinistra e mette il suo. I giocatori umani invece piazzano Influenza solo con gli OP.', focus: { x: 4, y: 43, w: 92, h: 8.5 } },
  ], view: (_, focus) => <div className="intro-card-row"><div className="round-card"><Framed src={botFrontArt('BOT-IR-E1')} alt="Carta BOT" focus={focus} ratio={CARD} /></div></div> },
  { id: 'control', kicker: 'Fine round · 3', title: 'Controllo degli Stati', steps: [
    { text: 'Per ogni Stato si contano unità e segnalini Influenza di ogni potenza. Chi ne ha di più, senza pareggi, lo controlla.', focus: { x: 50.5, y: 26, w: 18, h: 16 } },
    { text: 'Chi controlla prende il bonus stampato nella tabella: +1 a un tracciato, oppure 1 punto per lo Stretto di Hormuz.', focus: { x: 17, y: 59, w: 22, h: 21 } },
    { text: 'In Iraq si sceglie tra Economia e Militare. Se la Coalizione controlla l’Iran, l’Iran perde 1 Economia; se lo controlla per due round di fila, il Nucleare scende di 2.', focus: { x: 17, y: 59, w: 22, h: 21 } },
  ], view: (_, focus) => <Framed src={BOARD_ART} alt="Il tabellone" focus={focus} ratio={BOARD} /> },
  { id: 'score', kicker: 'Fine round · 4', title: 'Punti del round', steps: [
    { text: 'Ogni tracciato in zona Forte (8–10) dà +1 punto, ogni tracciato in Crisi (1–3) toglie 1 punto. I punti non scendono mai sotto zero.' },
    { text: `Esempio: Economia 9 e Diplomazia 8 danno +2, Consenso 3 toglie 1, Militare 5 non conta. In questo round l’Europa fa ${SCORE_DELTA > 0 ? '+' : ''}${SCORE_DELTA} punto.` },
  ], view: step => <div className="round-meters rules-wide">{(Object.keys(SCORE_EXAMPLE) as Track[]).map(t => {
    const v = SCORE_EXAMPLE[t], d = v >= 8 ? 1 : v <= 3 ? -1 : 0;
    return <div key={t} className="rules-score"><Meter label={`Europa · ${t}`} min={1} max={10} value={v} before={v} color="#5a3fb5" zones />{step >= 1 && <b className={d > 0 ? 'is-plus' : d < 0 ? 'is-minus' : ''}>{d > 0 ? '+1' : d < 0 ? '−1' : '0'}</b>}</div>;
  })}</div> },
  { id: 'units', kicker: 'Fine round · 5', title: 'Durata delle unità', steps: [
    { text: 'Le unità schierate in questo round si ruotano di 90°: è il segno che stanno per scadere.' },
    { text: 'Le unità che erano già ruotate tornano nella riserva del proprietario.' },
    { text: 'Per tenerne una, durante la tua attivazione spendi 1 OP di Mantenimento: torna dritta e resta un altro round. I BOT ne mantengono una gratis a ogni attivazione.' },
  ], view: step => <div className="intro-units">
    <div className="intro-unit-row">
      <img src={unitFrontArt('EU-U02')} alt="" className={step >= 0 ? 'is-rotated' : ''} style={{ '--i': 0 } as CSSProperties} />
      <img src={unitFrontArt('IR-U02')} alt="" className={step >= 1 ? 'rules-gone' : 'is-rotated'} style={{ '--i': 1 } as CSSProperties} />
      <img src={unitFrontArt('CO-U01')} alt="" className={step >= 2 ? 'is-rotated is-kept' : 'is-rotated'} style={{ '--i': 2 } as CSSProperties} />
    </div>
    <p className="intro-unit-caption">{['Appena schierata: si ruota', 'Già ruotata: torna in riserva', 'Mantenimento 1 OP: torna dritta'][step]}</p>
    <img className="intro-unit-back" src={unitBackArt('Europa')} alt="" />
  </div> },
  { id: 'refill', kicker: 'Fine round · 6', title: 'Rifornimento', steps: [
    { text: 'Ogni giocatore pesca carte in base al suo Consenso: 1 se è in Crisi, 2 se è Stabile, 3 se è Forte. I BOT non pescano.' },
    { text: 'Poi si scarta fino al limite di mano: 7 carte, oppure 5 se il Consenso è in Crisi.' },
  ], view: step => <div className="rules-refill">{([['Crisi 1–3', 1, '5'], ['Stabile 4–7', 2, '7'], ['Forte 8–10', 3, '7']] as const).map(([z, n, limit], i) =>
    <div key={z} style={{ '--i': i } as CSSProperties}><strong>Consenso {z}</strong><span className="rules-cards">{Array.from({ length: n }, (_, k) => <img key={k} src={FACTION_CARD_BACK} alt="" style={{ '--k': k } as CSSProperties} />)}</span>
      <small>pesca {n}</small>{step >= 1 && <em>limite di mano {limit}</em>}</div>)}</div> },
  { id: 'next', kicker: 'Fine round', title: 'Il round successivo', steps: [
    { text: 'Se il segna-turni ha raggiunto la linea della modalità (Breve 30, Media 60, Lunga 80), la partita finisce e si contano i punti finali.', focus: { x: 0, y: 0, w: 100, h: 9 } },
    { text: 'Altrimenti si scopre un nuovo Evento e comincia il round successivo.' },
  ], view: (step, focus) => step === 0 ? <Framed src={BOARD_ART} alt="Il tabellone" focus={focus} ratio={BOARD} /> :
    <div className="intro-card-row"><img className="intro-card intro-card-main" src={EVENT_BACK} alt="Mazzo Eventi" /></div> },
];

/* ---------------- Il turno di un BOT ---------------- */
const BOT_FACTION: Faction = 'Iran';
const BOT_ORDER: Track[] = ['Militare', 'Economia', 'Consenso', 'Diplomazia'];      // priorità stampata dell’Iran
const botTracks = INITIAL_TRACKS[BOT_FACTION];
export const BOT_WEAKEST = [...BOT_ORDER].sort((a, b) => botTracks[a] - botTracks[b])[0];
export const BOT_CARD = BOT_CARDS.find(c => c.id === 'BOT-IR-E1')!;
const MEDIATION = FACTION_CARDS.find(c => c.id === 'C097')!;
export const BOT_STATE = BOT_INFLUENCE[BOT_CARD.id];
const BASE_UNIT = unit('IR-U01');
export const BOT_SCENES: RuleScene[] = [
  { id: 'who', kicker: 'Il turno di un BOT', title: 'Le potenze senza giocatore', steps: [
    { text: 'Ogni potenza senza giocatore è un BOT. Gioca al suo turno come le altre, ma segue regole fisse: nessuno deve prendere decisioni al posto suo.' },
  ], view: () => <div className="rules-badges">{(['Iran', 'Coalizione', 'Russia', 'Cina', 'Europa'] as Faction[]).map((f, i) => <Badge key={f} faction={f} note={i === 0 ? 'BOT' : undefined} />)}</div> },
  { id: 'faction-card', kicker: 'BOT · 1', title: 'Prima il Mazzo Fazioni', steps: [
    { text: 'Il BOT gira la prima carta del Mazzo Fazioni. Se una delle tre opzioni favorisce lui, la gioca come Evento e il suo turno finisce.' },
    { text: `Qui esce “${MEDIATION.name}”: le opzioni sono per Europa, Russia e Cina, nessuna per l’Iran. La carta va negli scarti e il BOT usa il suo mazzo.` },
  ], view: step => <div className="intro-card-row"><img className={`intro-card intro-card-main ${step >= 1 ? 'rules-discarded' : ''}`} src={getFactionCardFront(MEDIATION.id, MEDIATION.origin) ?? ''} alt={MEDIATION.name} />
    {step >= 1 && <div className="rules-cross"><Badge faction="Iran" note="nessuna opzione" /></div>}</div> },
  { id: 'weakest', kicker: 'BOT · 2', title: 'Il tracciato più debole', steps: [
    { text: `Ogni BOT ha 4 mazzi, uno per tracciato, e pesca da quello del suo tracciato più basso. Per l’Iran Economia e Diplomazia sono entrambe a ${botTracks.Economia}.` },
    { text: `In caso di parità decide l’ordine stampato della fazione: per l’Iran ${BOT_ORDER.join(', ')}. Quindi pesca dal mazzo ${BOT_WEAKEST}.` },
  ], view: step => <div className="rules-decks">{BOT_ORDER.map((t, i) => <figure key={t} className={step >= 1 && t === BOT_WEAKEST ? 'is-picked' : botTracks[t] === botTracks[BOT_WEAKEST] ? 'is-low' : ''} style={{ '--i': i } as CSSProperties}>
    <img src={botBackArt(BOT_FACTION, t)} alt="" /><figcaption>{t} <b>{botTracks[t]}</b></figcaption></figure>)}</div> },
  { id: 'card', kicker: 'BOT · 3', title: 'Condizione e priorità', steps: [
    { text: `La carta ha una condizione: ${BOT_CARD.condition}. Ora le Sanzioni sono a 3, quindi è falsa.`, focus: { x: 4, y: 52, w: 92, h: 9 } },
    { text: `Condizione falsa: il BOT esegue la Priorità 2, ${BOT_CARD.priority2}. Se fosse vera eseguirebbe la Priorità 1.`, focus: { x: 4, y: 76, w: 92, h: 10.5 } },
    { text: 'Le azioni dei BOT non costano OP, e la correlazione dello Sviluppo la sceglie il BOT da solo. Se una priorità chiede di attaccare con la Crisi Bellica a 3 o meno, usa l’altra.', focus: { x: 4, y: 61.5, w: 92, h: 25 } },
  ], view: (_, focus) => <div className="intro-card-row"><div className="round-card"><Framed src={botFrontArt(BOT_CARD.id)} alt={BOT_CARD.name} focus={focus} ratio={CARD} /></div></div> },
  { id: 'presence', kicker: 'BOT · 4', title: 'Presenza minima', steps: [
    { text: 'Se il BOT non ha unità sul tabellone, il primo Sviluppo diventa uno Schieramento della sua unità base, nello Stato stampato sulla carta.', focus: { x: 4, y: 43, w: 92, h: 8.5 } },
    { text: `Così l’Iran, invece di sviluppare l’Economia, schiera le ${BASE_UNIT.name} in ${territoryName(BOT_STATE)}.`, focus: { x: 4, y: 43, w: 92, h: 8.5 } },
  ], view: (step, focus) => <Split left={<Framed src={botFrontArt(BOT_CARD.id)} alt={BOT_CARD.name} focus={focus} ratio={CARD} />}
    right={<div className="rules-presence"><Tile id={BASE_UNIT.id} label={BASE_UNIT.name} className={step >= 1 ? 'is-joining' : 'is-dim'} />{step >= 1 && <strong>→ {territoryName(BOT_STATE)}</strong>}</div>} /> },
  { id: 'more', kicker: 'BOT · 5', title: 'Le altre regole del BOT', steps: [
    { text: 'Se il BOT Avanza, quando usa il suo mazzo il segna-turni sale di 2; quando gioca una carta del Mazzo Fazioni, sale degli OP della carta.' },
    { text: 'All’inizio della sua attivazione il BOT mantiene gratis una sua unità ruotata, se ne ha.' },
    { text: `A fine round piazza 1 Influenza nello Stato stampato in alto sulla carta: qui ${territoryName(BOT_STATE)}.` },
  ], view: step => <Rows step={step} items={[['Segna-turni', '+2 con il mazzo BOT · OP della carta'], ['Mantenimento', '1 unità gratis per attivazione'], ['Influenza a fine round', territoryName(BOT_STATE)]]} /> },
];

/* ---------------- Punteggio finale ---------------- */
export const FINAL = {
  roundPoints: 6,
  influence: ['libano', 'egitto', 'arabia-saudita', 'siria'],
  objectives: [['OBJ-EU-01', true], ['OBJ-EU-05', true], ['OBJ-EU-09', false]] as [string, boolean][],
  tensAtTen: 1,
};
export const FINAL_INFLUENCE = FINAL.influence.reduce((n, t) => n + 1 + alignment(t, 'Europa'), 0);
export const FINAL_OBJECTIVES = FINAL.objectives.reduce((n, [id, ok]) => n + (ok ? objective(id).points : 0), 0);
export const FINAL_TOTAL = FINAL.roundPoints + FINAL_INFLUENCE + FINAL_OBJECTIVES + FINAL.tensAtTen * 2;
const ALIGN = ['amico', 'neutrale', 'nemico'];
function Tally({ upTo }: { upTo: number }) {
  const rows: [string, number][] = [['Punti dei round', FINAL.roundPoints], ['Influenza', FINAL_INFLUENCE], ['Obiettivi segreti', FINAL_OBJECTIVES], ['Tracciati a 10', FINAL.tensAtTen * 2]];
  return <div className="rules-tally"><header><img src={emblemArt('Europa')} alt="" />Europa</header>
    {rows.map(([l, v], i) => <div key={l} className={i <= upTo ? 'is-on' : ''}><span>{l}</span><b>+{v}</b></div>)}
    <div className={`rules-tally-total ${upTo >= 4 ? "is-on" : ""}`}><span>Totale</span><b>{upTo >= 4 ? FINAL_TOTAL : "…"}</b></div></div>;
}
export const SCORING_SCENES: RuleScene[] = [
  { id: 'end', kicker: 'Fine della partita', title: 'Quando finisce', steps: [
    { text: 'Vittoria immediata: Nucleare a 15 vince l’Iran, Sanzioni a 10 vince la Coalizione. Con la Crisi Bellica a 1 scoppia la guerra totale.' },
    { text: 'Altrimenti si gioca fino alla linea della modalità: Breve 30, Media 60, Lunga 80. Il round in cui il segna-turni la raggiunge si completa, poi si contano i punti.' },
  ], view: step => <Rows step={step} items={[['Nucleare 15 · Sanzioni 10', 'vittoria immediata'], ['Crisi Bellica 1', 'guerra totale, si conta ai punti'], ['Breve 30 · Media 60 · Lunga 80', 'fine del round, si conta ai punti']]} from={-1} /> },
  { id: 'rounds', kicker: 'Punteggio finale · 1', title: 'I punti dei round', steps: [
    { text: `Si parte dai punti fatti a ogni fine round con le zone Forte e Crisi. In questo esempio l’Europa ne ha ${FINAL.roundPoints}.` },
  ], view: () => <Tally upTo={0} /> },
  { id: 'influence', kicker: 'Punteggio finale · 2', title: 'L’Influenza', steps: [
    { text: 'Ogni segnalino Influenza vale 1, 2 o 3 punti, secondo l’allineamento dello Stato verso la tua potenza: amico, neutrale o nemico.' },
    { text: `L’Europa ha 4 segnalini: Libano e Egitto amici (1 + 1), Arabia Saudita neutrale (2), Siria nemica (3). Totale ${FINAL_INFLUENCE}.` },
  ], view: step => <Split left={<Tally upTo={step >= 1 ? 1 : 0} />} right={<Rows step={step >= 1 ? 9 : -1} items={FINAL.influence.map(t => [territoryName(t), `${ALIGN[alignment(t, 'Europa')]} · ${1 + alignment(t, 'Europa')}`] as [string, string])} />} /> },
  { id: 'objectives', kicker: 'Punteggio finale · 3', title: 'Gli obiettivi segreti', steps: [
    { text: 'Si scoprono i 3 obiettivi segreti. Ognuno completato dà i punti stampati: +3, +4 o +6.' },
    { text: `“${objective('OBJ-EU-01').name}” (+${objective('OBJ-EU-01').points}) e “${objective('OBJ-EU-05').name}” (+${objective('OBJ-EU-05').points}) sono completati. “${objective('OBJ-EU-09').name}” no: le Sanzioni sono a 8. Totale ${FINAL_OBJECTIVES}.` },
  ], view: step => <div className="rules-objectives">{FINAL.objectives.map(([id, ok], i) => <figure key={id} className={step >= 1 ? (ok ? 'is-done' : 'is-failed') : ''} style={{ '--i': i } as CSSProperties}>
    <img src={getObjectiveCardFront(id) ?? ''} alt={objective(id).name} />{step >= 1 && <b>{ok ? `+${objective(id).points}` : '0'}</b>}</figure>)}</div> },
  { id: 'tens', kicker: 'Punteggio finale · 4', title: 'Tracciati al massimo e totale', steps: [
    { text: 'Ogni tracciato arrivato a 10 vale +2 punti: qui la Diplomazia dell’Europa.' },
    { text: `Totale dell’Europa: ${FINAL.roundPoints} + ${FINAL_INFLUENCE} + ${FINAL_OBJECTIVES} + ${FINAL.tensAtTen * 2} = ${FINAL_TOTAL} punti.` },
    { text: 'Vince chi ha più punti. In caso di parità vince chi ha la somma dei quattro tracciati più alta, poi chi ha più Consenso.' },
  ], view: step => <Tally upTo={step === 0 ? 3 : 4} /> },
  { id: 'war', kicker: 'Punteggio finale · 5', title: 'Dopo una guerra totale', steps: [
    { text: 'Con la guerra totale i punti si contano allo stesso modo, ma chi l’ha provocata non può vincere.' },
    { text: 'Se la guerra è scoppiata per un Evento o per la Tensione, nessuno l’ha provocata: tutte le potenze perdono 5 punti.' },
  ], view: step => <Rows step={step} items={[['Provocata da una potenza', 'quella potenza non può vincere'], ['Causata da Evento o Tensione', '−5 punti a tutti']]} /> },
];

/* ---------------- Blocco di Hormuz ---------------- */
const FLEET = unit('IR-U05'), CARRIER = unit('CO-U04'), TOKEN = unit('IR-U09');
const HORMUZ: Focus = { x: 70, y: 46, w: 15, h: 12 };
export const HORMUZ_SCENES: RuleScene[] = [
  { id: 'strait', kicker: 'Blocco di Hormuz', title: 'Lo Stretto', steps: [
    { text: 'Lo Stretto di Hormuz è il passaggio del petrolio del Golfo. Chi lo controlla a fine round prende 1 punto.', focus: HORMUZ },
  ], view: (_, focus) => <Framed src={BOARD_ART} alt="Il tabellone" focus={focus} ratio={BOARD} /> },
  { id: 'activate', kicker: 'Blocco di Hormuz', title: 'Come si attiva', steps: [
    { text: 'Se l’Iran ha 2 Flotte veloci del Golfo nello Stretto, scatta il Blocco.' },
    { text: `Oppure l’Iran schiera il token ${TOKEN.name} (costo ${TOKEN.cost}): basta una Flotta veloce nello Stretto.` },
    { text: 'Appena si attiva: Crisi Bellica −1 e Opinione −1. Se la Crisi Bellica arriva a 1, la guerra l’ha provocata l’Iran.' },
  ], view: step => <Split left={<div className="rules-presence"><Tile id={FLEET.id} label={FLEET.name} />{step === 1 ? <Tile id={TOKEN.id} label={TOKEN.name} className="is-joining" /> : <Tile id={FLEET.id} label={FLEET.name} />}</div>}
    right={step >= 2 ? <Rows step={9} items={[['Crisi Bellica', '−1'], ['Opinione', '−1']]} /> : <div className="rules-note">{step === 1 ? '1 Flotta veloce + token Blocco = Blocco' : '2 Flotte veloci nello Stretto = Blocco'}</div>} /> },
  { id: 'rounds', kicker: 'Blocco di Hormuz', title: 'A ogni fine round', steps: [
    { text: 'Finché il Blocco dura, a ogni fine round: Europa e Cina −1 Economia. La Russia guadagna +1 Economia solo se ha unità nello Stretto o in uno Stato del Golfo.' },
    { text: 'L’Iran ha +1 Consenso solo al primo fine round di Blocco; dai successivi perde 1 Economia.' },
    { text: 'Per la Coalizione ogni Schieramento costa 1 OP in più, in qualsiasi Stato.' },
    { text: 'La Flotta commerciale cinese e la Missione navale UE possono ignorare una perdita di Economia per round.' },
  ], view: step => <Rows step={step === 0 ? 1 : step === 1 ? 2 : step === 2 ? 3 : 4} items={[['Europa · Cina', 'Economia −1'], ['Russia (se presente nel Golfo)', 'Economia +1'], ['Iran', '1° round Consenso +1 · poi Economia −1'], ['Coalizione', 'Schieramento +1 OP'], ['Flotta commerciale · Missione navale UE', 'ignorano 1 perdita di Economia']]} /> },
  { id: 'end', kicker: 'Blocco di Hormuz', title: 'Come finisce', steps: [
    { text: `Il Blocco finisce se nello Stretto restano meno di 2 Flotte veloci e nessun token, oppure se arriva un ${CARRIER.name} della Coalizione, che rimuove anche il token. Il token cade anche quando nello Stretto non resta nessuna Flotta veloce.` },
  ], view: () => <div className="rules-presence"><Tile id={FLEET.id} label={FLEET.name} className="is-dim" /><span className="rules-vs">✕</span><Tile id={CARRIER.id} label={CARRIER.name} className="is-joining" /></div> },
];

/* ---------------- Sviluppo e Veto ---------------- */
const [CORR_A, CORR_B] = CORRELATIONS.Iran.Economia;
const ECO_TRACK: Focus = { x: 1.5, y: 14, w: 48.5, h: 12 }, ECO_CORR: Focus = { x: 1.5, y: 26, w: 48.5, h: 8 };
const corr = (c: { faction: Faction; track: Track; delta: number }) => `${c.faction} ${c.track} ${c.delta > 0 ? '+' : '−'}${Math.abs(c.delta)}`;
export const DEVELOP = { from: INITIAL_TRACKS.Iran.Economia, negative: CORR_B.delta < 0 ? CORR_B : CORR_A, positive: CORR_B.delta < 0 ? CORR_A : CORR_B };
export const DEVELOP_SCENES: RuleScene[] = [
  { id: 'develop', kicker: 'Sviluppo', title: 'Alzare un proprio tracciato', steps: [
    { text: 'Lo Sviluppo costa 2 OP e alza di 1 un tuo tracciato.', focus: ECO_TRACK },
    { text: `L’Iran sviluppa l’Economia: da ${DEVELOP.from} a ${DEVELOP.from + 1}.`, focus: ECO_TRACK },
  ], view: (step, focus) => <Split left={<Framed src={factionBoardArt('Iran')} alt="Plancia dell’Iran" focus={focus} ratio={PLANCIA} />}
    right={<Meter label="Iran · Economia" min={1} max={10} value={DEVELOP.from + (step >= 1 ? 1 : 0)} before={DEVELOP.from} color="#1f8a4c" zones />} /> },
  { id: 'correlation', kicker: 'Sviluppo', title: 'La correlazione', steps: [
    { text: `Poi scegli una delle due correlazioni stampate sotto quel tracciato: ${corr(DEVELOP.positive)} oppure ${corr(DEVELOP.negative)}. Una delle due va applicata.`, focus: ECO_CORR },
    { text: `L’Iran sceglie ${corr(DEVELOP.negative)}, per frenare l’Europa.`, focus: ECO_CORR },
  ], view: (step, focus) => <Split left={<Framed src={factionBoardArt('Iran')} alt="Plancia dell’Iran" focus={focus} ratio={PLANCIA} />}
    right={<Rows step={step >= 1 ? 1 : 0} items={[[corr(DEVELOP.positive), 'correlazione 1'], [corr(DEVELOP.negative), 'correlazione 2 · scelta']]} />} /> },
  { id: 'veto', kicker: 'Veto', title: 'Il Veto', steps: [
    { text: 'L’Europa ha la Diplomazia Forte (8 o più): può usare il Veto per annullare una correlazione negativa che la colpisce.' },
    { text: 'Il Veto annulla la correlazione ma costa 1 Diplomazia: l’Europa scende da 8 a 7 e la sua Economia resta com’era. Si usa una volta per round.' },
    { text: 'Vale per ogni correlazione negativa, anche quelle delle carte giocate come Evento. I BOT usano il Veto da soli, solo se il tracciato colpito è già in Crisi.' },
  ], view: step => <div className="round-meters rules-wide">
    <Meter label="Europa · Diplomazia" min={1} max={10} value={step >= 1 ? 7 : 8} before={8} color="#5a3fb5" zones />
    <Meter label="Europa · Economia" min={1} max={10} value={INITIAL_TRACKS.Europa.Economia} before={INITIAL_TRACKS.Europa.Economia} color="#5a3fb5" zones />
    <div className={`rules-veto ${step >= 1 ? 'is-on' : ''}`}><s>{corr(DEVELOP.negative)}</s><b>VETO</b></div>
  </div> },
];

/* ---------------- Preparazione della partita ---------------- */
export const START_GLOBALS = { Nucleare: 4, Sanzioni: 3, 'Crisi Bellica': 7, Opinione: 0 };
export const SETUP_SCENES: RuleScene[] = [
  { id: 'mode', kicker: 'Preparazione', title: 'Scegliete la durata', steps: [
    { text: 'Si sceglie la modalità: Breve, Media o Lunga. La partita finisce alla fine del round in cui il segna-turni raggiunge 30, 60 oppure 80.' },
  ], view: () => <Rows step={9} items={[['Breve', 'segna-turni 30'], ['Media', 'segna-turni 60'], ['Lunga', 'segna-turni 80']]} /> },
  { id: 'powers', kicker: 'Preparazione', title: 'Giocatori e BOT', steps: [
    { text: 'Ogni giocatore sceglie una potenza e prende la sua plancia. Le potenze rimaste senza giocatore sono BOT.' },
    { text: 'Ogni potenza parte con i suoi valori iniziali: per esempio l’Iran ha Economia 4, Militare 7, Diplomazia 4 e Consenso 5.' },
  ], view: step => step === 0 ? <div className="rules-badges">{FACTIONS.map((f, i) => <Badge key={f} faction={f} note={i >= 3 ? 'BOT' : undefined} />)}</div> :
    <div className="rules-start">{FACTIONS.map(f => <div key={f}><Badge faction={f} />{TRACKS.map(t => <span key={t}>{t.slice(0, 3)} <b>{INITIAL_TRACKS[f][t]}</b></span>)}</div>)}</div> },
  { id: 'cards', kicker: 'Preparazione', title: 'Carte e obiettivi', steps: [
    { text: 'Si mescola il Mazzo Fazioni e ogni giocatore riceve 5 carte.' },
    { text: 'Ogni giocatore pesca 3 obiettivi segreti dal mazzo della sua potenza e li tiene coperti fino alla fine.' },
    { text: 'Ogni BOT riceve invece i suoi 4 mazzi BOT mescolati, uno per tracciato. I BOT non hanno mano né obiettivi.' },
  ], view: step => <div className="rules-setup-cards">
    <figure className={step >= 0 ? 'is-on' : ''}><span className="rules-cards">{Array.from({ length: 5 }, (_, k) => <img key={k} src={FACTION_CARD_BACK} alt="" style={{ '--k': k } as CSSProperties} />)}</span><figcaption>5 carte</figcaption></figure>
    <figure className={step >= 1 ? 'is-on' : ''}><span className="rules-cards">{Array.from({ length: 3 }, (_, k) => <img key={k} src={getObjectiveCardBack('Iran') ?? ''} alt="" style={{ '--k': k } as CSSProperties} />)}</span><figcaption>3 obiettivi</figcaption></figure>
    <figure className={step >= 2 ? 'is-on' : ''}><span className="rules-cards">{TRACKS.map((t, k) => <img key={t} src={botBackArt('Cina', t)} alt="" style={{ '--k': k } as CSSProperties} />)}</span><figcaption>4 mazzi BOT</figcaption></figure>
  </div> },
  { id: 'board', kicker: 'Preparazione', title: 'Il tabellone', steps: [
    { text: `I segnalini globali partono da Nucleare ${START_GLOBALS.Nucleare}, Sanzioni ${START_GLOBALS.Sanzioni}, Crisi Bellica ${START_GLOBALS['Crisi Bellica']} e Opinione ${START_GLOBALS.Opinione}. Il segna-turni parte da 0.` },
    { text: 'Si mescola il mazzo Eventi. Il primo round comincia scoprendo la prima carta Evento.' },
  ], view: step => step === 0 ? <div className="round-meters rules-wide">
    <Meter label="Nucleare" min={1} max={15} value={START_GLOBALS.Nucleare} before={START_GLOBALS.Nucleare} />
    <Meter label="Sanzioni" min={1} max={10} value={START_GLOBALS.Sanzioni} before={START_GLOBALS.Sanzioni} />
    <Meter label="Crisi Bellica" min={1} max={10} value={START_GLOBALS['Crisi Bellica']} before={START_GLOBALS['Crisi Bellica']} danger="low" />
    <Meter label="Opinione" min={-10} max={10} value={START_GLOBALS.Opinione} before={START_GLOBALS.Opinione} />
  </div> : <div className="intro-card-row"><img className="intro-card intro-card-main" src={EVENT_BACK} alt="Mazzo Eventi" /></div> },
];

/* ---------------- Le azioni con gli OP ---------------- */
function Cost({ rows, total, title }: { rows: [string, string][]; total?: string; title?: string }) {
  return <div className="rules-tally rules-cost">{title && <header>{title}</header>}{rows.map(([a, b]) => <div key={a} className="is-on"><span>{a}</span><b>{b}</b></div>)}
    {total && <div className="rules-tally-total is-on"><span>Costo</span><b>{total}</b></div>}</div>;
}
export const DEPLOY_EXAMPLE = { unit: unit('CO-U01'), crisis: 8, economy: INITIAL_TRACKS.Coalizione.Economia, territory: 'iraq' };
export const DEPLOY_COST = DEPLOY_EXAMPLE.unit.cost + (DEPLOY_EXAMPLE.crisis <= 4 ? 2 : DEPLOY_EXAMPLE.crisis <= 7 ? 1 : 0) +
  (DEPLOY_EXAMPLE.economy <= 3 ? 1 : DEPLOY_EXAMPLE.economy >= 8 ? -1 : 0) + alignment(DEPLOY_EXAMPLE.territory, 'Coalizione');
export const ACTIONS_SCENES: RuleScene[] = [
  { id: 'menu', kicker: 'Azioni OP', title: 'Spendere gli OP', steps: [
    { text: 'Una carta giocata per gli OP dà un budget da spendere in una o più azioni, nell’ordine che preferisci. Gli OP non spesi si perdono.' },
  ], view: () => <Rows step={9} items={[['Sviluppo', '2 OP'], ['Pressione globale', '1–3 OP'], ['Influenza', '1–3 OP'], ['Destabilizzare', '2 OP'], ['Schieramento', 'costo dell’unità'], ['Mantenimento', '1 OP'], ['Attacco', '2 OP · solo Iran e Coalizione']]} /> },
  { id: 'influence', kicker: 'Azioni OP', title: 'Influenza', steps: [
    { text: 'Un segnalino Influenza costa 1 OP in uno Stato amico, 2 in uno neutrale, 3 in uno nemico, e serve un riquadro libero. Di norma resta fino a fine partita.' },
    { text: 'Per Russia, Cina ed Europa negli Stati non amici conta il Militare: Forte −1 OP, Crisi +1 OP. L’Iran paga −1 con l’Opinione a −4 o meno, la Coalizione con l’Opinione a +4 o più.' },
    { text: 'Alcune unità nello Stato rendono l’Influenza più economica di 1, le unità Cyber avversarie la rendono più cara di 1. Il costo minimo è sempre 1 OP.' },
  ], view: step => <Split left={<Cost title="Influenza della Cina · OP" rows={[['Arabia Saudita · amico', '1'], ['Siria · neutrale', '2'], ['Israele · nemico', '3']]} />}
    right={<Rows step={step === 0 ? -1 : step} items={[['Militare Forte · Crisi', '−1 · +1 OP'], ['Opinione', 'Iran ≤ −4 · Coalizione ≥ +4: −1'], ['Unità amiche · Cyber avversaria', '−1 · +1 OP']]} />} /> },
  { id: 'destabilize', kicker: 'Azioni OP', title: 'Destabilizzare', steps: [
    { text: 'Con 2 OP togli un segnalino Influenza avversario da uno Stato qualsiasi.' },
    { text: 'Non si può se l’Influenza è protetta da un Presidio: Convenzionale della Coalizione, Infrastrutture cinesi o Forze convenzionali iraniane in Iran.' },
  ], view: step => <div className="rules-presence"><Tile id="CO-U01" label="Presidio" className={step >= 1 ? '' : 'is-dim'} /><Tile id="CN-U04" label="Dipendenza" className={step >= 1 ? '' : 'is-dim'} /><Tile id="IR-U01" label="Presidio in Iran" className={step >= 1 ? '' : 'is-dim'} /></div> },
  { id: 'pressure', kicker: 'Azioni OP', title: 'Pressione globale', steps: [
    { text: 'La Pressione sposta di 1 un tracciato globale. Costa 1 OP con la Diplomazia Forte, 2 se Stabile, 3 se in Crisi. Un solo passo per tracciato a ogni attivazione.' },
    { text: 'Solo l’Iran alza il Nucleare; Coalizione ed Europa lo abbassano. Coalizione ed Europa alzano le Sanzioni; Iran, Russia e Cina le abbassano. Crisi Bellica e Opinione le muovono tutti.' },
  ], view: step => <Rows step={step === 0 ? 0 : 9} items={[['Diplomazia Forte · Stabile · Crisi', '1 · 2 · 3 OP'], ['Nucleare', '+ Iran · − Coalizione, Europa'], ['Sanzioni', '+ Coalizione, Europa · − Iran, Russia, Cina'], ['Crisi Bellica · Opinione', 'tutti, nei due sensi']]} /> },
  { id: 'deploy', kicker: 'Azioni OP', title: 'Schieramento', steps: [
    { text: 'Schierare costa il valore stampato sull’unità, più la Crisi Bellica: +2 se è a 4 o meno, +1 da 5 a 7, nulla da 8 in su.' },
    { text: 'Poi l’Economia (in Crisi +1, Forte −1) e l’allineamento dello Stato (+0, +1, +2). Per la Coalizione +1 durante il Blocco di Hormuz, e +1 con una Cyber avversaria nello Stato.' },
    { text: `Esempio: la Coalizione schiera un ${DEPLOY_EXAMPLE.unit.name} in Iraq con la Crisi Bellica a ${DEPLOY_EXAMPLE.crisis}: ${DEPLOY_EXAMPLE.unit.cost} + 0 + 0 + 1 (Iraq neutrale) = ${DEPLOY_COST} OP. Le unità schierate non si muovono più.` },
  ], view: step => <Split left={<Tile id={DEPLOY_EXAMPLE.unit.id} label={`${DEPLOY_EXAMPLE.unit.name} · costo ${DEPLOY_EXAMPLE.unit.cost}`} />}
    right={step < 2 ? <Rows step={step === 0 ? 1 : 9} items={[['Costo dell’unità', 'stampato'], ['Crisi Bellica', '≤4 +2 · 5–7 +1 · ≥8 +0'], ['Economia', 'Crisi +1 · Forte −1'], ['Allineamento', '+0 · +1 · +2'], ['Blocco · Cyber', '+1 · +1']]} />
      : <Cost rows={[['Convenzionale', String(DEPLOY_EXAMPLE.unit.cost)], [`Crisi Bellica ${DEPLOY_EXAMPLE.crisis}`, '+0'], [`Economia ${DEPLOY_EXAMPLE.economy}`, '+0'], ['Iraq neutrale', '+1']]} total={`${DEPLOY_COST} OP`} />} /> },
  { id: 'keep', kicker: 'Azioni OP', title: 'Mantenimento e Attacco', steps: [
    { text: 'Mantenimento: 1 OP per una tua unità ruotata, che torna dritta e resta un altro round.' },
    { text: 'Attacco: 2 OP, solo per Iran e Coalizione, in uno Stato dove ci sono unità di tutte e due. Diventano 4 se nello Stato ci sono i Caschi blu europei.' },
  ], view: step => <div className="intro-units"><div className="intro-unit-row">
    <img src={unitFrontArt('CO-U02')} alt="" className={step === 0 ? 'is-rotated is-kept' : ''} />
    <img src={unitFrontArt('EU-U01')} alt="" className={step === 1 ? 'is-picked' : ''} /></div>
    <p className="intro-unit-caption">{step === 0 ? 'Mantenimento · 1 OP' : 'Attacco · 2 OP, 4 con i Caschi blu'}</p></div> },
];

/* ---------------- Le unità e i loro bonus ---------------- */
interface UnitStep { ids: string[]; text: string }
const UNIT_GROUPS: Record<Faction, UnitStep[]> = {
  Iran: [
    { ids: ['IR-U01', 'IR-U02'], text: 'Forze convenzionali: in Iran l’Influenza iraniana non può essere Destabilizzata. IRGC: l’élite, in Iran difende a 5.' },
    { ids: ['IR-U03', 'IR-U07'], text: 'Proxy regionali e Droni Shahed: se vincono, il vinto perde 1 Consenso in più. I Proxy rendono l’Influenza iraniana nel loro Stato più economica di 1 OP.' },
    { ids: ['IR-U04', 'IR-U06', 'IR-U05', 'IR-U09'], text: 'Missili balistici: attacco 4, al massimo 2 per Stato, annullati dallo Scudo. Cyber Unit: −1 alla difesa avversaria. Flotta veloce: con 2 a Hormuz scatta il Blocco. Token Blocco: con una sola Flotta, costo 3.' },
  ],
  Coalizione: [
    { ids: ['CO-U01', 'CO-U02'], text: 'Convenzionale: Presidio, la tua Influenza in quello Stato non si può Destabilizzare. Forze Speciali: se vincono +1 Diplomazia, se perdono −1 Consenso.' },
    { ids: ['CO-U03', 'CO-U05'], text: 'Aviazione Tattica e Missili da crociera: attacco 3. L’S-400 russo annulla l’Aviazione; i Missili, se vincono in Iran, tolgono 1 al Nucleare.' },
    { ids: ['CO-U06', 'CO-U04'], text: 'Scudo Missilistico: difesa 4 e annulla i Missili balistici iraniani. Carrier Strike Group: a Hormuz annulla il Blocco.' },
  ],
  Russia: [
    { ids: ['RU-U01', 'RU-U03'], text: 'Consiglieri militari e Forniture armi servono a sostenere gli altri: aggiungono forza alla parte che la Russia sceglie di aiutare.' },
    { ids: ['RU-U02', 'RU-U04'], text: 'Difesa aerea S-400: annulla l’Aviazione Tattica. Flotta nel Mediterraneo: l’Influenza russa costa 1 OP in meno in Siria e Libano.' },
    { ids: ['RU-U05', 'RU-U06'], text: 'Intelligence: a ogni attivazione guardi la mano di una potenza presente nel suo Stato. Cyber Russia: lì gli avversari pagano +1 OP per Influenza e Schieramento.' },
  ],
  Cina: [
    { ids: ['CN-U01', 'CN-U04'], text: 'Investimenti BRI: Influenza cinese −1 OP nello Stato. Infrastrutture: lì l’Influenza cinese non può essere Destabilizzata.' },
    { ids: ['CN-U02', 'CN-U03'], text: 'Flotta commerciale: una volta per round ignori una perdita di Economia. Tecnologia duale: +1 alla difesa se nello Stato difendono Iran o Russia.' },
    { ids: ['CN-U05', 'CN-U06'], text: 'Satelliti: guardi la mano di una potenza presente nel loro Stato. Cyber Unit: lì gli avversari pagano +1 OP per Influenza e Schieramento.' },
  ],
  Europa: [
    { ids: ['EU-U01', 'EU-U04'], text: 'Caschi blu: solo difesa, massimo 3 per Stato, e attaccare lì costa 2 OP in più. Diplomazia UE: la tua Pressione globale costa 1 OP in meno.' },
    { ids: ['EU-U03', 'EU-U02'], text: 'Aiuti umanitari: Influenza europea −1 OP nello Stato. Missione navale UE: una volta per round ignori una perdita di Economia.' },
    { ids: ['EU-U05', 'EU-U06'], text: 'Intelligence: guardi la mano di una potenza presente nel suo Stato. Cyber Unit: lì gli avversari pagano +1 OP per Influenza e Schieramento.' },
  ],
};
export const UNIT_GROUP_IDS = UNIT_GROUPS;
export const UNITS_SCENES: RuleScene[] = [
  { id: 'intro', kicker: 'Le unità', title: 'Costo, attacco, difesa, bonus', steps: [
    { text: 'Ogni unità ha stampati il costo, l’attacco e la difesa. Il bonus scritto sotto vale finché l’unità resta sul tabellone.' },
    { text: 'Il bonus vale nello Stato dove l’unità è schierata, salvo dove è scritto altrimenti. Vediamo le unità di ogni potenza.' },
  ], view: () => <div className="intro-card-row"><Tile id="IR-U03" label="Proxy regionali · costo 1 · A1 · D2" /></div> },
  ...FACTIONS.map((f): RuleScene => ({ id: `units-${f}`, kicker: `Le unità · ${f}`, title: `Le unità ${f === 'Europa' || f === 'Iran' ? 'dell’' : 'della '}${f}`,
    steps: UNIT_GROUPS[f].map(g => ({ text: g.text })),
    view: step => <div className="rules-units"><Badge faction={f} /><div>{UNITS.filter(u => u.faction === f).map((u, i) =>
      <figure key={u.id} className={UNIT_GROUPS[f][step]?.ids.includes(u.id) ? 'is-picked' : ''} style={{ '--i': i } as CSSProperties}><img src={unitFrontArt(u.id)} alt="" /><figcaption>{u.name}</figcaption></figure>)}</div></div> })),
];

export const RULE_INTROS = {
  setup: { scenes: SETUP_SCENES, label: 'Preparazione', seenKey: 'linea-rossa.guided-setup.v1' },
  actions: { scenes: ACTIONS_SCENES, label: 'Azioni OP', seenKey: 'linea-rossa.guided-actions.v1' },
  units: { scenes: UNITS_SCENES, label: 'Le unità', seenKey: 'linea-rossa.guided-units.v1' },
  endRound: { scenes: END_ROUND_SCENES, label: 'Fine del round', seenKey: 'linea-rossa.guided-end-round.v1' },
  bot: { scenes: BOT_SCENES, label: 'Turno di un BOT', seenKey: 'linea-rossa.guided-bot.v1' },
  scoring: { scenes: SCORING_SCENES, label: 'Punteggio finale', seenKey: 'linea-rossa.guided-scoring.v1' },
  hormuz: { scenes: HORMUZ_SCENES, label: 'Blocco di Hormuz', seenKey: 'linea-rossa.guided-hormuz.v1' },
  develop: { scenes: DEVELOP_SCENES, label: 'Sviluppo e Veto', seenKey: 'linea-rossa.guided-develop.v1' },
} as const;
export type RuleIntroId = keyof typeof RULE_INTROS;

export default function RuleIntro({ id, ...props }: PlayerProps & { id: RuleIntroId; onFinish?: () => void; finalLabel?: string }) {
  const intro = RULE_INTROS[id];
  return <IntroPlayer {...props} scenes={intro.scenes as unknown as RuleScene[]} label={intro.label}
    render={(scene, step) => scene.view(step, scene.steps[step]?.focus)} />;
}
