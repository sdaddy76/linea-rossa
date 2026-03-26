
-- =============================================
-- LINEA ROSSA — Schema Database Multiplayer
-- =============================================

-- Profili utente (estende auth.users di Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_color TEXT DEFAULT '#00ff88',
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partite
CREATE TABLE IF NOT EXISTS public.games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,           -- codice sala es. "ALFA-7"
  name TEXT NOT NULL,
  status TEXT DEFAULT 'lobby'          -- lobby | active | finished
    CHECK (status IN ('lobby','active','finished')),
  current_turn INTEGER DEFAULT 1,
  max_turns INTEGER DEFAULT 20,
  winner_faction TEXT,
  winner_condition TEXT,               -- 'breakout' | 'collasso' | 'defcon' | 'turni'
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

-- Giocatori per partita (umano o bot per ogni fazione)
CREATE TABLE IF NOT EXISTS public.game_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  faction TEXT NOT NULL
    CHECK (faction IN ('Iran','Coalizione','Russia','Cina','Europa')),
  player_id UUID REFERENCES public.profiles(id),   -- NULL se bot
  is_bot BOOLEAN DEFAULT FALSE,
  bot_difficulty TEXT DEFAULT 'normal'             -- easy | normal | hard
    CHECK (bot_difficulty IN ('easy','normal','hard')),
  turn_order INTEGER NOT NULL,
  is_ready BOOLEAN DEFAULT FALSE,
  UNIQUE (game_id, faction)
);

-- Stato globale tracciati per partita (aggiornato in real-time)
CREATE TABLE IF NOT EXISTS public.game_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE UNIQUE,
  -- Tracciati globali
  nucleare INTEGER DEFAULT 1 CHECK (nucleare BETWEEN 1 AND 15),
  sanzioni INTEGER DEFAULT 5 CHECK (sanzioni BETWEEN 1 AND 10),
  opinione INTEGER DEFAULT 0 CHECK (opinione BETWEEN -10 AND 10),
  defcon INTEGER DEFAULT 5 CHECK (defcon BETWEEN 1 AND 5),
  -- Risorse per fazione
  risorse_iran INTEGER DEFAULT 5 CHECK (risorse_iran BETWEEN 1 AND 10),
  risorse_coalizione INTEGER DEFAULT 5 CHECK (risorse_coalizione BETWEEN 1 AND 10),
  risorse_russia INTEGER DEFAULT 5 CHECK (risorse_russia BETWEEN 1 AND 10),
  risorse_cina INTEGER DEFAULT 5 CHECK (risorse_cina BETWEEN 1 AND 10),
  risorse_europa INTEGER DEFAULT 5 CHECK (risorse_europa BETWEEN 1 AND 10),
  -- Stabilità per fazione
  stabilita_iran INTEGER DEFAULT 5 CHECK (stabilita_iran BETWEEN 1 AND 10),
  stabilita_coalizione INTEGER DEFAULT 5 CHECK (stabilita_coalizione BETWEEN 1 AND 10),
  stabilita_russia INTEGER DEFAULT 5 CHECK (stabilita_russia BETWEEN 1 AND 10),
  stabilita_cina INTEGER DEFAULT 5 CHECK (stabilita_cina BETWEEN 1 AND 10),
  stabilita_europa INTEGER DEFAULT 5 CHECK (stabilita_europa BETWEEN 1 AND 10),
  -- Fazione di turno corrente
  active_faction TEXT DEFAULT 'Iran'
    CHECK (active_faction IN ('Iran','Coalizione','Russia','Cina','Europa')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mazzi carte per partita (ogni fazione ha il proprio mazzo mescolato)
CREATE TABLE IF NOT EXISTS public.cards_deck (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  faction TEXT NOT NULL
    CHECK (faction IN ('Iran','Coalizione','Russia','Cina','Europa','Neutrale')),
  card_id TEXT NOT NULL,       -- es. "C025", "E001"
  card_name TEXT NOT NULL,
  card_type TEXT NOT NULL,     -- Militare | Diplomatico | Economico | Segreto | Media | Evento
  op_points INTEGER DEFAULT 1,
  deck_type TEXT DEFAULT 'base'  -- base | speciale (Iran/Coalizione hanno entrambi)
    CHECK (deck_type IN ('base','speciale')),
  status TEXT DEFAULT 'available'
    CHECK (status IN ('available','in_hand','played','discarded')),
  held_by_faction TEXT,        -- fazione che ha la carta in mano
  played_at_turn INTEGER,
  position INTEGER NOT NULL,   -- posizione nel mazzo (ordine shuffle)
  UNIQUE (game_id, card_id)
);

-- Log delle mosse per turno
CREATE TABLE IF NOT EXISTS public.moves_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  faction TEXT NOT NULL
    CHECK (faction IN ('Iran','Coalizione','Russia','Cina','Europa')),
  player_id UUID REFERENCES public.profiles(id),  -- NULL se bot
  is_bot_move BOOLEAN DEFAULT FALSE,
  card_id TEXT NOT NULL,
  card_name TEXT NOT NULL,
  card_type TEXT NOT NULL,
  -- Effetti applicati (delta valori tracciati)
  delta_nucleare INTEGER DEFAULT 0,
  delta_sanzioni INTEGER DEFAULT 0,
  delta_opinione INTEGER DEFAULT 0,
  delta_defcon INTEGER DEFAULT 0,
  delta_risorse INTEGER DEFAULT 0,
  delta_stabilita INTEGER DEFAULT 0,
  -- Stato tracciati DOPO la mossa
  stato_nucleare INTEGER,
  stato_sanzioni INTEGER,
  stato_opinione INTEGER,
  stato_defcon INTEGER,
  -- Metadati
  description TEXT,
  bot_reason TEXT,             -- perché il bot ha scelto questa carta
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards_deck ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moves_log ENABLE ROW LEVEL SECURITY;

-- Profiles: ogni utente vede tutti, modifica solo il proprio
CREATE POLICY "Profiles visibili a tutti" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profilo modificabile dal proprietario" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profilo creabile al signup" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Games: visibili a tutti, modificabili da chi è nella partita
CREATE POLICY "Partite visibili a tutti" ON public.games FOR SELECT USING (true);
CREATE POLICY "Partita creabile da utenti autenticati" ON public.games FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Partita modificabile da partecipanti" ON public.games FOR UPDATE USING (
  auth.uid() IN (SELECT player_id FROM public.game_players WHERE game_id = id AND player_id IS NOT NULL)
  OR auth.uid() = created_by
);

