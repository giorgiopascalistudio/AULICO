/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Template, UserProfile, Project, Task, FinanceMovement, ProjectInternal, MatericoEstimate } from './types';

export const MANSIONI = [
  'Sopralluoghi/Rilievi',
  'Architetto',
  'Ingegnere',
  'Geometra',
  'Impiantista',
  'Pratiche',
  'Sicurezza',
  'Direzione Lavori',
  'Computi',
  'Amministrazione'
];

export const ROLE_RULES: [RegExp, string][] = [
  [/sopralluog|rilievo|laser|stato di fatto|documentazione fotografica|misurazion/i, 'Sopralluoghi/Rilievi'],
  [/struttural/i, 'Ingegnere'],
  [/catast|docfa|pregeo|planimetr|visur/i, 'Geometra'],
  [/impiant|elettric|idraulic|riscald|cavidott|quadro|punti luce|\bprese\b|cablag|string|moduli|inverter|connession|gse|enea|fotovolta/i, 'Impiantista'],
  [/energetic|diagnosi|\bape\b|dimensionament/i, 'Impiantista'],
  [/sicurezz/i, 'Sicurezza'],
  [/direzione lavori|tracciament|collaud|demolizion|opere edili|finitur|montaggio|posa|verifich/i, 'Direzione Lavori'],
  [/comput|metric/i, 'Computi'],
  [/contabilit|business plan|preventiv|rendicontaz|giustificativ|costi/i, 'Amministrazione'],
  [/architettonic|render|modellazion|capitolat|layout|\b2d\b|\b3d\b/i, 'Architetto'],
  [/pratic|scia|cila|permesso|notific|agibilit|autorizzazion|nulla osta|deposit|domanda|piattaform|bando|conformit/i, 'Pratiche']
];

