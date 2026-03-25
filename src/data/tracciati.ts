// ─────────────────────────────────────────────────────────────────
// DATI TRACCIATI — Linea Rossa
// ─────────────────────────────────────────────────────────────────

export type ZonaColore = 'safe' | 'watch' | 'caution' | 'danger' | 'critical' | 'neutral' | 'coalition';

export interface ZonaTracciato {
  da: number;
  a: number;
  label: string;
  sottotitolo: string;
  colore: ZonaColore;
  icona: string;
  scenario: string;
  carteChiave: string[];
  condizioniVittoria: string;
  costoIran: string;
  costoCoalizione: string;
  noteStrategiche: string;
}

export interface Tracciato {
  id: string;
  nome: string;
  sigla: string;
  icona: string;
  min: number;
  max: number;
  descrizione: string;
  direzioneIran: string;
  direzioneCoalizione: string;
  zone: ZonaTracciato[];
}

// ── 1. NUCLEARE IRANIANO ──────────────────────────────────────────
export const trackNucleare: Tracciato = {
  id: 'nucleare',
  nome: 'Tracciato Nucleare Iraniano',
  sigla: 'TNI',
  icona: '☢️',
  min: 1,
  max: 15,
  descrizione: 'Misura il progresso del programma nucleare iraniano verso la bomba atomica.',
  direzioneIran: 'Aumentare verso 15 → Breakout Nucleare',
  direzioneCoalizione: 'Tenere sotto 8 → Impedire la bomba',
  zone: [
    {
      da: 1, a: 3, label: 'Ricerca Civile', sottotitolo: '🟢 Nessuna Minaccia', colore: 'safe', icona: '🔬',
      scenario: 'Il programma nucleare iraniano è nella sua fase embrionale. Le attività si limitano alla ricerca scientifica civile e alla produzione di energia. Nessun sito militare segreto è stato identificato.',
      carteChiave: ['Reattore Arak (IR-40): +1 TNI se giocata', 'Impianto Fordow: bloccato', 'AIEA Ispezioni: –1 TNI se approvate'],
      condizioniVittoria: 'Nessuna condizione di vittoria/sconfitta attivata. Iran deve investire in ricerca.',
      costoIran: 'Carte nucleari costano +1 risorsa extra (fase iniziale lenta).',
      costoCoalizione: 'Nessuna pressione necessaria. Sanzioni a efficacia ridotta (nessuna urgenza).',
      noteStrategiche: 'Zona di quiete. La Coalizione può ignorare il nucleare e puntare su altre strategie.',
    },
    {
      da: 4, a: 6, label: 'Arricchimento Iniziale', sottotitolo: '🟡 Sorveglianza', colore: 'watch', icona: '⚗️',
      scenario: 'Iran inizia ad arricchire uranio al 4-20%. Centrifughe IR-1 in funzione a Natanz. AIEA registra le prime anomalie. Le agenzie di intelligence aumentano la sorveglianza.',
      carteChiave: ['Centrifughe IR-1: +1 TNI per turno', 'Accordo JCPOA: –2 TNI se approvato', 'Sabotaggio Natanz: –1 TNI', 'Sorveglianza Mossad: rivela posizione impianti'],
      condizioniVittoria: 'Nessuna. Entrambe le parti in posizione di attesa.',
      costoIran: 'Carte nucleari a costo standard. Possibile avanzare di 1-2 livelli/turno.',
      costoCoalizione: 'Sanzioni moderate efficaci. Carta "Pressione AIEA" attivabile.',
      noteStrategiche: 'Punto di svolta: la Coalizione deve decidere se negoziare ora o aspettare.',
    },
    {
      da: 7, a: 9, label: 'Soglia Critica', sottotitolo: '🟠 Allarme', colore: 'caution', icona: '⚠️',
      scenario: 'Arricchimento al 60-90%. Centrifughe avanzate IR-6. Sito segreto scoperto. Israele e USA in allerta massima. Il Consiglio di Sicurezza ONU convoca riunione d\'emergenza.',
      carteChiave: ['Centrifughe IR-6: +2 TNI/turno', 'Strike Chirurgico Israele: –3 TNI', 'Escalation Imprevista: +1 TNI extra', 'Guardie Rivoluzionarie IRGC: protezione impianti'],
      condizioniVittoria: 'Se TNI ≥ 8 per 2 turni senza accordo: DEFCON –1 automatico.',
      costoIran: 'Carte nucleari a costo ridotto (–1 risorsa). Massima priorità.',
      costoCoalizione: 'Ogni turno senza azione: TNI può avanzare. Pressione massima.',
      noteStrategiche: 'ZONA ROSSA: Ogni decisione conta. Israele può attivare strike preventivo.',
    },
    {
      da: 10, a: 12, label: 'Arricchimento 90%', sottotitolo: '🔴 Crisi', colore: 'danger', icona: '💣',
      scenario: 'Uranio arricchito al 90% (qualità militare). Iran ha materiale per 1-2 ordigni. Possibile test nei prossimi mesi. Sanzioni massime già in vigore. Israele mobilita forze aeree.',
      carteChiave: ['Test Sotterraneo: +3 TNI', 'Operazione Speciale: –4 TNI ma DEFCON –2', 'Sanzioni SWIFT: –1 risorsa Iran/turno', 'Accordo di Emergenza: –3 TNI se tutte le fazioni accettano'],
      condizioniVittoria: 'Iran a 10+ per 1 turno: Coalizione deve fare un\'azione militare o perdere 2 punti.',
      costoIran: 'Carte nucleari GRATUITE (investimento massiccio). Priorità assoluta.',
      costoCoalizione: 'Strike militare Coalizione: disponibile senza penalità diplomatiche.',
      noteStrategiche: 'Finestra critica: un accordo ora è l\'ultima possibilità prima del breakout.',
    },
    {
      da: 13, a: 14, label: 'Test Imminente', sottotitolo: '💀 Pericolo Estremo', colore: 'critical', icona: '☢️',
      scenario: 'Iran ha assemblato un ordigno nucleare rudimentale. Test atomico sotterraneo imminente. Il mondo trattiene il respiro. Tutte le diplomazie in allerta rossa. DEFCON a 2.',
      carteChiave: ['Test Nucleare: +1 TNI → raggiunge 15 automaticamente', 'Strike Massiccio: possibile solo ora (–5 TNI, DEFCON –3)', 'Negoziato Disperato: –3 TNI ma Iran ottiene concessioni massime'],
      condizioniVittoria: 'Iran VINCE se raggiunge 15 nel turno successivo. Coalizione deve fermare il test.',
      costoIran: 'Tutto è gratuito. L\'Iran è in modalità breakout totale.',
      costoCoalizione: 'Tutte le risorse devono essere usate per fermare il test.',
      noteStrategiche: 'ⓘ ULTIMO TURNO UTILE per la Coalizione. Ogni azione ha conseguenze enormi.',
    },
    {
      da: 15, a: 15, label: '☢️ BREAKOUT NUCLEARE', sottotitolo: '💀 FINE PARTITA', colore: 'critical', icona: '☢️',
      scenario: 'IRAN HA LA BOMBA. L\'Iran ha condotto con successo il primo test nucleare. La regione è sconvolta. Il deterrente nucleare cambia gli equilibri geopolitici per sempre.',
      carteChiave: ['PARTITA TERMINATA — Iran vince con obiettivo nucleare', 'Arabia Saudita avvia programma nucleare proprio', 'Israele in stato di guerra'],
      condizioniVittoria: '🏆 IRAN VINCE — L\'obiettivo nucleare è stato raggiunto. Tutti gli altri giocatori perdono.',
      costoIran: '—',
      costoCoalizione: '—',
      noteStrategiche: 'Fine partita. L\'Iran ha ottenuto la deterrenza nucleare.',
    },
  ],
};

