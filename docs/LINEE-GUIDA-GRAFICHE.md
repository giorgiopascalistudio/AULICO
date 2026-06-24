# Linee guida grafiche — Aulico (ex Onirico Studio OS)

> **Scopo.** Questo documento è la fonte unica dello stile dell'app. Ogni **nuovo
> modulo, vista o componente** deve seguirlo, così la piattaforma resta coerente
> mentre cresce. È estratto dal codice reale (`src/index.css`, `src/finance.ts`,
> componenti esistenti) — quando cambi un token qui, aggiornalo anche nel codice
> e viceversa.
>
> 🔒 **Decisione vincolante (feedback Aulico).** La piattaforma viene rinominata
> **Aulico** (vedi `VISIONE-AULICO.md`), **ma lo stile grafico resta questo —
> il nostro**. La palette proposta nel deck Aulico ("Architectural Gold / Deep
> Cyan / Emerald Green / Terracotta Coral") **NON viene adottata**: restano i
> colori società `COMPANY_COLOR` e tutti i token qui sotto. Il rebrand tocca solo
> le **etichette** (nome app, `studio → "Onirico"`), non l'identità visiva.
>
> Regola d'oro: **prima di inventare un colore/raggio/pattern, cerca se esiste
> già qui o in un componente analogo e riusalo.** L'app deve sembrare disegnata
> da una sola mano.

---

## 0. Filosofia visiva

Onirico è un gestionale ma **non deve sembrare un gestionale**. L'estetica è
quella di un'app premium: editoriale, calma, "app-like".

- **Sobrio e monocromatico** di base (nero/bianco/grigi caldi), il **colore è
  funzionale**: serve a distinguere le società o a comunicare uno stato, mai
  decorativo.
- **Tanto spazio bianco**, gerarchia tipografica forte (serif per i titoli),
  card morbide su fondo caldo.
- **App-like, non web-like**: niente zoom, niente selezione testo accidentale,
  niente scrollbar invadenti, transizioni brevi ed eleganti.
- **Niente emoji decorative**, niente colori a caso, niente ombre pesanti.

---

## 1. Palette colori

### 1.1 Neutri (base dell'interfaccia)

| Ruolo | Colore | Uso |
|---|---|---|
| Fondo app | `#F5F5F3` | sfondo di ogni pagina (caldo, non bianco puro) |
| Superficie / card | `#FFFFFF` | card, pannelli, modali |
| Testo principale | `#161616` | titoli e corpo |
| Accent nero (azioni) | `#1b1b1b` | pulsanti primari, stati attivi |
| Bordo standard | `#e2e2e2` | bordo di card, input, divisori |
| Testo secondario | `#6b6b6b` / `#8a8a8a` | sottotitoli, metadati, label |
| Hover chiaro | `#f5f5f5` / `#fafafa` | hover di righe/tile |

> Sono i valori già "cablati" in tutta l'app e gestiti dalla dark mode (§7).
> **Usa questi**, non grigi Tailwind a caso, così la dark mode li rimappa
> automaticamente.

### 1.2 Colori società (identità a colpo d'occhio)

Fonte unica: **`COMPANY_COLOR` in `src/finance.ts`**. Non ridefinirli inline.

| Società | Colore | Hex | Significato |
|---|---|---|---|
| **Studio** *(UI: "Onirico")* | nero | `#161616` | architettura/ingegneria (il "default") |
| **Strategico** | ambra | `#b45309` | marketing / hub |
| **Materico** | arancio | `#c2410c` | forniture/posa |
| **Unico** | indaco | `#4338ca` | investimenti immobiliari |

> Nota rebrand: la chiave `studio` resta nel codice, ma in UI l'etichetta diventa
> **"Onirico"**. Il colore resta **nero** (il deck lo voleva teal: non adottato).

Uso tipico: bordo/sfondo dei badge società, pallini nelle liste raggruppate,
header di sezione, colore della pillbar attiva nella divisione.

```tsx
import { COMPANY_COLOR, COMPANY_LABEL } from '../finance';
<span style={{ color: COMPANY_COLOR[company] }}>{COMPANY_LABEL[company]}</span>
```

### 1.3 Colori di stato (semantici)

Per stati/badge usa le scale Tailwind **tenui** (sfondo `-50/-100`, testo
`-700`, bordo `-200`), coerenti con i badge esistenti. La dark mode li lascia
invariati di proposito.

| Stato | Famiglia | Esempio classi |
|---|---|---|
| Successo / confermato / pagato | `emerald` | `bg-emerald-50 text-emerald-700 border-emerald-200` |
| Attenzione / in attesa / scadenza | `amber` | `bg-amber-50 text-amber-700 border-amber-200` |
| Errore / rifiutato / scaduto | `rose` | `bg-rose-50 text-rose-700 border-rose-200` |
| Info / collegato / investimenti | `indigo` | `bg-indigo-50 text-indigo-700 border-indigo-200` |
| Neutro / bozza / pending | `gray`/`stone` | `bg-gray-100 text-gray-600` |

---

## 2. Tipografia

Tre font, caricati in `src/index.css`:

| Token | Font | Uso |
|---|---|---|
| `--font-serif` | **Playfair Display** | titoli `h1` e logo (`.m-logo-text`). Applicato d'ufficio agli `h1` (peso 400, mai bold) |
| `--font-sans` | **Inter** | tutto il resto (UI, corpo, label) |
| `--font-mono` | **JetBrains Mono** | numeri/codici tecnici, importi tabellari, ID |

Linee guida:
- I **titoli di pagina/sezione importanti** → serif (`font-serif`), leggeri.
- I **titoli di card/widget** → sans, `font-semibold`, `text-sm`/`text-base`.
- **Label e metadati** → sans, `text-xs`, `uppercase tracking-wide` se etichetta
  di sezione, colore secondario.
- Base body `15px`, `line-height 1.5` (già impostato sul `body`).

---

## 3. Forma, spazio, elevazione

### 3.1 Raggi (scala normalizzata)

Usa **solo** questa scala (px), già allineata in tutta l'app:

| Raggio | Uso |
|---|---|
| `rounded-lg` (8px) | input, select, textarea (default form), pulsanti piccoli, chip |
| `rounded-[16px]` | tile interne, elementi annidati |
| `rounded-[20px]` | card secondarie |
| `rounded-[22px]` | **card standard** (il valore più comune) |
| `rounded-[24px]` | card principali / contenitori grandi |
| `rounded-[26px]` | hero / contenitori di primo livello |
| `rounded-full` | pillole (tab), avatar, badge pill, toggle |

Non introdurre valori fuori scala (es. `rounded-xl` arbitrari): scegli il
gradino più vicino.

### 3.2 Bordi ed elevazione

- Card: `bg-white border border-[#e2e2e2]` + raggio della scala.
- Ombre **leggere**: `shadow-sm` a riposo; su elementi cliccabili **hover lift**
  → `hover:shadow-md` + micro-translate. Pattern usato nelle card Strategico:
  ```
  shadow-sm transition hover:shadow-md hover:-translate-y-0.5
  ```
- Evita ombre scure/grandi: l'app è chiara e piatta-morbida, non "material".

### 3.3 Spaziatura

- Padding card: `p-4`/`p-5` (compatte), `p-6` (principali).
- Gap tra card in griglia: `gap-3`/`gap-4`.
- Margini di sezione generosi; preferisci respiro a densità.

---

## 4. Componenti ricorrenti (pattern da riusare)

### 4.1 Card standard
```tsx
<div className="bg-white border border-[#e2e2e2] rounded-[22px] p-5 shadow-sm">
  …
</div>
```
Se cliccabile, aggiungi `transition hover:shadow-md hover:-translate-y-0.5 cursor-pointer`.

### 4.2 Barra a pillole (tabs) — pattern "barra settori"
Container con classe **`.pillbar`** (scroll orizzontale app-like, scrollbar
nascosta). Pillola attiva nera, inattive trasparenti:
```tsx
<div className="pillbar flex gap-1 bg-white border border-[#e2e2e2] rounded-full p-1">
  {tabs.map(t => (
    <button
      className={active === t.id
        ? 'rounded-full px-4 py-2 text-sm bg-[#1b1b1b] text-white'
        : 'rounded-full px-4 py-2 text-sm text-[#6b6b6b] hover:bg-[#f5f5f5]'}>
      {t.label}
    </button>
  ))}
</div>
```
Per le **divisioni società** la pillola attiva può usare `COMPANY_COLOR` come
sfondo invece del nero.

### 4.3 Pulsanti

| Tipo | Stile |
|---|---|
| Primario | `bg-[#1b1b1b] text-white rounded-full px-4 py-2 text-sm hover:bg-black transition` |
| Secondario | `bg-white border border-[#e2e2e2] rounded-full px-4 py-2 text-sm hover:bg-[#f5f5f5]` |
| Ghost/testo | `text-[#6b6b6b] hover:text-[#161616]` |
| Distruttivo | usa `ConfirmDeleteModal`/`askDelete` (vedi §6), stile rose solo nello stato armato |

I pulsanti sono tendenzialmente **a pillola** (`rounded-full`). Icone
`lucide-react`, dimensione `w-4 h-4` accanto al testo.

### 4.4 Badge / chip di stato
```tsx
<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs
                 bg-emerald-50 text-emerald-700 border border-emerald-200">
  Confermato
</span>
```

### 4.5 Form e input
Stile già forzato in `index.css`: bordo `#e2e2e2`, sfondo bianco, `rounded-lg`,
focus nero con anello sottile. **Non sovrascrivere** questi default; per i campi
nativi (`input/select/textarea`) basta usare l'elemento. Label sopra il campo,
`text-xs` colore secondario.

### 4.6 Modali
Due strade ammesse:
- componente **`Modal`** (`src/components/Modal.tsx`), oppure
- overlay manuale: `fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm` con card
  bianca centrata (raggio `[24px]`).

Z-index: overlay app `z-[200]`. Mantieni questa convenzione per evitare conflitti.

### 4.7 Stato vuoto (empty state)
Icona tenue + titolo breve + una riga di spiegazione + (eventuale) CTA. Colore
testo secondario, centrato, niente bordi pesanti. Coerente con gli empty state
esistenti (es. liste Materico/Strategico).

### 4.8 KPI / tile cliccabili
Pattern "Panoramica" (Cantiere/Strategico): griglia uniforme di tile con numero
grande (sans semibold o mono), label piccola sotto, l'intera tile cliccabile che
salta alla sezione di dettaglio. Mantieni **dimensioni e posizioni stabili**
(scansionabili) tra moduli.

---

## 5. Iconografia, motion, immagini

- **Icone**: esclusivamente `lucide-react`, tratto sottile, `w-4 h-4` (inline) o
  `w-5 h-5` (nav). Coerenza di set: non mischiare altre librerie.
- **Motion** (`motion`/Framer): transizioni **brevi** (180–420ms) con easing
  `cubic-bezier(0.22, 1, 0.36, 1)`. Animazioni già pronte: `animate-smartIn`,
  keyframe `riseIn`/`fadeIn`. Le **tab non animano il layout** (cambio statico,
  scelta deliberata). Niente animazioni gratuite che distraggono.
- **Immagini/media utente**: URL sempre passati da `safeUrl()` (vedi §6); raggio
  coerente con il contenitore; `object-cover`.

---

## 6. Regole non negoziabili (sicurezza & UX app-like)

Queste **non sono opzionali** — ogni nuovo modulo deve rispettarle.

1. **Niente dati locali / finti.** Tutto su Firebase Realtime DB, in tempo reale.
   Niente `localStorage`/`sessionStorage` per i dati, niente seed/account di test.
2. **Link utente sempre sanificati**: ogni `href` da input utente →
   `href={safeUrl(u) || '#'}` (`utils.ts`, whitelist http/https/mailto/tel) +
   `rel="noreferrer"` sui `target="_blank"`. Mai `dangerouslySetInnerHTML`.
3. **App non zoomabile e non selezionabile** (regole già globali). Non rimuoverle.
   I nuovi campi testo nativi sono già coperti dall'eccezione su
   `input/textarea/select/[contenteditable]`.
4. **Eliminazioni**: sempre via doppia conferma (`ConfirmDeleteModal` /
   `askDelete`) e passaggio dal **Cestino** (`moveToTrash`). Mai `window.confirm`
   diretto. (Unica eccezione documentata: unsend chat entro 60s.)
5. **Asset statici** via `import.meta.env.BASE_URL` (l'app gira su path arbitrari
   di GitHub Pages).

---

## 7. Dark mode

La dark mode **segue il tema di sistema** (`@media (prefers-color-scheme: dark)`)
ed è gestita centralmente in `index.css` rimappando i colori "cablati".

**Cosa devi fare per essere dark-mode-ready:** usa i colori neutri standard di
§1.1 (gli hex `#161616`, `#F5F5F3`, `#e2e2e2`, `bg-white`, ecc.) e le scale
Tailwind grigie comuni. Vengono rimappati automaticamente. Palette dark di
riferimento: app `#0e0f11` · card `#17181b` · pannello `#1d1f23` · bordo
`#2a2d31` · testo `#e8e8ea`.

**Cosa NON viene toccato** (resta identico): colori società (§1.2) e badge di
stato colorati (§1.3) — devono restare riconoscibili anche al buio.

Se introduci un colore neutro nuovo non in lista, **aggiungilo alla mappa dark**
in `index.css`, altrimenti in dark mode "lampeggerà" chiaro.

---

## 8. Stampa (report white-label)

Per le viste stampabili (es. Report Strategico) usa le classi:
- `.print-area` sul contenitore da stampare,
- `.no-print` su ciò che va nascosto in stampa.

Le regole `@media print` in `index.css` fanno il resto. Brandizza il report
(logo, intestazione) dentro `.print-area`.

---

## 9. Checklist per ogni nuovo modulo/funzionalità

- [ ] Fondo `#F5F5F3`, card `bg-white border-[#e2e2e2] rounded-[22px] shadow-sm`.
- [ ] Colore società da `COMPANY_COLOR`, non inline.
- [ ] Tab = `.pillbar` + pillola attiva nera/colore-società.
- [ ] Titoli serif dove pertinente; label `text-xs` secondarie.
- [ ] Icone solo `lucide-react`.
- [ ] Stati con badge tenui (emerald/amber/rose/indigo).
- [ ] Dati su Firebase (nodo + **regole** aggiornate); niente storage locale.
- [ ] `safeUrl` su ogni link utente; `rel="noreferrer"`.
- [ ] Eliminazioni via `askDelete` + `moveToTrash`.
- [ ] Colori neutri nuovi → aggiunti alla mappa dark mode.
- [ ] Verifica con `npm run build` (esbuild non fa type-check; `tsc` ha errori
      preesistenti — non inseguirli).

---

*Documento di riferimento. Aggiornare quando si introduce un nuovo token o
pattern condiviso, mantenendolo allineato a `src/index.css` e `src/finance.ts`.*