export const BUILTIN_TEMPLATES_RAW = [
  {
    id: 'arch-completo',
    icon: 'building',
    name: 'Progetto Architettonico Completo',
    desc: 'Pipeline completa: dal rilievo all’agibilità. Fase progettuale, abilitativa, esecutiva e collaudi.',
    phases: [
      { name: 'Sopralluogo & Rilievi', tasks: ['Sopralluogo iniziale', 'Rilievo laser scanner 3D', 'Documentazione fotografica', 'Verifica stato di fatto e vincoli'] },
      { name: 'Progettazione', tasks: ['Progetto architettonico 2D', 'Modellazione 3D e render fotorealistici', 'Progetto strutturale', 'Progetto energetico', 'Progetto impiantistico', 'Computo metrico estimativo'] },
      { name: 'Pratiche & Autorizzazioni', tasks: ['Pratiche catastali', 'Attestato Prestazione Energetica (APE)', 'Permesso di costruire / SCIA / CILA', 'Notifica preliminare', 'Comunicazione inizio lavori'] },
      { name: 'Cantiere & Direzione Lavori', tasks: ['Tracciamenti', 'Direzione lavori architettonico', 'Direzione lavori strutturale', 'Coordinamento sicurezza', 'Contabilità di cantiere'] },
      { name: 'Chiusura & Collaudi', tasks: ['Collaudo finale', 'Autorizzazione allo scarico', 'Agibilità', 'Consegna documentazione al cliente'] }
    ]
  },
  {
    id: 'ristrutturazione',
    icon: 'hammer',
    name: 'Ristrutturazione',
    desc: 'Recupero e ristrutturazione di immobile esistente, dalle pratiche edilizie alle finiture.',
    phases: [
      { name: 'Sopralluogo & Rilievi', tasks: ['Sopralluogo', 'Rilievo dello stato di fatto', 'Documentazione fotografica'] },
      { name: 'Progettazione', tasks: ['Progetto architettonico', 'Render di progetto', 'Progetto impianti', 'Computo metrico', 'Capitolato lavori'] },
      { name: 'Pratiche Edilizie', tasks: ['CILA / SCIA', 'Pratiche catastali', 'Eventuali nulla osta (paesaggistico, ecc.)'] },
      { name: 'Cantiere', tasks: ['Demolizioni', 'Opere edili', 'Impianti', 'Finiture', 'Direzione lavori', 'Sicurezza'] },
      { name: 'Chiusura', tasks: ['Collaudo', 'Aggiornamento catastale', 'Agibilità'] }
    ]
  },
  {
    id: 'impianto-elettrico',
    icon: 'bolt',
    name: 'Impianto Elettrico',
    desc: 'Progettazione e realizzazione impianto elettrico a norma (DM 37/08) con collaudo.',
    phases: [
      { name: 'Sopralluogo', tasks: ['Sopralluogo tecnico', 'Rilievo impianto esistente', 'Verifica quadro e contatore'] },
      { name: 'Progettazione', tasks: ['Schema elettrico unifilare', 'Dimensionamento linee e protezioni', 'Progetto impianto', 'Computo materiali'] },
      { name: 'Pratiche', tasks: ['Dichiarazione di conformità (DM 37/08)', 'Pratica distributore (se necessaria)'] },
      { name: 'Installazione & D.L.', tasks: ['Posa cavidotti e scatole', 'Cablaggio quadro elettrico', 'Installazione punti luce / prese', 'Direzione lavori'] },
      { name: 'Collaudo', tasks: ['Verifiche strumentali', 'Collaudo impianto', 'Rilascio certificazioni'] }
    ]
  },
  {
    id: 'fotovoltaico',
    icon: 'sun',
    name: 'Impianto Fotovoltaico',
    desc: 'Impianto FV con accumulo: dimensionamento, pratiche di connessione e attivazione.',
    phases: [
      { name: 'Sopralluogo', tasks: ['Sopralluogo e analisi dei consumi', 'Verifica copertura / falda', 'Verifica quadro e contatore'] },
      { name: 'Progettazione', tasks: ['Dimensionamento impianto', 'Layout moduli e stringhe', 'Progetto elettrico FV', 'Computo metrico'] },
      { name: 'Pratiche', tasks: ['Pratica di connessione (TICA)', 'Richiesta GSE / Scambio sul posto', 'Comunicazione ENEA (detrazione)', 'Pratiche autorizzative'] },
      { name: 'Installazione', tasks: ['Montaggio strutture', 'Posa moduli', 'Installazione inverter / accumulo', 'Cablaggio e quadri'] },
      { name: 'Collaudo & Attivazione', tasks: ['Verifiche e collaudo', 'Attivazione contatore di scambio', 'Consegna documentazione'] }
    ]
  },
  {
    id: 'catastale',
    icon: 'mapPin',
    name: 'Pratica Catastale',
    desc: 'Aggiornamento e registrazione al catasto (DOCFA / Pregeo).',
    phases: [
      { name: 'Sopralluogo', tasks: ['Sopralluogo e misurazioni', 'Reperimento documenti e visure'] },
      { name: 'Elaborazione', tasks: ['Elaborazione planimetria', 'Compilazione DOCFA / Pregeo'] },
      { name: 'Presentazione', tasks: ['Invio pratica Agenzia delle Entrate', 'Verifica avvenuta registrazione'] }
    ]
  },
  {
    id: 'bando',
    icon: 'award',
    name: 'Bando / Agevolazione',
    desc: 'Accesso ad agevolazioni (MINIPIA, PIA, …) con presentazione domanda e rendicontazione.',
    phases: [
      { name: 'Analisi', tasks: ['Verifica requisiti del bando', 'Analisi di fattibilità', 'Raccolta documentazione'] },
      { name: 'Progettazione Agevolazione', tasks: ['Business plan / piano investimenti', 'Progetto tecnico', 'Computi e preventivi'] },
      { name: 'Presentazione Domanda', tasks: ['Compilazione piattaforma (es. PugliaSemplice)', 'Caricamento allegati', 'Invio domanda'] },
      { name: 'Rendicontazione', tasks: ['Monitoraggio avanzamento', 'Raccolta giustificativi di spesa', 'Rendicontazione finale'] }
    ]
  },
  {
    id: 'ape',
    icon: 'leaf',
    name: 'APE / Diagnosi Energetica',
    desc: 'Diagnosi energetica e redazione dell’Attestato di Prestazione Energetica.',
    phases: [
      { name: 'Sopralluogo', tasks: ['Sopralluogo', 'Rilievo dati edificio'] },
      { name: 'Diagnosi', tasks: ['Analisi dei consumi', 'Diagnosi energetica', 'Simulazione interventi di efficientamento'] },
      { name: 'Certificazione', tasks: ['Redazione APE', 'Deposito del certificato'] }
    ]
  },
  {
    id: 'marketing-strategico',
    icon: 'award',
    name: 'Strategia di Marketing Aziendale',
    desc: 'Ideazione brand, benchmark competitivo, piano editoriale e campagne pubblicitarie per aziende.',
    phases: [
      { name: 'Analisi Strategica', tasks: ['Audit Brand Esistente', 'Analisi Competitor & Target', 'Definizione USP & Posizionamento'] },
      { name: 'Identità Visiva & Asset', tasks: ['Ideazione Logo e Palette Colori', 'Sviluppo Brand Book', 'Realizzazione Materiale Coordinato'] },
      { name: 'Piano & Canali', tasks: ['Strategia SEO & Calendario Editoriale', 'Configurazione Account Social', 'Ottimizzazione Canali di Conversione'] },
      { name: 'Campagne & Lancio', tasks: ['Creazione Campagne Google & Meta Ads', 'Set up Monitoraggio / Web Analytics', 'Report di Lancio & Ottimizzazione'] }
    ]
  },
  {
    id: 'fornitura-materico',
    icon: 'hammer',
    name: 'Approvvigionamento Materico',
    desc: 'Gestione contatti, preventivi partner e forniture per finiture di interni ed esterni ad alta marginalità.',
    phases: [
      { name: 'Selezione Materiali', tasks: ['Briefing esigenze finiture con il cliente', 'Identificazione categorie (porte, infissi, pavimenti)', 'Ricerca aziende partner d’eccellenza'] },
      { name: 'Raccolta Preventivi', tasks: ['Richiesta preventivi tecnico-economici ai partner', 'Verifica fattibilità e tempistiche di posa', 'Inserimento quotazioni nel portale Onirico'] },
      { name: 'Sottoscrizione Cliente', tasks: ['Applicazione mark-up Onirico design', 'Presentazione campionature ed estratti', 'Informativa ed accettazione del cliente finale'] },
      { name: 'Posa & Consegna', tasks: ['Ordine materiali ed acconto fornitori', 'Logistica e scarico in cantiere', 'Direzione posa e collaudo finale con il partner'] }
    ]
  },
  {
    id: 'concept-unico',
    icon: 'sun',
    name: 'Concept Unico - Progetto d’Atelier',
    desc: 'Iter esclusivo sartoriale firmato Onirico per ville di lusso e opere d’arte abitative.',
    phases: [
      { name: 'Rilievo Sensoriale', tasks: ['Analisi climatica e dei venti', 'Sopralluogo emozionale del luogo', 'Studio delle ombre e della geotermia naturale'] },
      { name: 'Tavola Archetipica', tasks: ['Sviluppo concept filosofico', 'Tavolozze materiche esclusive certificate', 'Incontro di co-progettazione segreta con il committente'] },
      { name: 'Sviluppo Esecutivo Chiuso', tasks: ['Ingegnerizzazione dei dettagli millimetrici', 'Scelta artigiani d’eccellenza autorizzati Onirico', 'Pianificazione blindata cantiere'] }
    ]
  }
];

