# TripSplit — Documentație completă funcționalități

> Aplicație web pentru planificarea călătoriilor în grup și împărțirea cheltuielilor.
> Stack: React (Vite) + Redux + SignalR | ASP.NET Core 10 + PostgreSQL

---

## 1. Autentificare

### 1.1 Înregistrare (`/register`)
- Formular cu câmpurile: **Nume**, **Email**, **Parolă**
- Validare pe server (email unic, parolă minimă)
- La succes → redirect automat la pagina principală
- Token JWT stocat în `localStorage`

### 1.2 Autentificare (`/login`)
- Formular cu **Email** și **Parolă**
- Token JWT returnat și salvat local
- Redirect la `/` după login reușit

### 1.3 Resetare parolă
- `/forgot-password` — utilizatorul introduce email-ul; se trimite link de resetare
- `/reset-password` — formular cu token din link; permite setarea parolei noi

### 1.4 Sesiune persistentă
- Token-ul JWT are valabilitate 7 zile
- Rutele protejate (`/`, `/trips/:id`, `/profile`) redirecționează la `/login` dacă nu există token valid
- Logout disponibil din pagina de profil

---

## 2. Pagina principală — Lista călătoriilor (`/`)

### 2.1 Afișarea călătoriilor
- Grid cu carduri pentru fiecare călătorie la care utilizatorul este membru
- Fiecare card afișează: **titlu**, **destinație**, **interval de date**, **stare** (Upcoming / Active / Completed), **imaginea de copertă** generată automat pe baza destinației
- Click pe card → deschide detaliile călătoriei

### 2.2 Creare călătorie nouă
- Buton „+ New trip" deschide un modal
- Câmpuri: **Titlu**, **Destinație**, **Data de start**, **Data de sfârșit**
- La creare, utilizatorul devine automat admin al călătoriei

### 2.3 TopBar
- Logo TripSplit (link la `/`)
- Avatar utilizator (click → navighează la `/profile`)

---

## 3. Detalii călătorie (`/trips/:id`)

Pagina principală a aplicației. Are un **tab bar** cu 5 secțiuni:

| Tab | Conținut |
|-----|----------|
| Itinerary | Activități zilnice + hartă |
| Expenses | Cheltuieli + balanțe |
| Members | Membri grup |
| Chat | Mesaje + propuneri activități |
| ✨ AI | Chatbot AI pentru destinație |

TopBar afișează breadcrumb: `Trips / [Titlu călătorie]` și avatar pentru profil.

---

## 4. Tab: Itinerary

