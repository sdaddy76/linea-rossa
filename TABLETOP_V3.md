# Linea Rossa — aggiornamento da tavolo v3

## Stato della consegna

Il percorso di pubblicazione del sito esistente è **GitHub → Vercel**:
il ramo `main` di `sdaddy76/linea-rossa` attiva le integrazioni Vercel
`linea-rossa` e `lr2`. L'invio di questo aggiornamento è stato richiesto
esplicitamente dall'utente. Dopo il push occorre verificare il successo delle
pubblicazioni del commit e il manifest pubblico `release.json`; una build locale
da sola non prova la pubblicazione online.

Il repository non è un Website gestito da Skywork: inspect e status restituiscono
`PROJECT_NOT_INITIALIZED`, stage `manifest`, non retryable. Questo riguarda solo
il percorso gestito Skywork, non il collegamento GitHub/Vercel esistente.
Non creare un manifest a mano, reinizializzare il sito o modificare identità/URL.
La pubblicazione del codice non cancella partite e non applica migrazioni al
database Supabase.

## Ultimi allegati adottati

- Regolamento `(6)`: SHA-256
  `5c20f82d2616d1562b2b00b733fa57020fd27122cf93aad6b84dfc826e35ec4d`.
- Scheda unità `(1)`: SHA-256
  `eea41298fc5ef108f002302b53428202a27262e3338e37aaf6b5f291d46e121e`.
- Cinque JPEG di `LineaRossa_Plance.zip`, conservati byte per byte.
- Prompt della partita guidata: scenario didattico distinto dalle partite vere.

Il confronto Poppler è esattamente identico su 43 delle 46 pagine del
regolamento precedente. Le pagine 17–19 chiariscono Scudo/Missili e cambiano
impaginazione. Carte, BOT, eventi, obiettivi e correlazioni non cambiano.
L'importatore ricava ora la coordinata della colonna Effetto dall'intestazione
del PDF e ricompone il nome spezzato S-400, evitando un errore di parsing o il
mancato riconoscimento dell'unità nel combattimento.

Il file pubblico `assets/tabletop-v3/release.json` identifica la release
`tabletop-2026-11-15-guidata` e i sette hash dei materiali nuovi. I test
verificano che i file distribuiti corrispondano a queste fonti.

## Reset richiesto

Censite 226 partite (141 attive, 71 in lobby, 14 concluse). Nessuna è stata
cancellata. Il payload completo con un filtro `games.id` per ciascuna partita
è stato pubblicato separatamente per la conferma richiesta dal connettore.
Non contiene cancellazioni di account, profili o cataloghi. Le FK previste
dalle migrazioni del progetto sono ON DELETE CASCADE: eventuali differenze
nel database vivo devono far fallire l'operazione, non giustificano la
cancellazione preventiva delle tabelle figlie. Il payload degli ID non è un
backup delle partite.

## Cosa cambia

- Nuova partita: regolamento v3, mazzo condiviso, 15 speciali in riserva, tre
  obiettivi segreti e cinque carte iniziali per umano, nessuna mano/obiettivo BOT.
- Quattro tracciati per ogni fazione, valori iniziali e correlazioni del PDF.
- Due attivazioni per fazione a round, ordine della carta evento, sei round sul
  tracciato e massimo otto effettivi con E71/E74.
- Tre opzioni evento esplicite per tutte le 347 carte. Dividendo, veto,
  sblocco speciale, OP spendibili in più azioni e scarti gestiti dal reducer.
- Sviluppo, pressione, schieramento e attacco; costi e limiti del regolamento.
- Combattimento locale Iran/Coalizione, sostegno scelto dagli altri giocatori,
  dadi, modificatori, scelte di perdite ed effetti delle unità.
- Tensione di fine round, pesca, limite mano, rotazione/rientro unità,
  condizioni immediate e punteggio finale con spareggi.
- Mantenimento (regola del 2026-11-25): nelle Operazioni una fazione paga 1 OP
  per una propria unità ruotata, che resta un altro round. Le unità che scadono
  all'ultimo fine round tornano in riserva prima del punteggio finale.
