/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Articoli editoriali del portale cliente ("Blog / Approfondimenti").
 * Contenuti demo curati a mano in italiano e inglese. La vista seleziona
 * l'array in base alla lingua corrente (vedi ClientPortalView).
 */
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  intro: string;
  sections: {
    title: string;
    paragraphs: string[];
  }[];
  quote?: string;
  pointsTitle?: string;
  points?: string[];
}

export const BLOG_POSTS_IT: BlogPost[] = [
  {
    id: 'trullo-marco',
    title: 'Il fascino eterno della pietra: il recupero di Trullo Marco in Puglia',
    excerpt: 'Scopri come coniugare il restauro conservativo delle tradizionali cupole in pietra con le più moderne tecnologie per l\'efficienza energetica e il massimo comfort abitativo.',
    category: 'Restauro',
    date: '14 Maggio 2026',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    intro: 'Il restauro dei trulli e delle antiche dimore storiche pugliesi non è solo un intervento di ingegneria o edilizia: è un atto d\'amore e profondo rispetto verso una sapienza costruttiva secolare. Trullo Marco rappresenta la sintesi ideale di questo approccio, combinando rispetto filologico della pietra e integrazione invisibile delle ultime tecnologie.',
    sections: [
      {
        title: 'Il consolidamento e la ricomposizione delle chiancarelle',
        paragraphs: [
          'La prima grande sfida di Trullo Marco ha riguardato le coperture a cono stuccate dalle intemperie del tempo. Il nostro laboratorio tecnico ha avviato uno smontaggio manuale selettivo dei chiancarelli ammalorati, procedendo al recupero minuzioso di ogni singola pietra originale.',
          'Il riposizionamento è stato eseguito a secco, secondo la regola d\'arte dei maestri trullari, interponendo uno strato impermeabilizzante e traspirante di ultima generazione, completamente celato alla vista. Questo assicura l\'impermeabilità totale mantenendo intatta la ventilazione naturale originaria.'
        ]
      },
      {
        title: 'Integrazione tecnologica invisibile e bioclimatica',
        paragraphs: [
          'Nel rispetto totale del manufatto storico, l\'impianto di riscaldamento e raffrescamento è stato integrato a pavimento sotto le chianche in pietra originarie levigate. Non vi sono unità esterne o split visibili che compromettano l\'estetica pastorale del trullo.',
          'Le murature in pietra massiccia, spesse fino a un metro e mezzo, offrono un\'eccezionale inerzia termica. Abbiamo ottimizzato questo comportamento passivo con l\'installazione di infissi in legno massiccio a taglio termico con profili ultra-sottili, incassati a scomparsa nelle spesse imbotte di muratura.'
        ]
      }
    ],
    quote: 'Restaurare un trullo significa ascoltare la pietra. Non dobbiamo aggiungere rumore visivo, ma liberare l\'anima funzionale che accoglierà la vita contemporanea con rigore ed eleganza.',
    pointsTitle: 'I cardini del restauro tecnologico di Trullo Marco:',
    points: [
      'Conservazione filologica della pietra calcarea locale stuccata a calce naturale.',
      'Riscaldamento radiante a pavimento sotto le chianche storiche recuperate.',
      'Integrazione di domotica invisibile per il controllo climatico e dell\'illuminazione.',
      'Sistemi di ricircolo naturale dell\'aria per eliminare completamente l\'umidità di risalita.'
    ]
  },
  {
    id: 'villa-marica',
    title: 'Villa Marica: la fusione formale tra contemporaneo ed architettura mediterranea',
    excerpt: 'Linee geometriche pure, ampie vetrate scorrevoli a scomparsa e un legame visivo simbiotico con la macchia mediterranea. Il concept progettuale dietro a un\'opera iconica.',
    category: 'Architettura',
    date: '30 Aprile 2026',
    readTime: '8 min',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    intro: 'Collocata su un declivio naturale panoramico, Villa Marica incarna perfettamente la cifra stilistica di Onirico: "Design your vision". Il concept nasce dalla volontà di annullare i confini tra l\'involucro abitato e la natura circostante, creando una sequenza di cannocchiali visivi puntati sull\'orizzonte.',
    sections: [
      {
        title: 'La poetica dello spazio aperto: il soggiorno fluido',
        paragraphs: [
          'La zona giorno si sviluppa come un unico grande padiglione vetrato. Grazie alle vetrate scorrevoli a triplo vetro con profili incassati nel solaio e nel pavimento, le ante scorrono completamente all\'interno delle pareti perimetrali, trasformando il soggiorno in un immenso porticato coperto.',
          'Il pavimento in cemento spatolato a calce, che riprende i caldi toni sabbia delle rocce costiere, si estende senza soluzione di continuità verso la grande terrazza esterna e i bordi della piscina a sfioro, esaltando la fluidità visiva.'
        ]
      },
      {
        title: 'Muri in pietra a secco e solai leggeri in calcestruzzo a vista',
        paragraphs: [
          'I materiali scelti creano un dialogo materico d\'eccezione: da un lato la solidità atavica dei setti murari in pietra locale disposta a secco, dall\'altro la leggerezza tecnologica dei solai in cemento armato a vista con finitura liscia "faccia a vista" cassonata in legno.',
          'Questa contrapposizione permette alla struttura di radicarsi saldamente nel territorio e, contemporaneamente, di librarsi leggera nello spazio con sbalzi audaci che ombreggiano naturalmente le facciate vetrate durante i mesi estivi.'
        ]
      }
    ],
    quote: 'La vera sostenibilità di un\'opera architettonica non è solo tecnologica, ma visiva ed emozionale: deve sembrare essere nata spontaneamente dal terreno su cui sorge.',
    pointsTitle: 'Soluzioni architettoniche adottate in Villa Marica:',
    points: [
      'Orientamento scientifico secondo gli assi solstiziali per ottimizzare gli apporti solari passivi.',
      'Sbalzi orizzontali calcolati per garantire l\'ombreggiamento estivo totale.',
      'Piscina a sfioro con sistema di filtraggio biologico ad acqua salata integrato nel declivio.',
      'Materiali locali a km 0 per ridurre al minimo l\'impatto ecologico di cantiere.'
    ]
  },
  {
    id: 'villa-alessandro',
    title: 'Disegnare l\'intimità logica: il progetto di interior di Villa Alessandro',
    excerpt: 'Come modulare la luce naturale ed utilizzare superfici strutturate e tonalità calde della terra per creare spazi accoglienti, intimi e tecnologicamente intelligenti.',
    category: 'Interior Design',
    date: '18 Aprile 2026',
    readTime: '5 min',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    intro: 'L\'interior design non si limita all\'arredo o alla scelta dei rivestimenti: è lo studio dei flussi quotidiani, della psicologia dello spazio e del benessere sensoriale dell\'individuo. Nel progetto di Villa Alessandro, abbiamo lavorato intensamente sulla luce radente e su palette cromatiche calde e materiche.',
    sections: [
      {
        title: 'La luce come elemento costruttivo primario',
        paragraphs: [
          'Ogni stanza di Villa Alessandro è stata studiata in relazione al cammino quotidiano del sole. Abbiamo inserito asole luminose a soffitto e gole LED arretrate che simulano e prolungano la luce naturale anche nelle ore serali, evitando fastidiosi abbagliamenti diretti.',
          'I dettagli delle gole in cartongesso ospitano profili di illuminazione intelligente dimmerabile che si adattano al ciclo circadiano degli abitanti, favorendo il rilassamento nelle ore serali con toni caldi a 2400K.'
        ]
      },
      {
        title: 'La selezione materica tra legno di rovere di recupero e metalli acidati',
        paragraphs: [
          'Per donare calore e carattere agli ambienti minimali, abbiamo progettato arredi su misura ad altezza totale integrando pannellature in legno di rovere spazzolato con venature in risalto, accostate a dettagli strutturali in ferro nero acidato artigianalmente.',
          'Questa alternanza tra il calore organico del legno e la freddezza industriale del ferro sabbiato genera una complessità visiva raffinatissima, esaltata da tessuti naturali come lino grezzo e bouclé.'
        ]
      }
    ],
    quote: 'La casa deve essere un rifugio per l\'anima, un tempio di silenzio visivo in cui ogni dettaglio ha una sua motivazione ergonomica ed estetica.',
    pointsTitle: 'Dettagli di interior design realizzati per Villa Alessandro:',
    points: [
      'Pannellature boiserie a scomparsa che celano porte filomuro e spazi contenitivi.',
      'Gole luminose a LED ad alta resa cromatica (CRI > 95) tarate sul benessere circadiano.',
      'Arredi su misura disegnati e lavorati da artigiani e falegnami del territorio.',
      'Rivestimenti doccia e bagno in grande formato in pietra d\'Iseo a spacco naturale.'
    ]
  },
  {
    id: 'borgo-tagliaferri',
    title: 'Borgo Tagliaferri: la rinascita di un borgo rurale come modello di bioarchitettura',
    excerpt: 'Dalle rovine agricole alla rinascita di prestigiose residenze di campagna. Il restauro ingegneristico applicato alle antiche murature miste e l\'autosufficienza energetica.',
    category: 'Ingegneria',
    date: '02 Aprile 2026',
    readTime: '7 min',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    intro: 'Borgo Tagliaferri rappresenta uno dei progetti ingegneristici più stimolanti affrontati dallo studio. Il recupero di questo nucleo agricolo abbandonato ha richiesto una profonda opera di consolidamento strutturale integrata fin da subito con standard termici e ad emissioni quasi zero (NZEB).',
    sections: [
      {
        title: 'Il consolidamento antisismico non invasivo',
        paragraphs: [
          'Le strutture in muratura portante mista presentavano forti fessurazioni e cedimenti fondazionali dovuti all\'età. Abbiamo strutturato un piano di iniezioni di miscele leganti eco-compatibili a base di calce idraulica naturale NHL nelle cavità murarie, accoppiato all\'inserimento di tiranti in acciaio d\'epoca e cerchiature invisibili.',
          'Questo approccio ha enormemente accresciuto la coesione sismica del borgo senza stravolgere lo spessore esterno o la finitura sabbiata delle murature a vista storiche.'
        ]
      },
      {
        title: 'Un micro-grid energetico centralizzato a fonti rinnovabili',
        paragraphs: [
          'L\'autosufficienza termica ed elettrica di Borgo Tagliaferri è stata raggiunta tramite l\'integrazione di un impianto fotovoltaico centralizzato integrato sui tetti delle vecchie stalle riconsolidate (quindi non visibile dalle residenze principali) abbinato a un sistema di accumulo agli ioni di litio da 60 kWh.',
          'La climatizzazione invernale ed estiva sfrutta un anello geotermico a bassa entalpia con sonde verticali che scendono a 120 metri di profondità, accoppiato a pompe di calore ad altissimo rendimento. Un vero capolavoro di ingegneria verde.'
        ]
      }
    ],
    quote: 'La vera ingegneria non si impone sul patrimonio storico, ma si nasconde nelle sue pieghe per garantirne l\'eternità strutturale ed energetica con il minor impatto possibile.',
    pointsTitle: 'Le specifiche ingegneristiche di Borgo Tagliaferri:',
    points: [
      'Iniezioni di calce NHL per incremento antisismico e consolidamento profondo.',
      'Riscaldamento ed idraulica alimentati al 100% da anello geotermico a bassa entalpia.',
      'Sistemi di accumulo energetico e solare fotovoltaico integrato ad impatto visivo zero.',
      'Recupero totale ed uso di malte e intonaci traspiranti d\'epoca.'
    ]
  },
  {
    id: 'villa-giuseppe',
    title: 'La luce bianca di Locorotondo: volumi geometrici e la poetica del bianco in Valle d\'Itria',
    excerpt: 'Come coniugare forme cubiche pulite, la leggendaria luce bianca di Locorotondo e la pietra calcare per creare una residenza unifamiliare ad altissima sostenibilità.',
    category: 'Architettura',
    date: '19 Marzo 2026',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    intro: 'Progettare a Locorotondo significa confrontarsi con una delle meraviglie cromatiche della Puglia: il bianco accecante della calce che riflette i raggi del sole mediterraneo. Per Villa Giuseppe abbiamo destrutturato il concetto di abitazione rurale, reinterpretandolo attraverso una serie di volumi stereometrici puri ed eleganti.',
    sections: [
      {
        title: 'Il gioco dei volumi e la gestione dell\'irraggiamento sfolgorante',
        paragraphs: [
          'La conformazione planimetrica si sviluppa su una pianta organizzata ad "L" volta a generare un cortile riparato dai venti del nord. Ogni volume cubico riflette la luce con angolazioni diverse durante le preziose fasi del giorno.',
          'La finitura esterna è realizzata in scialbatura di calce naturale stesa a pennello, una scelta non solo estetica ma squisitamente funzionale: la calce permette alla muratura di respirare in modo superbo e respinge oltre il 75% della radiazione solare estiva, mantenendo i locali freschi.'
        ]
      },
      {
        title: 'Il dialogo materico tra resina e pietra locale',
        paragraphs: [
          'La ricercatezza degli interni risiede nel minimalismo materico: un pavimento continuo in microcemento bianco latte fa da sfondo a setti decorativi in pietra locale lasciati grezzi, integrando la forza materica pugliese all\'interno di un concept moderno.',
          'Gli angoli delle finestre sono profilati con infissi minimalistici in alluminio color antracite, incassati nelle spalle perimetrali per inquadrare rigogliosi ulivi secolari come vere e proprie tele dipinte.'
        ]
      }
    ],
    quote: 'La luce non è solo un fenomeno fisico, è la materia prima con cui scolpiamo lo spazio. In Valle d\'Itria, il bianco non è un colore, è un silenzio visivo che amplifica ogni emozione.',
    pointsTitle: 'Soluzioni adottate per Villa Giuseppe:',
    points: [
      'Scialbatura artigianale a calce naturale stesa secondo le antiche ricette a spessore.',
      'Setti murari interni in pietra calcarea originaria spazzolata a secco.',
      'Orientamento scientifico dei lucernari a soffitto per beneficiare esclusivamente di luce indiretta confortevole.',
      'Isolamento termico in fibra di canapa naturale traspirante integrato nell\'intercapedine.'
    ]
  },
  {
    id: 'palazzo-alessandra',
    title: 'Trasparenze storiche: il restauro filologico di Palazzo Alessandra nel centro storico',
    excerpt: 'Restaurare un palazzo gentilizio rispettando i secoli di storia ma introducendo la luce naturale e il massimo comfort termico attraverso percorsi di trasparenza in vetro strutturale.',
    category: 'Restauro',
    date: '04 Marzo 2026',
    readTime: '8 min',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    intro: 'Nel cuore antico, Palazzo Alessandra custodisce una sequenza di volte a stella e a botte che raccontano secoli di architettura signorile. Il nostro intervento ha liberato gli spazi dalle stratificazioni novecentesche incoerenti, restituendo l\'armonia originaria attraverso una logica di trasparenza e leggerezza strutturale.',
    sections: [
      {
        title: 'Il recupero delle volte e la sverniciatura dei finti intonaci plastici',
        paragraphs: [
          'La prima operazione ha comportato la rimozione minuziosa delle pitture sintetiche applicate negli anni, le quali soffocavano il tufo e la pietra locale. Tramite lavaggi a bassa pressione e micro-sabbiature con polvere di carbonato di calcio, abbiamo riportato alla luce le calde sfumature dorate del carparo originario.',
          'Tutte le fughe sono state ri-consolidate utilizzando esclusivamente malte a base di calce idraulica naturale prive di cementi, per evitare la formazione di sali ammaloranti e garantire la totale traspirabilità dell\'edificio.'
        ]
      },
      {
        title: 'La passerella in vetro strutturale e il lucernario zenitale',
        paragraphs: [
          'Per connettere le tre ali del palazzo senza appesantire il cortile barocco interno, abbiamo introdotto una passerella aerea in vetro strutturale trasparente ad altissima resistenza. Questa struttura fluttua silenziosa tra le spesse pareti dorate, consentendo alla luce di penetrare fino al piano terra.',
          'In corrispondenza del salone principale, la rimozione di un vecchio solaio pericolante ha permesso di installare un lucernario zenitale scorrevole motorizzato, che funge da camino di ventilazione naturale durante l\'estate.'
        ]
      }
    ],
    quote: 'Il vetro è il miglior alleato della pietra antica: non cerca di imitarla, ma si offre come trasparenza discreta che ne rivela la maestosa fisicità senza tempo.',
    pointsTitle: 'I cardini ingegneristici ed estetici dell\'intervento:',
    points: [
      'Micro-sabbiatura selettiva e consolidamento antisismico delle volte a stella con fibre di carbonio.',
      'Sverniciatura totale e risanamento delle murature umide con intonaci macro-porosi a base calce.',
      'Passerella aerea con montanti in acciaio inox satinato e calpestatili in vetro triplo strato.',
      'Sistema domotico KNX integrato nella pietra per una gestione invisibile di luci scenografiche e riscaldamento.'
    ]
  }
];

