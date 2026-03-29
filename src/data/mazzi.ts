// =============================================
// LINEA ROSSA — Mazzi completi per fazione
// Iran: 24 carte base (C025-C048)
// Coalizione: 24 carte base (C001-C024)
// Russia: 18 carte (C073-C095 dispari Russia)
// Cina: 18 carte (dalla sezione Russia-Cina condivisa)
// Europa: 18 carte (C097-C120)
// Neutrale: 18 carte evento generali
// =============================================

import type { GameCard } from '@/types/game';

// Helper: clamp valore in range
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

// -----------------------------------------------
// MAZZO IRAN (24 carte base)
// -----------------------------------------------
export const MAZZO_IRAN: GameCard[] = [
  { card_id:'C025', card_name:'Arricchimento Uranio 60%', faction:'Iran', card_type:'Militare', op_points:4, deck_type:'base', description:'Accelerazione del programma nucleare',
    effects:{ nucleare:(v)=>v<=7?2:v<=12?1:3, sanzioni:(v)=>v>=5?-1:0, defcon:(v)=>v<=3?-1:0, risorse:(v)=>-1, stabilita:(v)=>v>=6?1:0 }},
  { card_id:'C026', card_name:'Proxy Hezbollah', faction:'Iran', card_type:'Militare', op_points:3, deck_type:'base', description:'Attivazione delle milizie in Libano',
    effects:{ defcon:(v)=>v<=3?-1:0, opinione:(v)=>v>=-5&&v<=-1?2:v>=5?-1:1, risorse:(v)=>-1 }},
  { card_id:'C027', card_name:'Diplomazia Regionale', faction:'Iran', card_type:'Diplomatico', op_points:2, deck_type:'base', description:'Apertura verso i paesi del Golfo',
    effects:{ stabilita:(v)=>1, opinione:(v)=>v<=0?2:1 }},
  { card_id:'C028', card_name:'Attacco Droni Houthi', faction:'Iran', card_type:'Militare', op_points:3, deck_type:'base', description:'Operazioni coordinate dallo Yemen',
    effects:{ defcon:(v)=>v<=3?-1:0, opinione:(v)=>v<=-3?2:0, risorse:(v)=>-1 }},
  { card_id:'C029', card_name:'Accordo Petrolio Cina', faction:'Iran', card_type:'Economico', op_points:3, deck_type:'base', description:'Contratto ventennale con Pechino',
    effects:{ risorse:(v)=>2, stabilita:(v)=>1, sanzioni:(v)=>-1 }},
  { card_id:'C030', card_name:'Test Missile Balistico', faction:'Iran', card_type:'Militare', op_points:3, deck_type:'base', description:'Lancio dimostrativo di missili a lungo raggio',
    effects:{ nucleare:(v)=>v>=11?1:0, defcon:(v)=>v<=4?-1:0, opinione:(v)=>v>=5?-2:0, risorse:(v)=>-1 }},
  { card_id:'C031', card_name:'Propaganda Press TV', faction:'Iran', card_type:'Media', op_points:2, deck_type:'base', description:'Campagna mediatica internazionale',
    effects:{ opinione:(v)=>v<=-5?2:1, stabilita:(v)=>1 }},
  { card_id:'C032', card_name:'Centrifughe Avanzate', faction:'Iran', card_type:'Militare', op_points:4, deck_type:'base', description:'Installazione di centrifughe IR-6',
    effects:{ nucleare:(v)=>v<=5?3:v<=10?2:1, defcon:(v)=>v<=2?-1:0, risorse:(v)=>-2 }},
  { card_id:'C033', card_name:'Negoziato JCPOA', faction:'Iran', card_type:'Diplomatico', op_points:3, deck_type:'base', description:'Ritorno al tavolo dei negoziati',
    effects:{ sanzioni:(v)=>2, defcon:(v)=>v<=3?1:0, risorse:(v)=>2 }},
  { card_id:'C034', card_name:'Sequestro Petroliera', faction:'Iran', card_type:'Militare', op_points:2, deck_type:'base', description:'Fermo di nave straniera nello Stretto',
    effects:{ defcon:(v)=>v<=3?-1:0, risorse:(v)=>1, opinione:(v)=>v<=-3?1:-1 }},
  { card_id:'C035', card_name:'Asse della Resistenza', faction:'Iran', card_type:'Militare', op_points:3, deck_type:'base', description:'Coordinamento con milizie regionali',
    effects:{ defcon:(v)=>v<=3?-1:0, stabilita:(v)=>1, risorse:(v)=>-1 }},
  { card_id:'C036', card_name:'Cyber Difesa', faction:'Iran', card_type:'Segreto', op_points:2, deck_type:'base', description:'Potenziamento sicurezza informatica',
    effects:{ nucleare:(v)=>1, stabilita:(v)=>1 }},
  { card_id:'C037', card_name:'Accordo SCO', faction:'Iran', card_type:'Diplomatico', op_points:2, deck_type:'base', description:'Adesione all\'Organizzazione di Shanghai',
    effects:{ sanzioni:(v)=>-1, opinione:(v)=>v<=0?1:0, risorse:(v)=>1 }},
  { card_id:'C038', card_name:'Milizie Iraq', faction:'Iran', card_type:'Militare', op_points:2, deck_type:'base', description:'Attivazione delle PMF in Iraq',
    effects:{ defcon:(v)=>v<=3?-1:0, stabilita:(v)=>v<=5?1:0, risorse:(v)=>-1 }},
  { card_id:'C039', card_name:'Deterrenza Nucleare', faction:'Iran', card_type:'Militare', op_points:4, deck_type:'base', description:'Minaccia di breakout nucleare',
    effects:{ nucleare:(v)=>1, defcon:(v)=>-1, opinione:(v)=>v>=5?-2:0, stabilita:(v)=>1 }},
  { card_id:'C040', card_name:'Commercio Alternativo', faction:'Iran', card_type:'Economico', op_points:2, deck_type:'base', description:'Rotte commerciali per aggirare sanzioni',
    effects:{ sanzioni:(v)=>-1, risorse:(v)=>2 }},
  { card_id:'C041', card_name:'Supporto Hamas', faction:'Iran', card_type:'Militare', op_points:2, deck_type:'base', description:'Armi e fondi per Gaza',
    effects:{ defcon:(v)=>v<=3?-1:0, opinione:(v)=>v<=-3?1:-1, risorse:(v)=>-1 }},
  { card_id:'C042', card_name:'Diplomazia Oman', faction:'Iran', card_type:'Diplomatico', op_points:2, deck_type:'base', description:'Canale segreto via Muscat',
    effects:{ sanzioni:(v)=>1, opinione:(v)=>1, defcon:(v)=>v<=2?1:0 }},
  { card_id:'C043', card_name:'Esercitazioni Navali', faction:'Iran', card_type:'Militare', op_points:2, deck_type:'base', description:'Manovre nello Stretto di Hormuz',
    effects:{ defcon:(v)=>-1, opinione:(v)=>v<=-3?1:0, risorse:(v)=>-1 }},
  { card_id:'C044', card_name:'Propaganda Anti-USA', faction:'Iran', card_type:'Media', op_points:2, deck_type:'base', description:'Campagna Grande Satana',
    effects:{ opinione:(v)=>v<=-5?2:1, stabilita:(v)=>1 }},
  { card_id:'C045', card_name:'Sito Nucleare Segreto', faction:'Iran', card_type:'Segreto', op_points:3, deck_type:'base', description:'Costruzione di impianto sotterraneo',
    effects:{ nucleare:(v)=>2, stabilita:(v)=>1 }},
  { card_id:'C046', card_name:'Accordo Baghdad', faction:'Iran', card_type:'Diplomatico', op_points:2, deck_type:'base', description:'Riavvicinamento con Arabia Saudita',
    effects:{ sanzioni:(v)=>-1, opinione:(v)=>v<=0?2:1, defcon:(v)=>v<=2?1:0 }},
  { card_id:'C047', card_name:'Rappresaglia Missilistica', faction:'Iran', card_type:'Militare', op_points:3, deck_type:'base', description:'Attacco su basi USA nella regione',
    effects:{ defcon:(v)=>-2, risorse:(v)=>-2, stabilita:(v)=>1 }},
  { card_id:'C048', card_name:'Moratoria Nucleare', faction:'Iran', card_type:'Diplomatico', op_points:2, deck_type:'base', description:'Sospensione temporanea arricchimento',
    effects:{ nucleare:(v)=>-1, sanzioni:(v)=>2, opinione:(v)=>2, risorse:(v)=>2, defcon:(v)=>v<=3?1:0 }},
];

