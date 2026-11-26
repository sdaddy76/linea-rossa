import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Play, Check, ChevronDown, CircleHelp, Flag, RotateCcw, Shield, SkipForward, Sparkles, Swords, Trophy } from 'lucide-react';
import { TabletopBoard, FactionBoard, COLORS } from '../Boards';
import { FACTIONS, TRACKS, EVENTS, UNITS, type Faction, type GlobalTrack, type Track } from '../catalog';
import { MODE_THRESHOLDS, zone } from '../engine';
import { eventFrontArt, unitFrontArt, RULEBOOK_URL, RULEBOOK_FILENAME } from '../art';
import { getFactionCardFront } from '../../data/card-graphics';
import { FactionCardFace } from '../FactionCardFace';
import { LESSONS, STORAGE_KEY, back, cardFor, changeLabel, choose, choicesFor, currentLesson, deploymentPreview, freshSession, guidedEventChanges, guidedEventGlobals, parseSession, recommendedChoice, replaySession, type Session, type Speed } from './model';
import ComponentsIntro, { INTRO_SEEN_KEY } from './ComponentsIntro';
import RoundIntro, { ROUND_SEEN_KEY } from './RoundIntro';
import CombatIntro, { COMBAT_SEEN_KEY } from './CombatIntro';
import './guided-game.css';

const TRACK_HELP: Record<Track, string> = {
  Economia: 'Costo unità: Crisi +1 OP · Stabile +0 · Forte −1 OP.',
  Militare: 'Combattimento: Crisi −1 · Stabile +0 · Forte +1.',
  Diplomazia: 'Pressione: Crisi 3 OP · Stabile 2 · Forte 1. Forte dà il Veto una volta per round, pagando −1 Diplomazia.',
  Consenso: 'Pesca a fine round: Crisi 1 carta · Stabile 2 · Forte 3.',
};
const GLOBAL_HELP: Record<GlobalTrack, string> = {
  Nucleare: 'Da 1 a 15. A 15 vince immediatamente l’Iran.',
  Sanzioni: 'Da 1 a 10. A 10 vince immediatamente la Coalizione.',
  'Crisi Bellica': 'Da 1 a 10. A 1 guerra totale: chi la provoca è escluso dalla vittoria; le altre fazioni calcolano il punteggio finale. Se causata da Eventi o Tensione, nessun responsabile e −5 PV a tutte le fazioni in gara. Costo unità: 2–4 +2 OP; 5–7 +1; 8–10 +0.',
  Opinione: 'Da −10 a +10. Le soglie estreme influenzano la Diplomazia a fine round.',
};
const GLOBALS: GlobalTrack[] = ['Nucleare', 'Sanzioni', 'Crisi Bellica', 'Opinione'];
const SPEED_MS: Record<Speed, number> = { lenta: 1800, normale: 1100, veloce: 600 };
const ZONE_LABEL = { crisis: 'Crisi', stable: 'Stabile', strong: 'Forte' };
const FACTION_COLOR: Record<Faction, string> = { Iran: '#1f8a4c', Coalizione: '#2457b8', Russia: '#b3261e', Cina: '#d48a00', Europa: '#5a3fb5' };
function load() {
  try { return parseSession(typeof window === 'undefined' ? null : window.localStorage.getItem(STORAGE_KEY)); }
  catch { return freshSession(); }
}
function Dice({ value, label }: { value: number; label: string }) {
  return <div className="guide-die-wrap"><div className={`guide-die guide-die-${value}`} aria-label={`${label}: dado ${value}`}>
    {Array.from({ length: 9 }, (_, i) => <i key={i} className={([0, 2, 3, 5, 6, 8].includes(i) && value === 6) || ([0, 8].includes(i) && value === 2) ? 'is-pip' : ''} />)}
  </div><span>{label} · {value}</span></div>;
}
const KEY_RULES = [
  ['Correlazioni', 'Un aumento può spostare un tracciato di un’altra fazione: leggi entrambe le conseguenze.'],
  ['Dividendo diplomatico', 'Giocare l’opzione che favorisce un’altra fazione ti dà +1 PV, al massimo una volta per round.'],
  ['Influenza e controllo', 'I riquadri sono riservati all’Influenza permanente, che determina i punti territoriali finali. Le unità sono accanto allo Stato e non occupano riquadri.'],
  ['Unità a due round', 'Non si muovono: prima si ruotano, poi tornano nella riserva. Mantenimento: un’unità ruotata resta un altro round; i giocatori pagano 1 OP, i BOT ne mantengono gratis una per attivazione.'],
  ['Presenza minima BOT', 'Quando non ha unità sul tabellone e la sua priorità non prevede Schieramento, il BOT sostituisce il primo Sviluppo con la propria unità base nello Stato stampato sulla carta BOT.'],
  ['Combattimento', 'Contano solo le unità locali; ogni attacco riduce la Crisi Bellica.'],
  ['Durata della partita', 'Il segna-turni avanza degli OP delle carte delle fazioni Avanza: soglia 30, 60 o 80.'],
];