// ── 2. SANZIONI — STABILITÀ ECONOMICA ────────────────────────────
export const trackSanzioni: Tracciato = {
  id: 'sanzioni',
  nome: 'Sanzioni / Stabilità Economica',
  sigla: 'TSE',
  icona: '💰',
  min: 1,
  max: 10,
  descrizione: 'Misura la pressione economica sull\'Iran. 1 = collasso economico, 10 = economia fiorente.',
  direzioneIran: 'Aumentare verso 10 → Economia libera dalle sanzioni',
  direzioneCoalizione: 'Tenere tra 1-4 → Pressione economica massima',
  zone: [
    {
      da: 1, a: 2, label: 'Collasso Economico', sottotitolo: '💀 Regime in Crisi', colore: 'critical', icona: '📉',
      scenario: 'L\'economia iraniana è in ginocchio. Iperinflazione, disoccupazione di massa, carenza di beni essenziali. Il regime è sotto massima pressione interna.',
      carteChiave: ['Economia di Resistenza: +2 TSE (unica via di recupero)', 'Proteste Popolari: effetto doppio', 'Accordo Petrolifero Cina: +3 TSE se giocato'],
      condizioniVittoria: 'TSE ≤ 2 per 3 turni consecutivi → possibilità collasso regime (condizione vittoria Coalizione).',
      costoIran: 'Iran non può giocare carte nucleari costose. Solo carte da 0-1 OP disponibili.',
      costoCoalizione: 'Sanzioni non devono essere rinforzate (già massime). Risorse libere per altri fronti.',
      noteStrategiche: 'La Coalizione è vicina alla vittoria per collasso economico. Iran deve sbloccare accordi petroliferi.',
    },
    {
      da: 3, a: 4, label: 'Pressione Intensa', sottotitolo: '🔴 Economia in Crisi', colore: 'danger', icona: '⛽',
      scenario: 'Sanzioni SWIFT attive. Petrolio non esportabile nei mercati standard. Iran usa canali alternativi (Cina, Russia). Economia in forte difficoltà ma regime regge.',
      carteChiave: ['Contrabbando Petrolio: +2 TSE', 'Embargo Petrolio: –2 TSE', 'Belt and Road Iran: +3 TSE se Cina lo gioca'],
      condizioniVittoria: 'Nessuna immediata. Iran vulnerabile a ulteriori pressioni.',
      costoIran: 'Carte da 3+ OP bloccate. Solo azioni di sopravvivenza economica.',
      costoCoalizione: 'Sanzioni secondarie efficaci. Coalizione può applicare embargo con –1 costo.',
      noteStrategiche: 'Zona di vulnerabilità Iran: le sanzioni hanno il massimo impatto qui.',
    },
    {
      da: 5, a: 6, label: 'Equilibrio Precario', sottotitolo: '🟡 Economia in Difficoltà', colore: 'caution', icona: '⚖️',
      scenario: 'L\'economia iraniana sopravvive grazie ai proventi petroliferi verso Cina e Russia. Le sanzioni mordono ma non spezzano il regime. Negoziati diplomatici in corso.',
      carteChiave: ['Accordo JCPOA: +2 TSE', 'Sanzioni SWIFT: –2 TSE', 'Mediazione UE: possibile accordo'],
      condizioniVittoria: 'Nessuna condizione attivata. Zona di equilibrio fragile.',
      costoIran: 'Tutte le carte disponibili. Operatività normale.',
      costoCoalizione: 'Sanzioni a efficacia standard. Nuove sanzioni richiedono sforzo diplomatico.',
      noteStrategiche: 'Punto di equilibrio. Entrambe le parti possono romperlo in un senso o nell\'altro.',
    },
    {
      da: 7, a: 8, label: 'Ripresa Economica', sottotitolo: '🟢 Economia Stabilizzata', colore: 'watch', icona: '📈',
      scenario: 'Iran ha aggirati i canali delle sanzioni. Accordi petroliferi con Cina (25 anni) attivi. Valuta stabile. La pressione economica della Coalizione è ridotta.',
      carteChiave: ['Accordo Petrolifero 25 Anni: massima resa', 'Sanzioni secondarie: efficacia dimezzata', 'Investimenti Cina: +1 TSE/turno'],
      condizioniVittoria: 'Iran può ora investire risorse nel nucleare. Rischio escalation.',
      costoIran: 'Risorse abbondanti. Iran può finanziare sia nucleare che proxy (Hezbollah, Houthi).',
      costoCoalizione: 'Sanzioni quasi inefficaci. Necessario cambio di strategia.',
      noteStrategiche: 'Iran ha superato la pressione economica. La Coalizione deve usare strumenti militari.',
    },
    {
      da: 9, a: 10, label: 'Economia Fiorente', sottotitolo: '🏆 Iran Libero', colore: 'safe', icona: '💎',
      scenario: 'Iran ha completamente aggirato le sanzioni. Petrolio venduto liberamente attraverso canali alternativi. Economia in crescita. Regime consolidato. Le sanzioni Coalizione sono simboliche.',
      carteChiave: ['Sanzioni Coalizione: completamente inefficaci', 'Iran può finanziare 3 fronti contemporaneamente', 'Nucleare: avanza senza rallentamenti economici'],
      condizioniVittoria: 'Iran con TSE 9-10 per 2 turni: guadagna +1 punto vittoria/turno (economia resiliente).',
      costoIran: 'Tutte le carte disponibili senza limiti. Massima flessibilità.',
      costoCoalizione: 'Sanzioni inutili. Coalizione deve usare solo strumenti militari o diplomatici.',
      noteStrategiche: 'Iran in posizione di forza totale. La Coalizione ha fallito sul fronte economico.',
    },
  ],
};