// -----------------------------------------------
// MAZZO COALIZIONE USA (24 carte base)
// -----------------------------------------------
export const MAZZO_COALIZIONE: GameCard[] = [
  { card_id:'C001', card_name:'Portaerei nel Golfo', faction:'Coalizione', card_type:'Militare', op_points:3, deck_type:'base', description:'Dispiegamento della flotta nel Golfo Persico',
    effects:{ nucleare:(v)=>v>=11?-1:0, defcon:(v)=>v<=3?-1:0, sanzioni:(v)=>v>=6?1:0, risorse:(v)=>-1 }},
  { card_id:'C002', card_name:'Sanzioni SWIFT', faction:'Coalizione', card_type:'Economico', op_points:4, deck_type:'base', description:'Esclusione dell\'Iran dal sistema bancario',
    effects:{ sanzioni:(v)=>v<=3?3:v<=7?2:1, risorse:(v)=>0 }},
  { card_id:'C003', card_name:'Diplomazia Shuttle', faction:'Coalizione', card_type:'Diplomatico', op_points:2, deck_type:'base', description:'Missione diplomatica intensiva nella regione',
    effects:{ sanzioni:(v)=>1, opinione:(v)=>1, defcon:(v)=>v<=3?1:0 }},
  { card_id:'C004', card_name:'Cyber Attack Stuxnet 2.0', faction:'Coalizione', card_type:'Segreto', op_points:3, deck_type:'base', description:'Sabotaggio informatico delle centrifughe iraniane',
    effects:{ nucleare:(v)=>v<=5?-2:v<=10?-1:0, defcon:(v)=>v<=2?-1:0 }},
  { card_id:'C005', card_name:'Accordo Abraham Plus', faction:'Coalizione', card_type:'Diplomatico', op_points:4, deck_type:'base', description:'Estensione degli accordi di normalizzazione',
    effects:{ opinione:(v)=>v>=5?2:1, sanzioni:(v)=>1, defcon:(v)=>v<=2?1:0 }},
  { card_id:'C006', card_name:'Strike Chirurgico', faction:'Coalizione', card_type:'Militare', op_points:4, deck_type:'base', description:'Attacco mirato su installazioni nucleari',
    effects:{ nucleare:(v)=>v>=8?-2:v>=13?-3:-1, defcon:(v)=>-2, risorse:(v)=>-2 }},
  { card_id:'C007', card_name:'Pressione Mediatica CNN', faction:'Coalizione', card_type:'Media', op_points:2, deck_type:'base', description:'Campagna mediatica contro il regime iraniano',
    effects:{ opinione:(v)=>v>=-4?2:1, stabilita:(v)=>v>=6?1:0 }},
  { card_id:'C008', card_name:'Aiuti Militari Israele', faction:'Coalizione', card_type:'Militare', op_points:3, deck_type:'base', description:'Pacchetto di armi avanzate per Israele',
    effects:{ sanzioni:(v)=>1, defcon:(v)=>v<=3?-1:0, risorse:(v)=>-1 }},
  { card_id:'C009', card_name:'Negoziato Vienna', faction:'Coalizione', card_type:'Diplomatico', op_points:3, deck_type:'base', description:'Rilancio dei negoziati sul nucleare',
    effects:{ nucleare:(v)=>v<=10?-1:0, sanzioni:(v)=>1, opinione:(v)=>1, defcon:(v)=>v<=3?1:0 }},
  { card_id:'C010', card_name:'Embargo Petrolifero', faction:'Coalizione', card_type:'Economico', op_points:3, deck_type:'base', description:'Blocco delle esportazioni petrolifere iraniane',
    effects:{ sanzioni:(v)=>v<=3?3:v<=6?2:1, opinione:(v)=>v>=-3?0:-1 }},
  { card_id:'C011', card_name:'Base Avanzata Qatar', faction:'Coalizione', card_type:'Militare', op_points:2, deck_type:'base', description:'Potenziamento della base Al Udeid',
    effects:{ defcon:(v)=>v<=3?-1:0, sanzioni:(v)=>v>=6?1:0, risorse:(v)=>-1 }},
  { card_id:'C012', card_name:'Intelligence Sharing', faction:'Coalizione', card_type:'Segreto', op_points:2, deck_type:'base', description:'Condivisione intelligence con alleati',
    effects:{ nucleare:(v)=>v<=7?-1:0, sanzioni:(v)=>1 }},
  { card_id:'C013', card_name:'Pressione ONU', faction:'Coalizione', card_type:'Diplomatico', op_points:2, deck_type:'base', description:'Risoluzione al Consiglio di Sicurezza',
    effects:{ sanzioni:(v)=>v<=5?2:1, opinione:(v)=>v>=1?2:0 }},
  { card_id:'C014', card_name:'Difesa Missilistica THAAD', faction:'Coalizione', card_type:'Militare', op_points:3, deck_type:'base', description:'Dispiegamento sistemi antimissile nella regione',
    effects:{ defcon:(v)=>v<=2?1:0, sanzioni:(v)=>v>=6?1:0, risorse:(v)=>-1 }},
  { card_id:'C015', card_name:'Operazione Freedom', faction:'Coalizione', card_type:'Militare', op_points:4, deck_type:'base', description:'Operazione militare su larga scala',
    effects:{ nucleare:(v)=>v>=8?-2:0, defcon:(v)=>-2, risorse:(v)=>-3 }},
  { card_id:'C016', card_name:'Sanzioni Secondarie', faction:'Coalizione', card_type:'Economico', op_points:3, deck_type:'base', description:'Sanzioni contro chi commercia con l\'Iran',
    effects:{ sanzioni:(v)=>v<=3?2:1, opinione:(v)=>v>=-3?0:-1 }},
  { card_id:'C017', card_name:'Supporto Opposizione', faction:'Coalizione', card_type:'Segreto', op_points:2, deck_type:'base', description:'Finanziamento gruppi di opposizione iraniani',
    effects:{ stabilita:(v)=>-1, sanzioni:(v)=>1 }},
  { card_id:'C018', card_name:'Accordo Difesa Saudita', faction:'Coalizione', card_type:'Diplomatico', op_points:3, deck_type:'base', description:'Patto di mutua difesa con Riyadh',
    effects:{ opinione:(v)=>v>=5?2:1, sanzioni:(v)=>1 }},
  { card_id:'C019', card_name:'Propaganda VOA', faction:'Coalizione', card_type:'Media', op_points:2, deck_type:'base', description:'Trasmissioni Voice of America in farsi',
    effects:{ opinione:(v)=>v>=-4?2:1, stabilita:(v)=>v<=5?-1:0 }},
  { card_id:'C020', card_name:'Blocco Navale', faction:'Coalizione', card_type:'Militare', op_points:4, deck_type:'base', description:'Blocco dello Stretto di Hormuz',
    effects:{ sanzioni:(v)=>v<=3?3:v<=7?2:1, defcon:(v)=>-1, risorse:(v)=>-2 }},
  { card_id:'C021', card_name:'Congelamento Asset', faction:'Coalizione', card_type:'Economico', op_points:2, deck_type:'base', description:'Blocco dei beni iraniani all\'estero',
    effects:{ sanzioni:(v)=>v<=5?2:1 }},
  { card_id:'C022', card_name:'Summit Camp David', faction:'Coalizione', card_type:'Diplomatico', op_points:3, deck_type:'base', description:'Vertice con leader regionali',
    effects:{ opinione:(v)=>v>=5?2:1, defcon:(v)=>v<=3?1:0, sanzioni:(v)=>1 }},
  { card_id:'C023', card_name:'Droni Predator', faction:'Coalizione', card_type:'Militare', op_points:2, deck_type:'base', description:'Sorveglianza e strike con droni',
    effects:{ nucleare:(v)=>v>=11?-1:0, defcon:(v)=>v<=3?-1:0, risorse:(v)=>-1 }},
  { card_id:'C024', card_name:'Rilascio Prigionieri', faction:'Coalizione', card_type:'Diplomatico', op_points:1, deck_type:'base', description:'Scambio di prigionieri con l\'Iran',
    effects:{ opinione:(v)=>1, defcon:(v)=>v<=2?1:0, sanzioni:(v)=>1 }},
];

