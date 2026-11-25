/**
 * Guide "Come funziona" (semplificazione 25/11): 2-4 passi in parole semplici per sezione.
 * Chiave = id sezione (societyConfig) oppure chiave speciale ('cantiere').
 * Mostrate da components/HowToBox sopra la vista; si chiudono e si riaprono dal "?".
 */
export interface HowTo { title: string; steps: string[]; tip?: string }

export const HOWTO: Record<string, HowTo> = {
  dashboard: {
    title: 'La tua giornata',
    steps: [
      'Qui trovi in un colpo d’occhio le attività di oggi, le notifiche e le pratiche in corso.',
      'Clicca su un riquadro per andare al dettaglio.',
      'A sinistra scegli la società (Onirico, Materico…) e lavori nelle sue sezioni.',
    ],
  },
  agenda: {
    title: 'Agenda personale',
    steps: [
      'Vedi tutti i tuoi impegni e appuntamenti, di tutte le società.',
      '"Nuovo impegno" in alto: scegli se è un’attività o un appuntamento con qualcuno.',
      'Clicca un giorno per vederlo nel dettaglio; la matita modifica una voce.',
    ],
    tip: 'Il colore del blocco è la società, il pallino è l’urgenza. La società preimpostata si sceglie dal tuo profilo.',
  },
  'home-agenda': {
    title: 'Agenda della società',
    steps: [
      'Mostra solo gli impegni di questa società.',
      'Quello che crei da qui è già assegnato a questa società.',
      'La tua agenda completa è in alto a sinistra, "Agenda".',
    ],
  },
  'prod-progetti': {
    title: 'Pratiche e commesse',
    steps: [
      '"Nuovo progetto" crea una pratica: cliente dalla rubrica, indirizzo, date. Le attività vengono create e assegnate da sole.',
      'Una pratica nasce anche da sola quando un preventivo viene accettato.',
      'Apri una pratica per vedere avanzamento, documenti, cantiere e contabilità nelle sue schede.',
    ],
  },
  'comm-sopralluoghi': {
    title: 'Dal cliente alla commessa',
    steps: [
      '"Nuovo sopralluogo": cliente (dalla rubrica o nuovo), indirizzo, data e chi ci va. Finisce nella sua agenda.',
      'Durante o dopo il sopralluogo inserisci mq, livello di dettaglio e servizi: la stima si calcola da sola.',
      '"Crea il preventivo": lo trovi nel Centro Commerciale, pronto da stampare o far firmare.',
      'Preventivo accettato = commessa creata con le attività del rilievo già pronte.',
    ],
    tip: 'Le tariffe si cambiano dal tasto "Tariffe" (amministratori).',
  },
  'prod-abilitativa': {
    title: 'Fase abilitativa',
    steps: [
      'Righe = documenti (collaudo, DOCFA, APE, agibilità…), colonne = pratiche attive.',
      'Clicca una casella: scegli lo stato e a chi è assegnata.',
      'Chi riceve la casella la trova in agenda: quando la spunta, qui diventa "Fatto".',
    ],
  },
  'comm-preventivi': {
    title: 'Preventivi della società',
    steps: [
      'Qui consulti i preventivi di questa società e il loro stato.',
      'Si creano e si modificano nel Centro Commerciale (Strategico) oppure da un sopralluogo.',
      'Quando un preventivo è accettato nasce la commessa.',
    ],
  },
  'comm-stime': {
    title: 'Stima preliminare',
    steps: [
      'Una stima veloce del costo dei lavori: si inseriscono solo quantità e livello (base, medio, alto).',
      'Il budget si calcola da solo e si può stampare per il cliente.',
    ],
  },
  'comm-clienti': {
    title: 'Rubrica',
    steps: [
      'L’anagrafica di clienti e imprese, usata ovunque (pratiche, preventivi, sopralluoghi).',
      'Inserisci un contatto una volta sola: i moduli si compilano da soli.',
    ],
  },
  'prod-computi': {
    title: 'Computi metrici',
    steps: [
      'Un computo per pratica: voci a mano o importate da un file CSV.',
      'Il totale alimenta parcelle e contabilità di commessa.',
    ],
  },
  'prod-mappa': {
    title: 'Mappa operativa',
    steps: [
      'Tutti i luoghi della società sulla mappa: pratiche, cantieri, immobili.',
      'Da un punto puoi segnalare un problema o programmare un sopralluogo: diventa un’attività in agenda.',
    ],
  },
  'prod-render': {
    title: 'Render AI',
    steps: [
      'Carica una foto del lotto e rispondi a poche domande sullo stile.',
      'L’AI genera una bozza di render da scaricare e allegare alla pratica.',
    ],
  },
  'prod-opportunita': {
    title: 'Ricerca opportunità',
    steps: [
      'Ogni immobile segue i passi in ordine: contatto, sopralluogo, analisi, due diligence, offerta, atto.',
      'Un passo si sblocca quando il precedente è fatto.',
      'All’atto diventa un investimento in "Operazioni & Investitori".',
    ],
  },
  'prod-gestione': {
    title: 'Immobili e servizi',
    steps: [
      'Registra gli immobili in gestione e le richieste di servizio (manutenzione, pulizie…).',
      'Assegna la richiesta a un partner: costo e prezzo al cliente danno il margine.',
    ],
  },
  'prod-potenziale': {
    title: 'Potenziale cantiere',
    steps: [
      'Le trattative di lavori in arrivo, con valore e probabilità.',
      'Quando la trattativa è chiusa diventa una pratica.',
    ],
  },
  'home-piano': {
    title: 'Piano di battaglia',
    steps: [
      'La settimana di lavoro della società: trascina le attività sui giorni.',
      'Spunta quelle fatte; le frecce spostano di settimana.',
    ],
  },
  'home-cicli': {
    title: 'Lista dei cicli',
    steps: ['Tutti i lavori aperti della società, da portare nel Piano di battaglia quando vanno fatti.'],
  },
  'home-notifiche': {
    title: 'Notifiche',
    steps: ['Avvisi e messaggi che riguardano questa società e i suoi clienti.'],
  },
  'home-chat': {
    title: 'Chat di società',
    steps: ['Una stanza di chat per il team di questa società.'],
  },
  'mkt-calendario': {
    title: 'Calendario editoriale',
    steps: ['Consulta i contenuti social programmati per questa società. Si gestiscono nel Centro Marketing.'],
  },
  'amm-quadro': {
    title: 'Quadro contabile',
    steps: ['Fatturato, costi e ultime fatture della società, in sola lettura. Si registrano nel Centro Direzione.'],
  },
  'amm-adempimenti': {
    title: 'Adempimenti societari',
    steps: [
      'La lista dei documenti obbligatori della società (PEC, polizza, DURC…).',
      'Spunta quelli presenti, metti la scadenza e allega il file o il link.',
    ],
  },
  'amm-credenziali': {
    title: 'Credenziali',
    steps: ['Password e accessi della società, protetti da una password principale.'],
  },
  'hr-team': {
    title: 'Team e permessi',
    steps: [
      'Le persone del team, le loro mansioni e cosa possono vedere o modificare.',
      'Le mansioni servono ad assegnare le attività in automatico.',
    ],
  },
  'hr-incentivi': {
    title: 'Piano incentivante',
    steps: ['Punti per le attività svolte e bonus per fasce.'],
  },
  cestino: {
    title: 'Cestino',
    steps: ['Quello che viene eliminato resta qui 60 giorni: puoi ripristinarlo.'],
  },
  'point-of-entry': {
    title: 'Point of Entry',
    steps: [
      'Tutte le richieste in arrivo in un posto solo: nuovi contatti e richieste dal portale clienti.',
      'Smista ogni contatto alla società giusta con un tasto.',
    ],
  },
  'mkt-centro': {
    title: 'Centro Marketing',
    steps: [
      'In alto la situazione di tutti gli account (società e clienti).',
      'Apri un account per calendario, KPI, spese e report.',
      'La scheda si salva da sola mentre scrivi.',
    ],
  },
  'comm-centro': {
    title: 'Centro Commerciale',
    steps: [
      'Preventivi e contratti di tutte le società.',
      'Scegli la società: crea il preventivo, stampalo, fallo firmare con codice o invialo al portale del cliente.',
      'Accettato = commessa creata.',
    ],
  },
  'amm-centro': {
    title: 'Centro Direzione',
    steps: [
      'I numeri di ogni società: fatturato, incassi, liquidità, punto di pareggio.',
      'Apri una società per piano finanziario, IVA, budget e report.',
    ],
  },
  'amm-contabilita': {
    title: 'Contabilità operativa',
    steps: ['Qui si registrano fatture, scadenze e movimenti di tutte le società.'],
  },
  'hr-report': {
    title: 'Report e tempi',
    steps: ['I tempi delle attività e il report settimanale o mensile di ogni persona, già compilato dai dati.'],
  },
  'hr-recruiting': {
    title: 'Recruiting',
    steps: ['Annunci di lavoro, candidati per fase e piani di inserimento.'],
  },
  'sw-aulico': {
    title: 'Segnalazioni',
    steps: ['Bug e richieste inviati dal pulsante "Segnala un problema". Cambia lo stato quando sono risolti.'],
  },
  cantiere: {
    title: 'Come funziona il cantiere',
    steps: [
      'Si apre dalla pratica, scheda "Cantiere": crea il cantiere e assegna l’impresa, che lo vede dal suo portale.',
      'Ogni giorno: "Giornale di cantiere" con meteo, operai, lavorazioni e foto. L’impresa invia i rapportini, lo studio li approva.',
      'Avanzamento: un SAL approvato diventa una bozza di fattura in contabilità.',
      'Documenti e sicurezza con scadenza avvisano da soli prima che scadano.',
    ],
    tip: 'Tre aree: "Campi condivisi" (tutti), "Area Tecnici" (studio, direzione lavori), "Area Impresa" (dati dell’impresa).',
  },
};
