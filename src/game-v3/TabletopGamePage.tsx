import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOnlineGameStore } from '@/store/onlineGameStore';
import { getObjectiveCardFront } from '@/data/card-graphics';
import { FACTIONS, TRACKS, type Faction, type GlobalTrack, type TrackChange } from './catalog-types';
import { BOT_CARDS, BOT_INFLUENCE, CORRELATIONS, EVENTS, FACTION_CARDS, TERRITORIES, UNITS } from './catalog';
import { canDeploy, canPeek, attackCost, currentActor, deployCost, maintainableUnits, MAINTENANCE_COST, hormuzBlocked, influenceCost, canInfluence, territoryPresence, territoryController, occupiedSlots, MODE_THRESHOLDS, usesOfficialRules, usesLatestRules, reduce, type EngineState, type Command } from './engine';
import { commitCommand, readTabletop, type SavedTabletop } from './online';
import { objectiveStatus } from './objectives';
import { COLORS, FactionBoard, TabletopBoard, UnitImage } from './Boards';
import { Materials } from './Materials';
import { PlayerAid } from './PlayerAid';
import { CardMotion, useCardMotion } from './CardMotion';
import { FactionCardFace } from './FactionCardFace';
import { InfluenceAction } from './InfluenceAction';
import { viewerFaction } from './player-visibility';
import { botFrontArt, eventFrontArt, RULEBOOK_URL, RULEBOOK_FILENAME } from './art';
import '../pages/game/game-readability.css';
import { useReadability } from '@/pages/lobby/Readability';
import { Sun } from 'lucide-react';

/** Colori delle fazioni leggibili su fondo chiaro (alta leggibilità). */
const DARK_COLORS: Record<Faction, string> = { Iran: '#15803d', Coalizione: '#1d4ed8', Russia: '#b91c1c', Cina: '#92400e', Europa: '#6d28d9' };