// ── 3. OPINIONE GLOBALE ───────────────────────────────────────────
export const trackOpinione: Tracciato = {
  id: 'opinione',
  nome: 'Opinione Globale',
  sigla: 'TOG',
  icona: '🌍',
  min: -10,
  max: 10,
  descrizione: 'Misura il consenso internazionale. Negativo = pro-Iran, Positivo = pro-Coalizione.',
  direzioneIran: 'Portare verso –10 → Iran favorito diplomaticamente',
  direzioneCoalizione: 'Portare verso +10 → Coalizione favorita',
  zone: [
    {
      da: -10, a: -5, label: 'Egemonia Iran', sottotitolo: '🔴 Coalizione Isolata', colore: 'danger', icona: '📺',
      scenario: 'L\'opinione mondiale è pro-Iran. La Coalizione è vista come aggressore imperialista. Il Sud Globale supporta attivamente l\'Iran. Sanzioni trovano opposizione internazionale.',
      carteChiave: ['Propaganda RT: +2 TOG automatico', 'Propaganda Mediatica Iran: +2 TOG/turno', 'Carte media Coalizione: dimezzate in efficacia'],
      condizioniVittoria: 'Iran blocca risoluzioni ONU senza bisogno del veto Russia-Cina. Diplomazia totalmente favorevole.',
      costoIran: 'Carte diplomatiche costano 0 risorse. Massima libertà diplomatica.',
      costoCoalizione: 'Ogni carta offensiva causa –1 TOG extra. Coalizione internazionalmente isolata.',
      noteStrategiche: 'La Coalizione non può approvare risoluzioni. Sanzioni secondarie inefficaci. Iran domina.',
    },
    {
      da: -4, a: -1, label: 'Favore Iran', sottotitolo: '🟠 Pressione su Coalizione', colore: 'caution', icona: '🗣️',
      scenario: 'Maggioranza del Sud Globale supporta Iran. Media internazionali tendenzialmente pro-Iran. Europa in posizione di neutralità. USA e Israele in posizione difensiva mediatica.',
      carteChiave: ['Carte media Iran: +1 TOG extra', 'Accordo Abraham Espanso: nessun bonus TOG', 'Aiuti Umanitari UE: +2 TOG'],
      condizioniVittoria: 'Nessuna vittoria immediata. Coalizione deve investire in media per recuperare.',
      costoIran: 'Carte diplomatiche –1 costo risorsa. Carte media Iran gratuite.',
      costoCoalizione: 'Sanzioni costano +1 risorsa extra. Difficile ottenere consenso ONU.',
      noteStrategiche: 'Iran ha vantaggio diplomatico. Coalizione deve giocare almeno 2 carte media per recuperare.',
    },
    {
      da: 0, a: 0, label: 'Equilibrio', sottotitolo: '⚪ Status Quo', colore: 'neutral', icona: '⚖️',
      scenario: 'Nessuna parte ha vantaggio mediatico. Ogni azione diplomatica deve guadagnarsi il consenso da zero. Mondo spaccato tra chi supporta Iran e chi supporta la Coalizione.',
      carteChiave: ['Tutte le carte a efficacia base', 'Nessun bonus/malus da TOG', 'Momento ideale per negoziati'],
      condizioniVittoria: 'Nessuna modifica alle condizioni di vittoria.',
      costoIran: 'Costo standard per tutte le fazioni.',
      costoCoalizione: 'Ogni azione diplomatica parte da zero.',
      noteStrategiche: 'Momento ideale per negoziati: nessun vantaggio reputazionale. Accordi più facili.',
    },
    {
      da: 1, a: 4, label: 'Favore Coalizione', sottotitolo: '🟡 Opinione Favorevole', colore: 'watch', icona: '📡',
      scenario: 'Maggioranza delle democrazie occidentali supporta la Coalizione. Le sanzioni trovano più consenso. Iran è visto come violatore del diritto internazionale.',
      carteChiave: ['Carte sanzioni Coalizione: –1 costo', 'Pressione ONU: +2 TOG', 'Carte media Iran: –1 efficacia'],
      condizioniVittoria: 'Coalizione ha vantaggio nell\'approvare risoluzioni. Veti Russia-Cina meno efficaci.',
      costoIran: 'Iran spende +1 risorsa su carte diplomatiche. Carte media Iran costano +1.',
      costoCoalizione: 'Risoluzioni ONU passano più facilmente. Sanzioni senza opposizione significativa.',
      noteStrategiche: 'Zona favorevole Coalizione per approvare nuove sanzioni e risoluzioni ONU.',
    },
    {
      da: 5, a: 10, label: 'Egemonia Coalizione', sottotitolo: '🔴 Iran Isolato', colore: 'coalition', icona: '🗽',
      scenario: 'Iran visto come paria internazionale. Paesi neutrali si allineano con Coalizione. Media globali anti-Iran. Solo Russia e Cina si oppongono ma senza impatto significativo.',
      carteChiave: ['Carte media Coalizione CNN/VOA: +1 TOG extra', 'Lobby AIPAC: bonus extra attivo', 'Isolamento Diplomatico: Iran perde 1 alleato/turno', 'Embargo Totale: attivabile senza penalità (se TOG ≥ 8)'],
      condizioniVittoria: 'TOG ≥ 8 per 2 turni: Coalizione guadagna 2 punti vittoria extra. Sanzioni approvate automaticamente.',
      costoIran: 'Carte diplomatiche costano +2 risorse. Carte media costano il doppio.',
      costoCoalizione: 'Iran quasi diplomaticamente isolato. Ogni azione Iran –2 punti.',
      noteStrategiche: 'Iran può solo affidarsi a Cina e Russia. Coalizione ha piena libertà diplomatica.',
    },
  ],
};

