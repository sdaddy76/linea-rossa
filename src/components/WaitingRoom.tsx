// =============================================
// LINEA ROSSA — Sala d'attesa multiplayer
// Real-time: ogni giocatore vede chi è entrato
// e che fazione ha scelto. Una fazione per giocatore.
// =============================================
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, supabaseAdmin } from '@/integrations/supabase/client';
import type { Profile } from '@/types/game';

type Faction = 'Iran' | 'Coalizione' | 'Russia' | 'Cina' | 'Europa';

const FACTION_INFO: Record<Faction, { flag: string; color: string; desc: string }> = {
  Iran:       { flag: '🇮🇷', color: '#22c55e', desc: 'Strategia offensiva' },
  Coalizione: { flag: '🏳️', color: '#3b82f6', desc: 'Pressione e sanzioni' },
  Russia:     { flag: '🇷🇺', color: '#ef4444', desc: 'Supporto a Iran' },
  Cina:       { flag: '🇨🇳', color: '#f59e0b', desc: 'Mediazione economica' },
  Europa:     { flag: '🇪🇺', color: '#8b5cf6', desc: 'Diplomazia neutrale' },
};

const TURN_ORDER: Faction[] = ['Iran', 'Coalizione', 'Russia', 'Cina', 'Europa'];

interface LobbyPlayer {
  id: string;
  faction: Faction | null;
  player_id: string | null;
  is_bot: boolean;
  is_ready: boolean;
  profile?: { username: string } | null;
}

interface WaitingRoomProps {
  gameId: string;
  gameCode: string;
  gameName?: string;   // opzionale — non più richiesto
  isPublic?: boolean;  // true = aperta, false/undefined = riservata
  profile: Profile;
  isHost: boolean;                          // chi ha creato la partita
  onGameStart: (faction: string | null) => void; // callback quando status → active
  onLeave: () => void;
}