export const SEED_TEMPLATES: Record<string, Template> = BUILTIN_TEMPLATES_RAW.reduce((acc, t, i) => {
  const phases: Record<string, any> = {};
  t.phases.forEach((p, pi) => {
    const tasks: Record<string, any> = {};
    p.tasks.forEach((tt, ti) => {
      tasks[`t${ti}`] = { title: tt, order: ti };
    });
    phases[`p${pi}`] = { name: p.name, order: pi, tasks };
  });

  acc[t.id] = {
    id: t.id,
    name: t.name,
    desc: t.desc,
    icon: t.icon,
    builtin: true,
    order: i,
    phases,
    createdAt: 1780324800000 // June 2026
  };
  return acc;
}, {} as Record<string, Template>);

// Seed standard profiles, projects, tasks and finance for high-fidelity offline preview out-of-the-box
export const SEED_USERS: Record<string, UserProfile> = {
  'admin': {
    uid: 'admin',
    name: 'Giorgio Pascali',
    email: 'giorgio.pascali990@gmail.com',
    role: 'admin',
    title: 'Architetto Senior',
    functions: ['Architetto', 'Sopralluoghi/Rilievi', 'Direzione Lavori'],
    active: true,
    createdAt: 1780324800000
  },
  'mario': {
    uid: 'mario',
    name: 'Mario Rossi',
    email: 'mario@oniricodesign.com',
    role: 'manager',
    title: 'Project Manager',
    functions: ['Pratiche', 'Computi', 'Amministrazione'],
    active: true,
    createdAt: 1780324800000
  },
  'luca': {
    uid: 'luca',
    name: 'Luca Bianchi',
    email: 'luca@oniricodesign.com',
    role: 'staff',
    title: 'Ingegnere Strutturista',
    functions: ['Ingegnere', 'Sicurezza'],
    active: true,
    createdAt: 1780324800000
  },
  'cliente_famiglia': {
    uid: 'cliente_famiglia',
    name: 'Cliente Bianchi',
    email: 'cliente@oniricodesign.com',
    role: 'cliente',
    title: 'Cliente Portale Studio',
    active: true,
    createdAt: 1780324800000,
    sector: 'studio',
    projectIds: {
      'p-villa-ostuni': true,
      'p-attico-lecce': true
    }
  },
  'cliente_strategico': {
    uid: 'cliente_strategico',
    name: 'Alessandro Galli',
    email: 'strategico@oniricodesign.com',
    role: 'cliente',
    title: 'Cliente Onirico Strategico',
    active: true,
    createdAt: 1780324800000,
    sector: 'strategico',
    projectIds: {
      'p-strategico-bari': true,
      'p-lancio-masseriasalento': true,
      'p-strategico-pastificio': true
    }
  },
  'cliente_strategico_2': {
    uid: 'cliente_strategico_2',
    name: 'Edoardo Neri',
    email: 'edoardo@strategico.com',
    role: 'cliente',
    title: 'Cliente Strategico Brand & Growth',
    active: true,
    createdAt: 1780324800000,
    sector: 'strategico',
    projectIds: {
      'p-strategico-bari': true,
      'p-strategico-pastificio': true
    }
  },
  'cliente_materico': {
    uid: 'cliente_materico',
    name: 'Roberto Carlucci',
    email: 'materico_cliente@oniricodesign.com',
    role: 'cliente',
    title: 'Cliente Onirico Materico',
    active: true,
    createdAt: 1780324800000,
    sector: 'materico',
    projectIds: {
      'p-materico-trani': true,
      'p-rivestimenti-otranto': true,
      'p-materico-pavimenti': true
    }
  },
  'cliente_materico_2': {
    uid: 'cliente_materico_2',
    name: 'Giada Valenti',
    email: 'giada@materico.com',
    role: 'cliente',
    title: 'Cliente Materico & Interior',
    active: true,
    createdAt: 1780324800000,
    sector: 'materico',
    projectIds: {
      'p-materico-trani': true,
      'p-materico-pavimenti': true
    }
  },
  'partner_impresa': {
    uid: 'partner_impresa',
    name: 'Ing. Vincenzo Loconsole',
    email: 'partner@oniricodesign.com',
    role: 'partner',
    title: 'Artigiano Partner (ArredoArtigiano)',
    active: true,
    createdAt: 1780324800000,
    sector: 'partner',
    projectIds: {
      'p-materico-trani': true,
      'p-rivestimenti-otranto': true,
      'p-materico-pavimenti': true
    }
  },
  'partner_ceramiche': {
    uid: 'partner_ceramiche',
    name: 'Ceramiche Spada S.r.l.',
    email: 'partner2@oniricodesign.com',
    role: 'partner',
    title: 'Fornitore Marmi & Finiture (Partner)',
    active: true,
    createdAt: 1780324800000,
    sector: 'partner',
    projectIds: {
      'p-materico-trani': true,
      'p-rivestimenti-otranto': true
    }
  },
  'cliente_studio_test': {
    uid: 'cliente_studio_test',
    name: 'Cliente Studio Test',
    email: 'studio-test@oniricodesign.com',
    role: 'cliente',
    title: 'Account Test Studio',
    active: true,
    createdAt: 1780324800000,
    sector: 'studio',
    projectIds: {
      'p-villa-ostuni': true,
      'p-attico-lecce': true
    }
  },
  'cliente_strategico_test': {
    uid: 'cliente_strategico_test',
    name: 'Cliente Strategico Test',
    email: 'strategia-test@oniricodesign.com',
    role: 'cliente',
    title: 'Account Test Strategico',
    active: true,
    createdAt: 1780324800000,
    sector: 'strategico',
    projectIds: {
      'p-strategico-bari': true
    }
  },
  'cliente_materico_test': {
    uid: 'cliente_materico_test',
    name: 'Cliente Materico Test',
    email: 'materico-test@oniricodesign.com',
    role: 'cliente',
    title: 'Account Test Materico',
    active: true,
    createdAt: 1780324800000,
    sector: 'materico',
    projectIds: {
      'p-materico-trani': true
    }
  },
  'partner_test': {
    uid: 'partner_test',
    name: 'Partner Test Artigiano',
    email: 'partner-test@oniricodesign.com',
    role: 'partner',
    title: 'Account Test Partner B2B',
    active: true,
    createdAt: 1780324800000,
    sector: 'partner',
    projectIds: {
      'p-villa-ostuni': true,
      'p-materico-trani': true
    }
  }
};