-- Game players: visibili a tutti
CREATE POLICY "Giocatori visibili a tutti" ON public.game_players FOR SELECT USING (true);
CREATE POLICY "Giocatori inseribili da autenticati" ON public.game_players FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Giocatori modificabili da partecipanti" ON public.game_players FOR UPDATE USING (
  auth.uid() = player_id OR auth.uid() IN (
    SELECT player_id FROM public.game_players gp2 WHERE gp2.game_id = game_id AND gp2.player_id IS NOT NULL
  )
);

-- Game state: visibile a tutti, modificabile da partecipanti
CREATE POLICY "Stato visibile a tutti" ON public.game_state FOR SELECT USING (true);
CREATE POLICY "Stato inseribile da autenticati" ON public.game_state FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Stato modificabile da partecipanti" ON public.game_state FOR UPDATE USING (
  auth.uid() IN (SELECT player_id FROM public.game_players WHERE game_id = game_id AND player_id IS NOT NULL)
);

-- Cards deck: visibile a tutti
CREATE POLICY "Mazzo visibile a tutti" ON public.cards_deck FOR SELECT USING (true);
CREATE POLICY "Mazzo inseribile da autenticati" ON public.cards_deck FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Mazzo modificabile da partecipanti" ON public.cards_deck FOR UPDATE USING (
  auth.uid() IN (SELECT player_id FROM public.game_players WHERE game_id = game_id AND player_id IS NOT NULL)
);

-- Moves log: visibile a tutti, inseribile da partecipanti
CREATE POLICY "Log visibile a tutti" ON public.moves_log FOR SELECT USING (true);
CREATE POLICY "Log inseribile da autenticati" ON public.moves_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- FUNZIONI HELPER
-- =============================================

-- Trigger: crea profilo automaticamente al signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Funzione: genera codice partita univoco (es. "GULF-42")
CREATE OR REPLACE FUNCTION public.generate_game_code()
RETURNS TEXT AS $$
DECLARE
  prefixes TEXT[] := ARRAY['GULF','IRAN','ATOM','NUKE','HAWK','DOVE','SAND','SILK','BRIC','NATO'];
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := prefixes[floor(random() * array_length(prefixes,1) + 1)] || '-' || floor(random()*90+10)::TEXT;
    SELECT EXISTS(SELECT 1 FROM public.games WHERE games.code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Funzione: aggiorna updated_at su game_state
CREATE OR REPLACE FUNCTION public.update_game_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_state_ts
  BEFORE UPDATE ON public.game_state
  FOR EACH ROW EXECUTE FUNCTION public.update_game_state_timestamp();

-- =============================================
-- REALTIME: abilita per tabelle chiave
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.moves_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
