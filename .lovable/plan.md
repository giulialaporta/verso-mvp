

## Fix: Home mobile, foto, gestione stato

### Problemi identificati

1. **Home mobile — headline troncata**: `truncate` su riga 145 taglia il job title. Su 390px, con avatar 64px + gap + plan badge, resta pochissimo spazio.
2. **Home mobile — nessun contatore candidature**: Non si vede quante candidature sono attive/totali. Il match medio da solo non basta.
3. **Foto — rischio foto estranee**: L'Hero usa `photo_url` (estratta dal parsing PDF) e `photo_base64` come fallback. Se il PDF ha un logo o la foto di qualcun altro, appare nell'avatar. Pericoloso.
4. **CandidaturaDetail — stato sepolto e tagliato**: Il selettore stato è una riga di 6 pill in `overflow-x-auto` — su mobile si vedono solo 2-3, il resto è nascosto. Lo stato è la sezione più importante ma è persa tra ATS checks, seniority, diff, CV preview, note. L'utente deve scrollare tantissimo per arrivarci.

---

### Soluzioni

#### 1. Home Hero — headline su più righe + contatore

- Rimuovere `truncate` dalla headline, usare `line-clamp-2` per massimo 2 righe
- Aggiungere sotto il match medio una riga con contatore: "3 candidature attive · 5 totali"
- Il contatore usa i dati già disponibili da `useApplications`

#### 2. Foto — solo avatar caricato manualmente

- **Rimuovere** `photoUrl` e `photoBase64` dalla catena di fallback nell'Hero
- L'avatar mostra SOLO: `profiles.avatar_url` (upload manuale) → iniziali nome
- La foto estratta dal CV è inaffidabile (potrebbe essere un logo, una foto sbagliata, o di qualcun altro)
- L'utente carica la propria foto cliccando sull'avatar — flusso già implementato

#### 3. Stato candidatura — in cima, prominente, grid 2x3

Ripensare completamente la posizione e il layout dello stato in `CandidaturaDetail.tsx`:

- **Spostare lo stato SUBITO DOPO l'header** (prima degli score cards) — è l'azione primaria
- **Layout grid 2 colonne × 3 righe** invece di scroll orizzontale — tutti i 6 stati visibili senza scroll
- Ogni bottone più grande (48px altezza), con icona + label
- Lo stato attivo ha sfondo pieno + ring, gli altri sono ghost
- Il salvataggio dello stato è **automatico** (no bottone "Salva modifiche" separato) — click su uno stato → update immediato + toast
- **Note**: textarea rimane sotto, ma con auto-save on blur (non bottone dedicato)
- **Rimuovere il bottone "Salva modifiche"** — stato e note si salvano automaticamente

#### File coinvolti

| File | Modifica |
|------|----------|
| `src/pages/Home.tsx` | HeroSection: rimuovere `truncate` headline → `line-clamp-2`, rimuovere `photoUrl`/`photoBase64` dal fallback, aggiungere contatore candidature |
| `src/pages/CandidaturaDetail.tsx` | Spostare stato dopo header, grid 2x3, auto-save su click stato, auto-save note on blur, rimuovere bottone "Salva modifiche" |