// ── 4. TENSIONE DEFCON ────────────────────────────────────────────
export const trackDefcon: Tracciato = {
  id: 'defcon',
  nome: 'Tensione DEFCON',
  sigla: 'DEFCON',
  icona: '⚔️',
  min: 1,
  max: 5,
  descrizione: 'Misura la tensione militare globale. 5 = pace, 1 = guerra termonucleare (tutti perdono).',
  direzioneIran: 'Abbassare verso 1 → Rischio guerra massimo',
  direzioneCoalizione: 'Mantenere a 4-5 → Pace e diplomazia',
  zone: [
    {
      da: 5, a: 5, label: 'Pace Stabile', sottotitolo: '🟢 Nessun Rischio Guerra', colore: 'safe', icona: '🕊️',
      scenario: 'Clima di distensione generale. Truppe in luoghi di pace. Negoziati attivi. Nessuna tensione militare significativa. Le diplomazie lavorano attivamente.',
      carteChiave: ['Carte diplomatiche: +1 efficacia', 'Carte militari offensive: bloccate (penalità –3 Opinione)', 'Conferenza di Pace: attivabile gratuitamente'],
      condizioniVittoria: 'Nessuna condizione di sconfitta attivata. Iran non può fare mosse militari.',
      costoIran: 'Carte militari offensive costano +2 risorse. Carta "Negoziati Nucleari" dà +2 risorse.',
      costoCoalizione: 'Carte offensive Coalizione causano –2 Opinione se giocate a DEFCON 5.',
      noteStrategiche: 'DEFCON 5 è il livello ideale per accordi. Ogni escalation è penalizzata.',
    },
    {
      da: 4, a: 4, label: 'Tensione Latente', sottotitolo: '🟡 Situazione di Guardia', colore: 'watch', icona: '🔭',
      scenario: 'Allerta militare in alcune aree. Pattugliamenti intensificati. Incidenti isolati. Le diplomazie lavorano per prevenire escalation. Normalità operativa.',
      carteChiave: ['Pattugliamento navale: costo normale', 'Portaerei nel Golfo: –1 DEFCON automatico', 'Carte diplomatiche: a efficacia piena'],
      condizioniVittoria: 'Nessuna condizione di vittoria/sconfitta immediata.',
      costoIran: 'Costo standard per tutte le carte militari Iran.',
      costoCoalizione: 'Sanzioni economiche applicabili senza penalità. Operatività normale.',
      noteStrategiche: 'Zona di normale operatività. Tutte le carte disponibili senza penalità.',
    },
    {
      da: 3, a: 3, label: 'Alta Tensione', sottotitolo: '🟠 Rischio Conflitto', colore: 'caution', icona: '🚨',
      scenario: 'Incidenti navali. Droni abbattuti. Missili testati. Alleati in stato di allerta. La Coalizione valuta opzioni militari. Crisi diplomatica in corso.',
      carteChiave: ['Strike Chirurgico: attivabile senza penalità', 'Attacco Houthi Mar Rosso: –2 DEFCON invece di –1', 'Escalation Imprevista: effetto raddoppiato'],
      condizioniVittoria: 'Se DEFCON scende a 2 nel turno successivo senza accordo → crisi immediata.',
      costoIran: 'Carte militari costano –1 risorsa (urgenza guerra). Blocco Hormuz attivabile.',
      costoCoalizione: 'Strike aereo Coalizione attivato. Operazione Aerea Mirata a piena efficacia.',
      noteStrategiche: 'PUNTO CRITICO: ogni carta militare rischia di far precipitare la situazione.',
    },
    {
      da: 2, a: 2, label: 'Guerra Imminente', sottotitolo: '🔴 Crisi Totale', colore: 'danger', icona: '💥',
      scenario: 'Forze armate in posizione d\'attacco. Bombardamenti su siti nucleari. Mobilizzazione generale. Asse della Resistenza (Hezbollah, Houthi) completamente attivato.',
      carteChiave: ['Test Nucleare Sotterraneo: +3 TNI invece di +2', 'Operazione Speciale Fallita: scala a DEFCON 1', 'Accordo diplomatico: guadagna +3 DEFCON'],
      condizioniVittoria: 'Se nessun accordo entro 1 turno → DEFCON 1 automatico. Iran può giocare "Breakout Nucleare".',
      costoIran: 'Iran può giocare carte militari GRATUITAMENTE. Tutto per la guerra.',
      costoCoalizione: 'USA può dichiarare stato di guerra. Tutte le carte Coalizione offensive sono gratuite.',
      noteStrategiche: 'Situazione borderline. Un singolo evento può innescare la guerra termonucleare.',
    },
    {
      da: 1, a: 1, label: '☢️ GUERRA', sottotitolo: '💀 TUTTI PERDONO', colore: 'critical', icona: '💀',
      scenario: 'La guerra è scoppiata. Attacchi missilistici massicci. Risposta nucleare. PARTITA TERMINATA — Nessuna vittoria per nessuna fazione.',
      carteChiave: ['PARTITA TERMINATA IMMEDIATAMENTE', 'Tutte le carte sono inutili', 'Nessun punteggio viene conteggiato'],
      condizioniVittoria: '💀 SCONFITTA TOTALE — Tutte le fazioni perdono. Il tavolo è perdente collettivamente.',
      costoIran: '—',
      costoCoalizione: '—',
      noteStrategiche: 'Condizione da evitare assolutamente. Nessuno vince a DEFCON 1. Il gioco finisce qui.',
    },
  ],
};

