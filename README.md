# Onirico Studio OS

Gestionale dello studio (React + Vite + Tailwind + Three.js) con **login Google +
controllo accessi** e **tutti i dati condivisi sul Realtime Database** del progetto
`oniricoapp-48953`. Deploy su **GitHub Pages**.

## Accesso e ruoli
- Si entra solo con **account Google**.
- Il **primo** che accede diventa **admin**. La tua email
  (`giorgio.pascali990@gmail.com`) e gia impostata come admin garantito.
- Ogni nuovo accesso resta **in attesa**: lo approvi tu dal pulsante **Accessi**
  (icona persone, in alto a destra e nel profilo), assegnando un **ruolo**.
- Ruoli e accesso ai dati (secondo le regole del Database):
  - **Admin / Manager / Staff** = team "attivo": vedono e modificano i dati dello
    studio (progetti, task, template, preventivi, documenti, messaggi). La
    contabilita (`studioFinance`) e visibile solo ad Admin e Manager.
  - **Cliente / Partner** = accesso solo ai **propri** progetti (collegati tramite
    `clientUid`), con documenti e messaggi relativi.

## Dati condivisi
Tutto cio che accade nell'app viene scritto sul **Realtime Database** e si
sincronizza in tempo reale tra tutti gli utenti. Niente piu dati locali.
Nodi usati: `users`, `projects`, `tasks`, `templates`, `projectsInternal`,
`estimates`, `studioFinance`, `documents`, `projectMessages`.
Al primo avvio (admin) vengono creati solo i **template** di progetto; il resto
parte vuoto e si popola con i tuoi dati reali.

---

## Cosa devi fare tu

### 1) Abilita Google
Firebase Console -> Authentication -> Sign-in method -> **Google -> Abilita**.
In Authentication -> Settings -> **Authorized domains** aggiungi
`giorgiopascalistudio.github.io` (localhost e gia autorizzato).

### 2) Pubblica le REGOLE del Database
Realtime Database -> Regole -> incolla il contenuto di **`firebase-rules.json`**
(in questo progetto) -> **Pubblica**. Sono le tue regole, con in piu:
- il nodo `estimates`;
- protezione anti auto-promozione sul nodo `users` (nessuno puo darsi da solo
  ruolo o attivazione; solo admin o la tua email).

> La tua email e gia scritta dentro le regole come amministratore di fiducia,
> quindi il primo accesso admin e sicuro fin da subito.

### 3) Carica i 13 modelli 3D
Metti `step-01.glb` ... `step-13.glb` in **`public/model/`**.

> Il generatore di modulistica (`public/generatore-modulistica.html`) e gia
> incluso e viene pubblicato in automatico: lo apri dalla sezione Documenti.

---

## Avvio in locale
```bash
npm install
npm run dev
```

## Deploy su GitHub Pages (automatico)
Incluso `.github/workflows/deploy.yml`. Una volta sola: push su `main`, poi su
GitHub **Settings -> Pages -> Source = GitHub Actions**.

---

## Note
- La config Firebase nel codice e pubblica: e normale per le web app; la
  sicurezza viene dalle regole del punto 2.
- Per come sono scritte le tue regole, i progetti vengono modificati da
  Admin/Manager; lo Staff lavora su agenda/task e in lettura sul resto. Se vuoi
  dare allo Staff anche la modifica dei progetti, basta allentare la regola
  `projects/.write`.