export default function GuidedGame({ onExit, onPlay }: { onExit: () => void; onPlay: () => void }) {
  const [session, setSession] = useState<Session>(load);
  const [expandedFaction, setExpandedFaction] = useState<Faction | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState('iraq');
  const [error, setError] = useState('');
  const [saveUnavailable, setSaveUnavailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [systemReduced, setSystemReduced] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [zoom, setZoom] = useState<{ src: string; name: string } | null>(null);
  const [showIntro, setShowIntro] = useState<'components' | 'round' | 'combat' | null>(() => {
    if (typeof window === 'undefined' || session.cursor !== 0) return null;
    try {
      if (!window.localStorage.getItem(INTRO_SEEN_KEY)) return 'components';
      return window.localStorage.getItem(ROUND_SEEN_KEY) ? null : 'round';
    } catch { return 'components'; }
  });
  const busyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lessonHeading = useRef<HTMLHeadingElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const closeZoomButton = useRef<HTMLButtonElement>(null);
  const reduced = reduceMotion || systemReduced;
  const t = useMemo(() => replaySession(session), [session]);
  const previous = useMemo(() => replaySession({ ...session, cursor: Math.max(0, session.cursor - 1) }), [session]);
  const s = t.game, l = currentLesson(t), card = cardFor(t), choices = choicesFor(t), recommended = recommendedChoice(t);
  const deploy = deploymentPreview(t);
  const active = s.pending?.kind === 'veto' ? s.pending.actor : l.actor;
  const shownFaction = expandedFaction ?? active ?? 'Iran';
  const summary = l.id === 'summary';
  const event = l.event ? EVENTS.find(e => e.id === l.event) : null;
  const originalCard = card ? getFactionCardFront(card.id, card.origin) : null;
  const art = event ? eventFrontArt(event.id) : originalCard;
  const milliseconds = reduced ? 0 : SPEED_MS[session.speed];
  const boardUnits = s.units.map(u => ({ ...u, deployedAt: u.rotated ? s.actualRound - 1 : s.actualRound }));
  const points = Object.fromEntries(FACTIONS.map(f => [f, s.players[f].points])) as Record<Faction, number>;
  const ranking = [...FACTIONS].sort((a, b) => points[b] - points[a]);
  const combatVisible = l.id === 'outcome' && s.combat;
  const lastChoice = session.choices[session.cursor - 1] ?? '';
  const priorCard = cardFor(previous);
  const correlation = lastChoice.startsWith('event:') ? priorCard?.options[Number(lastChoice.split(':')[1])]?.correlation :
    lastChoice.startsWith('correlation:') ? null : undefined;

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); setSaveUnavailable(false); }
    catch { setSaveUnavailable(true); }
  }, [session]);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const update = () => setSystemReduced(media.matches);
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  useEffect(() => {
    if (l.id !== 'declare') return;
    try { if (!window.localStorage.getItem(COMBAT_SEEN_KEY)) setShowIntro('combat'); } catch { /* nessun salvataggio */ }
  }, [l.id]);
  useEffect(() => {
    if (!zoom) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    closeZoomButton.current?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoom(null);
      // Only the close button is interactive in this image-only dialog.
      if (event.key === 'Tab') { event.preventDefault(); closeZoomButton.current?.focus(); }
    };
    window.addEventListener('keydown', close);
    return () => { window.removeEventListener('keydown', close); previousFocus.current?.focus(); };
  }, [zoom]);
  function release() {
    if (timerRef.current) clearTimeout(timerRef.current);
    busyRef.current = false; setBusy(false);
  }
  function pick(id: string) {
    if (busyRef.current) return;
    try {
      const next = choose(session, id);
      setError(''); setSession(next); setExpandedFaction(null);
      if (milliseconds) {
        busyRef.current = true; setBusy(true);
        timerRef.current = setTimeout(release, milliseconds);
      }
      lessonHeading.current?.focus({ preventScroll: true });
    } catch (e) { setError(e instanceof Error ? e.message : 'Scelta non disponibile.'); }
  }
  function remember(key: string) { try { window.localStorage.setItem(key, '1'); } catch { /* salvataggio non disponibile */ } }
  function closeIntro() { setShowIntro(null); remember(INTRO_SEEN_KEY); }
  function closeRound() { setShowIntro(null); remember(INTRO_SEEN_KEY); remember(ROUND_SEEN_KEY); }
  function closeCombat() { setShowIntro(null); remember(COMBAT_SEEN_KEY); }
  function componentsDone() { remember(INTRO_SEEN_KEY); setShowIntro('round'); }
  function goBack() { release(); setError(''); setSession(back(session)); }
  function restart() { release(); setError(''); setSession({ ...freshSession(), speed: session.speed }); setExpandedFaction(null); }
  const changed = FACTIONS.flatMap(f => TRACKS.flatMap(track => {
    const delta = s.players[f].tracks[track] - previous.game.players[f].tracks[track];
    return delta ? [`${f} ${track} ${delta > 0 ? '+' : ''}${delta}`] : [];
  }));
  const duration = { '--guide-duration': `${milliseconds}ms` } as CSSProperties;
  return <main className={`guided-game ${l.id === 'intro' ? 'guide-intro' : ''}`} style={duration} data-reduced-motion={reduced}>
    <div className="guide-shell">
      <header className="guide-header">
        <button className="guide-backlink" onClick={onExit}><ArrowLeft size={16} /> Torna a Linea Rossa</button>
        <span className="guide-intro-buttons"><button className="guide-components-button" onClick={() => setShowIntro('components')}><BookOpen size={16} /> I componenti del gioco</button><button className="guide-components-button" onClick={() => setShowIntro('round')}><Play size={16} /> Come si gioca un round</button><button className="guide-components-button" onClick={() => setShowIntro('combat')}><Swords size={16} /> Il combattimento</button></span>
        <span className="guide-offline"><span /> Simulazione locale · nessuna partita online modificata</span>
      </header>
      <div className="guide-title-row">
        <div><p className="guide-eyebrow"><Flag size={14} /> Impara giocando</p><h1>Partita <span>guidata</span></h1><p className="guide-subtitle">Un copione guidato per capire le fasi e le scelte della crisi.</p></div>
        <div className="guide-round-pill"><span>SEGNA-TURNI</span><strong>{s.turnMarker ?? 0}<small> / {MODE_THRESHOLDS[s.mode ?? 'media']}</small></strong><p>Demo breve · due round</p></div>
      </div>
      <nav className="guide-progress" aria-label="Avanzamento della partita guidata">
        <div><span>Passo {l.number} di 15</span><strong>{summary ? 'Tutorial completato' : l.number < 8 ? 'Round 1 · costruire gli equilibri' : 'Round 2 · mettere alla prova le alleanze'}</strong><span>{Math.round(t.step / (LESSONS.length - 1) * 100)}%</span></div>
        <progress max={LESSONS.length - 1} value={t.step} aria-label={`Passo ${l.number} di 15`} />
      </nav>
      {session.cursor > 0 && !summary && <p className="guide-save-note">{saveUnavailable ? 'Il browser non consente il salvataggio. Puoi continuare, ma chiudendo perderai il progresso.' : 'Progresso salvato in questo browser. Puoi uscire e riprendere da qui.'}</p>}
      <div className="guide-layout">
        <div className="guide-table-area">
          <section className="guide-globals" aria-label="Tracciati globali">
            {GLOBALS.map(track => <div key={track} tabIndex={0} title={GLOBAL_HELP[track]} className={`guide-global ${track === 'Crisi Bellica' ? 'is-crisis' : ''}`}>
              <span>{track}</span><strong key={`${track}-${s.globals[track]}`}>{track === 'Opinione' && s.globals[track] > 0 ? '+' : ''}{s.globals[track]}<small> / {track === 'Nucleare' ? '15' : track === 'Opinione' ? '±10' : '10'}</small></strong>
              <span className="guide-tooltip" role="tooltip">{GLOBAL_HELP[track]}</span>
            </div>)}
          </section>
          <section className="guide-board" aria-label="Tabellone della partita guidata">
            <div className="guide-section-label"><span><span className="guide-live-dot" /> Teatro della crisi</span><span>{s.units.length} unità schierate</span></div>
            <TabletopBoard globals={s.globals} round={s.round} elapsed={s.actualRound} units={boardUnits} influence={s.influence} gameState={s} pv={points} selected={selectedTerritory} onSelect={setSelectedTerritory} />
          </section>
          <section className="guide-iraq" aria-label="Unità in Iraq">
            <div><p className="guide-eyebrow">Focus territorio</p><h2>Iraq <span>{s.units.filter(u => u.territory === 'iraq').length} unità</span></h2><p>Iran e Russia: Amico · Coalizione: Neutrale</p></div>
            <div className="guide-units">
              {s.units.filter(u => u.territory === 'iraq').map(u => {
                const def = UNITS.find(d => d.id === u.type)!;
                return <div className="guide-unit-entry" key={u.id}><button style={{ '--faction': FACTION_COLOR[u.faction] } as CSSProperties} onClick={() => setZoom({ src: unitFrontArt(u.type), name: `${u.faction} · ${def.name}` })} aria-label={`Ingrandisci ${def.name}, ${u.rotated ? 'ruotata, rientra alla prossima fine round' : 'nuova'}`} className="guide-unit">
                  <img src={unitFrontArt(u.type)} alt={`${u.faction}: ${def.name}`} style={{ transform: u.rotated ? 'rotate(90deg)' : 'none' }} />
                </button><span>{def.name}</span><small>{u.rotated ? 'Ruotata · ultimo round' : 'Nuova · due round'}</small></div>;
              })}
              {!s.units.length && <p className="guide-empty"><Shield size={24} /> Nessuna unità sul territorio{summary ? ' · tutte in riserva' : ''}</p>}
            </div>
          </section>
          <section className="guide-factions" aria-label="Le cinque plance fazione">
            {FACTIONS.map(f => <article key={f} style={{ '--faction': FACTION_COLOR[f], '--faction-light': COLORS[f] } as CSSProperties} className={`guide-faction ${active === f ? 'is-active' : ''}`}>
              <button className="guide-faction-heading" onClick={() => setExpandedFaction(expandedFaction === f ? null : f)} aria-expanded={shownFaction === f} aria-label={`Mostra plancia originale ${f}`}>
                <span>{f}{active === f && <small>Attiva</small>}</span><strong>{points[f]} <small>PV</small></strong>
              </button>
              {points[f] !== previous.game.players[f].points && <span className="guide-pv-fly" key={`pv-${session.cursor}`}>{points[f] - previous.game.players[f].points > 0 ? '+' : ''}{points[f] - previous.game.players[f].points} PV</span>}
              {TRACKS.map(track => {
                const value = s.players[f].tracks[track], before = previous.game.players[f].tracks[track], z = zone(value), entering = z !== zone(before);
                return <div key={track} title={`${TRACK_HELP[track]} Zone: Crisi 1–3; Stabile 4–7; Forte 8–10.`} tabIndex={0} className={`guide-track zone-${z} ${entering ? 'zone-entering' : ''}`}>
                  <div><span>{track === 'Economia' ? 'Economia · PO' : track}</span><strong>{value}</strong></div>
                  <div className="guide-track-bar">{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < 3 ? 'is-low' : i > 6 ? 'is-high' : ''} />)}<b style={{ left: `${(value - 1) / 9 * 100}%`, transitionTimingFunction: `steps(${Math.max(1, Math.abs(value - before))}, end)` }} /></div>
                  <span className="guide-tooltip" role="tooltip">{ZONE_LABEL[z]} · {TRACK_HELP[track]}</span>
                </div>;
              })}
              <p>{s.players[f].hand.length} carte in mano{f === 'Cina' && s.advancers.includes(f) ? ' · Avanza' : ''}</p>
            </article>)}
          </section>
          <details className="guide-original-board" open={!!active || !!expandedFaction} key={shownFaction}>
            <summary>Plancia originale · {shownFaction}<ChevronDown size={16} /></summary>
            <FactionBoard faction={shownFaction} tracks={s.players[shownFaction].tracks} pv={points[shownFaction]} />
          </details>
          {summary && <section className="guide-summary">
            <h2><Trophy size={21} /> La tua classifica</h2>
            <div className="guide-ranking">{ranking.map((f, i) => <div key={f}><span>{i + 1}</span><strong style={{ color: COLORS[f] }}>{f}</strong><b>{points[f]} PV</b></div>)}</div>
            <div className="guide-final-table"><table><caption>Stato finale dei tracciati della tua partita</caption><thead><tr><th>Fazione</th>{TRACKS.map(track => <th key={track}>{track}</th>)}<th>PV</th></tr></thead><tbody>{FACTIONS.map(f => <tr key={f}><th scope="row">{f}</th>{TRACKS.map(track => <td key={track}>{s.players[f].tracks[track]}</td>)}<td>{points[f]}</td></tr>)}</tbody></table></div>
            <div className="guide-key-rules">{KEY_RULES.map(([title, text]) => <article key={title}><Check size={17} /><h3>{title}</h3><p>{text}</p></article>)}</div>
          </section>}
        </div>
        <aside className="guide-instruction" aria-label="Istruzioni e scelte">
          <section className="guide-lesson" aria-labelledby="guide-lesson-title">
            <div className="guide-lesson-kicker"><span>{s.pending?.kind === 'veto' ? 'Decisione di Veto' : `Passo ${l.number.toString().padStart(2, '0')}`}</span><span>{active ?? (summary ? 'Debriefing' : 'La crisi')}</span></div>
            <h2 id="guide-lesson-title" ref={lessonHeading} tabIndex={-1}>{s.pending?.kind === 'veto' ? `${s.pending.actor}: proteggi la correlazione?` : l.title}</h2>
            <p>{s.pending?.kind === 'veto' ? `${changeLabel(s.pending.change)}. La Diplomazia Forte permette di annullare solo questa correlazione pagando −1 Diplomazia.` : l.text}</p>
            {l.id === 'intro' && <div className="guide-scenario-note"><BookOpen size={19} /><p><strong>Una simulazione didattica, regole aggiornate.</strong> Per brevità, in questa partita guidata ogni fazione si attiva <strong>una volta per round</strong> (nella partita vera due volte). Guarda il segna-turni: avanza solo quando gioca la fazione evidenziata sull’evento. Carte, eventi e dadi sono fissati per imparare; il copione copre due round, non una partita completa.</p></div>}
            {(card || event) && <div className="guide-card-stage">
              <div className="guide-card-title"><span>{event?.id ?? card?.id}</span><strong>{event?.name ?? card?.name}</strong>{card && <b>{card.cost} OP</b>}</div>
              {art ? <button className="guide-card-art" onClick={() => setZoom({ src: art, name: event?.name ?? card!.name })} aria-label={`Ingrandisci ${event?.name ?? card?.name}`}><img key={art} src={art} alt={`Fronte originale: ${event?.name ?? card?.name}`} /><span>Tocca per ingrandire</span></button> :
                card && <FactionCardFace card={card}/>}
              {card && l.id === 'intro' && <div className="guide-preview-options">{card.options.map((o, i) => <p key={i}><b>{'ABC'[i]}</b><span>{changeLabel(o.boost)}<small>▸ {changeLabel(o.correlation)}</small></span></p>)}</div>}
              {originalCard && <p className="guide-original-caption">Le opzioni applicate sono quelle del catalogo aggiornato riportate nei pulsanti.</p>}
              {card && (l.mandatory || ['development', 'correlation'].includes(l.id)) && <details className="guide-muted-options"><summary title="Non selezionabili in questo passo">Opzioni Evento · non selezionabili qui</summary>{card.options.map((o, i) => <p key={i}>{'ABC'[i]}) {changeLabel(o.boost)} ▸ {changeLabel(o.correlation)}{o.globals.map(g => ` · ${g.track} ${g.delta > 0 ? '+' : ''}${g.delta}`).join('')}</p>)}</details>}
              {event && <div className="guide-event-effects">{guidedEventGlobals(event.id).map(g => <span key={g.track}>{g.track} <b>{g.delta > 0 ? '+' : ''}{g.delta}</b></span>)}{guidedEventChanges(event.id).map(c => <span key={`${c.faction}-${c.track}`}>{changeLabel(c)}</span>)}</div>}
            </div>}
            {deploy && <div className="guide-cost"><p>Calcolo dal motore · Iraq {deploy.alignment}</p><strong>{deploy.cost} <small>OP totali</small></strong><span>Base {deploy.unit.cost} + Crisi {deploy.crisisCost} + Economia {deploy.economyCost} + Allineamento {deploy.alignmentCost} = {deploy.cost}</span><span>Carta: {deploy.available} OP · residuo {deploy.available - deploy.cost}</span></div>}
            {s.phase === 'ops' && s.ops && !['special', 'dice', 'outcome'].includes(l.id) && <div className="guide-op-budget"><strong>{s.ops.remaining} OP rimasti</strong><span>{s.ops.pressured.length ? `Già modificati: ${s.ops.pressured.join(', ')}` : 'Nessun globale ancora modificato'}</span></div>}
            {l.mandatory && <p className="guide-mandatory"><Shield size={15} /> In questo tutorial questa mossa è obbligatoria per mostrarti il combattimento.</p>}
            {combatVisible && <div className="guide-combat-result">
              <div className="guide-dice-row"><Dice value={s.combat!.dice![0]} label="Coalizione" /><Swords size={24} /><Dice value={s.combat!.dice![1]} label="Iran" /></div>
              <div><span>Attacco Coalizione</span><strong>{s.combat!.attack}</strong></div><div><span>Difesa Iran</span><strong>{s.combat!.defense}</strong></div>
              <p>Unità + modificatore Militare + dado. Sostegno russo: {t.selectedSupport === 'defender' ? 'Iran · +1 Difesa' : t.selectedSupport === 'attacker' ? 'Coalizione · +1 Attacco' : 'nessuno · la Difesa non riceve +1'}.</p>
              <strong className="guide-winner">Vince {s.combat!.winner}</strong>
            </div>}
            <div className="guide-choices" role="group" aria-label="Scegli la mossa">
              {choices.map(c => <button key={c.id} className={`guide-choice ${c.recommended ? 'is-recommended' : ''}`} onClick={() => pick(c.id)} disabled={busy || !!c.unavailableReason}>
                {c.recommended && <small><Sparkles size={12} /> Consigliata</small>}<span>{c.label}<ArrowRight size={16} /></span>{c.detail && <p>{c.detail}</p>}{c.unavailableReason && <p>{c.unavailableReason}</p>}
              </button>)}
            </div>
            {summary && <div className="guide-summary-actions"><button className="guide-primary" onClick={onPlay}><Flag size={17} /> Inizia una partita vera</button><button onClick={restart}><RotateCcw size={16} /> Rigioca il tutorial</button></div>}
            <div className="guide-why"><h3><CircleHelp size={18} /> Perché?</h3><p>{l.why}</p></div>
            <div className="guide-feedback" role="status" aria-live="polite" aria-atomic="true">
              {t.feedback && <><Check size={15} /><div><strong>{t.feedback}</strong>{changed.length > 0 && <p>{changed.join(' · ')}</p>}</div></>}
            </div>
            {correlation && <div className="guide-correlation" key={`correlation-${session.cursor}`} aria-label={`Correlazione: ${changeLabel(correlation)}`}><span>{priorCard!.options[Number(lastChoice.split(':')[1])].boost.faction}</span><svg viewBox="0 0 100 20" aria-hidden="true"><path d="M0 10H95M85 2L95 10L85 18" /></svg><span>{changeLabel(correlation)}</span></div>}
            {error && <p className="guide-error" role="alert">{error}</p>}
          </section>
          <div className="guide-rule-link"><a href={RULEBOOK_URL} target="_blank" rel="noreferrer"><BookOpen size={16} /> Apri regolamento <ArrowRight size={14} /></a><a href={RULEBOOK_URL} download={RULEBOOK_FILENAME}><BookOpen size={16} /> Scarica manuale</a><p>Crisi 1–3 · Stabile 4–7 · Forte 8–10</p></div>
          <details className="guide-history"><summary>Registro della simulazione</summary><ol>{s.log.slice(-12).map((line, i) => <li key={`${i}-${line}`}>{line}</li>)}</ol></details>
        </aside>
      </div>
    </div>
    <footer className="guide-controls" aria-label="Controlli del tutorial">
      <div className="guide-controls-inner">
        <div className="guide-navigation"><button onClick={goBack} disabled={session.cursor === 0}><ArrowLeft size={16} /> Indietro</button><button className="guide-primary" onClick={() => recommended && pick(recommended.id)} disabled={!recommended || busy}>Avanti <ArrowRight size={16} /></button></div>
        <div className="guide-settings"><button onClick={restart} title="Riparti dallo stato iniziale"><RotateCcw size={16} /><span>Ricomincia</span></button><label>Velocità <select aria-label="Velocità animazioni" value={session.speed} onChange={e => { release(); setSession({ ...session, speed: e.target.value as Speed }); }}><option value="lenta">Lenta</option><option value="normale">Normale</option><option value="veloce">Veloce</option></select></label><label className="guide-reduced"><input type="checkbox" checked={reduced} disabled={systemReduced} onChange={e => setReduceMotion(e.target.checked)} /> Riduci movimento</label><button className="guide-skip" onClick={onExit}><SkipForward size={16} /><span>Salta il tutorial</span></button></div>
      </div>
    </footer>
    {zoom && <div className="guide-zoom" role="dialog" aria-modal="true" aria-label={zoom.name} onClick={() => setZoom(null)}><button ref={closeZoomButton} onClick={() => setZoom(null)}>Chiudi · {zoom.name}</button><img src={zoom.src} alt={zoom.name} onClick={e => e.stopPropagation()} /></div>}
    {showIntro === 'components' && <ComponentsIntro onClose={closeIntro} onFinish={componentsDone} finalLabel="Avanti: un round di gioco" reduced={reduced} />}
    {showIntro === 'round' && <RoundIntro onClose={closeRound} reduced={reduced} />}
    {showIntro === 'combat' && <CombatIntro onClose={closeCombat} finalLabel="Torna alla partita guidata" reduced={reduced} />}
  </main>;
}