// ── 5. RISORSE ECONOMICHE ─────────────────────────────────────────
export const trackRisorse: Tracciato = {
  id: 'risorse',
  nome: 'Risorse Economiche',
  sigla: 'RE',
  icona: '💵',
  min: 1,
  max: 10,
  descrizione: 'Ogni fazione ha il proprio tracciato risorse. Determina quante e quali carte si possono giocare.',
  direzioneIran: 'Mantenere proprie risorse a 7-10 → Massima flessibilità',
  direzioneCoalizione: 'Ridurre risorse Iran a 1-3 → Paralisi del regime',
  zone: [
    {
      da: 1, a: 2, label: 'Bancarotta', sottotitolo: '💀 Fazione in Crisi', colore: 'critical', icona: '📉',
      scenario: 'La fazione non può giocare la maggior parte delle carte. Costretta a scelte disperate. Ogni azione costa più di quanto si abbia.',
      carteChiave: ['Solo carte costo 0-1 OP disponibili', 'Economia di Resistenza (Iran): unica fonte di recupero', 'Carte costo ≥ 3: BLOCCATE'],
      condizioniVittoria: 'Se Iran a 1-2 risorse per 3 turni: –2 TNI automatico (programma rallentato).',
      costoIran: 'Iran non può giocare carte militari offensive.',
      costoCoalizione: 'Coalizione non può applicare nuove sanzioni né fare strike.',
      noteStrategiche: 'Emergenza totale. Priorità assoluta: recuperare risorse entro 1 turno.',
    },
    {
      da: 3, a: 4, label: 'Risorse Scarse', sottotitolo: '🔴 Limitazioni Gravi', colore: 'danger', icona: '🔋',
      scenario: 'La fazione deve scegliere con cura ogni mossa. Nessuno spreco possibile. Solo azioni ad alto impatto.',
      carteChiave: ['Carte costo ≤ 3 OP: giocabili', 'Carte da 4 OP: bloccate', 'Contrabbando Petrolio Iran: +3 risorse, prioritaria'],
      condizioniVittoria: 'Nessuna condizione attivata.',
      costoIran: 'Iran sceglie tra nucleare e militare: non può fare entrambi nello stesso turno.',
      costoCoalizione: 'Coalizione può applicare sanzioni ma non può fare strike militare.',
      noteStrategiche: 'Zona di vulnerabilità: l\'avversario che attacca ora colpisce al momento peggiore.',
    },
    {
      da: 5, a: 6, label: 'Risorse Standard', sottotitolo: '🟡 Operatività Normale', colore: 'caution', icona: '💼',
      scenario: 'La fazione ha sufficiente liquidità per la maggior parte delle azioni. Nessuna limitazione speciale. Gestione normale.',
      carteChiave: ['Tutte le carte costo 1-3 OP disponibili', 'Carte da 4 OP: richiedono pianificazione', 'Carte con guadagno risorse: opzionali'],
      condizioniVittoria: 'Nessuna modifica alle condizioni di vittoria.',
      costoIran: 'Iran e Coalizione operano a piena capacità nelle azioni standard.',
      costoCoalizione: 'Nessun effetto speciale. Operatività normale.',
      noteStrategiche: 'Livello sostenibile. Non richiede carte economiche di emergenza.',
    },
    {
      da: 7, a: 8, label: 'Buona Disponibilità', sottotitolo: '🟢 Vantaggio Operativo', colore: 'watch', icona: '💰',
      scenario: 'La fazione può permettersi azioni costose. Strike militari, grandi accordi diplomatici, campagne mediatiche massive.',
      carteChiave: ['Carte da 4 OP: disponibili senza restrizioni', 'Possibile giocare 2 carte medie nello stesso turno', 'Accordo Petrolifero 25 Anni: massima resa'],
      condizioniVittoria: 'Nessuna condizione di vittoria. Ma vantaggio tattico significativo.',
      costoIran: 'Iran può finanziare simultaneamente nucleare e proxy (Hezbollah, Houthi).',
      costoCoalizione: 'Coalizione può mantenere 2 fronti (sanzioni + strike).',
      noteStrategiche: 'Finestra di opportunità: la fazione con 7-8 risorse ha la flessibilità massima.',
    },
    {
      da: 9, a: 10, label: 'Abbondanza', sottotitolo: '🏆 Potere Totale', colore: 'safe', icona: '🏦',
      scenario: 'La fazione non ha limitazioni economiche. Può giocare qualsiasi carta e mantenere azioni multiple per turno.',
      carteChiave: ['Tutte le carte disponibili senza limite di costo', 'Possibile giocare 2 carte costose nello stesso turno', 'Belt and Road Iran (Cina): effetto massimo'],
      condizioniVittoria: 'Se Iran a 9-10 risorse per 2 turni: +1 TNI automatico (investimento massiccio).',
      costoIran: 'Iran può giocare 3 carte/turno invece di 2 (regola opzionale).',
      costoCoalizione: 'Coalizione può mantenere 3 fronti (sanzioni + media + militare).',
      noteStrategiche: 'Livello di potere totale. La fazione può dominare il turno con azioni multiple.',
    },
  ],
};