export const SEED_PROJECTS: Record<string, Project> = {
  'p-villa-ostuni': {
    id: 'p-villa-ostuni',
    name: 'Villa Bianchi — Ostuni',
    code: 'ARC-2026-001',
    client: 'Cliente Bianchi',
    location: 'Ostuni (BR)',
    manager: 'mario',
    startDate: '2026-05-01',
    dueDate: '2026-10-31',
    notes: 'Ristrutturazione trullo saraceno e ampliamento con piscina. Massima attenzione alla conservazione della pietra locale.',
    status: 'attivo',
    icon: 'building',
    templateId: 'arch-completo',
    templateName: 'Progetto Architettonico Completo',
    clientUid: 'cliente_famiglia',
    committente: 'Mario Bianchi',
    indirizzoImmobile: 'C.da Pascarosa, Ostuni',
    foglio: '142',
    particella: '54',
    sub: '1',
    tipoIntervento: 'Ristrutturazione e Ampliamento',
    clientMessage: 'Questa settimana completiamo i rilievi 3D con laser scanner e avviamo la prima modellazione strutturale.',
    clientMessageAt: 1780324800000,
    clientMessageBy: 'admin',
    division: 'studio',
    phases: {
      'p0': {
        id: 'p0',
        name: 'Sopralluogo & Rilievi',
        order: 0,
        tasks: {
          't0': { title: 'Sopralluogo iniziale', order: 0, done: true, role: 'Sopralluoghi/Rilievi', assignee: 'admin', due: '2026-05-05' },
          't1': { title: 'Rilievo laser scanner 3D', order: 1, done: true, role: 'Sopralluoghi/Rilievi', assignee: 'admin', due: '2026-05-10' },
          't2': { title: 'Documentazione fotografica', order: 2, done: true, role: 'Sopralluoghi/Rilievi', assignee: 'admin', due: '2026-05-10' },
          't3': { title: 'Verifica stato di fatto e vincoli', order: 3, done: true, role: 'Sopralluoghi/Rilievi', assignee: 'mario', due: '2026-05-15' }
        }
      },
      'p1': {
        id: 'p1',
        name: 'Progettazione',
        order: 1,
        tasks: {
          't0': { title: 'Progetto architettonico 2D', order: 0, done: true, role: 'Architetto', assignee: 'admin', due: '2026-05-25' },
          't1': { title: 'Modellazione 3D e render fotorealistici', order: 1, done: false, role: 'Architetto', assignee: 'admin', due: '2026-06-15' },
          't2': { title: 'Progetto strutturale', order: 2, done: false, role: 'Ingegnere', assignee: 'luca', due: '2026-06-30' },
          't3': { title: 'Progetto energetico', order: 3, done: false, role: 'Impiantista', assignee: 'luca', due: '2026-06-30' },
          't4': { title: 'Progetto impiantistico', order: 4, done: false, role: 'Impiantista', assignee: 'luca', due: '2026-06-30' },
          't5': { title: 'Computo metrico estimativo', order: 5, done: false, role: 'Computi', assignee: 'mario', due: '2026-07-05' }
        }
      },
      'p2': {
        id: 'p2',
        name: 'Pratiche & Autorizzazioni',
        order: 2,
        tasks: {
          't0': { title: 'Pratiche catastali', order: 0, done: false, role: 'Pratiche', assignee: 'mario', due: '2026-07-15' },
          't1': { title: 'Attestato Prestazione Energetica (APE)', order: 1, done: false, role: 'Pratiche', assignee: 'mario', due: '2026-07-20' },
          't2': { title: 'Permesso di costruire / SCIA / CILA', order: 2, done: false, role: 'Pratiche', assignee: 'mario', due: '2026-07-30' },
          't3': { title: 'Notifica preliminare', order: 3, done: false, role: 'Pratiche', assignee: 'mario', due: '2026-08-05' },
          't4': { title: 'Comunicazione inizio lavori', order: 4, done: false, role: 'Pratiche', assignee: 'mario', due: '2026-08-10' }
        }
      }
    },
    createdAt: 1780324800000,
    updatedAt: 1780324800000
  },
  'p-attico-lecce': {
    id: 'p-attico-lecce',
    name: 'Attico Barocco — Lecce',
    code: 'ARC-2026-005',
    client: 'Dott.ssa Sofia Rizzo',
    location: 'Lecce (LE)',
    manager: 'luca',
    startDate: '2026-05-20',
    dueDate: '2026-12-15',
    notes: 'Ristrutturazione d\'interni di pregio nel cuore del centro storico leccese. Restauro delle volte a stella e integrazione sistemi domotici.',
    status: 'attivo',
    icon: 'home',
    templateId: 'arch-completo',
    templateName: 'Progetto Architettonico Completo',
    clientUid: 'cliente_famiglia',
    committente: 'Sofia Rizzo',
    indirizzoImmobile: 'Via Palmieri, Lecce',
    foglio: '42',
    particella: '112',
    sub: '5',
    tipoIntervento: 'Restauro, Risanamento Conservativo',
    clientMessage: 'I tecnici stanno completando l\'analisi stratigrafica per verificare l\'integrità degli intonaci storici.',
    clientMessageAt: 1780324800000,
    clientMessageBy: 'admin',
    division: 'studio',
    phases: {
      'p0': {
        id: 'p0',
        name: 'Fattibilità & Rilievi',
        order: 0,
        tasks: {
          't0': { title: 'Verifica vincoli Soprintendenza', order: 0, done: true, role: 'Pratiche', assignee: 'mario', due: '2026-05-25' },
          't1': { title: 'Rilievo geometrico delle volte', order: 1, done: true, role: 'Sopralluoghi/Rilievi', assignee: 'admin', due: '2026-05-28' },
          't2': { title: 'Sondaggi sulle murature storiche', order: 2, done: false, role: 'Ingegnere', assignee: 'luca', due: '2026-06-18' }
        }
      },
      'p1': {
        id: 'p1',
        name: 'Concept & Interior Design',
        order: 1,
        tasks: {
          't0': { title: 'Moodboard materiali barocchi uniti a elementi moderni', order: 0, done: false, role: 'Architetto', assignee: 'admin', due: '2026-06-25' },
          't1': { title: 'Render fotorealistici delle zone giorno', order: 1, done: false, role: 'Architetto', assignee: 'admin', due: '2026-07-10' }
        }
      }
    },
    createdAt: 1780324800000,
    updatedAt: 1780324800000
  },
  'p-materico-trani': {
    id: 'p-materico-trani',
    name: 'Fornitura Porte & Infissi — Villa Trani',
    code: 'MAT-2026-002',
    client: 'Roberto Carlucci',
    location: 'Trani (BT)',
    manager: 'mario',
    startDate: '2026-05-15',
    dueDate: '2026-09-30',
    notes: 'Incarico Materico per la fornitura e posa in opera di porte interne pantografate e infissi in legno-alluminio a taglio termico.',
    status: 'attivo',
    icon: 'hammer',
    templateId: 'fornitura-materico',
    templateName: 'Approvvigionamento Materico',
    clientUid: 'cliente_famiglia',
    committente: 'Roberto Carlucci',
    indirizzoImmobile: 'Via Lungomare, Trani',
    division: 'materico',
    matericoEstimatedBudget: 32000,
    matericoFinitureType: 'infissi_minimali',
    matericoSottofondiStatus: 'idoneo',
    phases: {
      'p0': {
        id: 'p0',
        name: 'Selezione Materiali',
        order: 0,
        tasks: {
          't0': { title: 'Briefing esigenze finiture con il cliente', order: 0, done: true, role: 'Architetto', assignee: 'admin', due: '2026-05-18' },
          't1': { title: 'Identificazione categorie (porte, infissi)', order: 1, done: true, role: 'Architetto', assignee: 'admin', due: '2026-05-20' },
          't2': { title: 'Ricerca aziende partner d’eccellenza', order: 2, done: true, role: 'Computi', assignee: 'mario', due: '2026-05-25' }
        }
      },
      'p1': {
        id: 'p1',
        name: 'Raccolta Preventivi',
        order: 1,
        tasks: {
          't0': { title: 'Richiesta preventivi tecnico-economici ai partner', order: 0, done: true, role: 'Computi', assignee: 'mario', due: '2026-06-05' },
          't1': { title: 'Inserimento quotazioni nel portale Onirico', order: 1, done: false, role: 'Computi', assignee: 'mario', due: '2026-06-12' }
        }
      }
    } as any,
    createdAt: 1780324800000,
    updatedAt: 1780324800000
  },
  'p-rivestimenti-otranto': {
    id: 'p-rivestimenti-otranto',
    name: 'Rivestimenti & Arredi Luxury — Villa Otranto',
    code: 'MAT-2026-007',
    client: 'Ing. Giuseppe Rosati',
    location: 'Otranto (LE)',
    manager: 'mario',
    startDate: '2026-05-22',
    dueDate: '2026-11-20',
    notes: 'Progetto Materico per rivestimenti di lusso in microcemento continuo, marmi storici spazzolati, cucina bespoke in acciaio e teak marino con illuminazione di design.',
    status: 'attivo',
    icon: 'droplet',
    templateId: 'fornitura-materico',
    templateName: 'Approvvigionamento Materico',
    clientUid: 'cliente_famiglia',
    committente: 'Giuseppe Rosati',
    indirizzoImmobile: 'C.da Scalelle, Otranto',
    division: 'materico',
    matericoEstimatedBudget: 75000,
    matericoFinitureType: 'pavimenti_resina',
    matericoSottofondiStatus: 'da_asseverare',
    phases: {
      'p0': {
        id: 'p0',
        name: 'Design Superfici & Arredo',
        order: 0,
        tasks: {
          't0': { title: 'Scelta campionature in showroom', order: 0, done: true, role: 'Architetto', assignee: 'admin', due: '2026-05-28' },
          't1': { title: 'Verifica idoneità sottofondi per resine', order: 1, done: false, role: 'Impiantista', assignee: 'luca', due: '2026-06-15' }
        }
      },
      'p1': {
        id: 'p1',
        name: 'Valutazione Forniture',
        order: 1,
        tasks: {
          't0': { title: 'Emissione rda preventivi ai brand partner', order: 0, done: true, role: 'Computi', assignee: 'mario', due: '2026-06-01' },
          't1': { title: 'Approvazione proposte del cliente', order: 1, done: false, role: 'Computi', assignee: 'mario', due: '2026-06-20' }
        }
      }
    } as any,
    createdAt: 1780324800000,
    updatedAt: 1780324800000
  },
  'p-strategico-bari': {
    id: 'p-strategico-bari',
    name: 'Campagna & Sviluppo Brand — Caffè Bari',
    code: 'STR-2026-003',
    client: 'Bari Espresso Srl',
    location: 'Bari (BA)',
    manager: 'mario',
    startDate: '2026-05-10',
    dueDate: '2026-08-15',
    notes: 'Incarico marketing strategico affidato alla controllata Onirico Strategico per rebranding e posizionamento di una linea premium di caffè.',
    status: 'attivo',
    icon: 'award',
    templateId: 'marketing-strategico',
    templateName: 'Strategia di Marketing Aziendale',
    clientUid: 'cliente_famiglia',
    committente: 'Bari Espresso Srl',
    indirizzoImmobile: 'Zona Industriale, Bari',
    division: 'strategico',
    marketingBudget: 15000,
    marketingChannels: 'Branded Content, YouTube Ads, LinkedIn B2B',
    marketingGoal: 'Posizionamento Linea Caffè Premium in Uffici del Nord Italia',
    phases: {
      'p0': {
        id: 'p0',
        name: 'Analisi Strategica',
        order: 0,
        tasks: {
          't0': { title: 'Audit Brand Esistente', order: 0, done: true, assignee: 'mario', due: '2026-05-15' },
          't1': { title: 'Analisi Competitor & Target', order: 1, done: true, assignee: 'mario', due: '2026-05-20' },
          't2': { title: 'Definizione USP & Posizionamento', order: 2, done: false, assignee: 'mario', due: '2026-06-10' }
        }
      }
    } as any,
    createdAt: 1780324800000,
    updatedAt: 1780324800000
  },
  'p-lancio-masseriasalento': {
    id: 'p-lancio-masseriasalento',
    name: 'Digital Launch — Masseria Salentina',
    code: 'STR-2026-006',
    client: 'Consorzio Terre di Puglia',
    location: 'Brindisi (BR)',
    manager: 'mario',
    startDate: '2026-05-12',
    dueDate: '2026-09-10',
    notes: 'Campagna di posizionamento digitale, brand identity ed lead generation per l\'inaugurazione estiva della Masseria. Focus su video IG Reels, Meta ADS e ottimizzazione Local SEO.',
    status: 'attivo',
    icon: 'instagram',
    templateId: 'marketing-strategico',
    templateName: 'Strategia di Marketing Aziendale',
    clientUid: 'cliente_famiglia',
    committente: 'Masseria Salentina Group',
    indirizzoImmobile: 'S.P. Ostuni-Fasano, Brindisi',
    division: 'strategico',
    marketingBudget: 8500,
    marketingChannels: 'Instagram Reels, Facebook Lead Ads, TikTok',
    marketingGoal: 'Lead Generation Masserie Rosse d\'Otranto',
    phases: {
      'p0': {
        id: 'p0',
        name: 'Brand Identity & Setup',
        order: 0,
        tasks: {
          't0': { title: 'Restyling logo storico Masseria', order: 0, done: true, assignee: 'mario', due: '2026-05-18' },
          't1': { title: 'Configurazione profili Instagram, FB & Google Maps', order: 1, done: true, assignee: 'mario', due: '2026-05-22' },
          't2': { title: 'Verifica tracciamento Pixel e GA4 sul sito', order: 2, done: true, assignee: 'mario', due: '2026-05-25' }
        }
      },
      'p1': {
        id: 'p1',
        name: 'Strategia Social & Reels',
        order: 1,
        tasks: {
          't0': { title: 'Shooting fotografico e video-riprese con drone', order: 0, done: true, assignee: 'mario', due: '2026-05-28' },
          't1': { title: 'Montaggio n. 8 Reels immersivi di alta gamma', order: 1, done: false, assignee: 'mario', due: '2026-06-14' },
          't2': { title: 'Piano di influencer outreach regionale', order: 2, done: false, assignee: 'mario', due: '2026-06-25' }
        }
      },
      'p2': {
        id: 'p2',
        name: 'Meta Ads & Campagne',
        order: 2,
        tasks: {
          't0': { title: 'Creazione grafiche pubblicitarie e copy persuasivo', order: 0, done: false, assignee: 'mario', due: '2026-06-20' },
          't1': { title: 'Attivazione campagne Conversioni alloggi', order: 1, done: false, assignee: 'mario', due: '2026-07-01' }
        }
      }
    },
    createdAt: 1780324800000,
    updatedAt: 1780324800000
  },
  'p-strategico-pastificio': {
    id: 'p-strategico-pastificio',
    name: 'Rebranding & Export — Pastificio Foggia',
    code: 'STR-2026-003',
    client: 'Antico Pastificio Foggia',
    location: 'Foggia (FG)',
    manager: 'mario',
    startDate: '2026-05-15',
    dueDate: '2026-11-20',
    notes: 'Campagna di rilancio del brand, packaging sostenibile ed export verso la Germania.',
    status: 'attivo',
    icon: 'award',
    templateId: 'marketing-strategico',
    templateName: 'Strategia di Marketing Aziendale',
    clientUid: 'cliente_famiglia',
    committente: 'Antico Pastificio Srl',
    indirizzoImmobile: 'Via Industriale 120, Foggia',
    division: 'strategico',
    marketingBudget: 28000,
    marketingChannels: 'Google Search Ads, Instagram, TV Locali ed Eventi Food',
    marketingGoal: 'Aumentare le vendite dello shop online ed esordire in Germania',
    phases: {
      'p0': {
        id: 'p0',
        name: 'Brand Identity & Setup',
        order: 0,
        tasks: {
          't0': { title: 'Revisione del Logo e dei Bozzetti per nuovi Packaging', order: 0, done: true, assignee: 'mario', due: '2026-05-28' },
          't1': { title: 'Set-up Shopify multilingua', order: 1, done: false, assignee: 'mario', due: '2026-06-15' }
        }
      }
    } as any,
    createdAt: 1780324800000,
    updatedAt: 1780324800000
  },
  'p-materico-pavimenti': {
    id: 'p-materico-pavimenti',
    name: 'Pavimenti Resinati — Loft Lecce Center',
    code: 'MAT-2026-004',
    client: 'Studio Gallone',
    location: 'Lecce (LE)',
    manager: 'mario',
    startDate: '2026-05-10',
    dueDate: '2026-08-30',
    notes: 'Posa pavimento in microcemento e resina autolivellante in loft industriale storica.',
    status: 'attivo',
    icon: 'hammer',
    templateId: 'fornitura-materico',
    templateName: 'Approvvigionamento Materico',
    clientUid: 'cliente_famiglia',
    committente: 'Studio Gallone Srl',
    indirizzoImmobile: 'Via d\'Aragona, Lecce',
    division: 'materico',
    matericoEstimatedBudget: 54000,
    matericoFinitureType: 'pavimenti_resina',
    matericoSottofondiStatus: 'idoneo',
    phases: {
      'p0': {
        id: 'p0',
        name: 'Selezione Materiali',
        order: 0,
        tasks: {
          't0': { title: 'Valutazione campionatura colore Grigio Cemento', order: 0, done: true, assignee: 'mario', due: '2026-05-20' },
          't1': { title: 'Preventivo definitivo resina HD', order: 1, done: true, assignee: 'mario', due: '2026-05-25' }
        }
      }
    } as any,
    createdAt: 1780324800000,
    updatedAt: 1780324800000
  }
};