// -----------------------------------------------
// MAZZO RUSSIA (18 carte base)
// -----------------------------------------------
export const MAZZO_RUSSIA: GameCard[] = [
  { card_id:'C073R', card_name:'Veto ONU Russia', faction:'Russia', card_type:'Diplomatico', op_points:3, deck_type:'base', description:'Blocco risoluzioni al Consiglio di Sicurezza',
    effects:{ sanzioni:(v)=>v<=5?-2:v<=8?-1:0 }},
  { card_id:'C074R', card_name:'Vendita S-400', faction:'Russia', card_type:'Militare', op_points:3, deck_type:'base', description:'Fornitura sistemi antiaerei all\'Iran',
    effects:{ risorse:(v)=>2, defcon:(v)=>v<=3?-1:0, stabilita:(v)=>1 }},
  { card_id:'C075R', card_name:'Belt and Road Iran', faction:'Russia', card_type:'Economico', op_points:3, deck_type:'base', description:'Investimenti infrastrutturali massicci',
    effects:{ risorse:(v)=>2, sanzioni:(v)=>-1 }},
  { card_id:'C076R', card_name:'Esercitazioni Congiunte', faction:'Russia', card_type:'Militare', op_points:3, deck_type:'base', description:'Manovre navali nel Golfo di Oman',
    effects:{ defcon:(v)=>v<=3?-1:0, stabilita:(v)=>1, risorse:(v)=>-1 }},
  { card_id:'C077R', card_name:'Propaganda RT', faction:'Russia', card_type:'Media', op_points:2, deck_type:'base', description:'Campagna mediatica anti-occidentale',
    effects:{ opinione:(v)=>v<=-5?2:v<=-1?1:0, stabilita:(v)=>1 }},
  { card_id:'C078R', card_name:'Accordo Energia Russia-Iran', faction:'Russia', card_type:'Economico', op_points:3, deck_type:'base', description:'Contratti gas e petrolio con Iran',
    effects:{ risorse:(v)=>3, sanzioni:(v)=>-1 }},
  { card_id:'C079R', card_name:'Supporto Assad', faction:'Russia', card_type:'Militare', op_points:2, deck_type:'base', description:'Rafforzamento presenza in Siria',
    effects:{ defcon:(v)=>v<=3?-1:0, stabilita:(v)=>1, risorse:(v)=>-1 }},
  { card_id:'C080R', card_name:'Summit SCO Russia', faction:'Russia', card_type:'Diplomatico', op_points:2, deck_type:'base', description:'Vertice dell\'Organizzazione di Shanghai',
    effects:{ opinione:(v)=>v<=0?1:0, sanzioni:(v)=>-1 }},
  { card_id:'C081R', card_name:'Cyber Warfare Russia', faction:'Russia', card_type:'Segreto', op_points:2, deck_type:'base', description:'Attacchi informatici coordinati',
    effects:{ stabilita:(v)=>1, risorse:(v)=>1 }},
  { card_id:'C082R', card_name:'Tecnologia Nucleare Civile', faction:'Russia', card_type:'Economico', op_points:3, deck_type:'base', description:'Trasferimento know-how nucleare civile',
    effects:{ nucleare:(v)=>v<=7?1:0, risorse:(v)=>2, sanzioni:(v)=>v<=5?-1:0 }},
  { card_id:'C085R', card_name:'Droni Shahed', faction:'Russia', card_type:'Militare', op_points:2, deck_type:'base', description:'Fornitura droni all\'Iran',
    effects:{ risorse:(v)=>2, defcon:(v)=>v<=3?-1:0 }},
  { card_id:'C086R', card_name:'De-dollarizzazione', faction:'Russia', card_type:'Economico', op_points:3, deck_type:'base', description:'Commercio in valute alternative',
    effects:{ risorse:(v)=>2, sanzioni:(v)=>v<=5?-2:-1 }},
  { card_id:'C087R', card_name:'Base Navale Tartus', faction:'Russia', card_type:'Militare', op_points:2, deck_type:'base', description:'Espansione presenza nel Mediterraneo',
    effects:{ defcon:(v)=>v<=3?-1:0, stabilita:(v)=>1 }},
  { card_id:'C088R', card_name:'Mediazione Pechino', faction:'Russia', card_type:'Diplomatico', op_points:3, deck_type:'base', description:'Accordo Iran-Arabia Saudita',
    effects:{ sanzioni:(v)=>-1, defcon:(v)=>v<=3?1:0, opinione:(v)=>v<=0?1:0 }},
  { card_id:'C089R', card_name:'Armi Avanzate Russia', faction:'Russia', card_type:'Militare', op_points:3, deck_type:'base', description:'Fornitura caccia e missili all\'Iran',
    effects:{ risorse:(v)=>2, defcon:(v)=>-1, stabilita:(v)=>1 }},
  { card_id:'C090R', card_name:'Corridoio Nord-Sud', faction:'Russia', card_type:'Economico', op_points:2, deck_type:'base', description:'Rotta commerciale Russia-Iran-India',
    effects:{ risorse:(v)=>2, sanzioni:(v)=>-1 }},
  { card_id:'C091R', card_name:'Disinformazione', faction:'Russia', card_type:'Media', op_points:2, deck_type:'base', description:'Campagna fake news anti-occidentale',
    effects:{ opinione:(v)=>v<=0?2:1, stabilita:(v)=>1 }},
  { card_id:'C094R', card_name:'Accordo Militare Russia', faction:'Russia', card_type:'Militare', op_points:3, deck_type:'base', description:'Patto di cooperazione difensiva',
    effects:{ risorse:(v)=>2, defcon:(v)=>v<=3?-1:0, stabilita:(v)=>1 }},
];

