-- =============================================
-- LINEA ROSSA — Migration Obiettivi Segreti v2
-- 75 obiettivi: 15 per fazione × 5 fazioni
-- Eseguire in Supabase SQL Editor
-- =============================================

-- Crea tabella objectives se non esiste
CREATE TABLE IF NOT EXISTS objectives (
  obj_id             TEXT PRIMARY KEY,
  faction            TEXT NOT NULL,
  nome               TEXT NOT NULL,
  descrizione        TEXT,
  punti              INTEGER NOT NULL DEFAULT 5,
  difficolta         TEXT NOT NULL DEFAULT 'media',
  condizione_tipo    TEXT,
  condizione_campo   TEXT,
  condizione_op      TEXT,
  condizione_valore  INTEGER,
  condizione_note    TEXT,
  attivo             BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Crea tabella game_objectives se non esiste
CREATE TABLE IF NOT EXISTS game_objectives (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id     UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  faction     TEXT NOT NULL,
  obj_id      TEXT NOT NULL REFERENCES objectives(obj_id),
  completato  BOOLEAN DEFAULT false,
  punteggio   INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, faction, obj_id)
);

-- RLS
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_objectives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS objectives_public_read ON objectives;
CREATE POLICY objectives_public_read ON objectives FOR SELECT USING (true);
DROP POLICY IF EXISTS objectives_admin_write ON objectives;
CREATE POLICY objectives_admin_write ON objectives FOR ALL USING (true);
DROP POLICY IF EXISTS game_objectives_read ON game_objectives;
CREATE POLICY game_objectives_read ON game_objectives FOR SELECT USING (true);
DROP POLICY IF EXISTS game_objectives_write ON game_objectives;
CREATE POLICY game_objectives_write ON game_objectives FOR ALL USING (true);

-- Pulisci e reinserisci tutti i 75 obiettivi
DELETE FROM game_objectives;
DELETE FROM objectives;

INSERT INTO objectives
  (obj_id, faction, nome, descrizione, punti, difficolta,
   condizione_tipo, condizione_campo, condizione_op, condizione_valore, condizione_note, attivo)