// ── 6. STABILITÀ INTERNA ─────────────────────────────────────────
export const trackStabilita: Tracciato = {
  id: 'stabilita',
  nome: 'Stabilità Interna',
  sigla: 'SI',
  icona: '🏛️',
  min: 1,
  max: 10,
  descrizione: 'Misura la solidità del regime interno per ogni fazione.',
  direzioneIran: 'Mantenere stabilità a 7-10 → Regime blindato',
  direzioneCoalizione: 'Ridurre stabilità Iran a 1-3 → Cambio regime',
  zone: [
    {
      da: 1, a: 2, label: 'Collasso Interno', sottotitolo: '💀 Regime in Crisi', colore: 'critical', icona: '🔥',
      scenario: 'La fazione è sull\'orlo del collasso. Rivolta interna, defezioni militari, crisi di legittimità. Il regime non controlla il territorio.',
      carteChiave: ['Repressione Interna: gratuita ma –2 TOG', 'Mobilitazione Basij: +3 Stabilità Iran', 'Proteste Popolari Iran: effetto doppio (–3 SI)'],
      condizioniVittoria: 'Se Iran a 1-2 SI per 2 turni: possibilità cambio regime (vittoria Coalizione "Cambio Regime").',
      costoIran: 'Iran non può giocare carte diplomatiche offensive. Negoziati nucleari impossibili.',
      costoCoalizione: 'Coalizione può supportare opposizione gratuitamente.',
      noteStrategiche: 'Momento critico: il regime deve stabilizzarsi o rischia collasso. La Coalizione può vincere qui.',
    },
    {
      da: 3, a: 4, label: 'Instabilità Grave', sottotitolo: '🔴 Regime Sotto Pressione', colore: 'danger', icona: '⚡',
      scenario: 'Proteste diffuse. Economia in difficoltà. Pressione internazionale massima. Il regime regge ma con difficoltà.',
      carteChiave: ['Proteste Popolari Iran: –2 SI invece di –1', 'Economia di Resistenza: +1 SI bonus', 'Repressione Interna: efficace ma costo diplomatico'],
      condizioniVittoria: 'Nessuna vittoria immediata.',
      costoIran: 'Iran spende 1 risorsa extra su ogni carta diplomatica. Nucleare rallentato di 1 ogni 2 turni.',
      costoCoalizione: 'Supporto opposizione con –1 costo. Sanzioni più efficaci (regime vulnerabile).',
      noteStrategiche: 'Zona di vulnerabilità Iran: le sanzioni fanno più male. La Coalizione deve insistere.',
    },
    {
      da: 5, a: 6, label: 'Stabilità Precaria', sottotitolo: '🟡 Equilibrio Fragile', colore: 'caution', icona: '🏗️',
      scenario: 'Il regime regge. Proteste sporadiche. Opposizione presente ma non dominante. Normale gestione del potere.',
      carteChiave: ['Propaganda Mediatica Iran: +1 SI bonus', 'Mobilitazione Basij: disponibile ma non urgente', 'Tutte le carte a efficacia normale'],
      condizioniVittoria: 'Nessuna modifica.',
      costoIran: 'Iran opera normalmente. Nessun malus per instabilità.',
      costoCoalizione: 'Sanzioni a efficacia standard.',
      noteStrategiche: 'Zona di normalità. Il regime non è in pericolo immediato.',
    },
    {
      da: 7, a: 8, label: 'Regime Stabile', sottotitolo: '🟢 Controllo Consolidato', colore: 'watch', icona: '🛡️',
      scenario: 'Il regime ha il pieno controllo. Opposizione marginale. Supporto popolare moderato. Forze di sicurezza pienamente fedeli.',
      carteChiave: ['IRGC: +1 protezione siti nucleari', 'Carte diplomatiche Iran: –1 costo', 'Carta Supporto Opposizione Coalizione: completamente inefficace'],
      condizioniVittoria: 'Nessuna condizione di vittoria. Ma Iran più efficace nelle azioni.',
      costoIran: 'Iran può giocare carte nucleari e diplomatiche nello stesso turno. Resistenza alle sanzioni +1.',
      costoCoalizione: 'Carte "Supporto Opposizione" completamente inefficaci.',
      noteStrategiche: 'Iran è robusto. Difficile da destabilizzare. La Coalizione deve usare altri strumenti.',
    },
    {
      da: 9, a: 10, label: 'Regime Blindato', sottotitolo: '🏆 Controllo Totale', colore: 'safe', icona: '🔒',
      scenario: 'Il regime ha supporto popolare genuino o controllo totale. Nessuna opposizione rilevante. Forze armate completamente fedeli.',
      carteChiave: ['IRGC a piena potenza: protezione massima siti nucleari', 'Tutte le carte Iran interne: costo 0', 'Destabilizzazione: impossibile'],
      condizioniVittoria: 'Iran con SI 9-10: +1 punto vittoria/turno. Impossibile vincere tramite cambio regime.',
      costoIran: 'Iran immune a tutte le carte destabilizzazione. Nucleare avanza senza interferenze.',
      costoCoalizione: 'Solo azioni militari dirette sono efficaci contro Iran. Regime change impossibile.',
      noteStrategiche: 'Iran quasi invulnerabile internamente. La Coalizione deve usare la forza diretta.',
    },
  ],
};

export const TUTTI_TRACCIATI: Tracciato[] = [
  trackNucleare,
  trackSanzioni,
  trackOpinione,
  trackDefcon,
  trackRisorse,
  trackStabilita,
];