// -----------------------------------------------
// MAZZO CINA (18 carte base)
// -----------------------------------------------
export const MAZZO_CINA: GameCard[] = [
  { card_id:'C073C', card_name:'Veto ONU Cina', faction:'Cina', card_type:'Diplomatico', op_points:3, deck_type:'base', description:'Blocco risoluzioni al Consiglio di Sicurezza',
    effects:{ sanzioni:(v)=>v<=5?-2:v<=8?-1:0 }},
  { card_id:'C075C', card_name:'Belt and Road Cina', faction:'Cina', card_type:'Economico', op_points:3, deck_type:'base', description:'Investimenti infrastrutturali Iran',
    effects:{ risorse:(v)=>2, sanzioni:(v)=>v<=5?-2:-1 }},
  { card_id:'C078C', card_name:'Accordo Energia Cina', faction:'Cina', card_type:'Economico', op_points:3, deck_type:'base', description:'Contratto petrolio 25 anni',
    effects:{ risorse:(v)=>3, sanzioni:(v)=>v<=3?-3:v<=7?-2:-1 }},
  { card_id:'C082C', card_name:'Tecnologia Nucleare Cina', faction:'Cina', card_type:'Economico', op_points:3, deck_type:'base', description:'Trasferimento know-how nucleare civile',
    effects:{ nucleare:(v)=>v<=7?1:0, risorse:(v)=>2 }},
  { card_id:'C083C', card_name:'Crisi Taiwan', faction:'Cina', card_type:'Politico', op_points:3, deck_type:'base', description:'Escalation nel Pacifico distrae USA',
    effects:{ defcon:(v)=>-1, sanzioni:(v)=>v<=5?-1:0 }},
  { card_id:'C086C', card_name:'De-dollarizzazione Cina', faction:'Cina', card_type:'Economico', op_points:3, deck_type:'base', description:'Yuan vs Dollaro',
    effects:{ risorse:(v)=>2, sanzioni:(v)=>v<=5?-2:-1 }},
  { card_id:'C088C', card_name:'Mediazione Diplomatica Cina', faction:'Cina', card_type:'Diplomatico', op_points:3, deck_type:'base', description:'Accordo Iran-Arabia Saudita mediato da Pechino',
    effects:{ sanzioni:(v)=>-1, defcon:(v)=>v<=3?1:0, opinione:(v)=>1 }},
  { card_id:'C090C', card_name:'Porto di Chabahar', faction:'Cina', card_type:'Economico', op_points:2, deck_type:'base', description:'Infrastruttura strategica in Iran',
    effects:{ risorse:(v)=>2, sanzioni:(v)=>-1 }},
  { card_id:'C091C', card_name:'Propaganda CGTN', faction:'Cina', card_type:'Media', op_points:2, deck_type:'base', description:'Campagna mediatica anti-occidentale',
    effects:{ opinione:(v)=>v<=0?2:1, stabilita:(v)=>1 }},
  { card_id:'C092C', card_name:'Ferrovia Cina-Iran', faction:'Cina', card_type:'Economico', op_points:2, deck_type:'base', description:'Corridoio commerciale terrestre',
    effects:{ risorse:(v)=>2, sanzioni:(v)=>-1 }},
  { card_id:'C093C', card_name:'Satellite Spia Cina', faction:'Cina', card_type:'Segreto', op_points:2, deck_type:'base', description:'Condivisione intelligence satellitare',
    effects:{ nucleare:(v)=>1, stabilita:(v)=>1 }},
  { card_id:'C094C', card_name:'Accordo Militare Cina', faction:'Cina', card_type:'Militare', op_points:3, deck_type:'base', description:'Patto di cooperazione difensiva',
    effects:{ risorse:(v)=>2, defcon:(v)=>v<=3?-1:0 }},
  { card_id:'C095C', card_name:'Investimenti Petrolio Cina', faction:'Cina', card_type:'Economico', op_points:2, deck_type:'base', description:'Sviluppo giacimenti iraniani',
    effects:{ risorse:(v)=>2, sanzioni:(v)=>-1 }},
  { card_id:'C096C', card_name:'Blocco Sanzioni ONU Cina', faction:'Cina', card_type:'Diplomatico', op_points:2, deck_type:'base', description:'Opposizione a nuove sanzioni ONU',
    effects:{ sanzioni:(v)=>v<=5?-2:-1 }},
  { card_id:'C083C2', card_name:'Espansione BRICS Cina', faction:'Cina', card_type:'Economico', op_points:2, deck_type:'base', description:'Nuovi membri nel blocco economico',
    effects:{ risorse:(v)=>1, sanzioni:(v)=>-1, opinione:(v)=>v<=0?1:0 }},
  { card_id:'C084C', card_name:'Accordo BRICS Cina', faction:'Cina', card_type:'Diplomatico', op_points:2, deck_type:'base', description:'Espansione blocco economico alternativo',
    effects:{ sanzioni:(v)=>-1, opinione:(v)=>v<=0?1:0 }},
  { card_id:'C076C', card_name:'Esercitazioni Navali Cina', faction:'Cina', card_type:'Militare', op_points:3, deck_type:'base', description:'Manovre nel Golfo di Oman',
    effects:{ defcon:(v)=>v<=3?-1:0, risorse:(v)=>-1, stabilita:(v)=>1 }},
  { card_id:'C087C', card_name:'Rotte Commerciali Cina', faction:'Cina', card_type:'Economico', op_points:2, deck_type:'base', description:'Corridoio Nord-Sud alternativo',
    effects:{ risorse:(v)=>2, sanzioni:(v)=>v<=5?-1:0 }},
];