VALUES
  ('OBJ_IRAN_01', 'Iran', 'Soglia Nucleare', 'Raggiungi il livello 12 del Tracciato Nucleare senza che l''Iran subisca un attacco militare diretto ai siti nucleari.', 8, 'difficile', 'tracciato', 'nucleare', '>=', 12, 'Verifica il Tracciato Nucleare: deve essere ≥12 E nessuna carta ''Attacco Siti Nucleari'' deve essere stata giocata.', true),
  ('OBJ_IRAN_02', 'Iran', 'Asse della Resistenza', 'Controlla almeno 3 nazioni tra Libano, Siria, Iraq e Yemen contemporaneamente alla fine della partita.', 6, 'media', 'territorio', 'proxy_nazioni', '>=', 3, 'Conta le nazioni proxy (Libano, Siria, Iraq, Yemen) con almeno 1 unità o influenza Iran a fine partita.', true),
  ('OBJ_IRAN_03', 'Iran', 'Blocco dello Stretto', 'Mantieni almeno 2 unità navali nello Stretto di Hormuz per 3 turni consecutivi senza subire perdite.', 5, 'media', 'manuale', NULL, NULL, NULL, 'Verifica manuale: 2+ unità navali in ''Stretto di Hormuz'' per 3 turni consecutivi senza perdite in combattimento navale.', true),
  ('OBJ_IRAN_04', 'Iran', 'Supremazia IRGC', 'Porta il tracciato Forze Militari (IRGC) al livello massimo e mantienilo per almeno 2 turni.', 7, 'difficile', 'tracciato', 'irgc', '>=', 10, 'Tracciato IRGC deve essere al massimo (10) a fine partita e risulta invariato negli ultimi 2 turni.', true),
  ('OBJ_IRAN_05', 'Iran', 'Isolamento Internazionale Ribaltato', 'Porta il Tracciato Opinione Globale da negativo a +5 o superiore durante la partita.', 6, 'media', 'tracciato', 'opinione', '>=', 5, 'Tracciato Opinione Globale deve essere ≥+5 a fine partita (partendo da un valore negativo).', true),
  ('OBJ_IRAN_06', 'Iran', 'Resistenza alle Sanzioni', 'Mantieni il Tracciato Sanzioni/Stabilità Economica sopra il livello 5 per tutta la partita, nonostante le pressioni.', 7, 'difficile', 'tracciato', 'sanzioni', '>=', 5, 'Il Tracciato Sanzioni non deve MAI scendere sotto 5 durante tutta la partita. Verifica la storia dei tracciati.', true),
  ('OBJ_IRAN_07', 'Iran', 'Egemonia Regionale', 'Controlla almeno 5 nazioni nella regione del Medio Oriente con unità o influenza diretta.', 8, 'difficile', 'territorio', 'nazioni_iran', '>=', 5, 'Conta tutte le nazioni con unità o influenza Iran: deve essere ≥5 a fine partita.', true),
  ('OBJ_IRAN_08', 'Iran', 'Accordo Energetico Segreto', 'Stringi accordi commerciali con Cina e Russia (gioca le relative carte) senza che la Coalizione possa bloccarli.', 5, 'facile', 'carta', 'accordo_energetico', '>=', 2, 'Verifica che siano state giocate le carte ''Accordo Energetico Cina'' e ''Pipeline Russia-Iran'' senza contrasto.', true),
  ('OBJ_IRAN_09', 'Iran', 'Deterrenza Nucleare', 'Raggiungi il livello 8 del Tracciato Nucleare, poi mantienilo senza avanzare (deterrenza) per 2 turni consecutivi.', 6, 'media', 'tracciato', 'nucleare', '>=', 8, 'Tracciato Nucleare deve essere tra 8 e 11, non al massimo, per almeno gli ultimi 2 turni della partita.', true),
  ('OBJ_IRAN_10', 'Iran', 'Proxy Vittoriosi', 'Ottieni vittorie in combattimento proxy (Libano/Yemen/Iraq) in almeno 3 scontri nel corso della partita.', 5, 'facile', 'manuale', NULL, NULL, NULL, 'Conta i combattimenti proxy vinti da Iran in Libano, Yemen e Iraq. Devono essere almeno 3 in totale.', true),
  ('OBJ_IRAN_11', 'Iran', 'Crisi Energetica Globale', 'Causa interruzioni alle forniture energetiche globali (gioca 2 carte ''Crisi Energetica'') aumentando la pressione sulla Coalizione.', 6, 'media', 'carta', 'crisi_energetica', '>=', 2, 'Devono essere state giocate almeno 2 carte con nome/effetto ''Crisi Energetica'' dall''Iran.', true),
  ('OBJ_IRAN_12', 'Iran', 'Sopravvivenza del Regime', 'Mantieni la Stabilità Interna dell''Iran sopra il livello 6 per tutta la partita.', 4, 'facile', 'tracciato', 'stabilita', '>=', 6, 'Il Tracciato Stabilità Interna Iran non deve MAI scendere sotto 6 durante la partita.', true),
  ('OBJ_IRAN_13', 'Iran', 'Guerra Asimmetrica Vincente', 'Infliggi perdite militari alla Coalizione Occidentale in almeno 4 scontri diretti o indiretti.', 7, 'difficile', 'manuale', NULL, NULL, NULL, 'Conta gli scontri (diretti e proxy) in cui la Coalizione ha subito perdite di unità per azioni iraniane. Devono essere ≥4.', true),
  ('OBJ_IRAN_14', 'Iran', 'Mediazione Rifiutata', 'Rifiuta almeno 2 proposte di accordo diplomatico europeo mantenendo il Tracciato Nucleare in avanzamento.', 5, 'media', 'manuale', NULL, NULL, NULL, 'Verifica che almeno 2 carte ''Proposta Diplomatica UE'' siano state scartate/bloccate dall''Iran e il nucleare sia avanzato.', true),
  ('OBJ_IRAN_15', 'Iran', 'Vittoria della Resistenza', 'A fine partita, controlla il Libano, mantieni il Tracciato Nucleare sopra 6 e l''Opinione Globale non inferiore a -3.', 9, 'difficile', 'manuale', NULL, NULL, NULL, 'Tre condizioni simultanee: Libano controllato, nucleare≥7, opinione≥-3. Verifica tutte e tre a fine partita.', true),
  ('OBJ_COAL_01', 'Coalizione Occidentale', 'Smantellamento Nucleare', 'Riporta il Tracciato Nucleare iraniano al livello 3 o inferiore attraverso azioni diplomatiche o militari.', 8, 'difficile', 'tracciato', 'nucleare', '<=', 3, 'Il Tracciato Nucleare Iran deve essere ≤3 a fine partita. Può essere ottenuto con sanzioni, raid o diplomazia.', true),
  ('OBJ_COAL_02', 'Coalizione Occidentale', 'Cambio di Regime', 'Porta il Tracciato Sanzioni/Stabilità Economica dell''Iran al livello 2 o inferiore.', 7, 'difficile', 'tracciato', 'sanzioni', '<=', 2, 'Il Tracciato Sanzioni deve essere ≤2 a fine partita. Richiede sanzioni massicce e destabilizzazione.', true),
  ('OBJ_COAL_03', 'Coalizione Occidentale', 'Sicurezza Energetica', 'Mantieni il controllo o l''influenza dominante su almeno 2 nazioni produttrici di petrolio (Arabia Saudita, Iraq, Kuwait).', 5, 'facile', 'territorio', 'petrolio_nazioni', '>=', 2, 'Conta le nazioni petrolifere (Arabia Saudita, Iraq, Kuwait) con unità/influenza Coalizione a fine partita. Devono essere ≥2.', true),
  ('OBJ_COAL_04', 'Coalizione Occidentale', 'Supremazia Aerea', 'Mantieni il Tracciato Tecnologia Avanzata al massimo per almeno 3 turni consecutivi.', 6, 'media', 'tracciato', 'tecnologia', '>=', 12, 'Il Tracciato Tecnologia deve essere al massimo (12) per gli ultimi 3 turni della partita.', true),
  ('OBJ_COAL_05', 'Coalizione Occidentale', 'Coalizione Anti-Iran', 'Convinci almeno 2 fazioni neutrali (Russia o Cina) ad astenersi o supportare sanzioni ONU contro l''Iran.', 7, 'difficile', 'manuale', NULL, NULL, NULL, 'Verifica che almeno 2 risoluzioni ONU anti-Iran siano passate senza veto di Russia/Cina. Controlla il registro eventi.', true),
  ('OBJ_COAL_06', 'Coalizione Occidentale', 'Forze Speciali Vincenti', 'Vinci almeno 3 scontri militari diretti contro le forze iraniane o i loro proxy.', 5, 'media', 'manuale', NULL, NULL, NULL, 'Conta le vittorie in combattimento diretto della Coalizione contro Iran o proxy. Devono essere ≥3.', true),
  ('OBJ_COAL_07', 'Coalizione Occidentale', 'Sanzioni Massicce', 'Gioca almeno 4 carte di tipo ''Sanzione Economica'' durante la partita.', 4, 'facile', 'carta', 'sanzione_economica', '>=', 4, 'Conta le carte ''Sanzione Economica'' giocate dalla Coalizione. Devono essere ≥4.', true),
  ('OBJ_COAL_08', 'Coalizione Occidentale', 'Isolamento Diplomatico dell''Iran', 'Porta il Tracciato Opinione Globale a -5 o inferiore per l''Iran.', 6, 'media', 'tracciato', 'opinione', '<=', -5, 'Il Tracciato Opinione Globale deve essere ≤-5 a fine partita.', true),
  ('OBJ_COAL_09', 'Coalizione Occidentale', 'Protezione di Israele', 'Israele non deve subire perdite di unità per tutto il corso della partita.', 5, 'media', 'manuale', NULL, NULL, NULL, 'Verifica che nessuna unità israeliana sia stata eliminata in combattimento durante tutta la partita.', true),
  ('OBJ_COAL_10', 'Coalizione Occidentale', 'Supporto Pubblico Consolidato', 'Mantieni il Tracciato Supporto Pubblico Interno sopra il livello 7 per tutta la partita.', 5, 'facile', 'tracciato', 'supporto_pubblico', '>=', 7, 'Il Tracciato Supporto Pubblico non deve MAI scendere sotto 7 durante la partita.', true),
  ('OBJ_COAL_11', 'Coalizione Occidentale', 'Superiorità Navale', 'Mantieni almeno 3 unità navali nel Golfo Persico e nel Mar Arabico a fine partita.', 6, 'media', 'manuale', NULL, NULL, NULL, 'Conta le unità navali Coalizione in Golfo Persico + Mar Arabico a fine partita. Devono essere ≥3.', true),
  ('OBJ_COAL_12', 'Coalizione Occidentale', 'Raid sui Siti Nucleari', 'Esegui con successo almeno 1 attacco militare diretto ai siti nucleari iraniani.', 7, 'difficile', 'carta', 'raid_nucleare', '>=', 1, 'Deve essere stata giocata almeno 1 carta ''Raid Siti Nucleari'' con esito positivo.', true),
  ('OBJ_COAL_13', 'Coalizione Occidentale', 'Controllo del Mar Rosso', 'Mantieni almeno 2 unità navali nel Mar Rosso per bloccare le forniture agli Houthi.', 4, 'facile', 'manuale', NULL, NULL, NULL, 'Conta le unità navali Coalizione nel Mar Rosso a fine partita. Devono essere ≥2.', true),
  ('OBJ_COAL_14', 'Coalizione Occidentale', 'Accordo di Abramo Espanso', 'Normalizza le relazioni tra Israele e almeno 1 nazione araba aggiuntiva (Giordania, Egitto, Arabia Saudita).', 6, 'media', 'manuale', NULL, NULL, NULL, 'Verifica che sia stata giocata almeno 1 carta ''Accordo di Abramo'' o equivalente senza che l''Iran possa bloccarla.', true),
  ('OBJ_COAL_15', 'Coalizione Occidentale', 'Stabilità del Golfo', 'A fine partita: Tracciato Nucleare ≤5, almeno 2 paesi del Golfo sotto influenza Coalizione, DEFCON ≥5.', 9, 'difficile', 'manuale', NULL, NULL, NULL, 'Tre condizioni: Nucleare≤5, 2+ paesi Golfo con influenza Coalizione, DEFCON≥5. Verifica tutte e tre a fine partita.', true),
  ('OBJ_RUSS_01', 'Russia', 'Mediatore Indispensabile', 'Usa l''abilità ''Veto'' almeno 3 volte E mantieni influenza in almeno 2 nazioni controllate da fazioni diverse.', 6, 'media', 'manuale', NULL, NULL, NULL, 'Conta l''uso del Veto (deve essere ≥3) e le nazioni con influenza Russia nonostante controllo altrui (devono essere ≥2).', true),
  ('OBJ_RUSS_02', 'Russia', 'Contratti Militari', 'Vendi sistemi d''arma (gioca carte ''Vendita Armi'') ad almeno 3 nazioni diverse durante la partita.', 5, 'facile', 'carta', 'vendita_armi', '>=', 3, 'Conta le carte ''Vendita Armi'' giocate dalla Russia verso nazioni diverse. Devono coprire ≥3 nazioni.', true),
  ('OBJ_RUSS_03', 'Russia', 'Base Mediterranea', 'Controlla la Siria E mantieni almeno 1 unità navale nel Mediterraneo Orientale a fine partita.', 7, 'media', 'manuale', NULL, NULL, NULL, 'Due condizioni: Siria con unità/influenza Russia + almeno 1 unità navale russa in Mediterraneo Orientale.', true),
  ('OBJ_RUSS_04', 'Russia', 'Dominio Energetico', 'Porta il Tracciato Energia/Risorse al massimo e mantienilo per almeno 2 turni finali.', 6, 'media', 'tracciato', 'energia', '>=', 10, 'Il Tracciato Energia/Risorse Russia deve essere al massimo (10) negli ultimi 2 turni.', true),
  ('OBJ_RUSS_05', 'Russia', 'Partner Strategico dell''Iran', 'Gioca almeno 3 carte di supporto all''Iran (economico o militare) senza che l''Iran raggiunga DEFCON 1.', 5, 'media', 'carta', 'supporto_iran', '>=', 3, 'Conta le carte di supporto Russia→Iran. Devono essere ≥3 e la partita non deve finire per DEFCON 1.', true),
  ('OBJ_RUSS_06', 'Russia', 'Veto Decisivo', 'Blocca almeno 2 risoluzioni ONU sfavorevoli alla Russia o all''Iran con il Veto.', 4, 'facile', 'manuale', NULL, NULL, NULL, 'Conta l''uso del Veto russo per bloccare risoluzioni contro Russia o Iran. Deve essere ≥2.', true),
  ('OBJ_RUSS_07', 'Russia', 'Influenza nei Balcani e Levante', 'Mantieni influenza in almeno 3 nazioni non russe (Siria, Libano, Iraq, Turchia, Egitto) a fine partita.', 7, 'difficile', 'territorio', 'influenza_russia', '>=', 3, 'Conta le nazioni non Russia con presenza/influenza russa a fine partita. Devono essere ≥3.', true),
  ('OBJ_RUSS_08', 'Russia', 'Corridoio Energetico', 'Mantieni la pipeline Russia-Iran attiva (Tracciato Energia ≥6) senza che la Coalizione possa sabotarla.', 6, 'media', 'tracciato', 'energia', '>=', 6, 'Il Tracciato Energia Russia deve essere ≥6 a fine partita. Non devono essere state giocate carte ''Sabotaggio Pipeline'' con successo.', true),
  ('OBJ_RUSS_09', 'Russia', 'Supremazia Militare Regionale', 'Porta il Tracciato Influenza Militare al livello massimo e vinci almeno 1 scontro militare.', 7, 'difficile', 'tracciato', 'influenza_militare', '>=', 12, 'Il Tracciato Influenza Militare Russia deve essere al massimo (12) a fine partita + almeno 1 vittoria in combattimento.', true),
  ('OBJ_RUSS_10', 'Russia', 'Stabilità Economica Garantita', 'Mantieni il Tracciato Stabilità Economica Russia sopra il livello 7 per tutta la partita.', 5, 'media', 'tracciato', 'stabilita_econ', '>=', 7, 'Il Tracciato Stabilità Economica Russia non deve MAI scendere sotto 7 durante la partita.', true),
  ('OBJ_RUSS_11', 'Russia', 'Controllo del Mar Nero', 'Mantieni almeno 2 unità navali nel Mar Nero/Mediterraneo e nessuna nazione NATO controlla la Turchia.', 6, 'media', 'manuale', NULL, NULL, NULL, 'Conta le unità navali russe in Mar Nero + Mediterraneo (≥2) e verifica che la Turchia non sia sotto NATO/Coalizione.', true),
  ('OBJ_RUSS_12', 'Russia', 'Guerra Ibrida Vincente', 'Usa almeno 3 carte di tipo ''Guerra Informatica'' o ''Operazione Speciale'' con successo.', 6, 'media', 'carta', 'guerra_ibrida', '>=', 3, 'Conta le carte Guerra Informatica + Operazione Speciale russe giocate con effetto positivo. Devono essere ≥3.', true),
  ('OBJ_RUSS_13', 'Russia', 'Protettore della Siria', 'La Siria rimane sotto influenza russa per tutta la partita senza essere mai persa.', 5, 'media', 'manuale', NULL, NULL, NULL, 'La Siria deve avere influenza/unità Russia in OGNI turno della partita. Mai persa neanche temporaneamente.', true),
  ('OBJ_RUSS_14', 'Russia', 'Il Grande Gioco', 'A fine partita mantieni influenza sia in Iran che in almeno 1 paese della Coalizione (Arabia Saudita, Egitto).', 7, 'difficile', 'manuale', NULL, NULL, NULL, 'Russia deve avere influenza in Iran E in almeno uno tra Arabia Saudita ed Egitto a fine partita.', true),
  ('OBJ_RUSS_15', 'Russia', 'Potenza Indispensabile', 'A fine partita: Veto usato ≥2 volte, Energia ≥7, influenza in ≥3 nazioni diverse.', 9, 'difficile', 'manuale', NULL, NULL, NULL, 'Tre condizioni: Veto≥2 utilizzi, Energia≥7, influenza in ≥3 nazioni. Verifica tutte e tre a fine partita.', true),
  ('OBJ_CINA_01', 'Cina', 'Via della Seta Energetica', 'Piazza influenza BRI in almeno 4 nazioni diverse, creando una catena di connessione commerciale.', 7, 'difficile', 'territorio', 'bri_nazioni', '>=', 4, 'Conta le nazioni con influenza BRI/Cina a fine partita. Devono essere ≥4 e formare una catena geografica.', true),
  ('OBJ_CINA_02', 'Cina', 'Stabilità Commerciale', 'Termina la partita senza che il Tracciato Tensione Globale (DEFCON) sia mai sceso sotto il livello 4.', 6, 'media', 'tracciato', 'defcon', '>=', 4, 'Il DEFCON non deve MAI scendere sotto 4 durante la partita. Verifica la storia dei tracciati.', true),
  ('OBJ_CINA_03', 'Cina', 'Partner Silenzioso', 'Mantieni relazioni commerciali (influenza) sia con l''Iran che con almeno 1 nazione della Coalizione a fine partita.', 5, 'facile', 'manuale', NULL, NULL, NULL, 'Cina deve avere influenza sia in Iran che in almeno una tra: Arabia Saudita, Egitto, EAU. Verifica a fine partita.', true),
  ('OBJ_CINA_04', 'Cina', 'Potenza Economica Dominante', 'Porta il Tracciato Potenza Economica al massimo e mantienilo per almeno 3 turni.', 7, 'difficile', 'tracciato', 'potenza_economica', '>=', 15, 'Il Tracciato Potenza Economica Cina deve essere al massimo (15) negli ultimi 3 turni.', true),
  ('OBJ_CINA_05', 'Cina', 'Investimenti Strategici BRI', 'Gioca almeno 4 carte di tipo ''Investimento BRI'' o ''Accordo Commerciale'' durante la partita.', 5, 'facile', 'carta', 'investimento_bri', '>=', 4, 'Conta le carte BRI/Accordo Commerciale cinesi giocate. Devono essere ≥4.', true),
  ('OBJ_CINA_06', 'Cina', 'Neutralità Profittevole', 'Non partecipare ad alcun conflitto militare diretto e aumentare l''Influenza Commerciale di almeno 5 livelli.', 6, 'media', 'manuale', NULL, NULL, NULL, 'Nessuna unità cinese deve partecipare a combattimenti E il Tracciato Influenza Commerciale deve essere aumentato di ≥5.', true),
  ('OBJ_CINA_07', 'Cina', 'Cyber Supremacy', 'Porta il Tracciato Cyber Warfare al massimo e usa almeno 2 carte Cyber contro fazioni avversarie.', 6, 'media', 'tracciato', 'cyber', '>=', 10, 'Tracciato Cyber Warfare Cina al massimo (10) + ≥2 carte Cyber usate contro avversari.', true),
  ('OBJ_CINA_08', 'Cina', 'Accordo Energetico con l''Iran', 'Stringi un accordo energetico con l''Iran (gioca la carta specifica) che rimanga attivo per almeno 2 turni.', 5, 'facile', 'carta', 'accordo_iran_cina', '>=', 1, 'La carta ''Accordo Energetico Iran-Cina'' deve essere stata giocata e l''effetto non cancellato per ≥2 turni.', true),
  ('OBJ_CINA_09', 'Cina', 'Influenza sul Golfo', 'Estendi l''influenza cinese in almeno 2 nazioni del Golfo (Arabia Saudita, EAU, Kuwait, Qatar) a fine partita.', 6, 'media', 'territorio', 'golfo_nazioni', '>=', 2, 'Conta le nazioni del Golfo (Arabia Saudita, EAU, Kuwait, Qatar) con influenza/unità Cina a fine partita. Devono essere ≥2.', true),
  ('OBJ_CINA_10', 'Cina', 'Pazienza Strategica Premiata', 'Aumenta la Potenza Economica di almeno 6 livelli nel corso della partita mantenendo il DEFCON ≥5.', 7, 'difficile', 'manuale', NULL, NULL, NULL, 'Potenza Economica deve aumentare di ≥6 durante la partita E il DEFCON non deve MAI scendere sotto 5.', true),
  ('OBJ_CINA_11', 'Cina', 'Hub Commerciale Regionale', 'Controlla almeno 1 porto strategico (Gwadar, Hormuz, Aden) con influenza commerciale a fine partita.', 5, 'media', 'manuale', NULL, NULL, NULL, 'Verifica che almeno uno tra Gwadar, Stretto di Hormuz, Aden abbia influenza/unità Cina a fine partita.', true),
  ('OBJ_CINA_12', 'Cina', 'Mediazione Silenziosa', 'Contribuisci alla de-escalation di almeno 2 crisi diplomatiche giocando carte di mediazione.', 5, 'facile', 'carta', 'mediazione', '>=', 2, 'Conta le carte ''Mediazione'' o ''De-escalation'' cinesi giocate. Devono essere ≥2.', true),
  ('OBJ_CINA_13', 'Cina', 'Indipendenza Tecnologica', 'Porta il Tracciato Potenza Economica a ≥10 senza che la Coalizione possa imporre sanzioni tecnologiche alla Cina.', 6, 'media', 'tracciato', 'potenza_economica', '>=', 10, 'Potenza Economica ≥10 a fine partita E nessuna carta ''Sanzioni Tecnologiche Cina'' deve essere rimasta attiva.', true),
  ('OBJ_CINA_14', 'Cina', 'Il Nuovo Ordine Multipolare', 'A fine partita: Potenza Economica ≥12, influenza in ≥3 nazioni, DEFCON ≥4.', 8, 'difficile', 'manuale', NULL, NULL, NULL, 'Tre condizioni: Potenza Economica≥12, influenza in ≥3 nazioni, DEFCON≥4. Verifica tutte e tre a fine partita.', true),
  ('OBJ_CINA_15', 'Cina', 'Grande Cina', 'Porta l''Influenza Commerciale al massimo E il Tracciato Cyber al massimo entro la fine della partita.', 9, 'difficile', 'manuale', NULL, NULL, NULL, 'Due tracciati al massimo simultaneamente: Influenza Commerciale (12) E Cyber Warfare (10) a fine partita.', true),
  ('OBJ_EU_01', 'Unione Europea', 'Diplomazia Multilaterale', 'Fai approvare almeno 2 Risoluzioni ONU durante la partita senza che vengano bloccate dal veto russo o cinese.', 6, 'media', 'manuale', NULL, NULL, NULL, 'Verifica che almeno 2 risoluzioni siano passate con voto favorevole o astensione di Russia e Cina. Controlla il registro.', true),
  ('OBJ_EU_02', 'Unione Europea', 'Crisi Umanitaria Evitata', 'Nessuna nazione adiacente all''Europa (Turchia, Libano, Siria) deve avere stabilità inferiore a 3 a fine partita.', 7, 'difficile', 'manuale', NULL, NULL, NULL, 'Verifica stabilità di Turchia, Libano e Siria a fine partita. Tutte devono essere ≥3.', true),
  ('OBJ_EU_03', 'Unione Europea', 'Accordo Nucleare Rinnovato', 'Il Tracciato Nucleare deve essere nella metà inferiore (≤6) E il Tracciato Sanzioni non deve essere al massimo.', 8, 'difficile', 'tracciato', 'nucleare', '<=', 6, 'Due condizioni: Nucleare≤6 E Sanzioni non al massimo (≤8). Verifica entrambe a fine partita.', true),
  ('OBJ_EU_04', 'Unione Europea', 'Soft Power Europeo', 'Porta il Tracciato Influenza Diplomatica al massimo e mantienilo per almeno 2 turni.', 6, 'media', 'tracciato', 'influenza_diplomatica', '>=', 12, 'Il Tracciato Influenza Diplomatica UE deve essere al massimo (12) negli ultimi 2 turni.', true),
  ('OBJ_EU_05', 'Unione Europea', 'Mediatore di Pace', 'Negozia almeno 3 accordi diplomatici (gioca le relative carte) tra fazioni in conflitto.', 5, 'facile', 'carta', 'accordo_diplomatico', '>=', 3, 'Conta le carte ''Accordo Diplomatico'', ''Mediazione'', ''Negoziato'' giocate dall''UE. Devono essere ≥3.', true),
  ('OBJ_EU_06', 'Unione Europea', 'Sicurezza Energetica Europea', 'Mantieni il Tracciato Stabilità Energetica sopra il livello 7 per tutta la partita.', 5, 'facile', 'tracciato', 'stabilita_energetica', '>=', 7, 'Il Tracciato Stabilità Energetica UE non deve MAI scendere sotto 7 durante la partita.', true),
  ('OBJ_EU_07', 'Unione Europea', 'Coesione Interna Forte', 'Mantieni il Tracciato Coesione Interna al massimo per almeno 3 turni consecutivi.', 6, 'media', 'tracciato', 'coesione_interna', '>=', 10, 'Il Tracciato Coesione Interna UE deve essere al massimo (10) per gli ultimi 3 turni.', true),
  ('OBJ_EU_08', 'Unione Europea', 'Aiuti Umanitari Efficaci', 'Gioca almeno 3 carte ''Aiuti Umanitari'' durante la partita, riducendo la tensione nelle nazioni in crisi.', 4, 'facile', 'carta', 'aiuti_umanitari', '>=', 3, 'Conta le carte ''Aiuti Umanitari'' giocate dall''UE. Devono essere ≥3.', true),
  ('OBJ_EU_09', 'Unione Europea', 'Il Dialogo Come Arma', 'Riduci il DEFCON di almeno 2 livelli tramite azioni diplomatiche europee nel corso della partita.', 7, 'difficile', 'manuale', NULL, NULL, NULL, 'Il DEFCON deve essere aumentato (migliorato) di almeno 2 livelli totali grazie a carte diplomatiche UE nel corso della partita.', true),
  ('OBJ_EU_10', 'Unione Europea', 'Protezione dei Rifugiati', 'Contribuisci alla stabilizzazione di almeno 2 nazioni in crisi (giocando carte Aiuti o Stabilizzazione).', 5, 'media', 'carta', 'stabilizzazione', '>=', 2, 'Conta le carte ''Stabilizzazione'' e ''Aiuti Umanitari'' giocate in nazioni con stabilità bassa (<4). Devono essere ≥2.', true),
  ('OBJ_EU_11', 'Unione Europea', 'Accordo Verde nel Golfo', 'Negozia un accordo sull''energia rinnovabile con almeno 1 nazione del Golfo durante la partita.', 5, 'facile', 'manuale', NULL, NULL, NULL, 'Verifica che sia stata giocata una carta ''Accordo Verde'' o ''Energia Rinnovabile'' che coinvolga una nazione del Golfo.', true),
  ('OBJ_EU_12', 'Unione Europea', 'Argine alla Proliferazione', 'Mantieni il Tracciato Nucleare sotto il livello 8 per tutta la seconda metà della partita.', 7, 'difficile', 'tracciato', 'nucleare', '<=', 7, 'Il Tracciato Nucleare non deve salire oltre 7 nella seconda metà della partita (turni 6-fine).', true),
  ('OBJ_EU_13', 'Unione Europea', 'Rete di Sicurezza', 'Nessun paese europeo alleato (Turchia, Egitto) deve cadere sotto influenza Iran o Russia.', 6, 'media', 'manuale', NULL, NULL, NULL, 'Verifica che Turchia ed Egitto non abbiano influenza/unità Iran o Russia dominante a fine partita.', true),
  ('OBJ_EU_14', 'Unione Europea', 'L''Europa Parla con Una Voce', 'Fai passare almeno 3 risoluzioni favorevoli all''UE in ambito ONU nel corso della partita.', 6, 'media', 'manuale', NULL, NULL, NULL, 'Conta le risoluzioni ONU a favore dell''UE approvate (o su proposta UE). Devono essere ≥3.', true),
  ('OBJ_EU_15', 'Unione Europea', 'La Pace è Possibile', 'A fine partita: DEFCON ≥6, nessuna guerra aperta, almeno 1 accordo diplomatico ancora attivo.', 9, 'difficile', 'manuale', NULL, NULL, NULL, 'Tre condizioni: DEFCON≥6, nessun combattimento diretto negli ultimi 2 turni, almeno 1 carta accordo attiva. Verifica a fine partita.', true);

