// =============================================
// LINEA ROSSA — Sala d'attesa multiplayer
// Real-time: ogni giocatore vede chi è entrato
// e che fazione ha scelto. Una fazione per giocatore.
// =============================================
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

  // ── Carica giocatori correnti ─────────────────────────────────────
  const loadPlayers = useCallback(async () => {
    const { data } = await supabase
      .from('game_players')
      .select('*, profile:profiles(username)')
      .eq('game_id', gameId)
      .order('turn_order');
    if (data) {
      setPlayers(data as LobbyPlayer[]);
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
      await supabase
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
  const chooseFaction = async (faction: Faction) => {
    // Se già selezionata → deseleziona
    if (myFaction === faction) {
      setLoading(true); setError('');
      pendingOps.current += 1;          // blocca loadPlayers dal sovrascrivere
      setMyFaction(null);               // aggiornamento ottimistico immediato
      myFactionRef.current = null;
      try {
        const { error: delErr } = await supabase
          .from('game_players')
          .delete()
          .eq('game_id', gameId)
          .eq('player_id', profile.id);
        if (delErr) throw delErr;
        // Delete confermato dal DB: ora forza la lettura dello stato corretto
        await loadPlayers();
      } catch {
        // Rollback UI se il delete fallisce
        setMyFaction(faction);
        myFactionRef.current = faction;
        setError('Errore nella deselezione');
      } finally {
        pendingOps.current -= 1;        // sblocca loadPlayers
        setLoading(false);
      }
      return;
    }

    // Controlla che la fazione non sia già presa da un altro umano
    const taken = players.find(p => p.faction === faction && p.player_id && p.player_id !== profile.id);
    if (taken) { setError(`${faction} è già presa da un altro giocatore`); return; }

    setLoading(true); setError('');
    pendingOps.current += 1;            // blocca loadPlayers dal sovrascrivere
    const prevFaction = myFaction;
    setMyFaction(faction);              // aggiornamento ottimistico immediato
    myFactionRef.current = faction;
    try {
      // 1. Rimuove la scelta precedente del giocatore
      await supabase
        .from('game_players')
        .delete()
        .eq('game_id', gameId)
        .eq('player_id', profile.id);

      // 2. Pulisce righe stale della fazione target (bot/placeholder/chi ha lasciato)
      await supabase
        .from('game_players')
        .delete()
        .eq('game_id', gameId)
        .eq('faction', faction)
        .or(`player_id.is.null,player_id.eq.${profile.id}`);

      // 3. Insert diretto — slot garantito libero
      const { error: insErr } = await supabase
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
        if (insErr.code === '23505') {
          // Rollback: un altro giocatore ha preso la fazione nel frattempo
          setMyFaction(prevFaction);
          myFactionRef.current = prevFaction;
          setError(`${faction} è stata appena presa da un altro giocatore`);
          await loadPlayers();
        } else {
          throw insErr;
        }
      }
    } catch (err: unknown) {
      // Rollback UI
      setMyFaction(prevFaction);
      myFactionRef.current = prevFaction;
      setError(err instanceof Error ? err.message : 'Errore nella scelta');
    } finally {
      pendingOps.current -= 1;          // sblocca loadPlayers
      setLoading(false);
    }
  };

  // ── Avvia partita (solo host) ─────────────────────────────────────
  const startGame = async () => {
    if (!myFaction) { setError('Scegli prima la tua fazione'); return; }

    // Umani = chi ha player_id (includo me anche se il real-time non ha ancora aggiornato)
    const humanPlayers = players.filter(p => p.player_id && !p.is_bot);
    const humanCount = myFaction ? Math.max(humanPlayers.length, 1) : humanPlayers.length;
    if (humanCount === 0) { setError('Scegli prima la tua fazione'); return; }

    setStarting(true); setError('');
    try {
      console.log('[startGame] step 1 — inserimento bot');
      // Fazioni non prese da umani → assegna bot
      const takenFactions = new Set(players.filter(p => p.player_id).map(p => p.faction));
      if (myFaction) takenFactions.add(myFaction);
      const botFactions = TURN_ORDER.filter(f => !takenFactions.has(f));

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
        nucleare: 1, sanzioni: 5, opinione: 0, defcon: 10,
        risorse_iran: 5, risorse_coalizione: 5, risorse_russia: 5,
        risorse_cina: 5, risorse_europa: 5,
        stabilita_iran: 5, stabilita_coalizione: 5, stabilita_russia: 5,
        stabilita_cina: 5, stabilita_europa: 5,
        active_faction: 'Iran',
      };
      const { error: stateErr } = await supabase.from('game_state').upsert(
        baseState, { onConflict: 'game_id' }
      );
      if (stateErr) { console.error('[startGame] game_state upsert err:', stateErr); throw stateErr; }

      // ── Colonne opzionali (aggiunte da migration separate) ──
      // Ogni update è indipendente: se la colonna non esiste Supabase restituisce
      // error.code='42703' — lo ignoriamo, non blocchiamo l'avvio.
      const tryUpdate = async (data: Record<string, unknown>) => {
        const { error: e } = await supabase.from('game_state').update(data).eq('game_id', gameId);
        if (e && e.code !== '42703') console.warn('[startGame] optional update warn:', e);
      };
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
      } catch (e) {
        console.warn('[startGame] territori skip:', e);
      }
      console.log('[startGame] step 5 — aggiorna games.status');

      // Cambia status → active (triggera real-time su tutti i client)
      const { error: gameErr } = await supabase
        .from('games')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('id', gameId);
      if (gameErr) throw gameErr;

      // Prova a salvare game_mode (richiede migration add_unified_deck_columns.sql)
      // Non blocca l'avvio se la colonna non esiste ancora
      try {
        await supabase.from('games').update({ game_mode: gameMode }).eq('id', gameId);
      } catch { /* colonna game_mode non presente — la migration non è stata eseguita */ }

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
                  title={isMine ? `Clicca per deselezionare ${faction}` : takenByOther ? `${faction} è già presa` : `Scegli ${faction}`}
                  className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all group"
                  style={{
                    borderColor: isMine ? info.color : takenByOther ? '#1e2a3a' : '#1e3a5f',
                    background: isMine ? info.color + '15' : takenByOther ? '#060a10' : '#060d18',
                    opacity: takenByOther ? 0.45 : 1,
                    boxShadow: isMine ? `0 0 16px ${info.color}30` : 'none',
                    cursor: takenByOther ? 'not-allowed' : 'pointer',
                  }}>
                  {/* Icona: mostra ✕ su hover se è la fazione selezionata dal giocatore */}
                  <span className="text-2xl transition-all">
                    {isMine ? (
                      <span className="relative inline-block">
                        <span className="group-hover:opacity-0 transition-opacity">{info.flag}</span>
                        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-base font-black"
                          style={{ color: info.color }}>✕</span>
                      </span>
                    ) : info.flag}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm" style={{ color: isMine ? info.color : takenByOther ? '#334455' : '#c0cce0' }}>
                        {faction}
                      </span>
                      {isMine && (
                        <>
                          <span className="text-[10px] font-mono bg-[#00ff8820] text-[#00ff88] px-1.5 rounded group-hover:hidden">✓ TU</span>
                          <span className="text-[10px] font-mono bg-[#ff444420] text-[#ff6666] px-1.5 rounded hidden group-hover:inline">✕ Deseleziona</span>
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
                  {/* Gioca da solo con bot */}
                  <button
                    onClick={startGame}
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
                            onClick={startGame}
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