// -----------------------------------------------
// MAZZO EUROPA (18 carte base)
// -----------------------------------------------
export const MAZZO_EUROPA: GameCard[] = [
  { card_id:'C097', card_name:'Mediazione UE', faction:'Europa', card_type:'Diplomatico', op_points:3, deck_type:'base', description:'Proposta di pace e negoziato',
    effects:{ defcon:(v)=>v<=3?1:0, opinione:(v)=>1, sanzioni:(v)=>1 }},
  { card_id:'C099', card_name:'INSTEX Attivo', faction:'Europa', card_type:'Economico', op_points:2, deck_type:'base', description:'Meccanismo commerciale alternativo',
    effects:{ sanzioni:(v)=>v<=5?-2:-1, risorse:(v)=>1 }},
  { card_id:'C101', card_name:'Diplomazia E3', faction:'Europa', card_type:'Diplomatico', op_points:3, deck_type:'base', description:'Iniziativa Francia-Germania-UK',
    effects:{ defcon:(v)=>v<=3?1:0, opinione:(v)=>1, sanzioni:(v)=>1 }},
  { card_id:'C102', card_name:'Aiuti Umanitari UE', faction:'Europa', card_type:'Economico', op_points:2, deck_type:'base', description:'Assistenza alla popolazione civile',
    effects:{ opinione:(v)=>v<=0?2:1, stabilita:(v)=>1 }},
  { card_id:'C103', card_name:'Pressione Diritti Umani', faction:'Europa', card_type:'Diplomatico', op_points:2, deck_type:'base', description:'Campagna per i diritti in Iran',
    effects:{ opinione:(v)=>1, stabilita:(v)=>v<=3?-1:0 }},
  { card_id:'C104', card_name:'Accordo Gas Alternativo', faction:'Europa', card_type:'Economico', op_points:3, deck_type:'base', description:'Diversificazione forniture energetiche',
    effects:{ risorse:(v)=>2, stabilita:(v)=>1 }},
  { card_id:'C105', card_name:'Rilancio JCPOA', faction:'Europa', card_type:'Diplomatico', op_points:4, deck_type:'base', description:'Sforzo per salvare l\'accordo nucleare',
    effects:{ nucleare:(v)=>v<=7?-1:0, sanzioni:(v)=>v<=5?2:1, defcon:(v)=>v<=3?1:0, opinione:(v)=>1 }},
  { card_id:'C107', card_name:'Sanzioni Mirate', faction:'Europa', card_type:'Economico', op_points:2, deck_type:'base', description:'Misure contro individui specifici',
    effects:{ sanzioni:(v)=>1, opinione:(v)=>v>=1?1:0 }},
  { card_id:'C108', card_name:'Dialogo Critico', faction:'Europa', card_type:'Diplomatico', op_points:2, deck_type:'base', description:'Mantenimento canali diplomatici',
    effects:{ defcon:(v)=>v<=3?1:0, opinione:(v)=>1 }},
  { card_id:'C109', card_name:'Investimenti Ricostruzione', faction:'Europa', card_type:'Economico', op_points:3, deck_type:'base', description:'Fondi per stabilizzazione regionale',
    effects:{ stabilita:(v)=>1, opinione:(v)=>v<=0?2:1, risorse:(v)=>1 }},
  { card_id:'C110', card_name:'Pressione Mediatica UE', faction:'Europa', card_type:'Media', op_points:2, deck_type:'base', description:'Campagna informativa equilibrata',
    effects:{ opinione:(v)=>1, stabilita:(v)=>1 }},
  { card_id:'C111', card_name:'Accordo Turchia', faction:'Europa', card_type:'Diplomatico', op_points:2, deck_type:'base', description:'Partnership strategica con Ankara',
    effects:{ sanzioni:(v)=>1, opinione:(v)=>1 }},
  { card_id:'C113', card_name:'Diplomazia Energetica', faction:'Europa', card_type:'Economico', op_points:2, deck_type:'base', description:'Negoziati per forniture stabili',
    effects:{ risorse:(v)=>2, stabilita:(v)=>1 }},
  { card_id:'C114', card_name:'Conferenza di Pace', faction:'Europa', card_type:'Diplomatico', op_points:3, deck_type:'base', description:'Summit multilaterale per la pace',
    effects:{ defcon:(v)=>v<=3?1:0, opinione:(v)=>1, sanzioni:(v)=>1 }},
  { card_id:'C116', card_name:'Accordo Migranti', faction:'Europa', card_type:'Diplomatico', op_points:2, deck_type:'base', description:'Gestione flussi migratori',
    effects:{ opinione:(v)=>1, stabilita:(v)=>1 }},
  { card_id:'C117', card_name:'Tecnologia Verde', faction:'Europa', card_type:'Economico', op_points:2, deck_type:'base', description:'Cooperazione energie rinnovabili',
    effects:{ risorse:(v)=>1, stabilita:(v)=>1, opinione:(v)=>v<=0?1:0 }},
  { card_id:'C119', card_name:'Embargo Armi UE', faction:'Europa', card_type:'Militare', op_points:2, deck_type:'base', description:'Blocco vendita armi alla regione',
    effects:{ opinione:(v)=>v>=1?1:0, sanzioni:(v)=>1 }},
  { card_id:'C120', card_name:'Accordo Commerciale UE', faction:'Europa', card_type:'Economico', op_points:2, deck_type:'base', description:'Partnership economica regionale',
    effects:{ risorse:(v)=>1, stabilita:(v)=>1, sanzioni:(v)=>v<=5?-1:0 }},
];