- Anche i BOT mantengono: all'inizio di ogni attivazione rinnovano gratuitamente
  una propria unità ruotata, senza sostituire la normale azione della carta.
  Priorità: unità decisiva per il controllo, Stato conteso, altro Stato controllato;
  poi il costo stampato più alto; a parità completa l'ordine delle unità nel salvataggio.
  Le unità non scelte scadono normalmente. Nessun mantenimento extra a fine round.
- Bonus persistenti delle unità e Blocco di Hormuz (regole del 2026-11-26, solo
  regolamento attuale): gli effetti "al piazzamento" diventano bonus che valgono
  finché l'unità è sul tabellone (Presidio, sconti Influenza, Interferenza, Rete
  informativa, Rotte protette/sicure, Tecnologia duale, Zona protetta, Diplomazia
  UE); Forze Speciali sconfitte −1 Consenso. Il Blocco all'attivazione dà Crisi
  Bellica −1 e Opinione −1; a ogni fine round Europa e Cina Economia −1, Russia
  Economia +1, Iran Consenso +1 ed Economia −1.
- Presenza minima BOT (regola del 2026-11-25, per salvataggi con regole 2026-11-21):
  quando un BOT gioca una carta BOT e non ha unità sul tabellone, il primo
  Sviluppo diventa Schiera della sua unità base (Forze convenzionali, Convenzionale,
  Consiglieri militari, Investimenti BRI, Caschi blu) nello Stato stampato sulla carta.
  Nessuna sostituzione se la priorità prevede già uno Schieramento; le altre azioni
  restano invariate. Mantenimento e presenza minima non generano schieramenti doppi.
- 120 carte BOT con P1/P2, priorità di tracciato e schieramento stampate.
- Tabellone, cinque plance, 75 eventi, 120 fronti BOT, 36 fronti unità compresi
  cinque Dummy, 26 retri: 263 immagini. I Dummy sono solo nella galleria,
  non sono unità giocabili. I due PDF aggiornati sono consultabili; le vecchie
  plance PDF non sono più proposte nella galleria.
- Le partite attive legacy conservano il vecchio motore. Solo i nuovi avvii
  usano l'edizione v3. Nessuna conversione distruttiva di partite esistenti.
- La plancia generale è a tutta larghezza: ogni unità schierata occupa il suo
  singolo riquadro stampato sul territorio, con fronte originale, colore e sigla
  di fazione. Lo zoom 100/150/200% mantiene le pedine ancorate alla mappa.
  Selezionare un riquadro cambia il territorio delle Operazioni; non sposta unità
  già schierate e non aggira costi, capacità o regole di rientro.

## Chiarimento Scudo/Missili incorporato nella fonte

Lo Scudo Missilistico difendente annulla il bonus +4 dei Missili balistici
attaccanti. Uno Scudo annulla tutti i missili, incluso il caso esplicitamente
testato di due missili contro uno Scudo. Il nuovo PDF non contiene più la
contraddizione “ignorano lo Scudo”; non serve più un override del testo.
I PDF e i JPEG nuovi sono conservati senza modifiche. Sui vecchi token
illustrati ancora disponibili viene mostrata la regola corretta.

## Confini e verifiche ancora aperte

1. **Sicurezza multiplayer non completata.** Il motore è client-side e lo stato
   completo è salvato in `game_state.special_uses.tabletop_v3`.
   Mani/obiettivi altrui non sono renderizzati, ma restano accessibili con
   strumenti tecnici. Anche mazzi, RNG e comandi non sono server-autoritativi.
   Usare solo per tavoli fidati. Per segretezza equivalente al tavolo occorre
   un endpoint autenticato con stato privato sul server e proiezioni per utente,
   più policy DB verificate. Non presentare questa versione come anti-cheat.
