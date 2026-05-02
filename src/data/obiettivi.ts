// ================================================================
//  LINEA ROSSA — Obiettivi Segreti (v2 — BILANCIATI)
//  75 obiettivi: 15 per ciascuna delle 5 fazioni
//  Target per fazione: ~100 punti totali, 3 facile / 8 media / 4 difficile
//  Nomi fazione corretti: Iran | Coalizione | Russia | Cina | Europa
// ================================================================

export interface ObiettivoSegreto {
  obj_id:              string;
  faction:             string;
  nome:                string;
  descrizione:         string;
  punti:               number;
  difficolta:          'facile' | 'media' | 'difficile';
  condizione_tipo:     string | null;
  condizione_campo:    string | null;
  condizione_op:       string | null;
  condizione_valore:   number | null;
  condizione_note:     string | null;
  attivo:              boolean;
  completato?:         boolean;
  data_completamento?: string;
}

export const TUTTI_GLI_OBIETTIVI: ObiettivoSegreto[] = [

  // ════════════════════════════════════════════════════════════════════════════
  // IRAN — 15 obiettivi | target 100 pt | 3 facile · 8 media · 4 difficile
  // ════════════════════════════════════════════════════════════════════════════

  { obj_id: 'OBJ_IRAN_01', faction: 'Iran',
    nome: 'Soglia Nucleare',
    descrizione: 'Porta il tracciato Nucleare a 10 o superiore entro la fine della partita.',
    punti: 7, difficolta: 'difficile', condizione_tipo: 'tracciato',
    condizione_campo: 'nucleare', condizione_op: '>=', condizione_valore: 10,
    condizione_note: 'Controlla nucleare a fine partita. Deve essere ≥ 10.', attivo: true },

  { obj_id: 'OBJ_IRAN_02', faction: 'Iran',
    nome: 'Breakout Imminente',
    descrizione: 'Mantieni il tracciato Nucleare a 12 o superiore per almeno 3 turni consecutivi.',
    punti: 10, difficolta: 'difficile', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Verifica log: nucleare ≥ 12 per 3 turni di fila.', attivo: true },

  { obj_id: 'OBJ_IRAN_03', faction: 'Iran',
    nome: 'Sanzioni Infrante',
    descrizione: 'Riduci il tracciato Sanzioni a 3 o meno.',
    punti: 6, difficolta: 'media', condizione_tipo: 'tracciato',
    condizione_campo: 'sanzioni', condizione_op: '<=', condizione_valore: 3,
    condizione_note: 'Controlla sanzioni a fine partita. Deve essere ≤ 3.', attivo: true },

  { obj_id: 'OBJ_IRAN_04', faction: 'Iran',
    nome: 'Dominanza nel Golfo',
    descrizione: 'Raggiungi influenza ≥ 4 in almeno 3 territori tra Iraq, Yemen, Bahrain, Kuwait ed Emirati Arabi.',
    punti: 8, difficolta: 'difficile', condizione_tipo: 'territorio',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: '{"territories":["Iraq","Yemen","Bahrain","Kuwait","EmiratiArabi"],"minCount":3,"minInfluence":4}', attivo: true },

  { obj_id: 'OBJ_IRAN_05', faction: 'Iran',
    nome: 'Asse della Resistenza',
    descrizione: 'Controlla con influenza ≥ 3 almeno 3 territori tra Libano, Siria, Iraq e Yemen.',
    punti: 8, difficolta: 'difficile', condizione_tipo: 'territorio',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: '{"territories":["Libano","Siria","Iraq","Yemen"],"minCount":3,"minInfluence":3}', attivo: true },

  { obj_id: 'OBJ_IRAN_06', faction: 'Iran',
    nome: 'Destabilizzare il Nemico',
    descrizione: 'Riduci la Stabilità della Coalizione Occidentale a 3 o meno.',
    punti: 6, difficolta: 'media', condizione_tipo: 'tracciato',
    condizione_campo: 'stabilita_coalizione', condizione_op: '<=', condizione_valore: 3,
    condizione_note: 'Controlla stabilita_coalizione a fine partita. Deve essere ≤ 3.', attivo: true },

  { obj_id: 'OBJ_IRAN_07', faction: 'Iran',
    nome: 'Chiudere lo Stretto',
    descrizione: 'Attiva il blocco di Hormuz almeno una volta durante la partita.',
    punti: 5, difficolta: 'media', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Verifica nel log se la capacità hormuz_iran è stata attivata almeno una volta.', attivo: true },

  { obj_id: 'OBJ_IRAN_08', faction: 'Iran',
    nome: 'DEFCON al Limite',
    descrizione: 'Porta il DEFCON a 2 o inferiore almeno una volta durante la partita.',
    punti: 7, difficolta: 'difficile', condizione_tipo: 'tracciato',
    condizione_campo: 'defcon', condizione_op: '<=', condizione_valore: 2,
    condizione_note: 'Controlla log: DEFCON ≤ 2 almeno per un turno.', attivo: true },

  { obj_id: 'OBJ_IRAN_09', faction: 'Iran',
    nome: 'Stabilità Interna',
    descrizione: 'Mantieni la Stabilità dell\'Iran a 7 o superiore a fine partita.',
    punti: 4, difficolta: 'facile', condizione_tipo: 'tracciato',
    condizione_campo: 'stabilita_iran', condizione_op: '>=', condizione_valore: 7,
    condizione_note: 'Controlla stabilita_iran a fine partita. Deve essere ≥ 7.', attivo: true },

  { obj_id: 'OBJ_IRAN_10', faction: 'Iran',
    nome: 'Deterrenza Missilistica',
    descrizione: 'Schiera almeno 3 unità MissileiBalistici durante la partita.',
    punti: 6, difficolta: 'media', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Controlla log militare: unità MissileiBalistici schierate ≥ 3.', attivo: true },

  { obj_id: 'OBJ_IRAN_11', faction: 'Iran',
    nome: 'Corridoio Sciita',
    descrizione: 'Controlla con influenza ≥ 3 contemporaneamente Iran, Iraq e Siria.',
    punti: 9, difficolta: 'difficile', condizione_tipo: 'territorio',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: '{"territories":["Iran","Iraq","Siria"],"all":true,"minInfluence":3}', attivo: true },

  { obj_id: 'OBJ_IRAN_12', faction: 'Iran',
    nome: 'Milizie Proxy sul Campo',
    descrizione: 'Schiera almeno 3 unità Proxy in territori diversi.',
    punti: 5, difficolta: 'media', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Conta unità Proxy in almeno 3 territori diversi a fine partita.', attivo: true },

  { obj_id: 'OBJ_IRAN_13', faction: 'Iran',
    nome: 'Guerra Cyber',
    descrizione: 'Usa la carta CyberIran almeno 3 volte durante la partita.',
    punti: 4, difficolta: 'facile', condizione_tipo: 'carta',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Conta nel log le volte che CyberIran è stata giocata. Devono essere ≥ 3.', attivo: true },

  { obj_id: 'OBJ_IRAN_14', faction: 'Iran',
    nome: 'Signore dello Stretto',
    descrizione: 'Controlla lo Stretto di Hormuz con influenza ≥ 4.',
    punti: 7, difficolta: 'media', condizione_tipo: 'territorio',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: '{"territories":["StrettoHormuz"],"minCount":1,"minInfluence":4}', attivo: true },

  { obj_id: 'OBJ_IRAN_15', faction: 'Iran',
    nome: 'Resistenza Economica',
    descrizione: 'Mantieni le Risorse dell\'Iran a 6 o superiore per almeno 5 turni.',
    punti: 5, difficolta: 'facile', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Conta turni in cui risorse_iran ≥ 6. Devono essere almeno 5.', attivo: true },

  // ════════════════════════════════════════════════════════════════════════════
  // COALIZIONE — 15 obiettivi | target 100 pt | 3 facile · 8 media · 4 difficile
  // ════════════════════════════════════════════════════════════════════════════

  { obj_id: 'OBJ_COAL_01', faction: 'Coalizione',
    nome: 'Nucleare Bloccato',
    descrizione: 'Mantieni il tracciato Nucleare Iraniano a 5 o meno a fine partita.',
    punti: 8, difficolta: 'difficile', condizione_tipo: 'tracciato',
    condizione_campo: 'nucleare', condizione_op: '<=', condizione_valore: 5,
    condizione_note: 'Controlla nucleare a fine partita. Deve essere ≤ 5.', attivo: true },

  { obj_id: 'OBJ_COAL_02', faction: 'Coalizione',
    nome: 'Sanzioni Massime',
    descrizione: 'Porta il tracciato Sanzioni a 8 o superiore.',
    punti: 6, difficolta: 'media', condizione_tipo: 'tracciato',
    condizione_campo: 'sanzioni', condizione_op: '>=', condizione_valore: 8,
    condizione_note: 'Controlla sanzioni a fine partita. Deve essere ≥ 8.', attivo: true },

  { obj_id: 'OBJ_COAL_03', faction: 'Coalizione',
    nome: 'DEFCON Stabile',
    descrizione: 'Mantieni il DEFCON a 3 o superiore per tutta la partita.',
    punti: 5, difficolta: 'facile', condizione_tipo: 'tracciato',
    condizione_campo: 'defcon', condizione_op: '>=', condizione_valore: 3,
    condizione_note: 'Verifica log che DEFCON non sia mai sceso sotto 3.', attivo: true },

  { obj_id: 'OBJ_COAL_04', faction: 'Coalizione',
    nome: 'Superiorità Tecnologica',
    descrizione: 'Porta il tracciato Tecnologia Avanzata Coalizione a 8 o superiore.',
    punti: 6, difficolta: 'media', condizione_tipo: 'tracciato',
    condizione_campo: 'tecnologia_avanzata_coalizione', condizione_op: '>=', condizione_valore: 8,
    condizione_note: 'Controlla tecnologia_avanzata_coalizione a fine partita. Deve essere ≥ 8.', attivo: true },

  { obj_id: 'OBJ_COAL_05', faction: 'Coalizione',
    nome: 'Diplomazia Dominante',
    descrizione: 'Porta il tracciato Influenza Diplomatica Coalizione a 8 o superiore.',
    punti: 6, difficolta: 'media', condizione_tipo: 'tracciato',
    condizione_campo: 'influenza_diplomatica_coalizione', condizione_op: '>=', condizione_valore: 8,
    condizione_note: 'Controlla influenza_diplomatica_coalizione a fine partita. Deve essere ≥ 8.', attivo: true },

  { obj_id: 'OBJ_COAL_06', faction: 'Coalizione',
    nome: 'Supporto Pubblico Consolidato',
    descrizione: 'Mantieni il tracciato Supporto Pubblico Coalizione a 7 o superiore a fine partita.',
    punti: 5, difficolta: 'facile', condizione_tipo: 'tracciato',
    condizione_campo: 'supporto_pubblico_coalizione', condizione_op: '>=', condizione_valore: 7,
    condizione_note: 'Controlla supporto_pubblico_coalizione a fine partita. Deve essere ≥ 7.', attivo: true },

  { obj_id: 'OBJ_COAL_07', faction: 'Coalizione',
    nome: 'Iran Destabilizzato',
    descrizione: 'Riduci la Stabilità dell\'Iran a 3 o meno.',
    punti: 7, difficolta: 'difficile', condizione_tipo: 'tracciato',
    condizione_campo: 'stabilita_iran', condizione_op: '<=', condizione_valore: 3,
    condizione_note: 'Controlla stabilita_iran a fine partita. Deve essere ≤ 3.', attivo: true },

  { obj_id: 'OBJ_COAL_08', faction: 'Coalizione',
    nome: 'Opinione Mondiale Favorevole',
    descrizione: 'Porta il tracciato Opinione Globale a +4 o superiore.',
    punti: 6, difficolta: 'media', condizione_tipo: 'tracciato',
    condizione_campo: 'opinione', condizione_op: '>=', condizione_valore: 4,
    condizione_note: 'Controlla opinione a fine partita. Deve essere ≥ +4.', attivo: true },

  { obj_id: 'OBJ_COAL_09', faction: 'Coalizione',
    nome: 'Accordo Nucleare Storico',
    descrizione: 'Termina la partita con Nucleare ≤ 4 e Sanzioni ≥ 7 simultaneamente.',
    punti: 10, difficolta: 'difficile', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Controlla a fine partita: nucleare ≤ 4 AND sanzioni ≥ 7. Entrambe vere.', attivo: true },

  { obj_id: 'OBJ_COAL_10', faction: 'Coalizione',
    nome: 'Isolamento Diplomatico Russia',
    descrizione: 'Riduci l\'Influenza Diplomatica della Russia a 3 o meno.',
    punti: 7, difficolta: 'difficile', condizione_tipo: 'tracciato',
    condizione_campo: 'influenza_militare_russia', condizione_op: '<=', condizione_valore: 3,
    condizione_note: 'Controlla influenza_militare_russia a fine partita. Deve essere ≤ 3.', attivo: true },

  { obj_id: 'OBJ_COAL_11', faction: 'Coalizione',
    nome: 'Scudo Missilistico Attivo',
    descrizione: 'Schiera almeno 2 unità ScudoMissilistico entro il turno 10.',
    punti: 5, difficolta: 'media', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Controlla log militare: almeno 2 ScudoMissilistico schierate entro turno 10.', attivo: true },

  { obj_id: 'OBJ_COAL_12', faction: 'Coalizione',
    nome: 'Controllo del Golfo',
    descrizione: 'Ottieni influenza ≥ 3 in almeno 3 territori del Golfo Persico.',
    punti: 7, difficolta: 'media', condizione_tipo: 'territorio',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: '{"territories":["Kuwait","Bahrain","Qatar","ArabiaSaudita","EmiratiArabi","Oman"],"minCount":3,"minInfluence":3}', attivo: true },

  { obj_id: 'OBJ_COAL_13', faction: 'Coalizione',
    nome: 'Strike Chirurgico',
    descrizione: 'Esegui almeno 2 attacchi su siti nucleari iraniani (Natanz, Fordow o Teheran).',
    punti: 6, difficolta: 'media', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Conta nel log combattimenti con territorio Natanz, Fordow o Teheran da Coalizione. Devono essere ≥ 2.', attivo: true },

  { obj_id: 'OBJ_COAL_14', faction: 'Coalizione',
    nome: 'Superiorità Militare',
    descrizione: 'Porta le Forze Militari Coalizione a 7 o superiore.',
    punti: 4, difficolta: 'facile', condizione_tipo: 'tracciato',
    condizione_campo: 'forze_militari_coalizione', condizione_op: '>=', condizione_valore: 7,
    condizione_note: 'Controlla forze_militari_coalizione a fine partita. Deve essere ≥ 7.', attivo: true },

  { obj_id: 'OBJ_COAL_15', faction: 'Coalizione',
    nome: 'Hormuz Libero',
    descrizione: 'Mantieni lo Stretto di Hormuz aperto (influenza Coalizione ≥ 3 in StrettoHormuz) a fine partita.',
    punti: 7, difficolta: 'media', condizione_tipo: 'territorio',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: '{"territories":["StrettoHormuz"],"minCount":1,"minInfluence":3}', attivo: true },

  // ════════════════════════════════════════════════════════════════════════════
  // RUSSIA — 15 obiettivi | target 100 pt | 3 facile · 8 media · 4 difficile
  // ════════════════════════════════════════════════════════════════════════════

  { obj_id: 'OBJ_RUSS_01', faction: 'Russia',
    nome: 'Egemonia Militare',
    descrizione: 'Porta il tracciato Influenza Militare Russia a 8 o superiore.',
    punti: 7, difficolta: 'difficile', condizione_tipo: 'tracciato',
    condizione_campo: 'influenza_militare_russia', condizione_op: '>=', condizione_valore: 8,
    condizione_note: 'Controlla influenza_militare_russia a fine partita. Deve essere ≥ 8.', attivo: true },

  { obj_id: 'OBJ_RUSS_02', faction: 'Russia',
    nome: 'Veto Determinante',
    descrizione: 'Usa il Veto ONU almeno 2 volte durante la partita.',
    punti: 5, difficolta: 'facile', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Conta nel log quante volte è stato usato il Veto ONU Russia. Devono essere ≥ 2.', attivo: true },

  { obj_id: 'OBJ_RUSS_03', faction: 'Russia',
    nome: 'Energia come Arma',
    descrizione: 'Mantieni le Risorse Russia a 8 o superiore per almeno 4 turni.',
    punti: 6, difficolta: 'media', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Conta turni in cui risorse_russia ≥ 8. Devono essere almeno 4.', attivo: true },

  { obj_id: 'OBJ_RUSS_04', faction: 'Russia',
    nome: 'Destabilizza l\'Occidente',
    descrizione: 'Riduci il Supporto Pubblico della Coalizione a 4 o meno.',
    punti: 7, difficolta: 'difficile', condizione_tipo: 'tracciato',
    condizione_campo: 'supporto_pubblico_coalizione', condizione_op: '<=', condizione_valore: 4,
    condizione_note: 'Controlla supporto_pubblico_coalizione a fine partita. Deve essere ≤ 4.', attivo: true },

  { obj_id: 'OBJ_RUSS_05', faction: 'Russia',
    nome: 'Stabilità Economica',
    descrizione: 'Porta il tracciato Stabilità Russia a 8 o superiore.',
    punti: 5, difficolta: 'media', condizione_tipo: 'tracciato',
    condizione_campo: 'stabilita_russia', condizione_op: '>=', condizione_valore: 8,
    condizione_note: 'Controlla stabilita_russia a fine partita. Deve essere ≥ 8.', attivo: true },

  { obj_id: 'OBJ_RUSS_06', faction: 'Russia',
    nome: 'Guerra Ibrida',
    descrizione: 'Usa le unità GuerraIbrida in almeno 3 azioni durante la partita.',
    punti: 5, difficolta: 'facile', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Conta nel log le volte che GuerraIbrida è stata usata. Devono essere ≥ 3.', attivo: true },

  { obj_id: 'OBJ_RUSS_07', faction: 'Russia',
    nome: 'Alleanza con Iran',
    descrizione: 'Mantieni un\'alleanza attiva con l\'Iran per almeno 4 turni.',
    punti: 6, difficolta: 'media', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Verifica nel log che l\'alleanza Russia-Iran sia stata attiva per ≥ 4 turni.', attivo: true },

  { obj_id: 'OBJ_RUSS_08', faction: 'Russia',
    nome: 'DEFCON Teso',
    descrizione: 'Porta il DEFCON a 2 o 3 per almeno 2 turni.',
    punti: 7, difficolta: 'difficile', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Conta turni in cui DEFCON era ≤ 3. Devono essere almeno 2.', attivo: true },

  { obj_id: 'OBJ_RUSS_09', faction: 'Russia',
    nome: 'Sottomarini in Missione',
    descrizione: 'Usa le unità SottomariniAKULA in almeno 2 azioni navali.',
    punti: 6, difficolta: 'media', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Conta nel log le volte che SottomariniAKULA sono state usate. Devono essere ≥ 2.', attivo: true },

  { obj_id: 'OBJ_RUSS_10', faction: 'Russia',
    nome: 'Isolamento NATO',
    descrizione: 'Riduci l\'Influenza Diplomatica della Coalizione a 3 o meno.',
    punti: 8, difficolta: 'difficile', condizione_tipo: 'tracciato',
    condizione_campo: 'influenza_diplomatica_coalizione', condizione_op: '<=', condizione_valore: 3,
    condizione_note: 'Controlla influenza_diplomatica_coalizione a fine partita. Deve essere ≤ 3.', attivo: true },

  { obj_id: 'OBJ_RUSS_11', faction: 'Russia',
    nome: 'Presenza nel Mediterraneo',
    descrizione: 'Ottieni influenza ≥ 3 in almeno 2 territori tra Siria, Libano e Turchia.',
    punti: 7, difficolta: 'media', condizione_tipo: 'territorio',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: '{"territories":["Siria","Libano","Turchia"],"minCount":2,"minInfluence":3}', attivo: true },

  { obj_id: 'OBJ_RUSS_12', faction: 'Russia',
    nome: 'Base Navale Tartus',
    descrizione: 'Controlla la Siria con influenza ≥ 4 a fine partita.',
    punti: 7, difficolta: 'media', condizione_tipo: 'territorio',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: '{"territories":["Siria"],"minCount":1,"minInfluence":4}', attivo: true },

  { obj_id: 'OBJ_RUSS_13', faction: 'Russia',
    nome: 'Controllo Narrativo',
    descrizione: 'Porta il tracciato Opinione Globale a 0 o superiore.',
    punti: 5, difficolta: 'media', condizione_tipo: 'tracciato',
    condizione_campo: 'opinione', condizione_op: '>=', condizione_valore: 0,
    condizione_note: 'Controlla opinione a fine partita. Deve essere ≥ 0.', attivo: true },

  { obj_id: 'OBJ_RUSS_14', faction: 'Russia',
    nome: 'Stabilità Iran Alleato',
    descrizione: 'Mantieni la Stabilità dell\'Iran a 5 o superiore per 3 turni.',
    punti: 4, difficolta: 'facile', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Conta turni in cui stabilita_iran ≥ 5. Devono essere almeno 3.', attivo: true },

  { obj_id: 'OBJ_RUSS_15', faction: 'Russia',
    nome: 'Potenza Navale del Mar Nero',
    descrizione: 'Schiera almeno 3 unità SottomariniAKULA durante la partita.',
    punti: 5, difficolta: 'media', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Conta nel log quante unità SottomariniAKULA sono state schierate. Devono essere ≥ 3.', attivo: true },

  // ════════════════════════════════════════════════════════════════════════════
  // CINA — 15 obiettivi | target 100 pt | 3 facile · 8 media · 4 difficile
  // ════════════════════════════════════════════════════════════════════════════

  { obj_id: 'OBJ_CINA_01', faction: 'Cina',
    nome: 'Potenza Economica',
    descrizione: 'Porta le Risorse Cina a 10 o superiore.',
    punti: 6, difficolta: 'media', condizione_tipo: 'tracciato',
    condizione_campo: 'risorse_cina', condizione_op: '>=', condizione_valore: 10,
    condizione_note: 'Controlla risorse_cina a fine partita. Deve essere ≥ 10.', attivo: true },

  { obj_id: 'OBJ_CINA_02', faction: 'Cina',
    nome: 'Via della Seta Securizzata',
    descrizione: 'Porta il tracciato Stabilità Rotte Cina a 8 o superiore.',
    punti: 7, difficolta: 'difficile', condizione_tipo: 'tracciato',
    condizione_campo: 'stabilita_rotte_cina', condizione_op: '>=', condizione_valore: 8,
    condizione_note: 'Controlla stabilita_rotte_cina a fine partita. Deve essere ≥ 8.', attivo: true },

  { obj_id: 'OBJ_CINA_03', faction: 'Cina',
    nome: 'Influenza Commerciale Dominante',
    descrizione: 'Porta il tracciato Influenza Commerciale Cina a 8 o superiore.',
    punti: 7, difficolta: 'difficile', condizione_tipo: 'tracciato',
    condizione_campo: 'influenza_commerciale_cina', condizione_op: '>=', condizione_valore: 8,
    condizione_note: 'Controlla influenza_commerciale_cina a fine partita. Deve essere ≥ 8.', attivo: true },

  { obj_id: 'OBJ_CINA_04', faction: 'Cina',
    nome: 'Cyber Superiorità',
    descrizione: 'Porta il tracciato Cyber Warfare Cina a 8 o superiore.',
    punti: 7, difficolta: 'difficile', condizione_tipo: 'tracciato',
    condizione_campo: 'cyber_warfare_cina', condizione_op: '>=', condizione_valore: 8,
    condizione_note: 'Controlla cyber_warfare_cina a fine partita. Deve essere ≥ 8.', attivo: true },

  { obj_id: 'OBJ_CINA_05', faction: 'Cina',
    nome: 'Neutralità Strategica',
    descrizione: 'Non partecipare ad alcuna alleanza per almeno 5 turni.',
    punti: 5, difficolta: 'media', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Verifica log: Cina senza alleanze attive per almeno 5 turni.', attivo: true },

  { obj_id: 'OBJ_CINA_06', faction: 'Cina',
    nome: 'BRI nel Golfo',
    descrizione: 'Ottieni influenza ≥ 3 in almeno 2 territori tra Golfo e Medio Oriente.',
    punti: 7, difficolta: 'media', condizione_tipo: 'territorio',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: '{"territories":["Iraq","ArabiaSaudita","EmiratiArabi","Oman","Qatar"],"minCount":2,"minInfluence":3}', attivo: true },

  { obj_id: 'OBJ_CINA_07', faction: 'Cina',
    nome: 'Flotta PLA nel Golfo',
    descrizione: 'Schiera almeno 3 unità NavalePLA durante la partita.',
    punti: 6, difficolta: 'media', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Conta nel log le unità NavalePLA schierate. Devono essere ≥ 3.', attivo: true },

  { obj_id: 'OBJ_CINA_08', faction: 'Cina',
    nome: 'Destabilizza Europa',
    descrizione: 'Riduci la Coesione UE a 4 o meno.',
    punti: 7, difficolta: 'difficile', condizione_tipo: 'tracciato',
    condizione_campo: 'coesione_ue_europa', condizione_op: '<=', condizione_valore: 4,
    condizione_note: 'Controlla coesione_ue_europa a fine partita. Deve essere ≤ 4.', attivo: true },

  { obj_id: 'OBJ_CINA_09', faction: 'Cina',
    nome: 'DEFCON sotto Controllo',
    descrizione: 'Mantieni il DEFCON a 3 o superiore per tutta la partita.',
    punti: 5, difficolta: 'media', condizione_tipo: 'tracciato',
    condizione_campo: 'defcon', condizione_op: '>=', condizione_valore: 3,
    condizione_note: 'Verifica log: DEFCON mai sceso sotto 3.', attivo: true },

  { obj_id: 'OBJ_CINA_10', faction: 'Cina',
    nome: 'Mediatore di Pace',
    descrizione: 'Usa almeno 2 carte diplomatiche in turni in cui il DEFCON era ≤ 3.',
    punti: 8, difficolta: 'difficile', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Verifica log: almeno 2 carte diplomatiche usate con DEFCON ≤ 3.', attivo: true },

  { obj_id: 'OBJ_CINA_11', faction: 'Cina',
    nome: 'Accordo Commerciale con Iran',
    descrizione: 'Porta le Risorse Iran a 7 o superiore (Cina come partner economico).',
    punti: 6, difficolta: 'media', condizione_tipo: 'tracciato',
    condizione_campo: 'risorse_iran', condizione_op: '>=', condizione_valore: 7,
    condizione_note: 'Controlla risorse_iran a fine partita. Deve essere ≥ 7.', attivo: true },

  { obj_id: 'OBJ_CINA_12', faction: 'Cina',
    nome: 'Progetto BRI Completato',
    descrizione: 'Usa almeno 3 carte con effetto economia positiva per la Cina.',
    punti: 6, difficolta: 'media', condizione_tipo: 'carta',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Conta carte che hanno aumentato Risorse o Influenza Commerciale Cina. Devono essere ≥ 3.', attivo: true },

  { obj_id: 'OBJ_CINA_13', faction: 'Cina',
    nome: 'Stabilità Regionale',
    descrizione: 'Mantieni la Stabilità di almeno 3 fazioni a 5 o superiore a fine partita.',
    punti: 9, difficolta: 'difficile', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Conta fazioni con stabilita ≥ 5 a fine partita. Ne servono almeno 3.', attivo: true },

  { obj_id: 'OBJ_CINA_14', faction: 'Cina',
    nome: 'Cyber Army Attiva',
    descrizione: 'Usa le unità CyberCina in almeno 3 azioni durante la partita.',
    punti: 4, difficolta: 'facile', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Conta nel log le volte che CyberCina è stata usata. Devono essere ≥ 3.', attivo: true },

  { obj_id: 'OBJ_CINA_15', faction: 'Cina',
    nome: 'Porto Strategico',
    descrizione: 'Ottieni influenza ≥ 4 in almeno 1 territorio navale (Oman, EmiratiArabi, Qatar, Bahrain).',
    punti: 5, difficolta: 'facile', condizione_tipo: 'territorio',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: '{"territories":["Oman","EmiratiArabi","Qatar","Bahrain"],"minCount":1,"minInfluence":4}', attivo: true },

  // ════════════════════════════════════════════════════════════════════════════
  // EUROPA — 15 obiettivi | target 100 pt | 3 facile · 8 media · 4 difficile
  // ════════════════════════════════════════════════════════════════════════════

  { obj_id: 'OBJ_EU_01', faction: 'Europa',
    nome: 'Diplomazia Attiva',
    descrizione: 'Porta il tracciato Influenza Diplomatica Europa a 8 o superiore.',
    punti: 7, difficolta: 'difficile', condizione_tipo: 'tracciato',
    condizione_campo: 'influenza_diplomatica_europa', condizione_op: '>=', condizione_valore: 8,
    condizione_note: 'Controlla influenza_diplomatica_europa a fine partita. Deve essere ≥ 8.', attivo: true },

  { obj_id: 'OBJ_EU_02', faction: 'Europa',
    nome: 'Aiuti Umanitari',
    descrizione: 'Porta il tracciato Aiuti Umanitari Europa a 8 o superiore.',
    punti: 6, difficolta: 'media', condizione_tipo: 'tracciato',
    condizione_campo: 'aiuti_umanitari_europa', condizione_op: '>=', condizione_valore: 8,
    condizione_note: 'Controlla aiuti_umanitari_europa a fine partita. Deve essere ≥ 8.', attivo: true },

  { obj_id: 'OBJ_EU_03', faction: 'Europa',
    nome: 'Coesione Interna',
    descrizione: 'Mantieni la Coesione UE a 8 o superiore per almeno 4 turni.',
    punti: 6, difficolta: 'media', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Conta turni in cui coesione_ue_europa ≥ 8. Devono essere ≥ 4.', attivo: true },

  { obj_id: 'OBJ_EU_04', faction: 'Europa',
    nome: 'Sanzioni Moderate',
    descrizione: 'Mantieni il tracciato Sanzioni tra 4 e 7 per almeno 5 turni.',
    punti: 6, difficolta: 'media', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Conta turni in cui Sanzioni tra 4 e 7. Devono essere almeno 5.', attivo: true },

  { obj_id: 'OBJ_EU_05', faction: 'Europa',
    nome: 'DEFCON Verde',
    descrizione: 'Porta il DEFCON a 5 per almeno 2 turni.',
    punti: 5, difficolta: 'facile', condizione_tipo: 'tracciato',
    condizione_campo: 'defcon', condizione_op: '>=', condizione_valore: 5,
    condizione_note: 'Controlla log quante volte DEFCON era 5. Devono essere almeno 2 turni.', attivo: true },

  { obj_id: 'OBJ_EU_06', faction: 'Europa',
    nome: 'Multilateralismo Vincente',
    descrizione: 'Porta il tracciato Opinione Globale a +4 o superiore con almeno 3 carte diplomatiche EU.',
    punti: 8, difficolta: 'difficile', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Verifica: opinione ≥ +4 a fine partita E almeno 3 carte diplomatiche EU usate.', attivo: true },

  { obj_id: 'OBJ_EU_07', faction: 'Europa',
    nome: 'Stabilità Energetica',
    descrizione: 'Porta il tracciato Risorse Europa a 8 o superiore.',
    punti: 5, difficolta: 'media', condizione_tipo: 'tracciato',
    condizione_campo: 'risorse_europa', condizione_op: '>=', condizione_valore: 8,
    condizione_note: 'Controlla risorse_europa a fine partita. Deve essere ≥ 8.', attivo: true },

  { obj_id: 'OBJ_EU_08', faction: 'Europa',
    nome: 'Peacekeeping',
    descrizione: 'Schiera almeno 4 unità Peacekeeping durante la partita.',
    punti: 5, difficolta: 'media', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Conta nel log militare le unità Peacekeeping schierate. Devono essere ≥ 4.', attivo: true },

  { obj_id: 'OBJ_EU_09', faction: 'Europa',
    nome: 'Accordo Finale',
    descrizione: 'Termina la partita con DEFCON ≥ 4, Sanzioni tra 3 e 6, e Opinione Globale ≥ 0.',
    punti: 10, difficolta: 'difficile', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Controlla a fine partita: DEFCON ≥ 4 AND sanzioni tra 3 e 6 AND opinione ≥ 0. Tutte e tre.', attivo: true },

  { obj_id: 'OBJ_EU_10', faction: 'Europa',
    nome: 'Destabilizza Russia Diplomaticamente',
    descrizione: 'Riduci l\'Influenza Militare Russia a 3 o meno con azioni diplomatiche.',
    punti: 8, difficolta: 'difficile', condizione_tipo: 'tracciato',
    condizione_campo: 'influenza_militare_russia', condizione_op: '<=', condizione_valore: 3,
    condizione_note: 'Controlla influenza_militare_russia a fine partita. Deve essere ≤ 3.', attivo: true },

  { obj_id: 'OBJ_EU_11', faction: 'Europa',
    nome: 'Stabilità Iran',
    descrizione: 'Porta la Stabilità dell\'Iran a 7 o superiore (Europa come mediatore).',
    punti: 6, difficolta: 'media', condizione_tipo: 'tracciato',
    condizione_campo: 'stabilita_iran', condizione_op: '>=', condizione_valore: 7,
    condizione_note: 'Controlla stabilita_iran a fine partita. Deve essere ≥ 7.', attivo: true },

  { obj_id: 'OBJ_EU_12', faction: 'Europa',
    nome: 'Peacekeeping nel Levante',
    descrizione: 'Ottieni influenza ≥ 3 in almeno 2 territori tra Libano, Siria e Giordania.',
    punti: 7, difficolta: 'media', condizione_tipo: 'territorio',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: '{"territories":["Libano","Siria","Giordania"],"minCount":2,"minInfluence":3}', attivo: true },

  { obj_id: 'OBJ_EU_13', faction: 'Europa',
    nome: 'Fianco Sud NATO Protetto',
    descrizione: 'Ottieni influenza ≥ 3 in Turchia.',
    punti: 7, difficolta: 'media', condizione_tipo: 'territorio',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: '{"territories":["Turchia"],"minCount":1,"minInfluence":3}', attivo: true },

  { obj_id: 'OBJ_EU_14', faction: 'Europa',
    nome: 'Accordo Diplomatico',
    descrizione: 'Usa almeno 1 carta diplomatica che riduce il DEFCON o stabilizza una fazione.',
    punti: 4, difficolta: 'facile', condizione_tipo: 'carta',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Conta nel log le carte diplomatiche EU che hanno ridotto DEFCON o aumentato stabilità. ≥ 1.', attivo: true },

  { obj_id: 'OBJ_EU_15', faction: 'Europa',
    nome: 'Alleanza con Coalizione',
    descrizione: 'Mantieni un\'alleanza attiva con la Coalizione per almeno 5 turni.',
    punti: 5, difficolta: 'facile', condizione_tipo: 'manuale',
    condizione_campo: null, condizione_op: null, condizione_valore: null,
    condizione_note: 'Verifica nel log che l\'alleanza Europa-Coalizione sia stata attiva per ≥ 5 turni.', attivo: true },

];

// ── Helpers ───────────────────────────────────────────────────────────────────

export type ObjFazione =
  | 'Iran' | 'Coalizione' | 'Russia' | 'Cina' | 'Europa';

export const getObiettiviPerFazione = (faction: string): ObiettivoSegreto[] =>
  TUTTI_GLI_OBIETTIVI.filter(o => o.faction === faction && o.attivo);

export const getObiettivoById = (obj_id: string): ObiettivoSegreto | undefined =>
  TUTTI_GLI_OBIETTIVI.find(o => o.obj_id === obj_id);

export function estraiObiettiviRandom(
  faction: ObjFazione,
  numDraw = 3,
): ObiettivoSegreto[] {
  const pool = TUTTI_GLI_OBIETTIVI.filter(o => o.faction === faction && o.attivo);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, numDraw);
}

// Alias per retrocompatibilità con onlineGameStore.ts
export const assignObjectives = estraiObiettiviRandom;

// ── Tipo difficoltà ───────────────────────────────────────────────────────────
export type ObjDifficolta = 'facile' | 'media' | 'difficile';

// ── Colori e flag per fazione ─────────────────────────────────────────────────
export const OBJ_FACTION_COLORS: Record<ObjFazione, string> = {
  Iran:       '#22c55e',
  Coalizione: '#3b82f6',
  Russia:     '#ef4444',
  Cina:       '#f59e0b',
  Europa:     '#8b5cf6',
};

export const OBJ_FACTION_FLAGS: Record<ObjFazione, string> = {
  Iran:       '🇮🇷',
  Coalizione: '🇺🇸',
  Russia:     '🇷🇺',
  Cina:       '🇨🇳',
  Europa:     '🇪🇺',
};

// ── Colori e icone per difficoltà ─────────────────────────────────────────────
export const OBJ_DIFFICOLTA_COLORS: Record<ObjDifficolta, string> = {
  facile:    '#22c55e',
  media:     '#f59e0b',
  difficile: '#ef4444',
};

export const OBJ_DIFFICOLTA_ICONS: Record<ObjDifficolta, string> = {
  facile:    '⭐',
  media:     '⭐⭐',
  difficile: '⭐⭐⭐',
};
