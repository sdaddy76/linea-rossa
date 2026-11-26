import type { CSSProperties } from 'react';
import { EVENTS, FACTION_CARDS, INITIAL_TRACKS, type Faction, type GlobalTrack, type Track } from '../catalog';
import { EVENT_BACK, eventFrontArt } from '../art';
import { getFactionCardFront } from '../../data/card-graphics';
import { FlipCard, Framed, IntroPlayer, type IntroScene, type PlayerProps } from './IntroPlayer';
import { emblemArt } from './ComponentsIntro';

/** Animazione di un round: si scopre l'Evento, poi l'Europa gioca una carta. Valori presi dal catalogo vero. */
export const ROUND_SEEN_KEY = 'linea-rossa.guided-round.v1';

const EVENT = EVENTS.find(e => e.id === 'E01')!;
const CARD = FACTION_CARDS.find(c => c.id === 'C097')!;
const OPTION = CARD.options[0];
const HAND = ['C105', 'C114', 'C097', 'NE02', 'C108'];
const START_GLOBALS: Record<GlobalTrack, number> = { Nucleare: 4, Sanzioni: 3, 'Crisi Bellica': 7, Opinione: 0 };
const CARD_RATIO = 900 / 1260;

type Values = { globals: Record<GlobalTrack, number>; tracks: Record<Faction, Record<Track, number>>; pv: number };
const clampGlobal = (t: GlobalTrack, v: number) => Math.min(t === 'Nucleare' ? 15 : 10, Math.max(t === 'Opinione' ? -10 : 1, v));
/** Stadi: 0 iniziale · 1 Evento · 2 opzione · 3 correlazione · 4 globali dell'opzione. */
export function valuesAt(stage: number): Values {
  const v: Values = { globals: { ...START_GLOBALS }, tracks: structuredClone(INITIAL_TRACKS) as Values['tracks'], pv: 0 };
  const change = (c: { faction: Faction; track: Track; delta: number }) => { v.tracks[c.faction][c.track] = Math.min(10, Math.max(1, v.tracks[c.faction][c.track] + c.delta)); };
  const global = (g: { track: GlobalTrack; delta: number }) => { v.globals[g.track] = clampGlobal(g.track, v.globals[g.track] + g.delta); };
  if (stage >= 1) { EVENT.changes.forEach(change); EVENT.globals.forEach(global); }
  if (stage >= 2) change(OPTION.boost);
  if (stage >= 3) change(OPTION.correlation);
  if (stage >= 4) OPTION.globals.forEach(global);
  if (stage >= 2 && OPTION.boost.faction !== 'Europa') v.pv = 1;
  return v;
}

type Visual = 'deck' | 'effects' | 'order' | 'hand' | 'choice' | 'ops' | 'next';
interface Scene extends IntroScene { visual: Visual; stages: number[] }
const sign = (n: number) => `${n > 0 ? '+' : ''}${n}`;
const g = (t: GlobalTrack) => EVENT.globals.find(x => x.track === t)?.delta ?? 0;
const v0 = valuesAt(0), v4 = valuesAt(4);

