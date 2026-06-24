# Visione Aulico — integrazione del feedback strategico

> **Cos'è questo documento.** Recepisce il feedback ricevuto (deck "L'Architettura
> di Aulico" + Riepilogo Strategico) e lo integra con l'impianto che avevamo già
> definito (`MANUALE-FUNZIONALE`, `FLUSSI-DI-LAVORO`, `ARCHITETTURA-TARGET`,
> `LINEE-GUIDA-GRAFICHE`). È la **specifica di riferimento** della piattaforma
> target.
>
> **Due paletti fissati dal committente:**
> 1. **Si integra TUTTO** il contenuto Aulico (business, ruoli, finanza,
>    automazioni, KPI…).
> 2. **Lo stile grafico resta il NOSTRO** — niente palette del deck (teal/gold).
>    Restano `COMPANY_COLOR` e `LINEE-GUIDA-GRAFICHE.md` invariati.
>
> ⚠️ **Nessun file della piattaforma è stato modificato.** Questo è un documento
> di pianificazione.

---

## 1. Rebranding e mappa dei nomi

La piattaforma cambia nome: da "Onirico Studio OS" / "Unirico" → **Aulico**.
"Aulico" è volutamente **neutrale e super partes**: è l'infrastruttura comune del
gruppo (il "Database Centrale Aulico" / hub), non privilegia nessuna consociata.

**Mappa nomi (business ↔ codice attuale):**

| Nome business (Aulico) | Chiave nel codice oggi | Cos'è |
|---|---|---|
| **Aulico** | (l'app intera / "Holding" nei nostri doc) | piattaforma + DB centrale + shell |
| **Strategico** | `strategico` | casa madre / hub: admin di gruppo, contabilità, marketing, sviluppo SW |
| **Onirico** | `studio` | studio di architettura/ingegneria (commesse, cantieri) |
| **Materico** | `materico` | esecuzione lavori + subappaltatori |
| **Unico** | `unico` | investimenti immobiliari + investitori |

> **Nota tecnica:** le **chiavi** (`studio`, `strategico`, …) e i nodi DB
> **restano invariati** nel codice; cambia solo l'**etichetta** mostrata
> (`COMPANY_LABEL`): `studio → "Onirico"`, l'app → "Aulico". Così il rebrand non
> tocca dati/regole.

**Strategico = hub, ma Aulico resta neutro.** Tensione segnalata nel doc:
Strategico "gestisce la contabilità di gruppo" *ma* Aulico deve restare super
partes. Risoluzione adottata: la **contabilità/consolidato/anagrafiche** sono
**servizi del core Aulico** (neutri, §F del Manuale), *operati* dal personale di
Strategico. Strategico-marketing resta un verticale come gli altri.

---

## 2. Finalità della piattaforma (dal Riepilogo)

1. **Gestione Clienti** — ciclo di vita completo dal lead alla consegna.
2. **Monitoraggio Cantieri** — timeline visive, gestione documentale, aggiornamenti
   in tempo reale.
3. **Controllo Amministrativo** — contabilità e fatturazione centralizzate
   sull'intero perimetro societario.
4. **Statistiche di Gruppo** — dashboard aggregate sul valore totale generato.

Tutte e 4 sono già coperte come impianto; le estensioni richieste sono nei §
seguenti.

---

## 3. Architettura utenti & matrice permessi (RBAC granulare)

**Onboarding:** l'utente si registra come profilo generico → un **admin assegna
ruolo e permessi** → l'interfaccia si adatta dinamicamente (ognuno vede solo le
sue "stanze"). Già allineato con il nostro onboarding; va reso **più granulare**.

**Matrice di riferimento (dal deck):**

| Figura | Accesso | Tipo permesso |
|---|---|---|
| Dario Flore | Tutte le società + Gestione | **Owner / Admin totale** |
| Francesco | Strategico + altre all'occorrenza | **Operativo multi-società** |
| Claudia | Onirico | **Tecnico settoriale** (limitato a una società) |
| Rosa | Strategico + servizi in sola lettura | **Amministrazione & monitoraggio** (view-only) |
| Clienti | Solo il proprio progetto (Onirico/Unico) | Timeline + documenti propri |
| Investitori | Sezione Unico | Monitoraggio finanziario + ROE |
| Subappaltatori | Sezione Materico | Contratti, scadenze, task |

