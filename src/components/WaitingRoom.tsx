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
  gameName: string;
  profile: Profile;
  isHost: boolean;                          // chi ha creato la partita
  onGameStart: (faction: string | null) => void; // callback quando status → active
  onLeave: () => void;
}

export default function WaitingRoom({
  gameId, gameCode, gameName, profile, isHost, onGameStart, onLeave,
}: WaitingRoomProps) {
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [myFaction, setMyFaction] = useState<Faction | null>(null);
  const myFactionRef = useRef<Faction | null>(null); // ref sempre aggiornato — evita stale closure
  const isSwitchingFaction = useRef(false); // guard: evita reset durante cambio fazione
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
      // Recupera la fazione che ho già scelto (sync con DB)
      const me = data.find((p: LobbyPlayer) => p.player_id === profile.id);
      if (me?.faction) {
        // Il giocatore ha una fazione nel DB → aggiorna stato
        setMyFaction(me.faction as Faction);
        myFactionRef.current = me.faction as Faction;
      } else if (!isSwitchingFaction.current) {
        // Nessuna fazione nel DB (me assente o faction=null) → deseleziono
        // Copre sia il caso in cui non sono nella lista, sia il caso faction=null
        setMyFaction(null);
        myFactionRef.current = null;
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
        if (payload.new?.status === 'active') onGameStart(myFactionRef.current);
      })
      .subscribe();

    return () => {
      playersCh.unsubscribe();
      gameCh.unsubscribe();
    };
  }, [gameId, loadPlayers, onGameStart]);

  // ── Scelta fazione ────────────────────────────────────────────────
  const chooseFaction = async (faction: Faction) => {
    // Se già selezionata → deseleziona
    if (myFaction === faction) {
      setLoading(true); setError('');
      isSwitchingFaction.current = true; // ← FIX: blocca il real-time anche durante la deselezione
      try {
        await supabase
          .from('game_players')
          .delete()
          .eq('game_id', gameId)
          .eq('player_id', profile.id);
        setMyFaction(null);
        myFactionRef.current = null;
      } catch { setError('Errore nella deselezione'); }
      finally {
        isSwitchingFaction.current = false; // riabilita
        setLoading(false);
      }
      return;
    }

    // Controlla che la fazione non sia già presa da un altro umano
    const taken = players.find(p => p.faction === faction && p.player_id && p.player_id !== profile.id);
    if (taken) { setError(`${faction} è già presa da un altro giocatore`); return; }

    setLoading(true); setError('');
    isSwitchingFaction.current = true;
    try {
      // 1. Rimuove l'eventuale scelta precedente del giocatore (qualsiasi fazione)
      await supabase
        .from('game_players')
        .delete()
        .eq('game_id', gameId)
        .eq('player_id', profile.id);

      // 2. Rimuove QUALSIASI riga per quella fazione che non appartenga
      //    ad un altro umano reale: copre bot (player_id null), placeholder
      //    e righe stale di chi ha appena lasciato.
      //    La condizione .or rimuove: player_id IS NULL  oppure  player_id = me
      //    (me è già stato rimosso al passo 1, ma il secondo branch è innocuo)
      await supabase
        .from('game_players')
        .delete()
        .eq('game_id', gameId)
        .eq('faction', faction)
        .or(`player_id.is.null,player_id.eq.${profile.id}`);

      // 3. Insert diretto — il slot è ora garantito libero
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
          // C'è ancora una riga con un altro player_id reale → qualcuno l'ha presa nel frattempo
          setError(`${faction} è stata appena presa da un altro giocatore`);
          await loadPlayers(); // aggiorna la lista
        } else {
          throw insErr;
        }
      } else {
        setMyFaction(faction);
        myFactionRef.current = faction;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore nella scelta');
    } finally {
      isSwitchingFaction.current = false;
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
        nucleare: 1, sanzioni: 5, opinione: 0, defcon: 5,
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
      // Inizializza territori (stesso schema usato da onlineGameStore: territories + territory + inf_*)
      const { TERRITORIES } = await import('@/lib/territoriesData');
      const terrRows = TERRITORIES.map(t => ({
        game_id: gameId,
        territory: t.id,
        inf_iran:       0,
        inf_coalizione: 0,
        inf_russia:     0,
        inf_cina:       0,
        inf_europa:     0,
      }));
      const { error: terrErr } = await supabase
        .from('territories')
        .upsert(terrRows, { onConflict: 'game_id,territory' });
      if (terrErr) { console.error('[startGame] territori err:', terrErr); throw terrErr; }
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
  const takenFactions = new Set(
    players.filter(p => p.player_id && !p.is_bot).map(p => p.faction)
  );

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">

        {/* ── Header partita ── */}
        <div className="rounded-xl border border-[#1e3a5f] bg-[#0d1424] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-black font-mono text-white tracking-widest">{gameName}</h2>
              <p className="text-xs font-mono text-[#445566] mt-1">
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
              <p className="text-[10px] font-mono text-[#445566] uppercase tracking-widest mb-1">Codice partita da condividere</p>
              <p className="text-2xl font-black font-mono text-[#00ff88] tracking-[0.2em]">{gameCode}</p>
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
                  className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                  style={{
                    borderColor: isMine ? info.color : takenByOther ? '#1e2a3a' : '#1e3a5f',
                    background: isMine ? info.color + '15' : takenByOther ? '#060a10' : '#060d18',
                    opacity: takenByOther ? 0.45 : 1,
                    boxShadow: isMine ? `0 0 16px ${info.color}30` : 'none',
                    cursor: takenByOther ? 'not-allowed' : 'pointer',
                  }}>
                  <span className="text-2xl">{info.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm" style={{ color: isMine ? info.color : takenByOther ? '#334455' : '#c0cce0' }}>
                        {faction}
                      </span>
                      {isMine && (
                        <span className="text-[10px] font-mono bg-[#00ff8820] text-[#00ff88] px-1.5 rounded">✓ TU</span>
                      )}
                      {takenByOther && (
                        <span className="text-[10px] font-mono text-[#334455]">
                          🔒 {takerPlayer?.profile?.username ?? 'preso'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono truncate" style={{ color: takenByOther ? '#223' : '#445566' }}>
                      {info.desc}
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

            <button
              onClick={startGame}
              disabled={starting || !myFaction}
              className="w-full py-4 rounded-xl font-black font-mono tracking-widest text-sm transition-all
                disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: myFaction ? 'linear-gradient(135deg, #00ff88, #00cc66)' : '#1e3a5f',
                color: myFaction ? '#0a0e1a' : '#334455',
                boxShadow: myFaction ? '0 0 30px #00ff8840' : 'none',
              }}>
              {starting ? '⏳ AVVIO IN CORSO…' : myFaction ? '▶ AVVIA PARTITA' : 'SCEGLI LA TUA FAZIONE PER AVVIARE'}
            </button>
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