### 4.1 Vizualizare activități
- Activitățile sunt grupate **pe zile** (heading cu data completă: „Monday, Aug 3")
- Deasupra există un **calendar orizontal scroll** cu pill-uri pentru fiecare zi din intervalul călătoriei — click pe o zi face scroll la ziua respectivă
- Fiecare activitate are un card cu: **titlu**, **oră de start**, **categorie** (icon + culoare), **locație** (dacă există), buton **Delete**

### 4.2 Categorii activități
Sight (🏛), Food (🍽), Stay (🛏), Travel (✈), Fun (🎟), Transit (🚗)

### 4.3 Adăugare activitate manuală
- Buton „+ Add activity" pe fiecare zi
- Form în modal: **Titlu**, **Locație** (search cu autocomplete), **Categorie** (chips selectabile), **Dată**, **Oră**
- La submit → activitatea apare instant în lista zilei respective

### 4.4 Hartă activități
- Panou hartă interactiv (dreapta desktop / sub listă mobile)
- Pin-uri pentru toate activitățile care au coordonate GPS
- Click pe pin → afișează tooltip cu titlul activității

---

## 5. Tab: Expenses

### 5.1 Balanță generală (Balance Hero)
- Card mare în top cu soldul net al utilizatorului curent: „You are owed $X" sau „You owe $X"
- Afișează suma totală cheltuită în călătorie

### 5.2 Lista cheltuielilor
- Fiecare cheltuială afișează: **titlu**, **sumă**, **cine a plătit**, **câți au împărțit**, **sumă per persoană**
- Buton **Edit** → modal pre-completat cu datele cheltuielii
- Buton **Delete** → șterge cheltuiala

### 5.3 Adăugare / editare cheltuială
Form în modal cu:
- **Titlu** (ex: „Cina la restaurant")
- **Sumă** (în valuta călătoriei)
- **Cine a plătit** — dropdown cu membrii grupului
- **Împărțit între** — checkboxuri, implicit toți membrii

### 5.4 Secțiunea „Settle Up"
- Afișează lista datoriilor calculate automat (algoritmul minimizează numărul de tranzacții)
- Fiecare rând: „[Persoana A] pays [Persoana B] $X" + buton **Settle**
- Datele achitate dispar din listă

### 5.5 Modal achitare datorie
- Dacă destinatarul **are link de plată** setat → buton „Deschide link plată" (Revolut/PayPal/IBAN) + buton „Am plătit — marchează ca achitat"
- Dacă nu are link → mesaj explicativ + buton de confirmare cash
- La confirmare → datoria e marcată ca achitată în baza de date

---

## 6. Tab: Members

### 6.1 Lista membrilor
- Card pentru fiecare membru cu: **avatar** (inițiale), **nume**, **email**, **rol** (Admin / Member)
- Adminul călătoriei are badge special

### 6.2 Adăugare membri
- Câmp de căutare: caută utilizatori după **nume** sau **email**
- Dropdown cu rezultate live (debounced search pe server)
- Click pe un rezultat → adaugă imediat membrul în călătorie

### 6.3 Eliminare membri
- Buton „Remove" vizibil doar pentru admin
- Adminul nu se poate elimina pe sine

---

## 7. Tab: Chat

### 7.1 Mesagerie în timp real
- Conexiune **WebSocket via SignalR** — mesajele apar instant la toți membrii grupului
- Feed cronologic cu mesaje și propuneri de activități intercalate
- Fiecare mesaj afișează: **avatar** expeditor, **nume**, **text**, **oră**
- Mesajele proprii sunt aliniate la dreapta
- Câmp de input în jos: „Scrie un mesaj... (Enter pentru trimitere)"
- Istoricul mesajelor (ultimele 50) e încărcat la deschiderea tab-ului

### 7.2 Propuneri de activități (Activity Proposals)
- Buton **calendar icon** deschide formularul de propunere
- O propunere apare în feed ca un **card special** (distinct vizual față de mesaje)

**Câmpuri formular propunere:**
- Titlu (obligatoriu)
- Descriere (opțional)
- Locație (opțional)
- Data/ora de start
- Data/ora de final (opțional)
- Categorie (Sight / Food / Stay / Travel / Fun / Transit)
- Cost estimat (opțional)

**Sistem de vot:**
- Fiecare membru poate vota **Approve** sau **Reject**
- Card-ul propunerii afișează: **progress bar** cu procentul de aprobări, **contoare** (X aprobă / Y resping), **status badge** (Voting / Approved / Rejected)
- Dacă **mai mult de jumătate** din membri aprobă → propunerea e **aprobată automat** și activitatea e adăugată direct în itinerar (tab Itinerary se actualizează live)
- Dacă o majoritate respinge → propunerea e marcată ca Rejected
- Actualizările de vot sunt transmise în timp real tuturor membrilor prin SignalR

---

## 8. Tab: ✨ AI

### 8.1 Chatbot AI pentru destinație
- Powered by **Anthropic Claude Haiku** (model AI rapid și economic)
- Contextul include automat: **destinația călătoriei** și **intervalul de date**
- Conversație cu **memorie** — AI-ul reține istoricul conversației din sesiunea curentă

### 8.2 Prompt-uri rapide
Butoane predefinite pentru întrebări frecvente:
- „Ce activități recomandați în zonă?"
- „Unde se mănâncă bine? Budget/mid/premium"
- „Ce obiceiuri locale trebuie să știu?"
- „Transport local — cum mă deplasez?"
- „Ce să vizitez în prima zi?"

### 8.3 Format răspunsuri AI
AI-ul oferă întotdeauna **3 niveluri de opțiuni**:
- 💚 Budget (low cost)
- 💛 Mid-range
- 💎 Premium

Răspunsurile includ: prețuri aproximative, sfaturi practice, emoji pentru lizibilitate, și răspund în **limba utilizatorului** (română sau engleză).

---

## 9. Pagina de profil (`/profile`)

Accesată prin click pe **avatar** din TopBar (oriunde în aplicație).

### 9.1 Câmpuri editabile
- **Nume** — editat live, salvat pe server
- **Email** — read-only (nu poate fi schimbat)
- **Link de plată** — URL Revolut/PayPal/IBAN; văzut de ceilalți membri când îi datorează bani

### 9.2 Selector limbă
- Toggle simplu între 🇷🇴 Română și 🇬🇧 English
- Schimbarea e **imediată** (toată interfața se traduce instant)
- Preferința e salvată în `localStorage` și persistă la reîncărcare

### 9.3 Deconectare
- Buton „Deconectare" cu confirmare
- Șterge token-ul și redirecționează la `/login`

---

## 10. Internaționalizare (i18n)

- Sistem de traduceri cu **i18next**
- Limbi disponibile: **Română** (implicit) și **Engleză**
- Toate textele interfeței sunt traduse: navigare, formulare, mesaje, butoane, stări
- Limba selectată persistă în `localStorage`

---

## 11. Arhitectură tehnică (referință pentru design)

### Pagini / rute
| Rută | Pagina |
|------|--------|
| `/login` | Autentificare |
| `/register` | Înregistrare |
| `/forgot-password` | Resetare parolă (step 1) |
| `/reset-password` | Resetare parolă (step 2) |
| `/` | Lista călătoriilor |
| `/trips/:id` | Detalii călătorie (toate tab-urile) |
| `/profile` | Profil utilizator |

### Componente design system propriu
`Button`, `IconButton`, `Input`, `Badge`, `Card`, `Avatar`, `TripCover`, `SegmentedControl`, `Icon`, `Chip`, `ActivityCard`, `DatePicker`, `ActivityMap`, `LocationSearch`, `BalanceHero`, `ExpenseRow`, `SettleUpRow`

### State management
- Redux Toolkit — slice-uri pentru: `auth`, `trips`, `activities`, `expenses`, `chat`, `proposals`
- SignalR hub: `/hubs/chat` — events: `ReceiveMessage`, `ProposalCreated`, `ProposalUpdated`

---

## 12. Fluxuri principale (user journeys)

### Flux 1 — Planificare călătorie
1. Creare călătorie cu titlu + destinație + date
2. Adăugare membri din grup (search by email)
3. Adăugare activități manuale sau prin propuneri din chat
4. Vizualizare itinerar pe zile + hartă

### Flux 2 — Gestionare cheltuieli
1. Oricine adaugă o cheltuială (cine a plătit + pentru cine)
2. Balanțele se recalculează automat
3. La final de călătorie, fiecare achită datoriile prin link personal (Revolut etc.)
4. Debitele achitate se marchează ca settled

### Flux 3 — Propunere activitate prin chat
1. Utilizator A propune activitate cu detalii + oră
2. Card special apare în chat-ul tuturor
3. Membrii votează Approve/Reject
4. La majoritate → activitate adăugată automat în Itinerary

### Flux 4 — Recomandări AI
1. Utilizator deschide tab AI
2. Pune o întrebare (sau folosește prompt rapid)
3. AI răspunde cu 3 opțiuni (budget/mid/premium) specifice destinației
4. Conversația continuă contextual

---

## 13. Stări vizuale de care are nevoie designul

| Stare | Unde apare |
|-------|-----------|
| Loading (skeleton / spinner) | Orice fetch asincron |
| Empty state | Listă goală de activități, cheltuieli, membri, mesaje |
| Error state | Formular cu eroare server, fetch eșuat |
| Success feedback | Salvare profil, cheltuială adăugată, vot trimis |
| Real-time update | Mesaj nou, vot nou, activitate aprobată |
| Badge de stare călătorie | Upcoming (viitoare) / Active (în desfășurare) / Completed (finalizată) |
| Badge propunere | Voting / Approved / Rejected |
| Sold net pozitiv/negativ | BalanceHero (verde = ți se datorează, roșu = datorezi) |