export const ROUND_SCENES: Scene[] = [
  { id: 'deck', kicker: 'Un round di gioco', title: 'Si scopre l’Evento', visual: 'deck', stages: [0, 0], steps: [
    { text: 'Ogni round comincia così: si scopre la prima carta del mazzo Eventi.' },
    { text: `Esce ${EVENT.id}, “${EVENT.name}”. L’Evento cambia la situazione prima che qualcuno giochi.` },
  ] },
  { id: 'effects', kicker: 'Un round di gioco', title: 'Gli effetti dell’Evento', visual: 'effects', stages: [0, 1], steps: [
    { text: 'Il riquadro “Tracciati modificati” dice cosa cambia: il bordo arancione sale, quello azzurro scende.', focus: { x: 4, y: 63, w: 92, h: 16 } },
    { text: `Si applica subito: Nucleare ${sign(g('Nucleare'))}, Sanzioni ${sign(g('Sanzioni'))}, Opinione ${sign(g('Opinione'))} e Consenso dell’Iran −1. Gli effetti di un Evento non attivano correlazioni.`, focus: { x: 4, y: 63, w: 92, h: 16 } },
  ] },
  { id: 'order', kicker: 'Un round di gioco', title: 'Chi gioca e chi avanza', visual: 'order', stages: [1, 1], steps: [
    { text: 'L’Evento decide l’ordine di turno: Europa, Iran, Cina, Coalizione, Russia. Si fanno due giri: ogni potenza gioca una carta per volta, due carte a round.', focus: { x: 4, y: 79.5, w: 92, h: 9.5 } },
    { text: 'Avanzano: Cina. Solo le carte giocate dalla Cina muovono il segna-turni, di tanti spazi quanti sono i loro OP. È così che si avvicina la fine della partita.', focus: { x: 4, y: 89, w: 92, h: 8.5 } },
  ] },
  { id: 'hand', kicker: 'Attivazione · Europa', title: 'Tocca all’Europa', visual: 'hand', stages: [1, 1], steps: [
    { text: 'L’Europa è prima nell’ordine. Ha 5 carte in mano e ne sceglie una: Mediazione UE.' },
    { text: `Ogni carta si gioca in due modi: come Evento, scegliendo una delle 3 opzioni, oppure per i suoi OP, il numero nel cerchio (qui ${CARD.cost}).` },
  ] },
  { id: 'choice', kicker: 'Attivazione · Europa', title: 'Giocata come Evento', visual: 'choice', stages: [1, 2, 3, 4, 4, 4], steps: [
    { text: 'Le tre opzioni favoriscono potenze diverse: Europa, Russia o Cina. L’Europa sceglie la prima.', focus: { x: 4, y: 50.5, w: 92, h: 44 } },
    { text: `Europa Diplomazia +2: da ${v0.tracks.Europa.Diplomazia} a ${v4.tracks.Europa.Diplomazia}, nella zona Forte. Ora la Pressione le costa meno e può usare il Veto.`, focus: { x: 20, y: 55, w: 40, h: 5.5 } },
    { text: `Poi la correlazione stampata sotto: Cina Diplomazia −1, da ${v0.tracks.Cina.Diplomazia} a ${v4.tracks.Cina.Diplomazia}. La Cina potrebbe annullarla con il Veto solo se avesse la Diplomazia Forte.`, focus: { x: 20, y: 59.5, w: 40, h: 4.5 } },
    { text: `Infine i tracciati globali dell’opzione: Crisi Bellica +1, da ${valuesAt(1).globals['Crisi Bellica']} a ${v4.globals['Crisi Bellica']}. Più è alta, più la guerra è lontana.`, focus: { x: 72, y: 52.3, w: 22, h: 4.2 } },
    { text: 'Ha scelto un’opzione a proprio favore, quindi niente punto extra. Con la seconda o la terza avrebbe preso +1 punto: il dividendo diplomatico, una volta per round.', focus: { x: 74, y: 94, w: 22, h: 3.8 } },
    { text: `L’Europa non Avanza in questo round: il segna-turni resta fermo. Se questa carta l’avesse giocata la Cina, sarebbe avanzato di ${CARD.cost}.`, focus: { x: 85, y: 11.5, w: 11.5, h: 7.5 } },
  ] },
  { id: 'ops', kicker: 'Attivazione · Europa', title: 'Oppure: giocata per gli OP', visual: 'ops', stages: [1, 1, 1], steps: [
    { text: `In alternativa l’Europa poteva spendere i ${CARD.cost} OP della carta in azioni, anche diverse tra loro. Gli OP non spesi si perdono.` },
    { text: 'Sviluppo: 2 OP per +1 a un proprio tracciato, con una correlazione. Pressione: sposta di 1 un tracciato globale; con Diplomazia Stabile costa 2 OP.' },
    { text: 'Influenza: un segnalino in uno Stato, 1, 2 o 3 OP secondo l’allineamento. Schieramento: il costo dell’unità. Solo Iran e Coalizione possono Attaccare.' },
  ] },
  { id: 'next', kicker: 'Fine dell’attivazione', title: 'Il turno passa', visual: 'next', stages: [4, 4, 4], steps: [
    { text: 'Finita l’attivazione dell’Europa tocca all’Iran, poi a Cina, Coalizione e Russia. Poi si ricomincia con il secondo giro.' },
    { text: 'Quando tutti hanno giocato due carte il round si chiude: Tensione, Influenza dei BOT, controllo degli Stati, punti, unità e nuove carte.' },
    { text: 'Poi si scopre un nuovo Evento e comincia il round successivo. Ora prova tu: la partita guidata parte proprio da questo round.' },
  ] },
];

