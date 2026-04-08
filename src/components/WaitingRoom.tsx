// =============================================
// LINEA ROSSA — Sala d'attesa multiplayer
// Real-time: ogni giocatore vede chi è entrato
// e che fazione ha scelto. Una fazione per giocatore.
// =============================================
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, supabaseAdmin } from '@/integrations/supabase/client';
import type { Profile, BotDifficulty } from '@/types/game';

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
  // FIX: isMountedRef — previene setState su componente smontato (causa "message channel closed")
  const isMountedRef = useRef(true);
  useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; }; }, []);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  // Modalità mazzo: 'classic' (un mazzo per fazione) o 'unified' (mazzo unico)
  const [gameMode, setGameMode] = useState<'classic' | 'unified'>('classic');
  const [specialMode, setSpecialMode] = useState<'mixed' | 'separate'>('mixed');
  // Modalità setup iniziale territori
  const [setupMode, setSetupMode] = useState<'base' | 'avanzata'>('base');
  // Difficoltà bot
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('normal');
  // Fazioni forzate a bot dall'host (prima dell'avvio)
  const [forcedBotFactions, setForcedBotFactions] = useState<Set<Faction>>(new Set());
  const [showSetup, setShowSetup] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

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

    // Controlla che la fazione non sia già presa (check locale ottimistico)
    const takenLocal = players.find(p =>
      p.faction === faction && p.player_id && p.player_id !== profile.id && !p.is_bot
    );
    if (takenLocal) {
      setError(`⚠️ ${faction} è già presa da ${takenLocal.profile?.username ?? 'un altro giocatore'}`);
      return;
    }

    setLoading(true); setError('');
    pendingOps.current += 1;

    // ── Verifica lato DB (source of truth) prima di procedere ─────────────
    // Evita race condition: due giocatori cliccano la stessa fazione simultaneamente
    const { data: freshPlayers } = await supabase
      .from('game_players')
      .select('faction, player_id, is_bot')
      .eq('game_id', gameId);
    const takenDB = (freshPlayers ?? []).find(
      (p: { faction: string; player_id: string | null; is_bot: boolean }) =>
        p.faction === faction && p.player_id && p.player_id !== profile.id && !p.is_bot
    );
    if (takenDB) {
      setLoading(false);
      pendingOps.current -= 1;
      // Aggiorna lo stato locale con i dati freschi
      await loadPlayers();
      setError(`⚠️ ${faction} è stata appena scelta da un altro giocatore. Scegli un'altra fazione.`);
      return;
    }
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
          bot_difficulty: botDifficulty,
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
      // Fazioni non prese da umani → assegna bot
      // In modalità 'solo': tutte le fazioni libere + quelle forzate dall'host
      // In modalità 'pubblico': solo le fazioni esplicitamente forzate a bot dall'host
      const takenFactions = new Set(players.filter(p => p.player_id).map(p => p.faction));
      if (myFaction) takenFactions.add(myFaction);
      const botFactions = mode === 'solo'
        ? TURN_ORDER.filter(f => !takenFactions.has(f))
        : TURN_ORDER.filter(f => !takenFactions.has(f) && forcedBotFactions.has(f));

      if (botFactions.length > 0) {
        const botRows = botFactions.map(f => ({
          game_id: gameId, faction: f, player_id: null,
          is_bot: true, bot_difficulty: botDifficulty,
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
        nucleare: 1, sanzioni: 3,
        risorse_iran: 5, risorse_coalizione: 5, risorse_russia: 5,
        risorse_cina: 5, risorse_europa: 5,
        stabilita_iran: 5, stabilita_coalizione: 5, stabilita_russia: 5,
        stabilita_cina: 5, stabilita_europa: 5,
        active_faction: 'Iran',
        // turno_corrente RIMOSSO dal baseState — colonna opzionale, gestita in tryUpdate
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
        // ignora: 42703 = colonna mancante, PGRST204 = colonna assente schema cache, 23514 = constraint check
        if (e && e.code !== '42703' && e.code !== 'PGRST204' && e.code !== '23514') console.warn('[startGame] optional update warn:', e);
      };
      await tryUpdate({ turno_corrente: 1 }); // opzionale — ignorato se colonna assente (PGRST204/42703)
      await tryUpdate({ current_turn: 1 });   // alias alternativo — ignorato se colonna assente
      await tryUpdate({ defcon: 10 });
      await tryUpdate({ opinione: 0 });
      await tryUpdate({ forze_militari_iran: 5, forze_militari_coalizione: 5 });
      await tryUpdate({ forze_militari_russia: 5, forze_militari_cina: 5, forze_militari_europa: 5 });
      try {
        const { INITIAL_UNITS } = await import('@/lib/territoriesData');
        await tryUpdate({
          units_iran: INITIAL_UNITS.Iran, units_coalizione: INITIAL_UNITS.Coalizione,
          units_russia: INITIAL_UNITS.Russia, units_cina: INITIAL_UNITS.Cina,
          units_europa: INITIAL_UNITS.Europa,
          special_uses: { veto_russia: 3, hormuz_iran: false, superiorita_aerea: false },
          veto_onu_russia: 3,
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
          .upsert(deckRows, { onConflict: 'game_id,card_id', ignoreDuplicates: false });
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
      // Step 5a — update garantito: solo colonne presenti nel schema base
      const { error: gameErr } = await supabase
        .from('games')
        .update({ status: newStatus, started_at: new Date().toISOString() })
        .eq('id', gameId);
      if (gameErr) throw gameErr;

      // Step 5b — colonne opzionali: allow_join, game_mode, special_mode
      // FIRE-AND-FORGET con catch: dopo step 5a il real-time può già aver triggerato
      // onGameStart e smontato il componente. Queste Promise NON devono bloccare né
      // aggiornare stato locale — altrimenti generano "message channel closed".
      if (mode === 'pubblico') {
        supabase.from('games').update({ allow_join: true }).eq('id', gameId)
          .then(({ error: e }) => {
            if (e && e.code !== '42703' && e.code !== 'PGRST204') console.warn('[startGame] allow_join warn:', e);
          })
          .catch(e => console.warn('[startGame] allow_join fire-and-forget catch:', e));
      }
      supabase.from('games').update({ game_mode: gameMode, special_mode: specialMode }).eq('id', gameId)
        .then(({ error: e }) => {
          if (e && e.code !== '42703' && e.code !== 'PGRST204') console.warn('[startGame] game_mode warn:', e);
        })
        .catch(e => console.warn('[startGame] game_mode fire-and-forget catch:', e));

      // Se modalità "speciali separate": ricrea i mazzi senza le carte speciali,
      // e inserisce le speciali come status='special_locked' (mazzo separato in DB)
      // FIRE-AND-FORGET: dopo games.status=active il componente può essere smontato.
      if (specialMode === 'separate') {
        (async () => {
          try {
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
            let specPos = 1000;
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { error: specErr } = await (supabase.from('cards_deck') as any)
                .upsert(specialRows, { onConflict: 'game_id,card_id', ignoreDuplicates: true });
              if (specErr) console.warn('[startGame] specialRows upsert warn:', specErr);
            }
          } catch (e) {
            console.warn('[startGame] specialRows fire-and-forget catch:', e);
          }
        })();
      }

      // Se mazzo unificato: costruisci mazzo unico al posto dei mazzi separati
      // FIRE-AND-FORGET: dopo games.status=active il componente può essere smontato.
      if (gameMode === 'unified') {
        (async () => {
          try {
            await supabase.from('cards_deck').delete().eq('game_id', gameId);
            const { getUnifiedDeck, UNIFIED_HAND_SIZE } = await import('@/data/mazzi');
            const allPlayers = [...players.filter(p => p.player_id || p.is_bot)];
            const factions = allPlayers.map(p => p.faction) as Faction[];
            const unified = getUnifiedDeck();
            let pos = 1;
            const unifiedRows: object[] = [];
            let cardIdx = 0;
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
            for (; cardIdx < unified.length; cardIdx++) {
              const card = unified[cardIdx];
              unifiedRows.push({
                game_id: gameId, faction: card.faction, owner_faction: card.owner_faction,
                card_id: card.card_id, card_name: card.card_name, card_type: card.card_type,
                op_points: card.op_points, deck_type: card.deck_type,
                status: 'available', held_by_faction: null, position: pos++,
              });
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: unifiedErr } = await (supabase.from('cards_deck') as any)
              .upsert(unifiedRows, { onConflict: 'game_id,card_id', ignoreDuplicates: false });
            if (unifiedErr) console.error('[startGame] unifiedRows upsert err:', unifiedErr);
          } catch (e) {
            console.warn('[startGame] unified fire-and-forget catch:', e);
          }
        })();
      }

      // L'host viene notificato tramite real-time come tutti gli altri
      // (le Promise fire-and-forget sopra continuano in background senza bloccare)
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
      // ✅ Resetta lo stato loading solo se il componente è ancora montato
      // (evita setState su componente smontato dopo il navigate)
      if (isMountedRef.current) {
        setStarting(false);
      }
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
                {isHost && (
                  <button
                    onClick={() => setShowSetup(v => !v)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all"
                    style={{
                      backgroundColor: showSetup ? '#00ff8820' : '#1e3a5f',
                      color: showSetup ? '#00ff88' : '#8899aa',
                      border: `1px solid ${showSetup ? '#00ff8844' : '#2a4a7f'}`,
                    }}>
                    ⚙️ Setup
                  </button>
                )}
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

        {/* ── Tavolo fazioni — stato live ── */}
        <div className="rounded-xl border border-[#1e3a5f] bg-[#0d1424] p-5">
          <h3 className="text-xs font-mono font-bold text-[#8899aa] uppercase tracking-widest mb-1">
            🪑 Tavolo — Fazioni
          </h3>
          <p className="text-[10px] font-mono text-[#334455] mb-3">
            {'Seleziona una fazione libera per sederti al tavolo'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TURN_ORDER.map(faction => {
              const info        = FACTION_INFO[faction];
              const isMine      = myFaction === faction;
              const humanPlayer = players.find(p => p.faction === faction && p.player_id && !p.is_bot);
              const botPlayer   = players.find(p => p.faction === faction && p.is_bot);
              const takenByOtherHuman = !!humanPlayer && !isMine;
              const isBot       = !!botPlayer && !humanPlayer;
              const isFree      = !humanPlayer && !botPlayer && !isMine;

              // Non-host non può selezionare fazioni umane o bot già assegnati dall'host
              const isSelectable = !takenByOtherHuman && !isBot && !isMine;

              let borderColor = '#1e2a3a';
              let bgColor     = '#060a10';
              let labelColor  = '#334455';
              if (isMine)             { borderColor = info.color + '88'; bgColor = info.color + '15'; labelColor = info.color; }
              else if (takenByOtherHuman) { borderColor = info.color + '44'; bgColor = info.color + '08'; labelColor = info.color; }
              else if (isBot)         { borderColor = '#f59e0b44'; bgColor = '#f59e0b08'; labelColor = '#f59e0b'; }
              else if (isFree)        { borderColor = '#1e3a5f';   bgColor = '#060d18';   labelColor = '#c0cce0'; }

              return (
                <button
                  key={faction}
                  disabled={!isSelectable || loading}
                  onClick={() => isSelectable && !loading && chooseFaction(faction)}
                  className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all group"
                  style={{
                    borderColor,
                    background: bgColor,
                    boxShadow: isMine ? `0 0 14px ${info.color}30` : 'none',
                    cursor: !isSelectable ? 'default' : 'pointer',
                    opacity: (takenByOtherHuman || isBot) && !isMine ? 0.75 : 1,
                  }}>
                  <span className="text-2xl">{info.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-sm" style={{ color: labelColor }}>{faction}</span>
                      {isMine && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00ff8820] text-[#00ff88]">✓ TU</span>}
                      {takenByOtherHuman && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: info.color + '20', color: info.color }}>👤 {humanPlayer!.profile?.username ?? 'umano'}</span>}
                      {isBot && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#f59e0b20] text-[#f59e0b]">🤖 BOT</span>}
                      {isFree && !isHost && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#4a9eff20] text-[#4a9eff]">⬡ LIBERA — clicca per sederti</span>}
                      {isFree && isHost && <span className="text-[9px] font-mono text-[#334455]">⏳ libera</span>}
                    </div>
                    <p className="text-[10px] font-mono truncate mt-0.5" style={{ color: '#445566' }}>
                      {isMine ? <span className="group-hover:hidden">{info.desc}</span> : info.desc}
                      {isMine && <span className="hidden group-hover:inline text-[#ff6666]">Clicca un'altra fazione per cambiare</span>}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {/* Messaggio non-host senza fazione */}
          {!isHost && !myFaction && (
            <p className="text-[10px] font-mono text-[#4a9eff] mt-3 text-center">
              👆 Clicca su una fazione <span className="text-[#4a9eff] font-bold">LIBERA</span> per sederti al tavolo
            </p>
          )}
          {!isHost && myFaction && (
            <p className="text-[10px] font-mono text-[#00ff88] mt-3 text-center">
              ✓ Sei seduto come <strong>{myFaction}</strong> — in attesa che l'host avvii la partita
            </p>
          )}
        </div>

        {/* ── Errori ── */}
        {error && (
          <div className="px-4 py-3 rounded-lg border border-[#ff4444] bg-[#ff000010] text-[#ff6666] text-xs font-mono">
            ⚠️ {error}
          </div>
        )}

        {/* ── Pannello Setup (solo host, solo se showSetup) ── */}
        {isHost && showSetup && (
              <div className="rounded-xl border-2 border-[#00ff8844] bg-[#060d18] p-4 space-y-4">
                <p className="text-sm font-mono font-bold text-[#00ff88]">⚙️ Setup Partita</p>

                {/* Step 1: scegli fazione */}
                {!myFaction && (
                  <div className="rounded-lg border border-[#f59e0b44] bg-[#f59e0b08] p-3">
                    <p className="text-[10px] font-mono text-[#f59e0b] font-bold mb-2">1️⃣ Prima scegli la tua fazione</p>
                    <p className="text-[9px] font-mono text-[#556677]">Chiudi il Setup e clicca su una fazione libera per sederti</p>
                  </div>
                )}

                {/* Step 2: assegna bot alle fazioni libere */}
                <div>
                  <p className="text-[10px] font-mono text-[#8899aa] font-bold uppercase tracking-widest mb-2">
                    {myFaction ? '1️⃣' : '2️⃣'} Assegna Bot alle Fazioni Libere
                  </p>
                  <div className="space-y-1.5">
                    {TURN_ORDER.map(f => {
                      const info = FACTION_INFO[f];
                      const humanP = players.find(p => p.faction === f && p.player_id && !p.is_bot);
                      const isMe = f === myFaction;
                      const isForced = forcedBotFactions.has(f);
                      if (humanP || isMe) {
                        return (
                          <div key={f} className="flex items-center justify-between px-3 py-2 rounded-lg border"
                            style={{ borderColor: info.color + '33', backgroundColor: info.color + '08' }}>
                            <div className="flex items-center gap-2">
                              <span>{info.flag}</span>
                              <span className="font-mono text-xs font-bold" style={{ color: info.color }}>{f}</span>
                            </div>
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: info.color + '20', color: info.color }}>
                              {isMe ? '👤 TU' : `👤 ${humanP!.profile?.username ?? 'umano'}`}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <button key={f}
                          onClick={() => setForcedBotFactions(prev => {
                            const next = new Set(prev);
                            if (next.has(f)) next.delete(f); else next.add(f);
                            return next;
                          })}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all"
                          style={{
                            borderColor: isForced ? '#f59e0b88' : '#1e3a5f',
                            backgroundColor: isForced ? '#f59e0b12' : '#060a10',
                          }}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{info.flag}</span>
                            <span className="font-mono text-xs font-bold" style={{ color: isForced ? '#f59e0b' : '#8899aa' }}>{f}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg"
                            style={{ backgroundColor: isForced ? '#f59e0b' : '#1e2a3a', color: isForced ? '#0a0e1a' : '#445566' }}>
                            {isForced ? '🤖 BOT — clicca per rimuovere' : '⏳ libera — clicca per BOT'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Scorciatoie */}
                  {(() => {
                    const free = TURN_ORDER.filter(f => !players.find(p => p.faction === f && p.player_id && !p.is_bot) && f !== myFaction) as Faction[];
                    if (free.length < 2) return null;
                    return (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setForcedBotFactions(new Set(free))}
                          className="flex-1 text-[9px] font-mono py-1.5 rounded border border-[#f59e0b44] text-[#f59e0b] hover:bg-[#f59e0b12] transition-all">
                          🤖 Bot a tutte le libere
                        </button>
                        <button onClick={() => setForcedBotFactions(new Set())}
                          className="flex-1 text-[9px] font-mono py-1.5 rounded border border-[#1e3a5f] text-[#445566] hover:border-[#ef444444] hover:text-[#ef4444] transition-all">
                          ✕ Rimuovi tutti i bot
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Riepilogo */}
                <div className="flex gap-3 text-[10px] font-mono justify-center py-1">
                  <span className="text-[#00ff88]">👤 {players.filter(p => p.player_id && !p.is_bot).length} umani</span>
                  <span className="text-[#f59e0b]">🤖 {forcedBotFactions.size} bot</span>
                  <span className="text-[#445566]">⏳ {5 - players.filter(p => p.player_id && !p.is_bot).length - forcedBotFactions.size} libere</span>
                </div>

                {/* Bottone avvia */}
                <button
                  onClick={() => startGame('pubblico')}
                  disabled={starting || !myFaction}
                  className="w-full py-4 rounded-xl font-black font-mono tracking-widest text-base transition-all disabled:cursor-not-allowed"
                  style={{
                    background: (!myFaction || starting) ? '#1e2a3a' : 'linear-gradient(135deg,#00ff88,#00cc66)',
                    color: !myFaction ? '#556677' : '#0a0e1a',
                    boxShadow: myFaction && !starting ? '0 0 32px #00ff8850' : 'none',
                  }}>
                  {starting ? '⏳ AVVIO IN CORSO…' : !myFaction ? '⚠️ Prima scegli la tua fazione' : '▶ AVVIA PARTITA'}
                </button>
                <p className="text-[9px] font-mono text-[#334455] text-center">
                  🤖 BOT = gestita dall'IA · ⏳ libera = posto aperto per altri giocatori
                </p>

                {/* Opzioni avanzate collassabili */}
                <div className="rounded-xl border border-[#1e3a5f] bg-[#050d18]">
                  <button onClick={() => setShowAdvanced(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3">
                    <span className="text-[10px] font-mono font-bold text-[#556677] uppercase tracking-widest">
                      ⚙️ Opzioni Avanzate (mazzo, setup, difficoltà)
                    </span>
                    <span className="text-[#445566] font-mono">{showAdvanced ? '▲' : '▼'}</span>
                  </button>
                  {showAdvanced && (
                <div className="px-3 pb-3 space-y-3 border-t border-[#1e2a3a] pt-3">

                  {/* Selettore difficoltà bot */}
                  <div className="p-3 rounded-xl border border-[#1e3a5f] bg-[#060e1a]">
                    <p className="text-[10px] font-mono font-bold text-[#8899aa] uppercase tracking-widest mb-2">
                      🤖 Difficoltà Bot
                    </p>
                    <div className="flex gap-2">
                      {(['easy', 'normal', 'hard'] as const).map(d => (
                        <button
                          key={d}
                          onClick={() => setBotDifficulty(d)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex-1 ${
                            botDifficulty === d
                              ? d === 'easy' ? 'bg-green-900 border-green-500 text-green-300'
                                : d === 'normal' ? 'bg-yellow-900 border-yellow-500 text-yellow-300'
                                : 'bg-red-900 border-red-500 text-red-300'
                              : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400'
                          }`}
                        >
                          {d === 'easy' ? '🟢 Facile' : d === 'normal' ? '🟡 Normale' : '🔴 Difficile'}
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] font-mono text-[#445566] mt-1.5">
                      {botDifficulty === 'easy' ? '⬡ Bot gioca casualmente' : botDifficulty === 'normal' ? '⬡ Bot strategico bilanciato' : '⬡ Bot massimizza la propria strategia'}
                    </p>
                  </div>

                  {/* Toggle modalità setup territori */}
                  <div className="p-3 rounded-xl border border-[#1e3a5f] bg-[#060e1a]">
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
                        📣 AVANZATA
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
                  <div className="p-3 rounded-xl border border-[#1e3a5f] bg-[#060e1a]">
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
                  <div className="p-3 rounded-xl border border-[#1e3a5f] bg-[#060e1a]">
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

                </div>
              )}
                </div>

                {/* Codice partita */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-[#1e2a3a] bg-[#0a0e1a]">
                  <div>
                    <p className="text-[9px] font-mono text-[#334455] uppercase">Codice partita</p>
                    <p className="text-base font-black font-mono text-[#22d3ee] tracking-widest">{gameCode}</p>
                  </div>
                  <button onClick={copyCode}
                    className="px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all"
                    style={{ borderColor: copied ? '#00ff88' : '#1e3a5f', color: copied ? '#00ff88' : '#8899aa' }}>
                    {copied ? '✓ Copiato' : '📋 Copia'}
                  </button>
                </div>
              </div>
        )}


        {!isHost && (
          <div className="rounded-xl border border-[#1e3a5f] bg-[#0d1424] px-4 py-3 text-center space-y-1">
            <p className="text-xs font-mono text-[#445566]">
              {myFaction
                ? `✓ Sei al tavolo come ${myFaction} — attendi che l'host lanci la partita`
                : '👆 Seleziona una fazione libera per unirti al tavolo'}
            </p>
            <p className="text-[9px] font-mono text-[#334455]">
              La partita inizierà quando l'host clicca "▶ AVVIA PARTITA"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