export const SEED_ESTIMATES: Record<string, MatericoEstimate> = {
  'est-1': {
    id: 'est-1',
    projectId: 'p-materico-trani',
    itemName: 'Porte interne pantografate finitura opaca',
    partnerName: 'Finestre & Porte Srl',
    basePrice: 4200,
    markupPercent: 12,
    finalPrice: 4704,
    status: 'proposto_cliente',
    requestNotes: 'Fornitura di n. 8 porte comprese cerniere sbiellate.',
    notes: 'Posa ed imballi inclusi. Garanzia estesa Onirico 5 anni.',
    createdAt: 1780324800000,
    updatedAt: 1780324800000
  },
  'est-2': {
    id: 'est-2',
    projectId: 'p-materico-trani',
    itemName: 'Infissi Minimalisti Alluminio Schüco',
    partnerName: 'Alluminio d\'Apulia di M. Leo',
    basePrice: 9500,
    markupPercent: 15,
    finalPrice: 10925,
    status: 'accettato',
    requestNotes: 'Sostituzione infissi salone piano terra.',
    notes: 'Certificati per detrazione scale ad alto rendimento energetico.',
    createdAt: 1780324800000,
    updatedAt: 1780324800000
  },
  'est-3': {
    id: 'est-3',
    projectId: 'p-materico-trani',
    itemName: 'Arredo Bagno & Sanitari Sospesi',
    partnerName: 'Idrosanitaria Salentina',
    basePrice: 2800,
    markupPercent: 10,
    finalPrice: 3080,
    status: 'richiesto',
    requestNotes: 'Set per n. 2 bagni, rubinetterie incluse nere opache.',
    notes: 'In attesa di elaborazione progetto da parte dell\'idraulico.',
    createdAt: 1780324800000,
    updatedAt: 1780324800000
  },
  'est-otranto-1': {
    id: 'est-otranto-1',
    projectId: 'p-rivestimenti-otranto',
    itemName: 'Suoli in Microcemento continuo e Pietra Leccese',
    partnerName: 'Resine d\'Arte Apulia',
    basePrice: 12500,
    markupPercent: 12,
    finalPrice: 14000,
    status: 'proposto_cliente',
    requestNotes: 'Fornitura e posa di microcemento bi-componente e pietra leccese squadrata di recupero.',
    notes: 'Campionatura colore beige caldo accettata dal committente.',
    createdAt: 1780324800000,
    updatedAt: 1780324800000
  },
  'est-otranto-2': {
    id: 'est-otranto-2',
    projectId: 'p-rivestimenti-otranto',
    itemName: 'Cucina da Esterno Bespoke in Acciaio Corten e Teak',
    partnerName: 'Arredamenti Sartoriali d\'Abruzzo',
    basePrice: 19800,
    markupPercent: 10,
    finalPrice: 21780,
    status: 'proposto_cliente',
    requestNotes: 'Struttura autoportante in corten, top in marmo levigato e ante in massello di teak marino.',
    notes: 'Compresi accessori lavello, griglia a gas e mini-frigo da incasso esterno Flos.',
    createdAt: 1780324800000,
    updatedAt: 1780324800000
  },
  'est-otranto-3': {
    id: 'est-otranto-3',
    projectId: 'p-rivestimenti-otranto',
    itemName: 'Set Illuminazione Architetturale Flos & Davide Groppi',
    partnerName: 'Luce e Design Salento',
    basePrice: 7800,
    markupPercent: 15,
    finalPrice: 8970,
    status: 'accettato',
    requestNotes: 'Luci ad incasso radenti, faretti IP67 per le volte stellate e lampade da terra d\'atmosfera.',
    notes: 'Sistemi di dimmerazione domotica KNX inclusi nel pacchetto.',
    createdAt: 1780324800000,
    updatedAt: 1780324800000
  }
};