const FACTION_COLOR: Record<Faction, string> = { Iran: '#1f8a4c', Coalizione: '#2457b8', Russia: '#b3261e', Cina: '#d48a00', Europa: '#5a3fb5' };
interface MeterDef { label: string; min: number; max: number; value: number; before: number; color?: string; zones?: boolean; danger?: 'low' | 'high' }
export function Meter({ label, min, max, value, before, color, zones, danger }: MeterDef) {
  const cells = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const pos = (v: number) => (v - min + 0.5) / cells.length * 100;
  const zone = (v: number) => !zones ? '' : v <= 3 ? 'is-crisis' : v >= 8 ? 'is-strong' : '';
  const moved = value !== before;
  return <div className={`round-meter ${moved ? 'is-moved' : ''}`} style={{ '--c': color ?? '#6ee7b7' } as CSSProperties}>
    <div className="round-meter-head"><span>{label}</span><strong>{value > 0 && min < 0 ? `+${value}` : value}{moved && <em>{sign(value - before)}</em>}</strong></div>
    <div className={`round-meter-track ${danger ? `danger-${danger}` : ''}`}>
      {cells.map(c => <i key={c} className={zone(c)} />)}
      <b style={{ left: `${pos(value)}%` }} />
    </div>
  </div>;
}

function Meters({ stage, rows }: { stage: number; rows: ('Nucleare' | 'Sanzioni' | 'Opinione' | 'Crisi Bellica' | `${Faction}.${Track}`)[] }) {
  const now = valuesAt(stage), prev = valuesAt(Math.max(0, stage - 1));
  return <div className="round-meters">{rows.map(r => {
    if (r.includes('.')) {
      const [f, t] = r.split('.') as [Faction, Track];
      return <Meter key={r} label={`${f} · ${t}`} min={1} max={10} value={now.tracks[f][t]} before={prev.tracks[f][t]} color={FACTION_COLOR[f]} zones />;
    }
    const t = r as GlobalTrack;
    return <Meter key={r} label={t} min={t === 'Opinione' ? -10 : 1} max={t === 'Nucleare' ? 15 : 10} value={now.globals[t]} before={prev.globals[t]}
      danger={t === 'Crisi Bellica' ? 'low' : t === 'Opinione' ? undefined : 'high'} />;
  })}</div>;
}

export function OrderBar({ active }: { active?: Faction }) {
  return <div className="round-order">{EVENT.order.map((f, i) =>
    <span key={f} className={`${f === active ? 'is-active' : ''} ${EVENT.advancers.includes(f) ? 'is-advancer' : ''}`}>
      <small>{i + 1}</small><img src={emblemArt(f)} alt="" /><b>{f}</b>
    </span>)}</div>;
}