// -----------------------------------------------
// MAZZI SPECIALI: Iran e Coalizione (carte evento TNI)
// Iran speciale: carte evento nucleari a favore
// Coalizione speciale: carte evento nucleari contro
// -----------------------------------------------
export const MAZZO_IRAN_SPECIALE: GameCard[] = [
  { card_id:'SE_I01', card_name:'Centrifughe IR-9 (spec.)', faction:'Iran', card_type:'Militare', op_points:4, deck_type:'speciale', description:'Centrifughe di ultima generazione',
    effects:{ nucleare:(v)=>v<=5?3:v<=10?2:1, defcon:(v)=>-1 }},
  { card_id:'SE_I02', card_name:'Sito Sotterraneo (spec.)', faction:'Iran', card_type:'Segreto', op_points:3, deck_type:'speciale', description:'Bunker nucleare impenetrabile',
    effects:{ nucleare:(v)=>2, stabilita:(v)=>1 }},
  { card_id:'SE_I03', card_name:'Uranio 90% (spec.)', faction:'Iran', card_type:'Militare', op_points:4, deck_type:'speciale', description:'Arricchimento weapon-grade',
    effects:{ nucleare:(v)=>v<=12?3:1, defcon:(v)=>-2 }},
  { card_id:'SE_I04', card_name:'Accordo Sorpresa (spec.)', faction:'Iran', card_type:'Diplomatico', op_points:3, deck_type:'speciale', description:'Accordo improvviso con mediatore',
    effects:{ nucleare:(v)=>-1, sanzioni:(v)=>3, risorse:(v)=>2, opinione:(v)=>2 }},
  { card_id:'SE_I05', card_name:'Tecnologia Missilistica (spec.)', faction:'Iran', card_type:'Militare', op_points:3, deck_type:'speciale', description:'Vettore intercontinentale',
    effects:{ nucleare:(v)=>v>=11?1:0, defcon:(v)=>-1, stabilita:(v)=>1 }},
  { card_id:'SE_I06', card_name:'Alleanza BRICS Nucleare (spec.)', faction:'Iran', card_type:'Economico', op_points:3, deck_type:'speciale', description:'Supporto blocco emergente',
    effects:{ risorse:(v)=>3, sanzioni:(v)=>-2 }},
];