export const SEED_TASKS: Record<string, Task> = {
  'task-1': {
    id: 'task-1',
    title: 'Sopralluogo tecnico e posizionamento caposaldo',
    date: '2026-06-01',
    time: '10:00',
    frequency: 'once',
    priority: 'alta',
    assignee: 'admin',
    projectId: 'p-villa-ostuni',
    notes: 'Verificare quote del terreno rispetto al trullo saraceno adiacente.',
    done: false,
    createdAt: 1780324800000,
    updatedAt: 1780324800000,
    createdBy: 'mario'
  },
  'task-2': {
    id: 'task-2',
    title: 'Revisione preventivo impianto fotovoltaico',
    date: '2026-06-01',
    time: '14:30',
    frequency: 'once',
    priority: 'media',
    assignee: 'mario',
    projectId: null,
    notes: 'Contattare fornitore Enel X per sconto in fattura.',
    done: true,
    createdAt: 1780324800000,
    updatedAt: 1780324800000,
    createdBy: 'admin'
  },
  'task-3': {
    id: 'task-3',
    title: 'Allineamento settimanale progetti',
    date: '2026-06-01',
    time: '09:00',
    frequency: 'weekly',
    priority: 'bassa',
    assignee: 'admin',
    projectId: null,
    notes: 'Briefing con tutto il team dello studio per allineamento carichi di lavoro.',
    done: false,
    createdAt: 1780324800000,
    updatedAt: 1780324800000,
    createdBy: 'admin'
  }
};