**Gap rispetto a oggi:** il nostro modello `admin / manager / staff` è **piatto**.
Aulico richiede permessi **per-società** e **per-livello** (operativo vs sola
lettura, multi-società vs settoriale). → vedi proposta tecnica in §11.

**Privacy/GDPR (esplicito nel doc):** va definito **formalmente chi, in
Strategico, vede tutti i nuovi clienti** (Strategico è il "Point of Entry" dei
lead). Da modellare come permesso esplicito + log accessi, non implicito.

---

## 4. Strategico — Point of Entry & hub

- **Tutti i lead e le richieste di preventivo entrano da Strategico**, poi vengono
  smistati alla società di competenza. (Oggi i lead entrano nel CRM generale; va
  reso esplicito che il "varco" è Strategico.)
- Funzioni hub: amministrazione globale, **contabilità di gruppo**, marketing
  (campagne, **produzione foto/video**), **sviluppo software**.
- Marketing project-centric già costruito (`StrategicoView`, Manuale §E6): si
  conferma.

---

## 5. Onirico (Studio) — funnel commessa & automazioni

**Fasi del modulo:** Pianificazione · Progettazione · Esecuzione · **Abilitazione**
(agibilità). La nostra struttura a fasi/13-step va mappata su queste 4 macro-fasi.

**Convenzione naming commessa (obbligatoria):** `Nome Cliente + Località`
(es. "Nacci Grazio – Contrada Lato Aperto"). Da imporre nel form Nuovo progetto.

**Funnel di conversione (slide 7) — da implementare:**

```
01 Inserimento minimo      → preventivo con sole voci di costo essenziali predefinite
02 Generazione automatica  → preventivo composto dalle voci selezionate
03 Firma OTP               → accettazione legale con password temporanea
04 Creazione Cartella      → il preventivo diventa contratto: genera AUTOMATICAMENTE
                             la "Cartella Cliente" + i task operativi
```

- **Voci di costo predefinite** per preventivo rapido (listino riusabile).
- **All'accettazione → generazione automatica** della cartella cliente + task.
- **Ogni attività ha un responsabile assegnato + un valore economico o punteggio**
  (collega al point system, §7).

**Gamification cliente:** alla chiusura (rilascio agibilità) una **"graduazione"**/
feedback positivo per il cliente ("la pratica è stata completata con successo").

---

## 6. Unico — Cascata Finanziaria & ROE (modello preciso)

Sostituisce il nostro `margine = rivendita − acquisto − ristrutturazione` con il
**modello analitico** del deck (slide 10). Voci di costo da tracciare:

| Voce | Valore | Note |
|---|---|---|
| Costo Terreno/Immobile | input | base dell'operazione |
| Commissioni Agenzia | **3%** | sull'acquisto |
| Oneri Notarili | input | |
| **Progettazione Onirico** | **15% del costo di realizzazione** | ← ricavo inter-società per Onirico |
| Costo Opere/Lavori (realizzazione) | input | spesso via Materico |
| **Promozione Strategico** | **€10.000 fisso** | ← ricavo inter-società per Strategico |
| **Commissione Rivendita** | **4% sul prezzo finale** | |

Output: confronto con **prezzo di rivendita** → **margine netto**, **tempi di
ritorno**, **ROE (Return on Equity)**.

**Punto chiave:** le voci "Progettazione Onirico 15%" e "Promozione Strategico
€10.000" sono i **flussi inter-società** (`FLUSSI §6`) resi **espliciti come costi
di Unico e ricavi delle altre**. Vanno modellati come commesse interne che
confluiscono in finanza con il `sector` corretto.

> Da preservare anche l'attuale SPV/cap-table + posizioni private investitore: il
> ROE per investitore si calcola su questo modello.

**Scalabilità futura (slide 14):** **Gestione Immobili / affitti** come 5ª società
("Next Year") che si affianca ai moduli esistenti sullo stesso hub Aulico. Le case
costruite/vendute possono diventare strutture gestite. → tenerne conto nei confini
(`ARCHITETTURA §2`: l'albero a domini regge l'aggiunta di un nuovo verticale).

---

## 7. Materico — contratti, penali, incentivi