export const MAZZO_COALIZIONE_SPECIALE: GameCard[] = [
  { card_id:'SE_C01', card_name:'Sabotaggio Fordow (spec.)', faction:'Coalizione', card_type:'Segreto', op_points:4, deck_type:'speciale', description:'Distruzione sito nucleare chiave',
    effects:{ nucleare:(v)=>v<=5?-3:v<=10?-2:-1, defcon:(v)=>-1 }},
  { card_id:'SE_C02', card_name:'Operazione Mossad (spec.)', faction:'Coalizione', card_type:'Segreto', op_points:3, deck_type:'speciale', description:'Eliminazione scienziato nucleare',
    effects:{ nucleare:(v)=>-2, defcon:(v)=>-1 }},
  { card_id:'SE_C03', card_name:'Strike F-35 (spec.)', faction:'Coalizione', card_type:'Militare', op_points:4, deck_type:'speciale', description:'Raid aereo su tutti i siti',
    effects:{ nucleare:(v)=>v>=8?-3:v>=13?-4:-2, defcon:(v)=>-2, risorse:(v)=>-3 }},
  { card_id:'SE_C04', card_name:'Accordo Nucleare Last Minute (spec.)', faction:'Coalizione', card_type:'Diplomatico', op_points:3, deck_type:'speciale', description:'Accordo storico all\'ultimo momento',
    effects:{ nucleare:(v)=>-2, sanzioni:(v)=>3, defcon:(v)=>2, opinione:(v)=>2 }},
  { card_id:'SE_C05', card_name:'Sanzioni Totali (spec.)', faction:'Coalizione', card_type:'Economico', op_points:4, deck_type:'speciale', description:'Isolamento economico completo',
    effects:{ sanzioni:(v)=>v<=3?4:v<=6?3:2, risorse:(v)=>-2 }},
  { card_id:'SE_C06', card_name:'Operazione Smantellamento (spec.)', faction:'Coalizione', card_type:'Militare', op_points:4, deck_type:'speciale', description:'Operazione combinata multi-teatro',
    effects:{ nucleare:(v)=>v>=8?-3:-2, defcon:(v)=>-2, sanzioni:(v)=>1, risorse:(v)=>-3 }},
];