export const SEED_FINANCE: Record<string, FinanceMovement> = {
  'fin-1': {
    id: 'fin-1',
    kind: 'entrata',
    desc: 'Acconto rilievi e progettazione preliminare',
    amount: 3500.00,
    date: '2026-05-12',
    category: 'Acconto',
    note: 'Bonifico Cliente Bianchi',
    projectId: 'p-villa-ostuni',
    by: 'mario',
    at: 1780324800000
  },
  'fin-2': {
    id: 'fin-2',
    kind: 'uscita',
    desc: 'Noleggio laser scanner 3D Leica',
    amount: 450.00,
    date: '2026-05-10',
    category: 'Fornitore',
    note: 'Fattura Geotools srl',
    projectId: 'p-villa-ostuni',
    by: 'mario',
    at: 1780324800000
  }
};

export const SEED_INTERNAL: Record<string, ProjectInternal> = {
  'p-villa-ostuni': {
    notes: 'Nota interna riservata: il cliente ha un budget massimo di 180k euro. Preferisce interventi conservativi. Spingere molto sui bonus se riattivabili.',
    taskMeta: {
      'p0': {
        't1': {
          note: 'Eseguire nuvola di punti in formato .e57 comprensiva del terreno esterno.',
          attachments: {
            'att-1': {
              name: 'Nuvola_Punti_Villa_Ostuni_Rilievo.pdf',
              size: 2450000,
              type: 'application/pdf',
              url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1200', // standard working URL
              by: 'admin',
              at: 1780324800000
            }
          }
        }
      }
    }
  }
};