export const BLOG_POSTS_EN: BlogPost[] = [
  {
    id: 'trullo-marco',
    title: 'The timeless allure of stone: the restoration of Trullo Marco in Puglia',
    excerpt: 'Discover how to combine the conservative restoration of traditional stone domes with the latest technologies for energy efficiency and maximum living comfort.',
    category: 'Restoration',
    date: 'May 14, 2026',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    intro: 'Restoring the trulli and the ancient historic dwellings of Puglia is not merely an engineering or building project: it is an act of love and deep respect for centuries-old construction wisdom. Trullo Marco is the ideal synthesis of this approach, combining a philological respect for the stone with the invisible integration of the latest technologies.',
    sections: [
      {
        title: 'Consolidating and recomposing the chiancarelle',
        paragraphs: [
          'The first great challenge at Trullo Marco concerned the conical roofs, weathered by the passing of time. Our technical workshop began a selective manual dismantling of the damaged limestone slabs (chiancarelle), painstakingly recovering every single original stone.',
          'They were re-laid dry, following the craftsmanship of the master trullari, with a fully concealed, latest-generation waterproof yet breathable layer interposed between them. This ensures complete impermeability while preserving the original natural ventilation.'
        ]
      },
      {
        title: 'Invisible, bioclimatic technological integration',
        paragraphs: [
          'In full respect of the historic structure, the heating and cooling system was integrated into the floor beneath the original polished stone slabs (chianche). There are no external units or visible split systems to compromise the pastoral aesthetic of the trullo.',
          'The massive stone walls, up to a metre and a half thick, provide exceptional thermal inertia. We optimised this passive behaviour by installing thermal-break solid-wood window frames with ultra-slim profiles, recessed out of sight within the deep masonry reveals.'
        ]
      }
    ],
    quote: 'To restore a trullo is to listen to the stone. We must not add visual noise, but free the functional soul that will welcome contemporary life with rigour and elegance.',
    pointsTitle: 'The cornerstones of Trullo Marco’s technological restoration:',
    points: [
      'Philological conservation of the local limestone, pointed with natural lime mortar.',
      'Radiant underfloor heating beneath the recovered historic stone slabs.',
      'Integration of invisible home automation for climate and lighting control.',
      'Natural air-recirculation systems to completely eliminate rising damp.'
    ]
  },
  {
    id: 'villa-marica',
    title: 'Villa Marica: the formal fusion of contemporary and Mediterranean architecture',
    excerpt: 'Pure geometric lines, large retractable sliding glazing and a symbiotic visual bond with the Mediterranean scrub. The design concept behind an iconic work.',
    category: 'Architecture',
    date: 'April 30, 2026',
    readTime: '8 min',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    intro: 'Set on a natural panoramic slope, Villa Marica perfectly embodies Onirico’s signature ethos: "Design your vision". The concept stems from the desire to dissolve the boundaries between the inhabited shell and the surrounding nature, creating a sequence of visual vistas aimed at the horizon.',
    sections: [
      {
        title: 'The poetics of open space: the fluid living area',
        paragraphs: [
          'The living area unfolds as a single great glazed pavilion. Thanks to triple-glazed sliding panels with profiles recessed into the slab and the floor, the leaves slide completely inside the perimeter walls, turning the living room into an immense covered portico.',
          'The lime-troweled concrete floor, echoing the warm sandy tones of the coastal rocks, extends seamlessly towards the large outdoor terrace and the edges of the infinity pool, heightening the visual continuity.'
        ]
      },
      {
        title: 'Dry-stone walls and lightweight exposed-concrete slabs',
        paragraphs: [
          'The chosen materials create an exceptional material dialogue: on one hand the ancestral solidity of the dry-laid local-stone partitions, on the other the technological lightness of the exposed reinforced-concrete slabs with a smooth board-formed, timber-coffered finish.',
          'This contrast allows the structure to anchor itself firmly to the land while, at the same time, hovering lightly in space with bold cantilevers that naturally shade the glazed facades during the summer months.'
        ]
      }
    ],
    quote: 'The true sustainability of a work of architecture is not only technological but visual and emotional: it must look as though it sprang spontaneously from the very ground on which it stands.',
    pointsTitle: 'Architectural solutions adopted at Villa Marica:',
    points: [
      'Scientific orientation along the solstitial axes to optimise passive solar gain.',
      'Calculated horizontal cantilevers to guarantee total summer shading.',
      'Infinity pool with an integrated biological saltwater filtration system set into the slope.',
      'Local, zero-kilometre materials to minimise the site’s ecological impact.'
    ]
  },
  {
    id: 'villa-alessandro',
    title: 'Designing logical intimacy: the interior project of Villa Alessandro',
    excerpt: 'How to modulate natural light and use textured surfaces and warm earth tones to create welcoming, intimate and technologically intelligent spaces.',
    category: 'Interior Design',
    date: 'April 18, 2026',
    readTime: '5 min',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    intro: 'Interior design is not limited to furnishings or the choice of finishes: it is the study of daily flows, of the psychology of space and of the individual’s sensory wellbeing. In the Villa Alessandro project, we worked intensively on grazing light and on warm, material colour palettes.',
    sections: [
      {
        title: 'Light as the primary constructive element',
        paragraphs: [
          'Every room in Villa Alessandro was studied in relation to the sun’s daily path. We inserted ceiling light slots and recessed LED coves that simulate and prolong natural light into the evening hours, avoiding any uncomfortable direct glare.',
          'The plasterboard cove details house dimmable smart-lighting profiles that adapt to the inhabitants’ circadian rhythm, encouraging relaxation in the evening with warm 2400K tones.'
        ]
      },
      {
        title: 'A material selection of reclaimed oak and etched metals',
        paragraphs: [
          'To bring warmth and character to the minimal interiors, we designed full-height bespoke furniture, combining brushed-oak panelling with pronounced grain alongside structural details in hand-etched black iron.',
          'This alternation between the organic warmth of wood and the industrial coolness of sandblasted iron generates a refined visual complexity, enhanced by natural fabrics such as raw linen and bouclé.'
        ]
      }
    ],
    quote: 'A home must be a refuge for the soul, a temple of visual silence in which every detail has its own ergonomic and aesthetic reason for being.',
    pointsTitle: 'Interior design details delivered for Villa Alessandro:',
    points: [
      'Concealed boiserie panelling hiding flush doors and storage spaces.',
      'High-CRI LED light coves (CRI > 95) calibrated for circadian wellbeing.',
      'Bespoke furniture designed and crafted by local artisans and cabinetmakers.',
      'Large-format shower and bathroom cladding in natural split-face Iseo stone.'
    ]
  },
  {
    id: 'borgo-tagliaferri',
    title: 'Borgo Tagliaferri: the rebirth of a rural hamlet as a model of bioarchitecture',
    excerpt: 'From agricultural ruins to the rebirth of prestigious country residences. Engineering restoration applied to ancient mixed masonry and energy self-sufficiency.',
    category: 'Engineering',
    date: 'April 2, 2026',
    readTime: '7 min',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    intro: 'Borgo Tagliaferri is one of the most stimulating engineering projects the studio has tackled. The recovery of this abandoned agricultural nucleus required a profound structural-consolidation effort, integrated from the outset with near-zero-emission thermal standards (NZEB).',
    sections: [
      {
        title: 'Non-invasive seismic consolidation',
        paragraphs: [
          'The mixed load-bearing masonry structures showed severe cracking and foundation settlement due to age. We devised a plan of injections of eco-compatible binding mixes based on natural hydraulic lime (NHL) into the wall cavities, coupled with the insertion of period steel ties and invisible ring-beams.',
          'This approach greatly increased the hamlet’s seismic cohesion without altering the external thickness or the sandblasted finish of the historic exposed masonry.'
        ]
      },
      {
        title: 'A centralised renewable-energy micro-grid',
        paragraphs: [
          'Borgo Tagliaferri’s thermal and electrical self-sufficiency was achieved by integrating a centralised photovoltaic system on the roofs of the reconsolidated former stables (therefore not visible from the main residences), paired with a 60 kWh lithium-ion storage system.',
          'Winter and summer climate control relies on a low-enthalpy geothermal loop with vertical probes descending to 120 metres, coupled with very-high-efficiency heat pumps. A true masterpiece of green engineering.'
        ]
      }
    ],
    quote: 'True engineering does not impose itself on the historic heritage but hides within its folds to guarantee its structural and energy eternity with the least possible impact.',
    pointsTitle: 'The engineering specifications of Borgo Tagliaferri:',
    points: [
      'NHL lime injections for seismic strengthening and deep consolidation.',
      'Heating and plumbing powered 100% by a low-enthalpy geothermal loop.',
      'Energy storage and integrated photovoltaics with zero visual impact.',
      'Full recovery and use of period breathable mortars and plasters.'
    ]
  },
  {
    id: 'villa-giuseppe',
    title: 'The white light of Locorotondo: geometric volumes and the poetics of white in the Itria Valley',
    excerpt: 'How to combine clean cubic forms, the legendary white light of Locorotondo and limestone to create a highly sustainable single-family residence.',
    category: 'Architecture',
    date: 'March 19, 2026',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    intro: 'To design in Locorotondo is to engage with one of Puglia’s chromatic wonders: the blinding white of lime that reflects the rays of the Mediterranean sun. For Villa Giuseppe we deconstructed the concept of the rural dwelling, reinterpreting it through a series of pure, elegant stereometric volumes.',
    sections: [
      {
        title: 'The play of volumes and the management of dazzling sunlight',
        paragraphs: [
          'The plan is organised in an "L" shape, designed to generate a courtyard sheltered from the northern winds. Each cubic volume reflects the light at different angles throughout the precious phases of the day.',
          'The external finish is a natural lime wash applied by brush, a choice that is not only aesthetic but exquisitely functional: lime allows the masonry to breathe superbly and reflects over 75% of summer solar radiation, keeping the rooms cool.'
        ]
      },
      {
        title: 'The material dialogue between resin and local stone',
        paragraphs: [
          'The refinement of the interiors lies in material minimalism: a continuous milk-white microcement floor forms the backdrop to decorative partitions of local stone left raw, bringing the material strength of Puglia into a modern concept.',
          'The window corners are profiled with minimalist anthracite-coloured aluminium frames, recessed into the perimeter reveals to frame lush centuries-old olive trees like true painted canvases.'
        ]
      }
    ],
    quote: 'Light is not merely a physical phenomenon, it is the raw material with which we sculpt space. In the Itria Valley, white is not a colour, it is a visual silence that amplifies every emotion.',
    pointsTitle: 'Solutions adopted for Villa Giuseppe:',
    points: [
      'Artisan natural-lime wash applied in thickness according to ancient recipes.',
      'Internal partition walls in original limestone, dry brushed.',
      'Scientific orientation of the ceiling skylights to benefit solely from comfortable indirect light.',
      'Breathable natural hemp-fibre thermal insulation integrated into the cavity.'
    ]
  },
  {
    id: 'palazzo-alessandra',
    title: 'Historic transparencies: the philological restoration of Palazzo Alessandra in the old town',
    excerpt: 'Restoring a noble palazzo while respecting centuries of history, yet introducing natural light and maximum thermal comfort through paths of structural-glass transparency.',
    category: 'Restoration',
    date: 'March 4, 2026',
    readTime: '8 min',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    intro: 'In the ancient heart of the town, Palazzo Alessandra preserves a sequence of star and barrel vaults that recount centuries of stately architecture. Our intervention freed the spaces from incoherent twentieth-century stratifications, restoring the original harmony through a logic of transparency and structural lightness.',
    sections: [
      {
        title: 'Recovering the vaults and stripping the fake plastic plasters',
        paragraphs: [
          'The first operation involved the painstaking removal of the synthetic paints applied over the years, which were suffocating the tufa and the local stone. Through low-pressure washing and micro-sandblasting with calcium-carbonate powder, we brought back to light the warm golden hues of the original carparo stone.',
          'All the joints were re-consolidated using exclusively natural hydraulic-lime mortars free of cement, to prevent the formation of damaging salts and to guarantee the building’s total breathability.'
        ]
      },
      {
        title: 'The structural-glass walkway and the zenithal skylight',
        paragraphs: [
          'To connect the three wings of the palazzo without weighing down the internal Baroque courtyard, we introduced an aerial walkway in transparent, ultra-high-strength structural glass. This structure floats silently between the thick golden walls, allowing light to penetrate down to the ground floor.',
          'Above the main hall, the removal of an old unsafe slab made it possible to install a motorised sliding zenithal skylight, which acts as a natural ventilation chimney during the summer.'
        ]
      }
    ],
    quote: 'Glass is the best ally of ancient stone: it does not seek to imitate it, but offers itself as a discreet transparency that reveals its majestic, timeless physicality.',
    pointsTitle: 'The engineering and aesthetic cornerstones of the intervention:',
    points: [
      'Selective micro-sandblasting and seismic consolidation of the star vaults with carbon fibres.',
      'Complete paint stripping and remediation of damp masonry with macro-porous lime-based plasters.',
      'Aerial walkway with satin stainless-steel uprights and triple-layer glass treads.',
      'KNX home-automation system integrated into the stone for invisible control of scenic lighting and heating.'
    ]
  }
];