-- ─── Funzione: assign_objectives_to_faction ─────────────
-- Assegna num_draw obiettivi segreti casuali a una fazione in una partita.
-- Chiamata da: onlineGameStore.ts oppure trigger game init.
CREATE OR REPLACE FUNCTION assign_objectives_to_faction(
  p_game_id UUID,
  p_faction TEXT,
  p_num_draw INTEGER DEFAULT 3
) RETURNS SETOF game_objectives AS $$
DECLARE
  v_obj objectives%ROWTYPE;
BEGIN
  -- Rimuovi eventuali assegnazioni precedenti per questa fazione in questa partita
  DELETE FROM game_objectives WHERE game_id = p_game_id AND faction = p_faction;
  -- Inserisci num_draw obiettivi casuali
  FOR v_obj IN
    SELECT * FROM objectives
    WHERE faction = p_faction AND attivo = true
    ORDER BY random()
    LIMIT p_num_draw
  LOOP
    INSERT INTO game_objectives (game_id, faction, obj_id, completato, punteggio)
    VALUES (p_game_id, p_faction, v_obj.obj_id, false, 0)
    ON CONFLICT (game_id, faction, obj_id) DO NOTHING;
  END LOOP;
  -- Ritorna le assegnazioni create
  RETURN QUERY
    SELECT * FROM game_objectives
    WHERE game_id = p_game_id AND faction = p_faction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Funzione: assign_all_objectives ────────────────────
-- Assegna obiettivi a tutte le fazioni attive in una partita.
CREATE OR REPLACE FUNCTION assign_all_objectives(
  p_game_id UUID,
  p_num_draw INTEGER DEFAULT 3
) RETURNS void AS $$
DECLARE
  v_faction TEXT;
  v_factions TEXT[] := ARRAY[
    'Iran', 'Coalizione Occidentale', 'Russia', 'Cina', 'Unione Europea'
  ];
BEGIN
  FOREACH v_faction IN ARRAY v_factions LOOP
    PERFORM assign_objectives_to_faction(p_game_id, v_faction, p_num_draw);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Vista: v_game_objectives ───────────────────────────
CREATE OR REPLACE VIEW v_game_objectives AS
  SELECT
    go.id,
    go.game_id,
    go.faction,
    go.completato,
    go.punteggio,
    o.obj_id,
    o.nome,
    o.descrizione,
    o.punti,
    o.difficolta,
    o.condizione_tipo,
    o.condizione_campo,
    o.condizione_op,
    o.condizione_valore,
    o.condizione_note
  FROM game_objectives go
  JOIN objectives o ON go.obj_id = o.obj_id;