function RoundVisual({ scene, step }: { scene: Scene; step: number }) {
  const stage = scene.stages[step] ?? 0, focus = scene.steps[step]?.focus;
  const cardFront = getFactionCardFront(CARD.id, CARD.origin) ?? '';
  switch (scene.visual) {
    case 'deck':
      return <div className="intro-card-row"><FlipCard back={EVENT_BACK} front={eventFrontArt(EVENT.id)} alt={`Evento ${EVENT.id}`} flipped={step >= 1} /></div>;
    case 'effects':
      return <div className="round-split">
        <div className="round-card"><Framed src={eventFrontArt(EVENT.id)} alt={`Evento ${EVENT.id}`} focus={focus} ratio={CARD_RATIO} /></div>
        <Meters stage={stage} rows={['Nucleare', 'Sanzioni', 'Opinione', 'Iran.Consenso']} />
      </div>;
    case 'order':
      return <div className="round-split">
        <div className="round-card"><Framed src={eventFrontArt(EVENT.id)} alt={`Evento ${EVENT.id}`} focus={focus} ratio={CARD_RATIO} /></div>
        <div className="round-side"><OrderBar />
          <div className={`round-marker ${step === 1 ? 'is-on' : ''}`}><span>Segna-turni</span><strong>0</strong><small>avanza solo con le carte della Cina</small></div></div>
      </div>;
    case 'hand':
      return <div className="round-hand-wrap"><OrderBar active="Europa" />
        <div className={`round-hand ${step >= 1 ? 'is-picked' : ''}`}>{HAND.map((id, i) =>
          <img key={id} src={getFactionCardFront(id, 'Europa') ?? ''} alt={id === CARD.id ? CARD.name : ''} className={id === CARD.id ? 'is-chosen' : ''} style={{ '--i': i - 2 } as CSSProperties} />)}</div>
        {step >= 1 && <div className="round-ways"><span>Evento · 1 di 3 opzioni</span><span>oppure</span><span>{CARD.cost} OP · azioni</span></div>}
      </div>;
    case 'choice':
      return <div className="round-split">
        <div className="round-card"><Framed src={cardFront} alt={CARD.name} focus={focus} ratio={CARD_RATIO} /></div>
        <div className="round-side">
          <Meters stage={Math.min(stage, 4)} rows={['Europa.Diplomazia', 'Cina.Diplomazia', 'Crisi Bellica']} />
          <div className={`round-marker ${step >= 4 ? 'is-on' : ''}`}><span>{step === 5 ? 'Segna-turni' : 'Punti Europa'}</span><strong>{step === 5 ? 0 : valuesAt(stage).pv}</strong><small>{step === 5 ? 'Europa non Avanza' : 'nessun dividendo'}</small></div>
        </div>
      </div>;
    case 'ops':
      return <div className="round-split">
        <div className="round-card is-small"><Framed src={cardFront} alt={CARD.name} ratio={CARD_RATIO} /></div>
        <div className="round-ops">
          <div className="round-ops-budget">{Array.from({ length: CARD.cost }, (_, i) => <i key={i} />)}<span>{CARD.cost} OP</span></div>
          {[['Sviluppo', '2 OP', 1], ['Pressione', '2 OP', 1], ['Influenza', '1–3 OP', 2], ['Schieramento', 'costo unità', 2], ['Attacco', 'solo Iran e Coalizione', 2]].map(([name, cost, s]) =>
            <div key={String(name)} className={`${step >= Number(s) ? 'is-on' : ''} ${name === 'Attacco' ? 'is-locked' : ''}`}><strong>{name}</strong><span>{cost}</span></div>)}
        </div>
      </div>;
    default:
      return <div className="round-next"><OrderBar active={step === 0 ? 'Iran' : undefined} />
        {step >= 1 && <ol className="round-closure">{['Tensione', 'Influenza BOT', 'Controllo', 'Punti', 'Unità', 'Nuove carte'].map((x, i) => <li key={x} style={{ '--i': i } as CSSProperties}>{x}</li>)}</ol>}
        {step >= 2 && <div className="round-next-event"><FlipCard back={EVENT_BACK} front={EVENT_BACK} alt="" flipped={false} /></div>}
      </div>;
  }
}

export default function RoundIntro(props: PlayerProps & { onFinish?: () => void; finalLabel?: string }) {
  return <IntroPlayer {...props} scenes={ROUND_SCENES} label="Fasi del round" render={(scene, step) => <RoundVisual scene={scene} step={step} />} />;
}