2. Salvataggio azioni protetto da confronto atomico della revisione per evitare
   doppie mosse concorrenti. L'avvio coinvolge più tabelle e non è una
   transazione DB unica; l'upsert BOT non sovrascrive una fazione umana.
3. Test salvataggio e interfaccia eseguiti con database simulato, non con
   scritture sul database vivo. Auth, RLS e realtime multipersona in produzione
   richiedono ancora una verifica end-to-end autorizzata.
4. Il regolamento non dettaglia tutte le decisioni BOT: sostegno
   Russia/Cina→Iran, Europa→Coalizione; perdite meno costose per prime;
   Intelligence primo avversario, Cyber primo avversario locale, Diplomazia UE
   +1 Opinione; primo territorio idoneo in caso di più candidati. Sono scelte
   deterministiche dell'adattamento, non regole testuali aggiuntive.
5. Se Nucleare 15 e Sanzioni 10 arrivano nello stesso effetto senza guerra, il
   motore usa Nucleare come primo criterio. La precedenza della guerra è
   esplicita nel PDF, quella fra gli altri due terminali richiede una conferma
   regolamentare per essere dichiarata definitiva.
6. Sblocchi speciali verificati sui fronti disponibili: C004, C006, C015.
   C032, C045, NI34 sono ereditati per ID dal catalogo precedente: i rispettivi
   fronti mancano nei materiali disponibili e non sono verificati graficamente.
   L'appendice del regolamento non elenca il riquadro di sblocco.
7. Ordine e Avanzano dei 75 eventi sono tutti verificati sui fronti originali;
   nessuna dipendenza residua dal vecchio elenco eventi. Capacità e 80
   allineamenti territoriali sono trascritti dall'originale.
8. Le librerie amministrative precedenti sono etichettate “legacy” e non
   modificano il catalogo v3. Il catalogo v3 viene aggiornato tramite importer
   e codice; non è stato inventato un editor amministrativo nuovo.

## Verifiche riproducibili

```sh
npm ci
node scripts/test-tabletop.mjs
python3 scripts/import-tabletop-catalog.test.py
npm run build
```

Il runner focalizzato verifica 37 scenari di motore, sei di persistenza, nove
di interfaccia/asset, dodici di logica tutorial e due di UI tutorial.
L'importer ha nove test dedicati. Totale: 75 test focalizzati.
La build Vite passa. Restano avvisi di bundle grande/import misti e numerosi
errori TypeScript preesistenti nel motore legacy: non è stata dichiarata una
compilazione TypeScript globale pulita.

L'importazione dal PDF è riproducibile:

```sh
python3 scripts/import-tabletop-catalog.py --pdf /percorso/regolamento.pdf --check
```

Non occorre alcun servizio AI durante la partita: i BOT sono deterministici
secondo le carte e le regole definite, non chiamate a modelli.

## Superfici sorgente

- `src/game-v3/catalog*`: contratto, dati e controlli di completezza.
- `src/game-v3/engine.ts`, `bots.ts`, `objectives.ts`: regole pure.
- `src/game-v3/online.ts`: adattatore Supabase e revisione atomica.
- `src/game-v3/TabletopGamePage.tsx`, `Boards.tsx`, `Materials.tsx`: nuova UI.
- `src/components/WaitingRoom.tsx`: avvio completo prima di `status=active`.
- `src/App.tsx`: separazione v3/legacy.
- `src/store/onlineGameStore.ts`: blocco driver BOT/obiettivi legacy per v3.
- `src/pages/lobby/Index.tsx`: creazione a sei round, accesso ai materiali,
  rientro/spettatore senza sostituire BOT in una partita iniziata.
- `src/game-v3/tutorial/`: scenario guidato isolato, nessuna scrittura DB.
- `vercel.json`: esegue `verify:tabletop` prima della build, così un test
  fallito blocca la futura release Vercel. Questo configura un controllo,
  non prova che il codice sia stato caricato o pubblicato.

I file `test-client.ts` e `test-ui-store.ts` sono fixture soltanto per i test:
non sono importati dalla build dell'applicazione.