const GLOBALS: GlobalTrack[] = ['Nucleare', 'Sanzioni', 'Crisi Bellica', 'Opinione'];
const changeText = (c: TrackChange) => `${c.faction} · ${c.track} ${c.delta > 0 ? '+' : ''}${c.delta}`;
const globalText = (rows: { track: GlobalTrack; delta: number }[]) => rows.map(c => `${c.track} ${c.delta > 0 ? '+' : ''}${c.delta}`).join(' · ') || 'Nessuna variazione globale';
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 md:p-5 space-y-3"><h2 className="font-bold text-lg">{title}</h2>{children}</section>;
}
const button = 'rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-300';
const selectStyle = 'bg-slate-800 border border-slate-600 rounded-lg p-2 w-full text-sm';
export default function TabletopGamePage({ onBack, previewState }: {
  onBack: () => void; previewState?: EngineState;
}) {
  const { game, gameState, myFaction, profile, players } = useOnlineGameStore();
  const gameId = previewState ? 'readability-local-demo' : game?.id;
  const [saved, setSaved] = useState<SavedTabletop | null>(() => previewState
    ? { revision: 0, state: previewState } : readTabletop(gameState));
  const motion = useCardMotion(saved, gameId);
  // Stessa preferenza della pagina principale: attivarla qui la attiva anche nella lobby, e viceversa.
  const readability = useReadability();
  const tone = readability.high ? DARK_COLORS : COLORS;
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const [autoPaused, setAutoPaused] = useState(false);
  const [materials, setMaterials] = useState(false);
  const [tools, setTools] = useState(false);   // menu dell'intestazione su cellulare
  const [aid, setAid] = useState(false);
  const [selected, setSelected] = useState('iran');
  const [boardFaction, setBoardFaction] = useState<Faction>((myFaction as Faction) || 'Iran');
  const [cardId, setCardId] = useState<string | null>(null);
  const [marked, setMarked] = useState<string[]>([]);
  const [unitId, setUnitId] = useState('');
  const [target, setTarget] = useState<Faction>('Coalizione');
  const [diplomacyEffect, setDiplomacyEffect] = useState<'sanctions' | 'opinion'>('sanctions');
  const [botTerritory, setBotTerritory] = useState('iraq');
  useEffect(() => {
    if (!cardId) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setCardId(null); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [cardId]);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (previewState) return;
    const next = readTabletop(gameState);
    if (next) setSaved(old => !old || next.revision > old.revision ? next : old);
  }, [gameState, previewState]);
  const refresh = useCallback(async () => {
    if (previewState || !gameId) return;
    const result = await supabase.from('game_state').select('special_uses').eq('game_id', gameId).single();
    if (result.error) throw new Error(result.error.message);
    const next = readTabletop(result.data);
    if (!next) throw new Error('Stato della nuova edizione non disponibile.');
    if (mounted.current) setSaved(old => !old || next.revision >= old.revision ? next : old);
  }, [gameId, previewState]);
  useEffect(() => {
    if (previewState) return;
    // Realtime remains the primary transport; polling also recovers missed reconnect events.
    const timer = window.setInterval(() => { void refresh().catch(() => {}); }, 10000);
    return () => window.clearInterval(timer);
  }, [refresh, previewState]);
  const s = saved?.state;
  const actor = s ? currentActor(s) : null;
  const own = previewState ? 'Iran' : viewerFaction(profile?.id,players);
  const member = own !== null;
  const isBot = !!s && !!actor && (s.players[actor].bot || !!s.players[actor].neutral);
  const needsManualResolution = !!isBot && s?.pending?.kind === 'bot-influence';
  const canAct = !!actor && member && (actor === own && !isBot || needsManualResolution) && !busy;
  const send = useCallback(async (command: Command, automatic = false) => {
    if (!saved || !gameId || !actor || busyRef.current) return;
    const pendingChoice = saved.state.players[actor].bot && saved.state.pending?.kind === 'bot-influence' && command.type === 'bot-influence';
    if (!member || (automatic ? !isBot || command.type!=='advance-bot' : !(actor === own && !saved.state.players[actor].bot) && !pendingChoice)) return;
    busyRef.current = true; setBusy(true); setError('');
    try {
      // Public preview runs only this local state, with the real rules.
      // It never reads or writes games, profiles or hands from Supabase.
      const next = previewState
        ? { revision: saved.revision + 1, state: reduce(saved.state, actor, command) }
        : await commitCommand(gameId, saved, actor, command);
      if (mounted.current) { setSaved(next); setMarked([]); setCardId(null); }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operazione non riuscita.';
      if (mounted.current) {
        setError(message);
        if (automatic && !message.includes('altro giocatore')) setAutoPaused(true);
      }
      try { await refresh(); } catch (reloadError) {
        if (mounted.current) setError(message + ' · Ricaricamento non riuscito: ' + (reloadError as Error).message);
      }
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  }, [saved, gameId, actor, own, member, isBot, refresh, previewState]);
  useEffect(() => {
    if (!isBot || !member || busy || autoPaused || needsManualResolution || motion.active) return;
    const timer = window.setTimeout((): void => { void send({ type: 'advance-bot' }, true); }, 1400);
    return () => window.clearTimeout(timer);
  }, [saved?.revision, isBot, member, busy, autoPaused, needsManualResolution, send, motion.active]);
  useEffect(() => { setMarked([]); }, [s?.phase, actor]);
  if (!s || (!previewState && !game)) return <main className="game-interface p-8 bg-slate-950 text-white min-h-screen"><p>Caricamento partita…</p><button className={button} onClick={onBack}>Torna alla lobby</button></main>;
  const p = own ? s.players[own] : null;
  const event = EVENTS.find(e => e.id === s.event);
  const lastBotId = [...s.log].reverse().map(line => line.match(/\[(BOT-[^\]]+)\]/)?.[1]).find(Boolean);
  const lastBotCard = BOT_CARDS.find(c => c.id === lastBotId);
  const chosen = p?.hand.includes(cardId ?? '') ? FACTION_CARDS.find(c => c.id === cardId) : undefined;
  const opsActor = s.ops?.actor;
  const territory = TERRITORIES.find(t => t.id === selected)!;
  const localUnits = s.units.filter(u => u.territory === selected);
  const localInfluence = (s.influence ?? []).filter(i => i.territory === selected);
  const slotsUsed = occupiedSlots(s, selected).length;
  const controller = territoryController(s, selected);
  const official = usesOfficialRules(s);
  const deployable = UNITS.filter(u => u.faction === opsActor);
  const chosenUnit = deployable.find(u => u.id === unitId) ?? deployable[0];
  const intelligence = !!chosenUnit && /intelligence|satelliti/i.test(chosenUnit.name);
  const placementCyber = !!chosenUnit && !usesLatestRules(s) && /^(cyber russia|cyber unit)$/i.test(chosenUnit.name);
  const targetOptions = intelligence ? [...FACTIONS] : FACTIONS.filter(f => f !== opsActor && (usesLatestRules(s) ? territoryPresence(s,f,selected)>0 : localUnits.some(u => u.faction === f)));
  const deploymentTarget = targetOptions.includes(target) ? target : targetOptions[0];
  const budget = s.ops?.remaining ?? 0;
  const expiringUnits = opsActor ? maintainableUnits(s, opsActor) : [];
  const pressureBase = opsActor ? (s.players[opsActor].tracks.Diplomazia <= 3 ? 3 : s.players[opsActor].tracks.Diplomazia >= 8 ? 1 : 2) : 0;
  // Diplomazia UE sul tabellone: Pressione globale dell'Europa −1 OP (regolamento attuale).
  const pressureCost = opsActor === 'Europa' && usesLatestRules(s) && s.units.some(u => u.faction === 'Europa' && UNITS.find(d => d.id === u.type)?.name === 'Diplomazia UE') ? Math.max(1, pressureBase - 1) : pressureBase;
  const latest = usesLatestRules(s);
  const peekTargets = own && canAct && (s.phase === 'activation' || s.phase === 'ops') ? FACTIONS.filter(f => canPeek(s, own, f)) : [];
  const myIntel = own && latest ? [...s.intel[own]].slice(-3).reverse() : [];
  const toggle = (id: string) => setMarked(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  const points = Object.fromEntries(FACTIONS.map(f => [f, s.players[f].points])) as Record<Faction, number>;
  const stage = { activation: 'Scelta carta', ops: 'Operazioni', veto: 'Decisione sul veto', support: 'Scelta del sostegno', casualty: 'Selezione perdite', discard: 'Scarto di fine round', control: 'Bonus controllo territorio', 'bot-influence': 'Influenza BOT · destinazione manuale', ended: 'Partita conclusa' }[s.phase];
  const mode = s.mode ?? 'media', threshold = MODE_THRESHOLDS[mode];
  return <main className="game-interface tabletop-view min-h-screen bg-slate-950 text-white pb-12" data-reduced-motion={motion.reduced} data-readability={readability.high ? 'high' : 'standard'}>
    {previewState && <p className="game-preview-notice" role="status">Anteprima leggibilità · dati dimostrativi. Le scelte modificano solo questa simulazione locale; nessuna partita online viene letta o modificata.</p>}
    <header className="border-b border-slate-700 bg-slate-900 p-4">
      <div className="max-w-[1600px] mx-auto flex flex-wrap gap-4 items-center justify-between">
        <div><p className="text-xs uppercase tracking-[0.2em] text-red-400">Linea Rossa · Regolamento da tavolo {usesLatestRules(s) ? 'v3.11' : 'v3 · salvataggio precedente'}</p>
          <h1 className="text-xl font-bold mt-1">Round {s.round} <span className="text-slate-400 font-normal text-sm">· {official ? `modalità ${mode} · segna-turni ${s.turnMarker}/${threshold}` : `legacy · effettivo ${s.actualRound}/8`} · giro {s.lap}/2</span></h1></div>
        <div className="flex gap-2 md:hidden">
          <button className={button} aria-expanded={tools} aria-controls="game-tools" onClick={() => setTools(!tools)}>{tools ? '✕ Chiudi menu' : '☰ Menu'}</button>
          <button className={button} onClick={onBack}>Lobby</button></div>
        <div id="game-tools" className={`${tools ? 'flex' : 'hidden'} md:flex flex-wrap gap-2 w-full md:w-auto`}><a href={RULEBOOK_URL} target="_blank" rel="noreferrer" className={button}>Apri regolamento PDF</a>
          <a href={RULEBOOK_URL} download={RULEBOOK_FILENAME} className={button}>Scarica manuale</a>
          <button className={button} onClick={() => setAid(true)}>Aiuto giocatore</button>
          <label className={button + ' flex items-center gap-2'}>Velocità animazioni
            <select aria-label="Velocità animazioni carte" className="bg-slate-950 rounded p-1" value={motion.speed}
              onChange={e => motion.setSpeed(e.target.value)}>
              <option value="slow">Lenta · 10 s</option><option value="normal">Normale · 6,5 s</option><option value="fast">Veloce · 4 s</option>
            </select>
          </label>
          <label className={button + ' flex items-center gap-2 cursor-pointer'}><input type="checkbox"
            checked={motion.reduced} disabled={motion.systemReduced} onChange={e => motion.setReduced(e.target.checked)}/>
            Riduci animazioni</label>
          <button className={button + ' game-readability-toggle inline-flex items-center gap-2'} aria-pressed={readability.high} onClick={readability.toggle}
            title={readability.high ? 'Torna al tema scuro' : 'Tema chiaro, caratteri grandi e contrasto elevato'}>
            <Sun size={18} aria-hidden="true"/>{readability.high ? 'Alta leggibilità: attiva' : 'Alta leggibilità'}</button>
          <button className={button} onClick={() => setMaterials(true)}>Materiali</button><button className={button + ' hidden md:inline-block'} onClick={onBack}>Lobby</button></div>
      </div>
    </header>
    <div className="max-w-[1600px] mx-auto px-3 md:px-6 space-y-5 mt-5">
      <p className="text-xs text-amber-200 border border-amber-900 bg-amber-950/20 p-3 rounded-lg">Modalità tavolo fidato: mani e obiettivi sono nascosti nell’interfaccia, ma lo stato condiviso non è ancora isolato sul server. Questa versione non offre protezione contro l’ispezione tecnica delle carte avversarie.</p>
      {official && <p className={'rounded-lg border p-3 text-sm '+((s.turnMarker??0)>=threshold?'border-amber-500 bg-amber-950/30 text-amber-100':'border-slate-700 text-slate-300')}>
        {(s.turnMarker??0)>=threshold
          ? s.result ? `Soglia ${threshold} superata: partita conclusa dopo la chiusura del round, come da regolamento.`
            : `Ultimo round: soglia ${threshold} raggiunta. Si completano entrambi i giri e tutte le fasi di fine round; poi punteggio finale, senza pescare un nuovo Evento. Il segna-turni può superare ${threshold}.`
          : `La soglia ${threshold} avvia la chiusura alla fine del round, non un arresto immediato. Il valore finale può essere superiore; gli Eventi di blocco possono allungare la durata (cap. 7).`}
      </p>}
      <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:gap-3">{GLOBALS.map(g => <div key={`${g}-${motion.active?.key ?? 'idle'}`}
        className={'rounded-lg bg-slate-900 border border-slate-700 px-2 py-2 sm:px-4 min-w-0' + (motion.active?.changes.some(c => c.target === g) ? ' tabletop-track-changed' : '')}><span className="text-slate-400 text-xs block">{g}</span><strong className="text-xl">{s.globals[g]}</strong></div>)}
        {hormuzBlocked(s) && <p className="col-span-4 self-center text-amber-300">Blocco di Hormuz attivo · Coalizione +1 OP per schierare</p>}
      </div>
      <div role="status" className="p-4 rounded-xl border border-red-800 bg-red-950/30">
        <strong>{stage}</strong>{actor && <span> · <span style={{ color: tone[actor] }}>{actor}</span>{s.players[actor].neutral ? ' · neutrale' : isBot ? ' · BOT' : actor === own ? ' · tocca a te' : ' · in attesa del giocatore'}</span>}
        <p className="text-sm text-slate-300 mt-1">Ordine del round: {s.order.join(' → ')}.{official ? ` Avanza il segna-turni: ${s.advancers.join(', ') || 'nessuna fazione'}; valgono gli OP della carta giocata.` : ` Pesca extra legacy: ${s.advancers.join(', ') || 'nessuna'}.`}{s.roundBlocked ? ' Questo evento blocca l’avanzamento del segna-turni.' : ''}</p>
        {canAct && <a href="#azioni-partita" className="inline-block underline text-red-200 mt-2 text-sm">Vai alle tue scelte ↓</a>}
        {busy && <p className="text-sm mt-1">Salvataggio della mossa…</p>}
      </div>
      {error && <div role="alert" className="p-4 rounded-lg border border-amber-600 text-amber-200"><p>{error}</p><button className={button + ' mt-2'} onClick={async () => { try { await refresh(); setError(''); setAutoPaused(false); } catch (err) { setError((err as Error).message); } }}>Ricarica e riprendi</button></div>}
      {s.result && <Panel title={s.result.winners.length ? `Vittoria: ${s.result.winners.join(' e ')}` : 'Crisi Bellica a 1 · tutti perdono'}>
        <p>{({ war: 'La crisi è degenerata in guerra generale.', nuclear: 'Il Nucleare ha raggiunto 15.', sanctions: 'Le Sanzioni hanno raggiunto 10.', points: `Punteggio finale: ${official ? 'Influenza, obiettivi e tracciati al massimo' : 'unità, obiettivi e tracciati al massimo'} inclusi. A parità si confrontano somma dei tracciati e Consenso.` })[s.result.reason]}</p>
        <div className="grid sm:grid-cols-5 gap-3">{FACTIONS.map(f => {
          const objectives = objectiveStatus(s, f);
          const objectivePoints = objectives.reduce((n, o) => n + (o.complete ? o.points : 0), 0);
          const unitPoints = official ? (s.influence ?? []).filter(u => u.faction === f).reduce((n, u) => n + 1 + TERRITORIES.find(t => t.id === u.territory)!.alignment[f], 0)
            : s.units.filter(u => u.faction === f).reduce((n, u) => n + 1 + TERRITORIES.find(t => t.id === u.territory)!.alignment[f], 0);
          const maximums = TRACKS.filter(t => s.players[f].tracks[t] === 10).length * 2;
          return <div key={f} className="border border-slate-700 p-3 rounded-lg"><strong style={{ color: tone[f] }}>{f}: {s.result!.scores[f]} PV</strong>
            {s.result!.reason === 'points' && <p className="text-xs mt-2 text-slate-300">Round/dividendi: {s.players[f].points - unitPoints - objectivePoints - maximums}<br />{official ? 'Influenza' : 'Unità'}: {unitPoints} · Obiettivi: {objectivePoints} · Tracciati 10: {maximums}</p>}</div>;
        })}</div>
      </Panel>}
      <TabletopBoard globals={s.globals} round={s.round} elapsed={s.actualRound}
            units={s.units.map(u => ({ ...u, deployedAt: u.placedRound }))} influence={s.influence} gameState={s} pv={points} selected={selected} onSelect={setSelected} />
      <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-5">
        <div className="space-y-5 min-w-0">
          <Panel title={`${territory.name} · ${slotsUsed}/${territory.capacity} riquadri · controllo ${controller ?? 'conteso'}`}>
            <p className="text-xs text-slate-400">Allineamento e valore finale: {FACTIONS.map(f => `${f} ${['amico', 'neutrale', 'nemico'][territory.alignment[f]]} (${1 + territory.alignment[f]} PF)`).join(' · ')}</p>
            {!localUnits.length && <p className="text-slate-400 text-sm">Nessuna unità schierata.</p>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{localUnits.map(u => {
              const definition = UNITS.find(d => d.id === u.type)!;
              return <div key={u.id} className="rounded-lg border p-2 space-y-2" style={{ borderColor: tone[u.faction] }}><UnitImage id={u.type} name={definition.name} />
                <p className="text-xs">{u.faction} · {u.rotated ? s.players[u.faction].bot ? 'Ruotata: rientra a fine round, salvo Mantenimento automatico BOT (gratis, 1 unità per attivazione)' : 'Ruotata: rientra a fine round, salvo Mantenimento (1 OP)' : 'Attiva: rientra a fine round successivo'}</p></div>;
            })}</div>
            {localInfluence.length > 0 && <p className="text-sm">Influenza permanente: {localInfluence.map(i => <span key={i.id} className="mr-3" style={{color:tone[i.faction]}}>{i.faction} · riquadro {i.slot + 1}</span>)}</p>}
            <p className="text-xs text-slate-400">Presenza: {FACTIONS.map(f => `${f} ${territoryPresence(s, f, selected)}`).join(' · ')}</p>
          </Panel>
          <Panel title="Plance dei giocatori">
            <div className="flex flex-wrap gap-2">{FACTIONS.map(f => <button key={f} className={button} aria-pressed={boardFaction === f} style={{ borderColor: boardFaction === f ? tone[f] : undefined }} onClick={() => setBoardFaction(f)}>{f} · {s.players[f].points} PV {s.players[f].neutral ? 'Neutrale' : s.players[f].bot ? 'BOT' : ''}</button>)}</div>
            <div className="flex gap-4 flex-wrap text-sm">{TRACKS.map(t => <span key={`${t}-${motion.active?.key ?? 'idle'}`}
              className={motion.active?.changes.some(c => c.target === `${boardFaction} · ${t}`) ? 'tabletop-track-changed' : undefined}>{t}: <strong>{s.players[boardFaction].tracks[t]}</strong></span>)}<span>Carte in mano: {s.players[boardFaction].hand.length}</span></div>
            <FactionBoard faction={boardFaction} tracks={s.players[boardFaction].tracks} pv={s.players[boardFaction].points} />
          </Panel>
        </div>
        <aside className="space-y-5">
          {event && <Panel title={`Evento ${event.id} · ${event.name}`}><img src={eventFrontArt(event.id)} alt={event.name} className="w-full h-auto rounded" />
            <p className="text-sm">{globalText(event.globals)}</p>{event.changes.map((c, i) => <p key={i} className="text-sm">{changeText(c)}</p>)}</Panel>}
          {lastBotCard && <Panel title={`Ultima carta BOT · ${lastBotCard.faction}`}><img src={botFrontArt(lastBotCard.id)} alt={lastBotCard.name} className="w-full h-auto rounded" /><p className="text-sm">{lastBotCard.condition}</p></Panel>}
          <Panel title="Registro pubblico"><ol className="text-xs space-y-2 max-h-96 overflow-y-auto">{s.log.slice(-45).reverse().map((line, i) => <li key={s.log.length - i} className="border-b border-slate-800 pb-2">{line}</li>)}</ol></Panel>
          {s.combat && <Panel title="Combattimento in corso"><p>{s.combat.attacker} attacca {s.combat.defender} · {s.combat.territory}</p>
            <p className="text-sm">Sostegno: {Object.entries(s.combat.support).map(([f, side]) => `${f}: ${side === 'attacker' ? 'attaccante' : side === 'defender' ? 'difensore' : 'neutrale'}`).join(' · ') || 'in attesa'}</p>
            {s.combat.dice && <p>Attacco {s.combat.attack} / difesa {s.combat.defense} · dadi {s.combat.dice.join(' / ')}</p>}</Panel>}
        </aside>
      </div>
      <div id="azioni-partita" className="scroll-mt-4" />
      {canAct && s.pending?.kind === 'veto' && <Panel title="Veto diplomatico"><p>Correlazione avversa: {changeText(s.pending.change)}. Il veto costa −1 Diplomazia e si può usare una volta per round.</p>
        <div className="flex gap-3"><button className={button} onClick={() => send({ type: 'veto', use: true })}>Usa il veto</button><button className={button} onClick={() => send({ type: 'veto', use: false })}>Accetta la correlazione</button></div></Panel>}
      {canAct && s.pending?.kind === 'control' && <Panel title={`Bonus di controllo · ${TERRITORIES.find(t => t.id === (s.pending?.kind === 'control' ? s.pending.territoryId : ''))?.name}`}>
        <p>{actor} controlla il territorio con unità e Influenza presenti. Scegli il bonus stampato:</p>
        <div className="flex gap-3 flex-wrap">{s.pending.choices.map(choice => <button key={choice} className={button} onClick={() => send({ type: 'control-bonus', track: choice })}>{`${choice} +1`}</button>)}</div>
      </Panel>}
      {canAct && s.pending?.kind === 'bot-influence' && <Panel title={`Influenza BOT · ${s.pending.actor}`}>
        <p>Questo salvataggio precedente conserva la scelta manuale. Il nuovo fronte di {s.pending.cardId} indica Influenza → {TERRITORIES.find(t=>t.id===BOT_INFLUENCE[s.pending?.kind==='bot-influence'?s.pending.cardId:''])?.name}. Seleziona lo Stato stampato sulla carta; in uno Stato pieno l’Influenza segue le regole di sostituzione.</p>
        <div className="max-w-64"><img src={botFrontArt(s.pending.cardId)} alt={`Carta ${s.pending.cardId} · destinazione Influenza`}/></div>
        <label className="block text-sm">Stato<select className={selectStyle} value={botTerritory} onChange={e => {setBotTerritory(e.target.value);setSelected(e.target.value);}}>{TERRITORIES.map(t=><option key={t.id} value={t.id}>{t.name} · {occupiedSlots(s,t.id).length}/{t.capacity}</option>)}</select></label>
        <button className={button} onClick={() => send({type:'bot-influence',territoryId:botTerritory})}>Piazza l’Influenza BOT</button>
      </Panel>}
      {canAct && s.phase === 'support' && <Panel title="Scegli il sostegno"><p>Le tue unità nel territorio possono sostenere una parte senza subire perdite.</p><div className="flex flex-wrap gap-3">{(['attacker', 'defender', 'none'] as const).map(side => <button key={side} className={button} onClick={() => send({ type: 'support', side })}>{({ attacker: 'Sostieni attaccante', defender: 'Sostieni difensore', none: 'Non intervenire' })[side]}</button>)}</div></Panel>}
      {canAct && s.pending?.kind === 'casualty' && <Panel title={`Scegli ${s.pending.count} unità da rimuovere`}>
        <div className="flex flex-wrap gap-3">{s.pending.unitIds.map(id => {
          const u = s.units.find(x => x.id === id)!; return <button key={id} className={button} aria-pressed={marked.includes(id)} onClick={() => toggle(id)}>{marked.includes(id) ? '✓ ' : ''}{UNITS.find(d => d.id === u.type)?.name} · {id}</button>;
        })}</div><button disabled={marked.length !== s.pending.count} className={button} onClick={() => send({ type: 'casualties', unitIds: marked })}>Conferma perdite ({marked.length}/{s.pending.count})</button></Panel>}
      {canAct && s.phase === 'ops' && opsActor && <Panel title={`Operazioni · ${budget} OP disponibili`}>
        <div className="grid lg:grid-cols-3 gap-5">
          <div><h3 className="font-semibold mb-2">Sviluppo · 2 OP</h3><p className="text-xs text-slate-400 mb-3">+1 al tuo tracciato. Scegli la correlazione obbligatoria.</p>
            <div className="space-y-3">{TRACKS.map(track => <div key={track}><p className="text-sm mb-1">{track}</p><div className="flex flex-col gap-1">{CORRELATIONS[opsActor][track].map((c, i) => <button key={i} disabled={budget < 2} className={button + ' text-left'} onClick={() => send({ type: 'develop', track, correlation: i })}>{changeText(c)}</button>)}</div></div>)}</div>
          </div>
          <div><h3 className="font-semibold mb-2">Pressione · {pressureCost} OP</h3><p className="text-xs text-slate-400 mb-3">Massimo un passo per ciascun tracciato globale in questa attivazione.</p>
            {GLOBALS.map(track => <div key={track} className="mb-3"><p className="text-sm">{track}</p><div className="flex gap-2">{([-1, 1] as const).map(delta => {
              const allowed = track === 'Nucleare' ? (delta > 0 ? opsActor === 'Iran' : ['Coalizione', 'Europa'].includes(opsActor)) : track === 'Sanzioni' ? (delta > 0 ? ['Coalizione', 'Europa'].includes(opsActor) : ['Iran', 'Russia', 'Cina'].includes(opsActor)) : true;
              return <button key={delta} disabled={!allowed || budget < pressureCost || s.ops!.pressured.includes(track)} className={button} onClick={() => send({ type: 'pressure', track, delta })}>{delta > 0 ? '+1' : '−1'}</button>;
            })}</div></div>)}
            <h3 className="font-semibold mt-5 mb-2">Attacco · {attackCost(s, selected)} OP</h3><p className="text-xs text-slate-400 mb-2">Nel territorio selezionato devono esserci unità di Iran e Coalizione. Crisi Bellica −1 immediato.</p>
            <button className={button} disabled={budget < attackCost(s, selected) || !['Iran', 'Coalizione'].includes(opsActor) || !localUnits.some(u => u.faction === 'Iran') || !localUnits.some(u => u.faction === 'Coalizione')} onClick={() => send({ type: 'attack', territoryId: selected })}>Attacca in {territory.name}</button>
            {official && <><h3 className="font-semibold mt-5 mb-2">Influenza · {influenceCost(s, opsActor, selected)} OP</h3><p className="text-xs text-slate-400 mb-2">Base: 1 OP amico, 2 neutrale, 3 nemico.{usesLatestRules(s) && ' Si applicano i modificatori Militare per Russia/Cina/Europa e Opinione per Iran/Coalizione; minimo 1 OP. Destabilizzare costa 2 OP, in qualsiasi Stato.'}</p>
              <InfluenceAction key={`${gameId}-${saved.revision}-${opsActor}-${selected}`} proposal={{revision:saved.revision,actor:opsActor,territoryId:selected,territoryName:territory.name,cost:influenceCost(s,opsActor,selected),budget}}
                disabled={!canAct || !canInfluence(s,selected) || budget<influenceCost(s,opsActor,selected)} onConfirm={()=>{void send({type:'influence',territoryId:selected});}}/>
              {localInfluence.filter(marker => marker.faction !== opsActor && (usesLatestRules(s) || territoryPresence(s, opsActor, selected) > 0)).map(marker=><button key={marker.id} className={button+' ml-2'} disabled={budget<2} onClick={()=>send({type:'destabilize',influenceId:marker.id})}>Destabilizza {marker.faction} · 2 OP</button>)}
            </>}
          </div>
          <div><h3 className="font-semibold mb-2">Schieramento</h3><p className="text-xs text-slate-400 mb-3">Seleziona il territorio sulla mappa. Costi comprensivi di Economia, Crisi Bellica, allineamento e Hormuz.</p>
            <label className="block text-sm">Unità<select className={selectStyle} value={chosenUnit?.id ?? ''} onChange={e => setUnitId(e.target.value)}>{deployable.map(u => <option key={u.id} value={u.id}>{u.name} · {deployCost(s, opsActor, u.id, selected)} OP</option>)}</select></label>
            <label className="block text-sm mt-3">Territorio<select className={selectStyle} value={selected} onChange={e => setSelected(e.target.value)}>{TERRITORIES.map(t => <option key={t.id} value={t.id}>{t.name} ({occupiedSlots(s,t.id).length}/{t.capacity})</option>)}</select></label>
            {chosenUnit && <><p className="text-sm my-3">{chosenUnit.effect}</p>
              {(intelligence || placementCyber) && <label className="block text-sm">Fazione bersaglio<select className={selectStyle} value={deploymentTarget ?? ''} onChange={e => setTarget(e.target.value as Faction)}>{!targetOptions.length && <option value="">Nessun avversario presente nel territorio</option>}{targetOptions.map(f => <option key={f}>{f}</option>)}</select></label>}
              {!latest && /diplomatic/i.test(chosenUnit.name) && <label className="block text-sm">Effetto diplomatico<select className={selectStyle} value={diplomacyEffect} onChange={e => setDiplomacyEffect(e.target.value as 'sanctions' | 'opinion')}><option value="sanctions">Sanzioni −1</option><option value="opinion">Opinione +1</option></select></label>}
              <button className={button + ' mt-3 w-full'} disabled={!canDeploy(s, opsActor, chosenUnit.id, selected) || deployCost(s, opsActor, chosenUnit.id, selected) > budget || ((intelligence || placementCyber) && !deploymentTarget)}
                onClick={() => send({ type: 'deploy', unitId: chosenUnit.id, territoryId: selected, target: deploymentTarget, diplomacyEffect })}>Schiera · {deployCost(s, opsActor, chosenUnit.id, selected)} OP</button>
              <div className="max-w-48 mt-3"><UnitImage id={chosenUnit.id} name={chosenUnit.name} /></div></>}
          </div>
        </div>
        {expiringUnits.length > 0 && <div className="mt-4" aria-label="Mantenimento delle unità"><h3 className="font-semibold mb-2">Mantenimento · {MAINTENANCE_COST} OP per unità</h3>
          <p className="text-xs text-slate-400 mb-3">Queste unità tornano in riserva al prossimo fine round. Paga {MAINTENANCE_COST} OP per tenerne una un altro round. Al punteggio finale contano solo le unità ancora sul tabellone. I BOT mantengono gratuitamente 1 unità ruotata per attivazione, privilegiando il controllo degli Stati e poi le unità più costose.</p>
          <div className="flex flex-wrap gap-2">{expiringUnits.map(u => <button key={u.id} data-maintain-unit={u.id} className={button} disabled={!canAct || budget < MAINTENANCE_COST}
            onClick={() => send({ type: 'maintain', unitId: u.id })}>Mantieni {UNITS.find(d => d.id === u.type)?.name} · {TERRITORIES.find(t => t.id === u.territory)?.name} · {u.id} · {MAINTENANCE_COST} OP</button>)}</div></div>}
        <button className={button + ' border-red-500'} onClick={() => send({ type: 'finish-ops' })}>Termina attivazione{budget ? ` · rinuncia a ${budget} OP` : ''}</button>
      </Panel>}
      {own && latest && (peekTargets.length > 0 || myIntel.length > 0) && <Panel title="Rete informativa · solo per te">
        <p className="text-xs text-slate-400">Intelligence e Satelliti: a ogni tua attivazione puoi guardare la mano di una fazione presente in uno Stato dove hai una di queste unità.</p>
        {peekTargets.length > 0 && <div className="flex flex-wrap gap-2 my-2">{peekTargets.map(f => <button key={f} className={button} onClick={() => send({ type: 'peek', target: f })}>Guarda la mano di {f}</button>)}</div>}
        {myIntel.map((entry, i) => <p key={i} className="text-sm mt-1"><strong>{entry.target}</strong> (attivazione {entry.activation}): {entry.hand.length ? entry.hand.map(id => FACTION_CARDS.find(c => c.id === id)?.name ?? id).join(' · ') : 'mano vuota'}</p>)}
      </Panel>}
      {p && own && <Panel title={`La tua mano · ${own} · ${p.hand.length} carte`}>
        {s.pending?.kind === 'discard' && actor === own && <div className="text-amber-200"><p>Seleziona {s.pending.count} carte da scartare. Limite mano: {s.pending.limit}.</p>
          <button className={button + ' mt-2'} disabled={!canAct || marked.length !== s.pending.count} onClick={() => send({ type: 'discard', cardIds: marked })}>Conferma scarto ({marked.length}/{s.pending.count})</button></div>}
        {!p.hand.length && <p className="text-slate-400">Mano vuota.{canAct && s.phase === 'activation' && <button className={button + ' ml-3'} onClick={() => send({ type: 'skip' })}>Passa attivazione</button>}</p>}
        <p className="text-xs text-slate-400">Questa è soltanto la tua mano. Cambiare la plancia consultata non mostra le carte degli altri giocatori. Tocca un fronte originale per ingrandirlo e scegliere evento o OP.</p>
        <div className="tabletop-hand-grid">{p.hand.map(id => {
          const c = FACTION_CARDS.find(x => x.id === id)!;
          return <button key={id} className="tabletop-hand-card" aria-label={`${marked.includes(id) ? 'Selezionata · ' : ''}${c.id} · ${c.name} · ${c.cost} OP`} aria-pressed={marked.includes(id)}
            onClick={() => s.phase === 'discard' && actor === own ? toggle(id) : setCardId(id)}>
            <FactionCardFace card={c}/>
            <span className="tabletop-hand-hint">{s.phase === 'discard' && actor === own ? marked.includes(id) ? '✓ Selezionata per lo scarto' : 'Seleziona per lo scarto' : 'Ingrandisci · scegli evento oppure OP'}</span>
          </button>;
        })}</div>
      </Panel>}
      {own && <Panel title="I tuoi obiettivi segreti"><p className="text-xs text-slate-400">Valutati solo a fine partita. Le condizioni attualmente soddisfatte possono cambiare.</p><div className="grid md:grid-cols-3 gap-4">{objectiveStatus(s, own).map(o => {
        const front = getObjectiveCardFront(o.id);
        return <div key={o.id} className="rounded-lg border border-slate-700 p-3">{front && <img src={front} alt={`${o.id} · ${o.name}`} className="w-full h-auto mb-3" loading="lazy" />}<strong>{o.name} · {o.points} PV</strong><p className="text-sm mt-2">{o.condition}</p><p className={'text-sm mt-2 ' + (o.complete ? 'text-emerald-300' : 'text-slate-400')}>{o.complete ? 'Condizione attualmente soddisfatta' : 'Non ancora soddisfatto'}</p></div>;
      })}</div></Panel>}
      <p className="text-xs text-slate-500">BOT: nessuna mano né obiettivi. Mantenimento gratuito: 1 unità ruotata per attivazione.{usesLatestRules(s) && ' Presenza minima: senza unità, una carta BOT priva di Schieramento sostituisce il primo Sviluppo con l’unità base nello Stato stampato.'} Sostegno automatico: Russia/Cina per Iran, Europa per Coalizione; perdite meno costose per prime. Regolamento aggiornato: un solo Scudo difendente annulla tutti i Missili balistici attaccanti. La mano usa i fronti originali del mazzo base completo; gli effetti vengono applicati dalle opzioni strutturate del catalogo.</p>
    </div>
    {chosen && <div role="dialog" aria-modal="true" aria-label={chosen.name} className="fixed inset-0 z-40 overflow-y-auto bg-black/90 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-600 p-5 rounded-xl space-y-4">
        <button autoFocus className={button} onClick={() => setCardId(null)}>Chiudi carta</button>
        <h2 className="text-xl font-bold">{chosen.id} · {chosen.name}</h2>
        <div className="tabletop-card-enlarged"><FactionCardFace card={chosen}/></div>
        <p className="text-sm text-slate-300">Scegli una delle tre opzioni evento oppure usa i {chosen.cost} OP. Favorire una fazione diversa dalla tua dà +1 PV{usesLatestRules(s) ? ', al massimo una volta per round' : ''}. {chosen.special ? 'La speciale viene rimossa dopo l’uso.' : 'La carta usata va negli scarti.'} {!usesLatestRules(s) && chosen.unlocksSpecial ? 'Questa carta sblocca una speciale.' : ''}</p>
        <div className="grid md:grid-cols-3 gap-3">{chosen.options.map((option, i) => <div key={i} className="border border-slate-600 rounded-lg p-4 space-y-3">
          <h3 className="font-bold">Opzione {i + 1} · {option.boost.faction}</h3><p>{changeText(option.boost)}</p><p className="text-sm">Correlazione: {changeText(option.correlation)}</p><p className="text-sm">{globalText(option.globals)}</p>
          <button className={button} disabled={!canAct || s.phase !== 'activation' || !p?.hand.includes(chosen.id)} onClick={() => send({ type: 'play-event', cardId: chosen.id, option: i })}>Gioca evento</button></div>)}</div>
        <button className={button + ' w-full border-red-500'} disabled={!canAct || s.phase !== 'activation' || !p?.hand.includes(chosen.id)} onClick={() => send({ type: 'begin-ops', cardId: chosen.id })}>Usa per {chosen.cost} OP</button>
      </div>
    </div>}
    <CardMotion cue={motion.active} reduced={motion.reduced} speed={motion.speed} paused={motion.paused} onPause={motion.togglePaused} onDismiss={motion.dismiss}/>
    {materials && <Materials onClose={() => setMaterials(false)} />}
    {aid && <PlayerAid onClose={() => setAid(false)} />}
  </main>;
}
