import type { CSSProperties, ReactNode } from 'react';
import { FACTION_CARDS, UNITS, type Faction } from '../catalog';
import { BOARD_ART, unitFrontArt } from '../art';
import { getFactionCardFront } from '../../data/card-graphics';
import { Framed, IntroPlayer, type IntroScene, type PlayerProps } from './IntroPlayer';
import { emblemArt } from './ComponentsIntro';

/** Animazione di un combattimento: lo stesso scontro in Iraq che si gioca nella partita guidata. */
export const COMBAT_SEEN_KEY = 'linea-rossa.guided-combat.v1';

const unit = (id: string) => UNITS.find(u => u.id === id)!;
const IRGC = unit('IR-U02'), CONV = unit('CO-U01'), ADVISERS = unit('RU-U01');
const CARD = FACTION_CARDS.find(c => c.id === 'C009')!;
/** Valori dello scontro, verificati nei test contro il motore della partita guidata. */
export const BATTLE = {
  dice: [6, 2] as [number, number], military: { Coalizione: 7, Iran: 7 },
  crisis: [9, 8] as [number, number], consensus: [4, 3] as [number, number], attackCost: 2,
};
const mod = (m: number) => m <= 3 ? -1 : m >= 8 ? 1 : 0;
export const ATTACK = CONV.attack + mod(BATTLE.military.Coalizione) + BATTLE.dice[0];
export const DEFENSE = IRGC.defense + ADVISERS.defense + mod(BATTLE.military.Iran) + BATTLE.dice[1];
const IRAQ = { x: 50.5, y: 26, w: 18, h: 16 };

type Visual = 'field' | 'declare' | 'support' | 'totals' | 'outcome' | 'special';
interface Scene extends IntroScene { visual: Visual }

export const COMBAT_SCENES: Scene[] = [
  { id: 'field', kicker: 'Combattimento', title: 'Il campo di battaglia', visual: 'field', steps: [
    { text: `In Iraq ci sono tre unità: l’${IRGC.name} dell’Iran, le Forze convenzionali della Coalizione e i ${ADVISERS.name} russi.` },
    { text: 'Solo Iran e Coalizione possono attaccare, e solo in uno Stato dove ci sono unità di tutte e due.' },
  ] },
  { id: 'declare', kicker: 'Combattimento · 1', title: 'La Coalizione dichiara l’attacco', visual: 'declare', steps: [
    { text: `Nella sua attivazione la Coalizione gioca “${CARD.name}” per i ${CARD.cost} OP e ne spende ${BATTLE.attackCost} per attaccare in Iraq.` },
    { text: `Ogni attacco abbassa subito di 1 la Crisi Bellica: da ${BATTLE.crisis[0]} a ${BATTLE.crisis[1]}. Se arriva a 1 scoppia la guerra totale e chi l’ha provocata non può vincere.` },
  ] },
  { id: 'support', kicker: 'Combattimento · 2', title: 'Il sostegno', visual: 'support', steps: [
    { text: 'Le altre potenze con unità nello Stato scelgono chi sostenere, oppure restano fuori. Qui decide la Russia.' },
    { text: `La Russia sostiene l’Iran: i suoi ${ADVISERS.name} passano dalla parte del difensore e aggiungono la loro Difesa.` },
  ] },
  { id: 'totals', kicker: 'Combattimento · 3', title: 'Si fanno i conti', visual: 'totals', steps: [
    { text: `Chi attacca somma l’Attacco delle sue unità, chi difende la Difesa. Coalizione: ${CONV.attack}. Iran: ${IRGC.defense} dell’IRGC più ${ADVISERS.defense} dei Consiglieri.` },
    { text: 'Poi il Militare: +1 se è Forte, −1 se è in Crisi. Qui sono entrambi Stabili, quindi 0. Nessuno controlla l’Iraq, quindi niente +1 al difensore.' },
    { text: `Ognuno tira un dado: la Coalizione fa ${BATTLE.dice[0]}, l’Iran fa ${BATTLE.dice[1]}.` },
    { text: `Totale: Coalizione ${ATTACK}, Iran ${DEFENSE}. Vince la Coalizione. In caso di parità avrebbe vinto il difensore.` },
  ] },
  { id: 'outcome', kicker: 'Combattimento · 4', title: 'Le perdite', visual: 'outcome', steps: [
    { text: 'Chi perde rimuove 1 unità, oppure 2 se la differenza è di 4 o più. L’Iran perde l’IRGC; le unità di chi ha dato sostegno non si toccano.' },
    { text: `Lo sconfitto perde anche 1 Consenso (Iran da ${BATTLE.consensus[0]} a ${BATTLE.consensus[1]}) e il suo segnalino Influenza più a sinistra in quello Stato, se ne ha.` },
  ] },
  { id: 'special', kicker: 'Combattimento · 5', title: 'Unità speciali', visual: 'special', steps: [
    { text: 'Alcune unità cambiano i conti. L’IRGC difende a 5 quando è in Iran. La Cyber Unit toglie 1 alla Difesa avversaria.' },
    { text: 'La Difesa aerea S-400 annulla l’Aviazione Tattica; lo Scudo Missilistico annulla i Missili balistici. Proxy e Droni, se vincono, tolgono 1 Consenso in più.' },
    { text: 'Nella partita guidata giocherai proprio questo scontro, nel secondo round.' },
  ] },
];