export default function WaitingRoom({
  gameId, gameCode, gameName, isPublic, profile, isHost, onGameStart, onLeave,
}: WaitingRoomProps) {
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [myFaction, setMyFaction] = useState<Faction | null>(null);
  const myFactionRef = useRef<Faction | null>(null); // ref sempre aggiornato — evita stale closure
  // opSeq: ogni operazione chooseFaction ottiene un numero crescente.
  // loadPlayers aggiorna myFaction SOLO se non ci sono operazioni in volo (pendingOps===0).
  // Questo sostituisce isSwitchingFaction (basato su timing/setTimeout) con una
  // soluzione deterministica basata su contatore.
  const pendingOps = useRef(0);
  const onGameStartRef = useRef(onGameStart); // ref stabile — evita re-subscribe ad ogni render
  useEffect(() => { onGameStartRef.current = onGameStart; }, [onGameStart]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  // Modalità mazzo: 'classic' (un mazzo per fazione) o 'unified' (mazzo unico)
  const [gameMode, setGameMode] = useState<'classic' | 'unified'>('classic');
  const [specialMode, setSpecialMode] = useState<'mixed' | 'separate'>('mixed');
  // Modalità setup iniziale territori
  const [setupMode, setSetupMode] = useState<'base' | 'avanzata'>('base');

  // ── Configurazioni setup iniziale ────────────────────────────────────────
  // Chiavi: faction name → { territoryId: cubetti }
  // Nota: usare gli ID esatti di TerritoryId (es. 'ArabiaSaudita', non 'Arabia Saudita')
  const SETUP_BASE: Record<string, Record<string, number>> = {
    'Iran':       { 'Iran': 3 },
    'Coalizione': { 'Israele': 4 },
  };

  const SETUP_AVANZATA: Record<string, Record<string, number>> = {
    'Iran':       { 'Iran': 3, 'Libano': 1, 'Siria': 1 },
    'Coalizione': { 'Israele': 4, 'ArabiaSaudita': 2, 'Iraq': 1, 'Yemen': 2 },
    'Europa':     { 'Turchia': 1, 'Libano': 1 },
  };

  // ── Carica giocatori correnti ─────────────────────────────────────
  const loadPlayers = useCallback(async () => {
    const { data } = await supabase
      .from('game_players')
      .select('*, profile:profiles(username)')
      .eq('game_id', gameId)
      .order('turn_order');
    if (data) {
      // Deduplicazione client-side: per ogni player_id tieni solo la prima riga
      const seen = new Set<string>();
      const deduplicated = (data as LobbyPlayer[]).filter(p => {
        if (!p.player_id) return true; // bot: tieni sempre
        if (seen.has(p.player_id)) return false;
        seen.add(p.player_id);
        return true;
      });
      setPlayers(deduplicated);
      // Aggiorna myFaction SOLO se non c'è un'operazione chooseFaction in corso.
      // Durante selezione/deselezione, l'UI è già aggiornata ottimisticamente:
      // sovrascrivere con dati DB potenzialmente vecchi causerebbe il "rimbalzo".
      if (pendingOps.current === 0) {
        const me = data.find((p: LobbyPlayer) => p.player_id === profile.id);
        if (me?.faction) {
          setMyFaction(me.faction as Faction);
          myFactionRef.current = me.faction as Faction;
        } else {
          setMyFaction(null);
          myFactionRef.current = null;
        }
      }
    }
  }, [gameId, profile.id]);

  // ── Abbandona la partita ──────────────────────────────────────────
  const leaveGame = useCallback(async () => {
    // Rimuove il record del giocatore (se non è host)
    // Se è host, elimina la partita intera
    if (isHost) {
      await supabase.from('games').delete().eq('id', gameId);
    } else {
      await supabaseAdmin
        .from('game_players')
        .delete()
        .eq('game_id', gameId)
        .eq('player_id', profile.id);
    }
    onLeave();
  }, [gameId, isHost, profile.id, onLeave]);

  // ── Sottoscrizione real-time game_players ─────────────────────────
  useEffect(() => {
    loadPlayers();

    const playersCh = supabase
      .channel(`lobby-players-${gameId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'game_players',
        filter: `game_id=eq.${gameId}`,
      }, () => loadPlayers())
      .subscribe();

    // Ascolta avvio partita (games.status → active)
    // NOTA: usa myFactionRef.current (non myFaction) per evitare la stale closure:
    // la subscription viene creata una sola volta ma myFaction può cambiare dopo
    const gameCh = supabase
      .channel(`lobby-game-${gameId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'games',
        filter: `id=eq.${gameId}`,
      }, (payload) => {
        if (payload.new?.status === 'active') onGameStartRef.current(myFactionRef.current);
      })
      .subscribe();

    return () => {
      playersCh.unsubscribe();
      gameCh.unsubscribe();
    };
  // onGameStart è ora stabile tramite ref — rimosso dalle dipendenze per evitare
  // re-subscribe indesiderati che causano eventi "catch-up" da Supabase
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, loadPlayers]);

  // ── Scelta fazione ────────────────────────────────────────────────
  // ── Scelta fazione ────────────────────────────────────────────────
  // Logica semplificata: cliccare su una fazione la SOSTITUISCE sempre.
  // Non è prevista la deselezione — se vuoi cambiare, clicca direttamente sull'altra.
  const chooseFaction = async (faction: Faction) => {
    // Ignora click sulla fazione già selezionata
    if (myFactionRef.current === faction) return;

    // Controlla che la fazione non sia già presa da un altro umano
    const taken = players.find(p =>
      p.faction === faction &&
      p.player_id &&
      p.player_id !== profile.id &&
      !p.is_bot
    );
    if (taken) {
      setError(`⚠️ ${faction} è già presa da un altro giocatore`);
      return;
    }

    setLoading(true); setError('');
    pendingOps.current += 1;
    const prevFaction = myFactionRef.current;
    setMyFaction(faction);
    myFactionRef.current = faction;

    try {
      // Step 1 — rimuovi TUTTE le righe umane mie (player_id)
      await supabaseAdmin
        .from('game_players')
        .delete()
        .eq('game_id', gameId)
        .eq('player_id', profile.id);

      // Step 2 — se avevo una fazione precedente, rimuovi anche per nome fazione
      //          (gestisce righe che nel DB hanno player_id diverso/null)
      if (prevFaction) {
        await supabaseAdmin
          .from('game_players')
          .delete()
          .eq('game_id', gameId)
          .eq('faction', prevFaction)
          .eq('is_bot', false);
      }

      // Step 3 — rimuovi eventuali bot/placeholder sulla nuova fazione
      await supabaseAdmin
        .from('game_players')
        .delete()
        .eq('game_id', gameId)
        .eq('faction', faction)
        .eq('is_bot', true);

      // Step 4 — inserisci la mia nuova scelta (supabaseAdmin bypassa RLS)
      const { error: insErr } = await supabaseAdmin
        .from('game_players')
        .insert({
          game_id: gameId,
          faction,
          player_id: profile.id,
          is_bot: false,
          bot_difficulty: 'normal',
          turn_order: TURN_ORDER.indexOf(faction) + 1,
          is_ready: true,
        });

      if (insErr) {
        // Se duplicate key (23505): la riga esiste già, va bene
        if (insErr.code === '23505') {
          console.warn('[chooseFaction] riga già esistente, ignorato');
        } else {
          console.error('[chooseFaction] insert error:', insErr.code, insErr.message, insErr.details);
          throw insErr;
        }
      }

    } catch (err: unknown) {
      // Rollback UI
      setMyFaction(prevFaction);
      myFactionRef.current = prevFaction;
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setError('Errore nella scelta: ' + msg);
    } finally {
      pendingOps.current -= 1;
      setLoading(false);
      await loadPlayers();
    }
  };


  // ── Avvia partita (solo host) ─────────────────────────────────────
  const startGame = async (mode: 'solo' | 'pubblico' = 'solo') => {
    if (!myFaction) { setError('Scegli prima la tua fazione'); return; }

    // Umani = chi ha player_id (includo me anche se il real-time non ha ancora aggiornato)
    const humanPlayers = players.filter(p => p.player_id && !p.is_bot);
    const humanCount = myFaction ? Math.max(humanPlayers.length, 1) : humanPlayers.length;
    if (humanCount === 0) { setError('Scegli prima la tua fazione'); return; }

    setStarting(true); setError('');
    try {
      console.log('[startGame] step 1 — inserimento bot, mode:', mode);
      // Fazioni non prese da umani → assegna bot solo in modalità 'solo'
      const takenFactions = new Set(players.filter(p => p.player_id).map(p => p.faction));
      if (myFaction) takenFactions.add(myFaction);
      const botFactions = mode === 'solo'
        ? TURN_ORDER.filter(f => !takenFactions.has(f))
        : []; // modalità pubblica: nessun bot, i posti restano liberi

      if (botFactions.length > 0) {
        const botRows = botFactions.map(f => ({
          game_id: gameId, faction: f, player_id: null,
          is_bot: true, bot_difficulty: 'normal',
          turn_order: TURN_ORDER.indexOf(f) + 1, is_ready: true,
        }));
        const { error: botErr } = await supabase
          .from('game_players')
          .upsert(botRows, { onConflict: 'game_id,faction', ignoreDuplicates: false });
        if (botErr) { console.error('[startGame] bot insert err:', botErr); throw botErr; }
      }
      console.log('[startGame] step 2 — game_state');

      // ── Inizializza game_state con SOLO le colonne garantite dal schema base ──
      const baseState = {
        game_id: gameId,
        nucleare: 1, sanzioni: 4, opinione: 0,
        risorse_iran: 5, risorse_coalizione: 5, risorse_russia: 5,
        risorse_cina: 5, risorse_europa: 5,
        stabilita_iran: 5, stabilita_coalizione: 5, stabilita_russia: 5,
        stabilita_cina: 5, stabilita_europa: 5,
        active_faction: 'Iran',
      };
      const { data: existingState } = await supabase
        .from('game_state').select('game_id').eq('game_id', gameId).maybeSingle();
      let stateErr;
      if (existingState) {
        const { error: updErr } = await supabase.from('game_state').update(baseState).eq('game_id', gameId);
        stateErr = updErr;
      } else {
        const { error: insErr } = await supabase.from('game_state').insert(baseState);
        stateErr = insErr;
      }
      if (stateErr) { console.error('[startGame] game_state err:', stateErr); throw stateErr; }

      // ── Colonne opzionali (aggiunte da migration separate) ──
      // Ogni update è indipendente: se la colonna non esiste Supabase restituisce
      // error.code='42703' — lo ignoriamo, non blocchiamo l'avvio.
      const tryUpdate = async (data: Record<string, unknown>) => {
        const { error: e } = await supabase.from('game_state').update(data).eq('game_id', gameId);
        // ignora: 42703 = colonna mancante, 23514 = constraint check (defcon range)
        if (e && e.code !== '42703' && e.code !== '23514') console.warn('[startGame] optional update warn:', e);
      };
      await tryUpdate({ defcon: 10 });
      await tryUpdate({ turno_corrente: 1 });
      await tryUpdate({ forze_militari_iran: 5, forze_militari_coalizione: 5 });
      await tryUpdate({ forze_militari_russia: 5, forze_militari_cina: 5, forze_militari_europa: 5 });
      try {
        const { INITIAL_UNITS } = await import('@/lib/territoriesData');
        await tryUpdate({
          units_iran: INITIAL_UNITS.Iran, units_coalizione: INITIAL_UNITS.Coalizione,
          units_russia: INITIAL_UNITS.Russia, units_cina: INITIAL_UNITS.Cina,
          units_europa: INITIAL_UNITS.Europa,
          special_uses: { veto_russia: 3, hormuz_iran: false, superiorita_aerea: false },
          active_alliances: [],
        });
      } catch { /* import fallito — ignorato */ }

      console.log('[startGame] step 3 — mazzi carte');
      const { getFullDeck, CLASSIC_HAND_SIZE: HAND_SIZE } = await import('@/data/mazzi');
      const allPlayers = await supabase
        .from('game_players')
        .select('faction')
        .eq('game_id', gameId);
      const allFactions = (allPlayers.data ?? []).map(p => p.faction) as Faction[];

      const deckRows: {
        game_id: string; faction: Faction; card_id: string; card_name: string;
        card_type: string; op_points: number; deck_type: string;
        status: string; position: number; held_by_faction: Faction | null;
      }[] = [];
      for (const f of allFactions) {
        const deck = getFullDeck(f);
        deck.forEach((card, i) => {
          const inHand = i < HAND_SIZE;
          deckRows.push({
            game_id: gameId,
            faction: f,
            card_id: card.card_id,
            card_name: card.card_name,
            card_type: card.card_type,
            op_points: card.op_points ?? 0,
            deck_type: card.deck_type ?? 'base',
            status:          inHand ? 'in_hand'  : 'available',
            held_by_faction: inHand ? f          : null,
            position: i,
          });
        });
      }
      console.log('[startGame] deckRows da inserire:', deckRows.length);
      if (deckRows.length > 0) {
        const { error: deckErr } = await supabase
          .from('cards_deck')
          .upsert(deckRows, { onConflict: 'game_id,card_id', ignoreDuplicates: true });
        if (deckErr) { console.error('[startGame] deck upsert err:', deckErr); throw deckErr; }
      }

      console.log('[startGame] step 4 — territori');
      // Inizializza territori — non bloccante se la tabella non esiste ancora
      try {
        const { TERRITORIES } = await import('@/lib/territoriesData');
        const terrRows = TERRITORIES.map(t => ({
          game_id: gameId,
          territory: t.id,
          inf_iran: 0, inf_coalizione: 0, inf_russia: 0, inf_cina: 0, inf_europa: 0,
        }));
        const { error: terrErr } = await supabase
          .from('territories')
          .upsert(terrRows, { onConflict: 'game_id,territory' });
        if (terrErr) {
          // PGRST205 = tabella non nel cache schema → non bloccante, la mappa sarà vuota
          if (terrErr.code === 'PGRST205' || terrErr.code === '42P01') {
            console.warn('[startGame] tabella territories non presente — mappa disabilitata');
          } else {
            throw terrErr;
          }
        }

        // ── Applica setup iniziale cubi influenza ─────────────────────────────
        console.log('[startGame] step 4b — setup influenze:', setupMode);
        const factionToInfKey: Record<string, string> = {
          'Iran':                  'inf_iran',
          'Coalizione':            'inf_coalizione',
          'Coalizione Occidentale':'inf_coalizione',
          'Russia':                'inf_russia',
          'Cina':                  'inf_cina',
          'Europa':                'inf_europa',
          'Unione Europea':        'inf_europa',
        };
        const activeSetup = setupMode === 'avanzata' ? SETUP_AVANZATA : SETUP_BASE;
        // Aggrega: territorio → { inf_xxx: n, ... }
        const setupAgg: Record<string, Record<string, number>> = {};
        for (const [faction, terrMap] of Object.entries(activeSetup)) {
          const infKey = factionToInfKey[faction];
          if (!infKey) continue;
          for (const [terrId, cubi] of Object.entries(terrMap)) {
            if (!setupAgg[terrId]) setupAgg[terrId] = {};
            setupAgg[terrId][infKey] = cubi;
          }
        }
        for (const [terrId, infData] of Object.entries(setupAgg)) {
          const { error: setupErr } = await supabase
            .from('territories')
            .upsert(
              { game_id: gameId, territory: terrId, ...infData },
              { onConflict: 'game_id,territory' },
            );
          if (setupErr) console.warn('[startGame] setup upsert warn:', terrId, setupErr);
        }
        // ─────────────────────────────────────────────────────────────────────
      } catch (e) {
        console.warn('[startGame] territori skip:', e);
      }
      console.log('[startGame] step 5 — aggiorna games.status');

      // Cambia status:
      // - 'solo'     → 'active' (tutti i posti sono coperti da umani/bot)
      // - 'pubblico' → 'active' con allow_join:true — posti vuoti restano liberi per nuovi entranti
      const newStatus = 'active';
      const gameUpdatePayload: Record<string, unknown> = {
        status: newStatus,
        started_at: new Date().toISOString(),
      };
      if (mode === 'pubblico') {
        // allow_join segnala che il tavolo accetta ancora giocatori
        try { (gameUpdatePayload as Record<string, unknown>)['allow_join'] = true; } catch { /* colonna opzionale */ }
      }
      const { error: gameErr } = await supabase
        .from('games')
        .update(gameUpdatePayload)
        .eq('id', gameId);
      if (gameErr) throw gameErr;

      // Prova a salvare game_mode (richiede migration add_unified_deck_columns.sql)
      // Non blocca l'avvio se la colonna non esiste ancora
      try {
        await supabase.from('games').update({
          game_mode: gameMode,
          special_mode: specialMode,
        }).eq('id', gameId);
      } catch { /* colonna game_mode non presente — la migration non è stata eseguita */ }

      // Se modalità "speciali separate": ricrea i mazzi senza le carte speciali,
      // e inserisce le speciali come status='special_locked' (mazzo separato in DB)
      if (specialMode === 'separate') {
        // Rimuovi le speciali già inserite nel mazzo normale
        await supabase.from('cards_deck')
          .delete()
          .eq('game_id', gameId)
          .eq('deck_type', 'speciale');

        // Reinserisci le speciali come special_locked (mazzo separato, non pescabile)
        const { MAZZI_SPECIALI } = await import('@/data/mazzi');
        const specialRows: object[] = [];
        const activeFactions = players
          .filter(p => p.player_id || p.is_bot)
          .map(p => p.faction) as Faction[];
        let specPos = 1000; // posizioni alte per non confondersi col mazzo normale
        for (const faction of activeFactions) {
          const specCards = MAZZI_SPECIALI[faction] ?? [];
          for (const card of specCards) {
            specialRows.push({
              game_id: gameId,
              faction: card.faction,
              owner_faction: faction,
              card_id: card.card_id,
              card_name: card.card_name,
              card_type: card.card_type,
              op_points: card.op_points,
              deck_type: 'speciale_locked',
              status: 'special_locked',
              held_by_faction: null,
              position: specPos++,
            });
          }
        }
        if (specialRows.length > 0) {
          await supabase.from('cards_deck').insert(specialRows);
        }
      }

      // Se mazzo unificato: costruisci mazzo unico al posto dei mazzi separati
      if (gameMode === 'unified') {
        // Cancella i deck rows già inseriti sopra (mazzo classico) e crea il mazzo unificato
        await supabase.from('cards_deck').delete().eq('game_id', gameId);
        const { getUnifiedDeck, UNIFIED_HAND_SIZE } = await import('@/data/mazzi');
        const allPlayers = [...players.filter(p => p.player_id || p.is_bot)];
        const factions = allPlayers.map(p => p.faction) as Faction[];
        const unified = getUnifiedDeck();
        let pos = 1;
        const unifiedRows: object[] = [];
        let cardIdx = 0;
        // Distribuisce le mani round-robin
        for (let i = 0; i < UNIFIED_HAND_SIZE; i++) {
          for (const f of factions) {
            if (cardIdx >= unified.length) break;
            const card = unified[cardIdx++];
            unifiedRows.push({
              game_id: gameId, faction: card.faction, owner_faction: card.owner_faction,
              card_id: card.card_id, card_name: card.card_name, card_type: card.card_type,
              op_points: card.op_points, deck_type: card.deck_type,
              status: 'in_hand', held_by_faction: f, position: pos++,
            });
          }
        }
        // Resto: mazzo disponibile
        for (; cardIdx < unified.length; cardIdx++) {
          const card = unified[cardIdx];
          unifiedRows.push({
            game_id: gameId, faction: card.faction, owner_faction: card.owner_faction,
            card_id: card.card_id, card_name: card.card_name, card_type: card.card_type,
            op_points: card.op_points, deck_type: card.deck_type,
            status: 'available', held_by_faction: null, position: pos++,
          });
        }
        await supabase.from('cards_deck').insert(unifiedRows);
      }

      // L'host viene notificato tramite real-time come tutti gli altri
    } catch (err: unknown) {
      const pe = (typeof err === 'object' && err !== null) ? err as Record<string, string> : {};
      const msg = pe.message ?? (err instanceof Error ? err.message : 'Errore nell\'avvio');
      const detail = [
        pe.code    ? `code=${pe.code}`       : '',
        pe.details ? `details: ${pe.details}` : '',
        pe.hint    ? `hint: ${pe.hint}`       : '',
      ].filter(Boolean).join(' | ');
      const full = detail ? `${msg} — ${detail}` : msg;
      console.error('[WaitingRoom startGame] errore:', full, err);
      setError(full);
    } finally {
      // ✅ SEMPRE resetta lo stato loading — anche in caso di successo o errore
      setStarting(false);
    }
  };

  // ── Copia codice ──────────────────────────────────────────────────
  const copyCode = () => {
    navigator.clipboard.writeText(gameCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Stato derivato ────────────────────────────────────────────────
  const humanPlayers = players.filter(p => p.player_id && !p.is_bot);
  // takenFactions esclude sempre il giocatore corrente: così durante la deselezione
  // ottimistica (myFaction → null) il bottone non passa a "preso da altri"
  const takenFactions = new Set(
    players.filter(p => p.player_id && !p.is_bot && p.player_id !== profile.id).map(p => p.faction)
  );

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">

        {/* ── Header partita ── */}
        <div className="rounded-xl border border-[#1e3a5f] bg-[#0d1424] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-wider ${
                  isPublic ? 'bg-[#22d3ee15] text-[#22d3ee]' : 'bg-[#a78bfa15] text-[#a78bfa]'
                }`}>
                  {isPublic ? '🌐 Tavolo aperto' : '🔒 Tavolo riservato'}
                </span>
                <span className="text-[#00ff88] font-mono font-black text-sm tracking-wider">{gameCode}</span>
              </div>
              <p className="text-xs font-mono text-[#445566]">
                {isHost ? 'Sei l\'host — avvia quando tutti sono pronti' : 'In attesa che l\'host avvii la partita…'}
              </p>
            </div>
            <button onClick={leaveGame}
              className="text-xs font-mono text-[#445566] hover:text-[#ef4444] transition-colors px-2 py-1">
              ✕ esci
            </button>
          </div>

          {/* Codice partita */}
          <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-[#060d18] border border-[#1e3a5f]">
            <div className="flex-1">
              <p className="text-[10px] font-mono text-[#445566] uppercase tracking-widest mb-1">
                {isPublic ? 'Codice (opzionale — tavolo visibile nella lista)' : 'Codice da condividere con i giocatori'}
              </p>
              <p className="text-2xl font-black font-mono tracking-[0.2em]" style={{ color: isPublic ? '#22d3ee' : '#a78bfa' }}>{gameCode}</p>
            </div>
            <button
              onClick={copyCode}
              className="px-4 py-2 rounded-lg border font-mono text-xs font-bold transition-all"
              style={{
                borderColor: copied ? '#00ff88' : '#1e3a5f',
                color: copied ? '#00ff88' : '#8899aa',
                background: copied ? '#00ff8810' : 'transparent',
              }}>
              {copied ? '✓ Copiato!' : '📋 Copia'}
            </button>
          </div>
        </div>

        {/* ── Giocatori in sala ── */}
        <div className="rounded-xl border border-[#1e3a5f] bg-[#0d1424] p-5">
          <h3 className="text-xs font-mono font-bold text-[#8899aa] uppercase tracking-widest mb-3">
            Giocatori connessi ({humanPlayers.length})
          </h3>
          {humanPlayers.length === 0 ? (
            <p className="text-xs font-mono text-[#334455] italic">
              In attesa che altri giocatori entrino con il codice…
            </p>
          ) : (
            <div className="space-y-2">
              {humanPlayers.map(p => {
                const info = p.faction ? FACTION_INFO[p.faction as Faction] : null;
                const isMe = p.player_id === profile.id;
                return (
                  <div key={p.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border"
                    style={{ borderColor: info ? info.color + '44' : '#1e3a5f', background: info ? info.color + '08' : '#060d18' }}>
                    <span className="text-lg">{info?.flag ?? '⏳'}</span>
                    <div className="flex-1">
                      <span className="font-mono text-sm font-bold" style={{ color: info?.color ?? '#8899aa' }}>
                        {p.profile?.username ?? 'Anonimo'}
                        {isMe && <span className="ml-2 text-[10px] text-[#00ff88] bg-[#00ff8815] px-1.5 py-0.5 rounded">TU</span>}
                      </span>
                      {p.faction && (
                        <span className="ml-2 text-xs font-mono text-[#445566]">{p.faction}</span>
                      )}
                    </div>
                    {p.faction ? (
                      <span className="text-[10px] font-mono text-[#00ff88]">✓ pronto</span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#445566]">sceglie…</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Scelta fazione ── */}
        <div className="rounded-xl border border-[#1e3a5f] bg-[#0d1424] p-5">
          <h3 className="text-xs font-mono font-bold text-[#8899aa] uppercase tracking-widest mb-1">
            Scegli la tua fazione
          </h3>
          <p className="text-xs font-mono text-[#334455] mb-4">
            Le fazioni non scelte da nessun giocatore saranno gestite dal bot
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TURN_ORDER.map(faction => {
              const info = FACTION_INFO[faction];
              const isMine = myFaction === faction;
              const takenByOther = takenFactions.has(faction) && !isMine;
              const takerPlayer = players.find(p => p.faction === faction && p.player_id && p.player_id !== profile.id);

              return (
                <button
                  key={faction}
                  onClick={() => !takenByOther && !loading && chooseFaction(faction)}
                  disabled={takenByOther || loading}
                  title={isMine ? `Fazione attuale — clicca un'altra per cambiare` : takenByOther ? `${faction} è già presa` : `Scegli ${faction}`}
                  className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all group"
                  style={{
                    borderColor: isMine ? info.color : takenByOther ? '#1e2a3a' : '#1e3a5f',
                    background: isMine ? info.color + '15' : takenByOther ? '#060a10' : '#060d18',
                    opacity: takenByOther ? 0.45 : 1,
                    boxShadow: isMine ? `0 0 16px ${info.color}30` : 'none',
                    cursor: takenByOther ? 'not-allowed' : 'pointer',
                  }}>
                  {/* Icona fazione */}
                  <span className="text-2xl">{info.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm" style={{ color: isMine ? info.color : takenByOther ? '#334455' : '#c0cce0' }}>
                        {faction}
                      </span>
                      {isMine && (
                        <>
                          <span className="text-[10px] font-mono bg-[#00ff8820] text-[#00ff88] px-1.5 rounded">✓ TU</span>
                        </>
                      )}
                      {takenByOther && (
                        <span className="text-[10px] font-mono text-[#334455]">
                          🔒 {takerPlayer?.profile?.username ?? 'preso'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono truncate" style={{ color: takenByOther ? '#223' : '#445566' }}>
                      {isMine ? (
                        <span className="group-hover:hidden">{info.desc}</span>
                      ) : info.desc}
                      {isMine && (
                        <span className="hidden group-hover:inline text-[#ff6666]">Clicca per cambiare fazione</span>
                      )}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Errori ── */}
        {error && (
          <div className="px-4 py-3 rounded-lg border border-[#ff4444] bg-[#ff000010] text-[#ff6666] text-xs font-mono">
            ⚠️ {error}
          </div>
        )}

        {/* ── Avvia (solo host) ── */}
        {isHost && (
          <div className="space-y-3">
            {/* Toggle modalità setup territori */}
            <div className="p-3 rounded-xl border border-[#1e3a5f] bg-[#050d18]">
              <p className="text-[10px] font-mono font-bold text-[#4a9eff] uppercase tracking-widest mb-2">
                🗺️ Modalità Setup
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSetupMode('base')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold border transition-all ${
                    setupMode === 'base'
                      ? 'bg-[#1a6eb520] border-[#1a6eb5] text-[#4a9eff]'
                      : 'bg-transparent border-[#1e3a5f] text-[#445566] hover:border-[#2a4a7f]'
                  }`}
                >
                  ⚡ BASE
                  <p className="text-[10px] font-normal mt-0.5 text-[#667788]">Iran 3🟢 + Coal 4🔵</p>
                </button>
                <button
                  onClick={() => setSetupMode('avanzata')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold border transition-all ${
                    setupMode === 'avanzata'
                      ? 'bg-[#2d8a4e20] border-[#2d8a4e] text-[#4ade80]'
                      : 'bg-transparent border-[#1e3a5f] text-[#445566] hover:border-[#2a4a7f]'
                  }`}
                >
                  🌍 AVANZATA
                  <p className="text-[10px] font-normal mt-0.5 text-[#667788]">+7 cubi iniziali</p>
                </button>
              </div>
              {setupMode === 'avanzata' && (
                <div className="mt-2 text-[10px] text-[#445566] space-y-0.5 font-mono">
                  <p>🇮🇷 Iran → Libano +1, Siria +1</p>
                  <p>🇺🇸 Coalizione → Arabia Saudita +2, Iraq +1, Yemen +2</p>
                  <p>🇪🇺 Europa → Turchia +1, Libano +1</p>
                </div>
              )}
            </div>

            {/* Toggle modalità mazzo */}
            <div className="p-3 rounded-xl border border-[#1e3a5f] bg-[#060d18]">
              <p className="text-[10px] font-mono font-bold text-[#8899aa] uppercase tracking-widest mb-2">
                🎴 Modalità mazzo
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setGameMode('classic')}
                  className="py-2 px-3 rounded-lg font-mono text-xs font-bold transition-all"
                  style={{
                    backgroundColor: gameMode === 'classic' ? '#22c55e20' : 'transparent',
                    border: `1px solid ${gameMode === 'classic' ? '#22c55e' : '#1e3a5f'}`,
                    color: gameMode === 'classic' ? '#22c55e' : '#556677',
                  }}>
                  🃏 Classico
                  <span className="block text-[9px] font-normal mt-0.5 opacity-70">
                    Mazzo per fazione
                  </span>
                </button>
                <button
                  onClick={() => setGameMode('unified')}
                  className="py-2 px-3 rounded-lg font-mono text-xs font-bold transition-all"
                  style={{
                    backgroundColor: gameMode === 'unified' ? '#f9731620' : 'transparent',
                    border: `1px solid ${gameMode === 'unified' ? '#f97316' : '#1e3a5f'}`,
                    color: gameMode === 'unified' ? '#f97316' : '#556677',
                  }}>
                  🎴 Unificato
                  <span className="block text-[9px] font-normal mt-0.5 opacity-70">
                    Mazzo unico condiviso
                  </span>
                </button>
              </div>
              {gameMode === 'unified' && (
                <p className="text-[10px] font-mono text-[#f97316] mt-2 leading-relaxed">
                  ✦ Carte altrui: usa come OP → evento si attiva auto<br/>
                  ✦ Carte tue: scegli evento <em>oppure</em> OP
                </p>
              )}
            </div>

            {/* Toggle speciali separate */}
            <div className="p-3 rounded-xl border border-[#1e3a5f] bg-[#050d18]">
              <p className="text-xs font-bold text-[#4a9eff] uppercase tracking-widest mb-2">
                ✦ Carte Speciali
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSpecialMode('mixed')}
                  className="py-2 px-3 rounded-lg font-mono text-xs font-bold transition-all"
                  style={{
                    backgroundColor: specialMode === 'mixed' ? '#22c55e20' : 'transparent',
                    border: `1px solid ${specialMode === 'mixed' ? '#22c55e' : '#1e3a5f'}`,
                    color: specialMode === 'mixed' ? '#22c55e' : '#556677',
                  }}>
                  🃏 Nel mazzo
                  <span className="block text-[9px] font-normal mt-0.5 opacity-70">
                    Mischiate con le base
                  </span>
                </button>
                <button
                  onClick={() => setSpecialMode('separate')}
                  className="py-2 px-3 rounded-lg font-mono text-xs font-bold transition-all"
                  style={{
                    backgroundColor: specialMode === 'separate' ? '#a855f720' : 'transparent',
                    border: `1px solid ${specialMode === 'separate' ? '#a855f7' : '#1e3a5f'}`,
                    color: specialMode === 'separate' ? '#a855f7' : '#556677',
                  }}>
                  ✦ Mazzo separato
                  <span className="block text-[9px] font-normal mt-0.5 opacity-70">
                    Sbloccate da eventi
                  </span>
                </button>
              </div>
              {specialMode === 'separate' && (
                <p className="text-[10px] font-mono text-[#a855f7] mt-2 leading-relaxed">
                  ✦ Le carte speciali (SE_) formano un mazzo a parte<br/>
                  ✦ Gioca come evento una carta con <strong>✦</strong> per pescarne 1<br/>
                  ✦ Trigger Iran: Centrifughe Avanzate, Sito Segreto, Soglia Zero<br/>
                  ✦ Trigger Coal: Stuxnet 2.0, Strike Chirurgico, Op. Freedom
                </p>
              )}
            </div>

            {/* Sezione avvio — visibile solo quando la fazione è scelta */}
            {myFaction ? (
              <div className="rounded-xl border border-[#1e3a5f] bg-[#060d18] p-4 space-y-3">
                <p className="text-[11px] font-mono font-bold text-[#8899aa] uppercase tracking-widest text-center">
                  ✅ Fazione scelta: <span style={{ color: FACTION_INFO[myFaction].color }}>{FACTION_INFO[myFaction].flag} {myFaction}</span>
                </p>
                <p className="text-[10px] font-mono text-[#445566] text-center">
                  Come vuoi procedere?
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {/* Pulsante tavolo pubblico — avvia senza bot, posti vuoti aperti */}
                  <button
                    onClick={() => startGame('pubblico')}
                    disabled={starting}
                    className="w-full py-3 px-4 rounded-xl font-black font-mono tracking-widest text-sm transition-all
                      disabled:opacity-40 disabled:cursor-not-allowed border-2"
                    style={{
                      borderColor: '#22d3ee',
                      color: '#22d3ee',
                      background: starting ? '#22d3ee20' : 'transparent',
                      boxShadow: '0 0 16px #22d3ee30',
                    }}>
                    {starting ? '⏳ AVVIO IN CORSO…' : '🌐 APRI TAVOLO PUBBLICO'}
                  </button>
                  <p className="text-[9px] font-mono text-[#445566] text-center -mt-1">
                    Avvia subito — i posti vuoti restano aperti per altri giocatori dalla lobby
                  </p>

                  {/* Gioca da solo con bot */}
                  <button
                    onClick={() => startGame('solo')}
                    disabled={starting}
                    className="w-full py-3 rounded-xl font-black font-mono tracking-widest text-sm transition-all
                      disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #00ff88, #00cc66)',
                      color: '#0a0e1a',
                      boxShadow: '0 0 24px #00ff8840',
                    }}>
                    {starting ? '⏳ AVVIO IN CORSO…' : '🤖 GIOCA DA SOLO (con bot)'}
                  </button>
                  {/* Aspetta altri giocatori — comportamento diverso per aperto/riservato */}
                  <div className="rounded-xl border bg-[#0a0e1a] overflow-hidden"
                    style={{ borderColor: isPublic ? '#22d3ee44' : '#a78bfa44' }}>
                    <div className="flex items-center gap-2 px-3 py-2"
                      style={{ backgroundColor: isPublic ? '#22d3ee0a' : '#a78bfa0a' }}>
                      <span className="text-base">{isPublic ? '🌐' : '🔒'}</span>
                      <div>
                        <p className="text-[11px] font-mono font-bold"
                          style={{ color: isPublic ? '#22d3ee' : '#a78bfa' }}>
                          {isPublic ? 'Tavolo aperto — visibile a tutti nel lobby' : 'Tavolo riservato — solo con codice'}
                        </p>
                        <p className="text-[9px] font-mono text-[#334455]">
                          {isPublic
                            ? 'Chiunque può entrare dalla lista partite. Puoi anche condividere il codice direttamente.'
                            : 'Solo chi ha il codice può entrare. Condividilo con i tuoi giocatori.'}
                        </p>
                      </div>
                    </div>
                    {/* Codice da condividere */}
                    <div className="flex items-center justify-between px-3 py-2 border-t border-[#1e3a5f]">
                      <div>
                        <p className="text-[9px] font-mono text-[#445566] uppercase tracking-wider mb-0.5">
                          {isPublic ? 'Codice (opzionale)' : 'Codice da condividere'}
                        </p>
                        <p className="text-lg font-black font-mono tracking-[0.15em]"
                          style={{ color: isPublic ? '#22d3ee' : '#a78bfa' }}>
                          {gameCode}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={copyCode}
                          className="px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all"
                          style={{
                            borderColor: copied ? '#00ff88' : '#1e3a5f',
                            color: copied ? '#00ff88' : '#8899aa',
                            background: copied ? '#00ff8810' : 'transparent',
                          }}>
                          {copied ? '✓ Copiato' : '📋 Copia'}
                        </button>
                        {humanPlayers.length > 1 && (
                          <button
                            onClick={() => startGame('solo')}
                            disabled={starting}
                            className="px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all
                              disabled:opacity-40"
                            style={{ background: '#3b82f6', color: '#fff' }}>
                            ▶ Avvia
                          </button>
                        )}
                      </div>
                    </div>
                    {humanPlayers.length === 1 && (
                      <div className="px-3 py-2 border-t border-[#1e3a5f]">
                        <p className="text-[9px] font-mono text-[#334455]">
                          ⏳ {humanPlayers.length} giocatore connesso — il pulsante "Avvia" apparirà quando entrerà almeno un altro giocatore
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-3 text-center text-[11px] font-mono text-[#334455]">
                👆 Scegli prima la tua fazione per avviare
              </div>
            )}
          </div>
        )}

        {!isHost && (
          <div className="text-center text-xs font-mono text-[#334455] py-2">
            ⏳ In attesa che l'host avvii la partita…
          </div>
        )}
      </div>
    </div>
  );
}