// -----------------------------------------------
// MAPPA MAZZI per fazione
// -----------------------------------------------
import type { Faction } from '@/types/game';

export const MAZZI_PER_FAZIONE: Record<Faction, GameCard[]> = {
  Iran:       MAZZO_IRAN,
  Coalizione: MAZZO_COALIZIONE,
  Russia:     MAZZO_RUSSIA,
  Cina:       MAZZO_CINA,
  Europa:     MAZZO_EUROPA,
};

export const MAZZI_SPECIALI: Partial<Record<Faction, GameCard[]>> = {
  Iran:       MAZZO_IRAN_SPECIALE,
  Coalizione: MAZZO_COALIZIONE_SPECIALE,
};

// Shuffle Fisher-Yates
export function shuffleDeck<T>(deck: T[]): T[] {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Ottieni tutte le carte di una fazione (base + eventuale speciale)
export function getFullDeck(faction: Faction): GameCard[] {
  const base = MAZZI_PER_FAZIONE[faction] ?? [];
  const special = MAZZI_SPECIALI[faction] ?? [];
  return shuffleDeck([...base, ...special]);
}

// =============================================
// MAZZO UNIFICATO — tutte le fazioni in un unico mazzo mescolato
// owner_faction = fazione proprietaria della carta
// (se giochi una carta altrui → solo OP + evento automatico;
//  se giochi la tua → scegli evento OR OP)
// =============================================

/** Versione della carta arricchita con owner_faction esplicito */
export interface UnifiedCard extends GameCard {
  /** Fazione che ha "scritto" questa carta (può differire da chi la gioca) */
  owner_faction: Faction;
}

/**
 * Costruisce il mazzo unificato (tutte le fazioni) e lo mescola.
 * Ogni carta mantiene la sua faction originale come owner_faction.
 */
export function getUnifiedDeck(): UnifiedCard[] {
  const all: UnifiedCard[] = [];
  const factions: Faction[] = ['Iran', 'Coalizione', 'Russia', 'Cina', 'Europa'];
  for (const f of factions) {
    const base    = MAZZI_PER_FAZIONE[f] ?? [];
    const special = MAZZI_SPECIALI[f] ?? [];
    for (const card of [...base, ...special]) {
      all.push({ ...card, owner_faction: f });
    }
  }
  return shuffleDeck(all);
}

/**
 * Dimensione mano iniziale per fazione nel mazzo unificato.
 * Default: 4 carte a testa. Può essere configurata.
 */
export const UNIFIED_HAND_SIZE = 4;

/**
 * Numero di carte che ogni fazione pesca a fine turno (dopo aver giocato 1).
 * Default: 1 (si mantiene sempre la mano a UNIFIED_HAND_SIZE).
 */
export const UNIFIED_DRAW_PER_TURN = 1;