function Tile({ id, label, className = '', style }: { id: string; label: string; className?: string; style?: CSSProperties }) {
  return <figure className={`combat-tile ${className}`} style={style}><img src={unitFrontArt(id)} alt="" /><figcaption>{label}</figcaption></figure>;
}
function Side({ faction, role, children }: { faction: Faction; role: string; children: ReactNode }) {
  return <div className="combat-side"><header><img src={emblemArt(faction)} alt="" /><div><strong>{faction}</strong><small>{role}</small></div></header>{children}</div>;
}
const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
function Die({ value, rolled }: { value: number; rolled: boolean }) {
  return <span className={`combat-die ${rolled ? 'is-rolled' : ''}`} aria-label={rolled ? `dado ${value}` : 'dado'}>
    {Array.from({ length: 9 }, (_, i) => <i key={i} className={rolled && PIPS[value].includes(i) ? 'is-on' : ''} />)}
  </span>;
}
function Sum({ rows, total, show, win }: { rows: [string, number, boolean][]; total: number; show: boolean; win?: boolean }) {
  return <div className={`combat-sum ${win ? 'is-win' : ''}`}>
    {rows.map(([label, v, on]) => <div key={label} className={on ? 'is-on' : ''}><span>{label}</span><b>{v > 0 ? `+${v}` : v}</b></div>)}
    <div className={`combat-total ${show ? 'is-on' : ''}`}><span>Totale</span><b>{total}</b></div>
  </div>;
}

function CombatVisual({ scene, step }: { scene: Scene; step: number }) {
  const v = scene.visual;
  const supported = v !== 'field' && v !== 'declare' && !(v === 'support' && step === 0);
  const removed = v === 'outcome' || v === 'special';
  const advisers = <Tile id={ADVISERS.id} label={`${ADVISERS.name} · D${ADVISERS.defense}`} className={v === "support" ? "is-russia is-joining" : "is-russia"} />;
  if (v === 'special') return <div className="combat-specials">{['IR-U02', 'IR-U06', 'RU-U02', 'CO-U03', 'CO-U06', 'IR-U04', 'IR-U03', 'IR-U07'].map((id, i) =>
    <Tile key={id} id={id} label={unit(id).name} style={{ '--i': i } as CSSProperties} className={(step === 0 ? [0, 1] : step === 1 ? [2, 3, 4, 5, 6, 7] : []).includes(i) ? 'is-picked' : step === 2 ? '' : 'is-dim'} />)}</div>;
  return <div className="combat-arena">
    <div className="combat-bg"><Framed src={BOARD_ART} alt="" focus={IRAQ} ratio={3072 / 2048} /></div>
    {v === 'declare' && <div className="combat-declare">
      <img src={getFactionCardFront(CARD.id, CARD.origin) ?? ''} alt={CARD.name} />
      <div className="combat-ops">{Array.from({ length: CARD.cost }, (_, i) => <i key={i} className={i < BATTLE.attackCost ? 'is-spent' : ''} />)}<span>{BATTLE.attackCost} OP · Attacco</span></div>
      <div className={`combat-crisis ${step >= 1 ? 'is-on' : ''}`}><span>Crisi Bellica</span><b>{step >= 1 ? BATTLE.crisis[1] : BATTLE.crisis[0]}</b>{step >= 1 && <em>−1</em>}</div>
    </div>}
    <Side faction="Coalizione" role="Attacca">
      <div className="combat-units"><Tile id={CONV.id} label={`${CONV.name} · A${CONV.attack}`} className={v === 'outcome' ? 'is-winner' : ''} /></div>
      {v === 'totals' && <div className="combat-calc"><Die value={BATTLE.dice[0]} rolled={step >= 2} />
        <Sum rows={[['Unità', CONV.attack, true], ['Militare', mod(BATTLE.military.Coalizione), step >= 1], ['Dado', BATTLE.dice[0], step >= 2]]} total={ATTACK} show={step >= 3} win={step >= 3} /></div>}
    </Side>
    <div className="combat-vs">
      <span>VS</span>
      {!supported && advisers}
      {v === 'support' && step === 0 && <div className="combat-choice"><b>Iran</b><b>Coalizione</b><b>Nessuno</b></div>}
    </div>
    <Side faction="Iran" role="Difende">
      <div className="combat-units"><Tile id={IRGC.id} label={`${IRGC.name} · D${IRGC.defense}`} className={removed ? 'is-removed' : ''} />
        {supported && advisers}</div>
      {v === 'totals' && <div className="combat-calc"><Die value={BATTLE.dice[1]} rolled={step >= 2} />
        <Sum rows={[['Unità', IRGC.defense + ADVISERS.defense, true], ['Militare', mod(BATTLE.military.Iran), step >= 1], ['Dado', BATTLE.dice[1], step >= 2]]} total={DEFENSE} show={step >= 3} /></div>}
      {v === 'outcome' && <div className={`combat-loss ${step >= 1 ? 'is-on' : ''}`}><span>Consenso Iran</span><b>{step >= 1 ? BATTLE.consensus[1] : BATTLE.consensus[0]}</b>{step >= 1 && <em>−1</em>}</div>}
    </Side>
  </div>;
}

export default function CombatIntro(props: PlayerProps & { onFinish?: () => void; finalLabel?: string }) {
  return <IntroPlayer {...props} scenes={COMBAT_SCENES} label="Fasi del combattimento" render={(scene, step) => <CombatVisual scene={scene} step={step} />} />;
}