- **Contrattualistica digitale con firma OTP** + gestione scadenze temporali.
- **Controllo & penali:** monitoraggio ritardi → **attivazione automatica delle
  penali**.
- **Sistema incentivante (Point System):** punti basati sul **valore delle attività
  svolte** (collega ai 300+ attività a punti già in roadmap CRM).
- **Gestione cantiere via app:** report su **sicurezza, pulizia, organizzazione
  logistica** (estende l'attuale modulo Cantiere).

---

## 8. Automazioni di processo (nuove)

| Automazione | Descrizione | Stato oggi |
|---|---|---|
| **Render AI preliminare** | da **2 input**: foto lotto/terreno + risposte **questionario digitale** → render di partenza | Abbiamo `aiGenerate` (solo testo); **manca generazione immagini** |
| **Proactive Alert 60 giorni** | countdown scelte estetiche (sanitari, rivestimenti, infissi) con **remind giornaliero**; allo scadere **blocco formale del cantiere** | Abbiamo arredi fissi+scadenza; **manca** countdown/blocco |
| **Report settimanale automatico** | pacchetto al cliente (foto, video, cronoprogramma) per ridurre richieste manuali | Cantiere ha foto/SAL; **manca** invio automatico |
| **WhatsApp + OTP** | sottoscrizione contratti via OTP; comunicazioni WhatsApp | Oggi solo link `wa.me`; **manca** API/OTP |

Tutte richiedono backend (Cloud Functions, già predisposte §F del Manuale) e/o
provider esterni (OTP, WhatsApp Business API, modello AI immagini).

---

## 9. KPI & Statistiche di gruppo (funnel preciso)

Distinguere **KPI di singola società** vs **Dashboard di Gruppo**. Funnel richiesto:

```
Preventivato → Venduto → Erogato → Fatturato → Incassato → Liquidità
```

| KPI | Significato |
|---|---|
| **Preventivato** | volume totale offerte emesse |
| **Venduto** | contratti firmati |
| **Erogato** | avanzamento lavori (valore prodotto) |
| **Fatturato** | totale emesso in fattura |
| **Incassato** | liquidità effettivamente entrata |
| **Liquidità** | disponibilità corrente, per società + aggregata |

**Gap:** il nostro `StatsView` ha redditività/BEP/incassato; va **esteso** con
questo funnel esatto e con la vista **per-società + consolidato di gruppo** (i dati
ci sono già nei nodi finanza, è questione di aggregazione).

---

## 10. Tabella di riconciliazione (deck Aulico → nostri documenti)

| Requisito Aulico | Già presente? | Dove (nostro doc) | Azione |
|---|---|---|---|
| 5 gestionali / DB centrale | ✅ | FLUSSI §0, ARCHITETTURA §2 | rinominare in "Aulico" |
| Moduli indipendenti, no dati duplicati | ✅ | ARCHITETTURA §4 | — |
| Onboarding generico → ruolo da admin | ✅ | MANUALE §A | rendere granulare §3 |
| RBAC per-società/livello | ⚠️ parziale | MANUALE §A | **estendere** (§11) |
| Privacy chi vede i lead | ❌ | — | **nuovo** permesso + log |
| Strategico Point of Entry lead | ⚠️ parziale | MANUALE §C4/E6 | esplicitare il varco |
| Funnel commessa + voci predefinite | ❌ | — | **nuovo** (§5) |
| Firma OTP (Onirico/Materico) | ❌ | roadmap "firma digitale" | **nuovo** (backend) |
| Generazione automatica Cartella Cliente | ⚠️ | "converti in progetto" simile | estendere |
| Naming "Cliente + Località" | ❌ | — | **nuovo** (form) |
| Gamification cliente (agibilità) | ❌ | — | **nuovo** (portale) |
| Cascata ROE Unico (3%/15%/€10k/4%) | ⚠️ | finance.ts (margine semplice) | **estendere** motore |
| Materico penali automatiche | ❌ | — | **nuovo** |
| Point system incentivi | ❌ | roadmap "Incentivi 300+ attività" | **nuovo** |
| Render AI da foto+questionario | ❌ | aiGenerate (solo testo) | **nuovo** (AI immagini) |
| Proactive alert 60gg + blocco | ❌ | arredi/scadenze (base) | **nuovo** |
| Report settimanale automatico | ❌ | cantiere (base) | **nuovo** (cron) |
| WhatsApp API | ❌ | link wa.me | roadmap |
| KPI funnel di gruppo | ⚠️ | StatsView | **estendere** |
| Gestione Immobili/affitti (futuro) | ❌ | — | predisposto da ARCHITETTURA §2 |
| Palette grafica del deck | 🚫 **rifiutata** | LINEE-GUIDA | **teniamo il nostro stile** |

Legenda: ✅ presente · ⚠️ parziale · ❌ assente · 🚫 esplicitamente non adottato.

---

## 11. Proposta tecnica per il RBAC granulare (da decidere)

**Modello scelto: per-società *e* per-modulo** (granularità fine). Al profilo
utente si aggiunge una mappa permessi a due livelli: un default per società +
override opzionale per singolo modulo di quella società.

```
type Level = 'none' | 'view' | 'operate' | 'admin';

access: {
  studio:     { default: Level; modules?: { [modulo: string]: Level } },
  strategico: { default: Level; modules?: { … } },
  materico:   { default: Level; modules?: { … } },
  unico:      { default: Level; modules?: { … } },
}
// risoluzione: access[societa].modules[modulo] ?? access[societa].default
```
Moduli tipici per override: `finanza`, `cantiere`, `progetti`, `documenti`,
`investitori`, `marketing`, `commesseInterne`…

Esempi dalla matrice §3:
- `admin totale` (Dario) = `admin` su tutte le società (default `admin`).
- `multi-società operativo` (Francesco) = `operate` su più società.
- `settoriale` (Claudia) = `operate` su Onirico, `none` altrove.
- `monitoraggio` (Rosa) = `view` su Strategico; es. override `finanza: 'view'`
  ma `marketing: 'operate'`.
- Caso d'uso per-modulo: "operativo su Onirico **ma** niente finanza" →
  `studio: { default: 'operate', modules: { finanza: 'none' } }`.

Il ruolo "macro" (`admin/manager`) resta per le funzioni di **gruppo** (gestione
accessi, creazione admin) e per il permesso esplicito **"chi vede i lead"** (§3).

> Da convertire poi anche nelle **regole Firebase** (oggi basate su `role/active`).
> Decisione da confermare prima di implementare.

---

## 12. Cosa NON cambia

- **Stile grafico** = il nostro (`LINEE-GUIDA-GRAFICHE.md`), `COMPANY_COLOR`
  invariati. La palette "Architectural Gold / Deep Cyan / Emerald / Terracotta"
  del deck **non** viene adottata.
- **Stack, deploy, nodi DB e regole**: invariati come comportamento. Il rebrand è
  di etichette, non di chiavi/dati.
- I 4 documenti esistenti restano validi; vengono **aggiornati** (naming + rimandi
  a questo doc), non riscritti.

---

## 13. Punti aperti da confermare (prima di implementare)

**Tutti decisi ✅**
- **Mappa nomi UI**: app → **"Aulico"**, `studio` → **"Onirico"** (chiavi codice
  invariate).
- **RBAC**: modello `access` **per-società *e* per-modulo** (§11).
- **Cascata ROE Unico**: percentuali **default override-abili per operazione**
  (+ date e payback). Schema in `SCHEMA-COMMESSE-INTERNE.md`.
- **Commesse interne**: **entità dedicata** `internalOrders` (numerazione `CI-`,
  generazione automatica al salvataggio deal, scrittura finanza alla conferma).
- **Bridge finanza**: servizio core **`finance.record()`** (+ intercompany eliso
  nel consolidato).
- **Smistamento lead**: **automatico con conferma** (+ fallback manuale).
- **Backend** (OTP / WhatsApp / AI-render): **fase separata**, non blocca il resto.
- **Primo lotto di implementazione**: **Rebrand + RBAC + ROE Unico + KPI funnel**
  (basso rischio, alto valore direzionale).

Nessun punto bloccante residuo: alla prossima fase si passa all'implementazione
del primo lotto (sempre previa conferma esplicita — la piattaforma non è ancora
stata toccata).

---

*Documento maestro dell'integrazione Aulico. Tutte le estensioni qui elencate sono
da implementare in seguito; nessuna è ancora nel codice.*
