-- =============================================
-- LINEA ROSSA — Tabella Obiettivi Segreti
-- =============================================

CREATE TABLE IF NOT EXISTS public.objectives (
  id              SERIAL PRIMARY KEY,
  obj_id          TEXT NOT NULL UNIQUE,          -- es. 'OBJ_IRAN_01'
  faction         TEXT NOT NULL,                 -- Iran | Coalizione Occidentale | Russia | Cina | Unione Europea | Neutrale
  nome            TEXT NOT NULL,
  descrizione     TEXT NOT NULL,
  punti           INTEGER NOT NULL DEFAULT 5,

  -- Condizioni verificabili (opzionali — per condizione automatica futura)
  condizione_tipo TEXT,                          -- 'tracciato' | 'territorio' | 'carta' | 'manuale'
  condizione_campo TEXT,                         -- es. 'nucleare', 'sanzioni', 'defcon'
  condizione_op   TEXT,                          -- '>=' | '<=' | '==' | 'controllo'
  condizione_valore INTEGER,                     -- valore soglia
  condizione_note TEXT,                          -- descrizione testuale per verifica manuale

  -- Metadati
  difficolta      TEXT DEFAULT 'media'           -- facile | media | difficile
    CHECK (difficolta IN ('facile', 'media', 'difficile')),
  attivo          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indici utili
CREATE INDEX IF NOT EXISTS idx_objectives_faction ON public.objectives (faction);
CREATE INDEX IF NOT EXISTS idx_objectives_attivo  ON public.objectives (attivo);

-- RLS
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "objectives_select_all" ON public.objectives
  FOR SELECT USING (true);
CREATE POLICY "objectives_insert_auth" ON public.objectives
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "objectives_update_auth" ON public.objectives
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "objectives_delete_auth" ON public.objectives
  FOR DELETE USING (auth.role() = 'authenticated');

-- Tabella assegnazioni obiettivi per partita
CREATE TABLE IF NOT EXISTS public.game_objectives (
  id          SERIAL PRIMARY KEY,
  game_id     UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  faction     TEXT NOT NULL,
  obj_id      TEXT NOT NULL REFERENCES public.objectives(obj_id) ON DELETE CASCADE,
  completato  BOOLEAN DEFAULT false,
  turno_completato INTEGER,
  rivelato    BOOLEAN DEFAULT false,            -- l'obiettivo è stato rivelato agli altri giocatori
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (game_id, faction, obj_id)
);

CREATE INDEX IF NOT EXISTS idx_game_objectives_game ON public.game_objectives (game_id);
CREATE INDEX IF NOT EXISTS idx_game_objectives_faction ON public.game_objectives (game_id, faction);

ALTER TABLE public.game_objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "game_objectives_select" ON public.game_objectives
  FOR SELECT USING (true);
CREATE POLICY "game_objectives_insert_auth" ON public.game_objectives
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "game_objectives_update_auth" ON public.game_objectives
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "game_objectives_delete_auth" ON public.game_objectives
  FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- Dati iniziali — 15 Obiettivi Segreti
-- =============================================

INSERT INTO public.objectives (obj_id, faction, nome, descrizione, punti, condizione_tipo, condizione_campo, condizione_op, condizione_valore, condizione_note, difficolta) VALUES

-- IRAN (3 obiettivi)
('OBJ_IRAN_01', 'Iran',
 'Soglia Nucleare',
 'Raggiungi il penultimo spazio del Tracciato Nucleare senza che la Coalizione effettui un attacco militare diretto contro i tuoi siti nucleari.',
 8, 'tracciato', 'nucleare', '>=', 14,
 'Verificare che non siano avvenuti attacchi militari ai siti nucleari iraniani durante la partita.',
 'difficile'),

('OBJ_IRAN_02', 'Iran',
 'Asse della Resistenza',
 'Controlla almeno 3 nazioni tra Libano, Siria, Iraq e Yemen contemporaneamente alla fine della partita.',
 6, 'territorio', 'controllo', '>=', 3,
 'Contare quante tra Libano, Siria, Iraq, Yemen risultano controllate da Iran alla fine.',
 'media'),

('OBJ_IRAN_03', 'Iran',
 'Blocco dello Stretto',
 'Mantieni almeno 2 unità navali nello Stretto di Hormuz per 3 turni consecutivi senza subire perdite.',
 5, 'territorio', 'Stretto di Hormuz', '>=', 2,
 'Verificare presenza di 2+ unità navali nello Stretto di Hormuz per 3 turni consecutivi.',
 'media'),

-- COALIZIONE OCCIDENTALE (3 obiettivi)
('OBJ_COAL_01', 'Coalizione Occidentale',
 'Smantellamento Nucleare',
 'Riporta il Tracciato Nucleare iraniano al livello iniziale attraverso azioni diplomatiche o militari.',
 8, 'tracciato', 'nucleare', '<=', 1,
 'Il tracciato nucleare deve essere tornato al valore di inizio partita (1).',
 'difficile'),

('OBJ_COAL_02', 'Coalizione Occidentale',
 'Cambio di Regime',
 'Porta il Tracciato Sanzioni/Stabilità Economica dell''Iran al livello critico, causando proteste interne diffuse.',
 7, 'tracciato', 'sanzioni', '>=', 9,
 'Il tracciato sanzioni deve raggiungere il livello critico (9-10). Verificare presenza proteste (stabilità Iran bassa).',
 'difficile'),

('OBJ_COAL_03', 'Coalizione Occidentale',
 'Sicurezza Energetica',
 'Mantieni il controllo o l''influenza dominante su almeno 2 nazioni produttrici di petrolio (Arabia Saudita, Iraq, Kuwait) fino alla fine della partita.',
 5, 'territorio', 'controllo', '>=', 2,
 'Arabia Saudita, Iraq, Kuwait: almeno 2 devono essere sotto influenza Coalizione alla fine.',
 'media'),

-- RUSSIA (3 obiettivi)
('OBJ_RUS_01', 'Russia',
 'Mediatore Indispensabile',
 'Usa l''abilità Veto almeno 3 volte durante la partita e mantieni influenza in almeno 2 nazioni controllate da fazioni diverse.',
 6, 'carta', 'veto', '>=', 3,
 'Contare le carte Veto giocate (min 3) e verificare influenza in 2+ nazioni di fazioni diverse.',
 'media'),

('OBJ_RUS_02', 'Russia',
 'Contratti Militari',
 'Vendi sistemi d''arma (gioca carte specifiche) ad almeno 3 nazioni diverse durante la partita.',
 5, 'carta', 'contratto_militare', '>=', 3,
 'Contare le carte di vendita sistemi d''arma giocate verso nazioni diverse (min 3 nazioni).',
 'facile'),

('OBJ_RUS_03', 'Russia',
 'Base Mediterranea',
 'Controlla la Siria e mantieni almeno 1 unità navale nel Mediterraneo Orientale alla fine della partita.',
 7, 'territorio', 'Siria', '==', 1,
 'Siria controllata da Russia + almeno 1 unità navale in Mediterraneo Orientale alla fine.',
 'media'),

-- CINA (3 obiettivi)
('OBJ_CINA_01', 'Cina',
 'Via della Seta Energetica',
 'Piazza influenza BRI in almeno 4 nazioni diverse, creando una catena di connessione commerciale.',
 7, 'territorio', 'influenza_bri', '>=', 4,
 'Contare le nazioni con influenza BRI cinese al termine della partita (minimo 4).',
 'difficile'),

('OBJ_CINA_02', 'Cina',
 'Stabilità Commerciale',
 'Termina la partita senza che il Tracciato Tensione Globale (DEFCON) superi mai il livello critico (scenda sotto 4).',
 6, 'tracciato', 'defcon', '>=', 4,
 'Il DEFCON non deve mai scendere sotto 4 durante tutta la partita. Verificare nel log turni.',
 'media'),

('OBJ_CINA_03', 'Cina',
 'Partner Silenzioso',
 'Mantieni relazioni commerciali (influenza) sia con l''Iran che con almeno una nazione della Coalizione alla fine della partita.',
 5, 'territorio', 'influenza_mista', '>=', 2,
 'Cina deve avere influenza sia su Iran che su almeno una nazione Coalizione alla fine.',
 'facile'),

-- UNIONE EUROPEA (3 obiettivi)
('OBJ_EU_01', 'Unione Europea',
 'Diplomazia Multilaterale',
 'Fai approvare almeno 2 Risoluzioni ONU durante la partita senza che vengano bloccate dal veto russo o cinese.',
 6, 'carta', 'risoluzione_onu', '>=', 2,
 'Contare le risoluzioni ONU approvate (non bloccate da veto Russia/Cina): minimo 2.',
 'media'),

('OBJ_EU_02', 'Unione Europea',
 'Crisi Umanitaria Evitata',
 'Nessuna nazione adiacente all''Europa (Turchia, Libano, Siria) deve avere stabilità inferiore a 2 alla fine della partita.',
 7, 'territorio', 'stabilita_adiacente', '>=', 2,
 'Turchia, Libano, Siria: tutti e 3 devono avere stabilità >= 2 alla fine. Verificare nel game_state.',
 'difficile'),

('OBJ_EU_03', 'Unione Europea',
 'Accordo Nucleare Rinnovato',
 'Negozia un nuovo accordo JCPOA: il Tracciato Nucleare deve essere nella metà inferiore e il Tracciato Sanzioni non deve essere al massimo.',
 8, 'tracciato', 'nucleare', '<=', 7,
 'Nucleare <= 7 E Sanzioni < 10 alla fine della partita. Entrambe le condizioni devono essere soddisfatte.',
 'difficile')

ON CONFLICT (obj_id) DO UPDATE SET
  nome = EXCLUDED.nome,
  descrizione = EXCLUDED.descrizione,
  punti = EXCLUDED.punti,
  condizione_nota = EXCLUDED.condizione_note,
  updated_at = NOW();
