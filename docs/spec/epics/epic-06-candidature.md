# Epic 06 — Pagina Candidature (Tracker) (Implementato)

---

## Cosa è stato costruito

1. Pagina `/app/candidature` — lista di tutte le candidature con gestione stati, note, e download CV adattato
2. Pagina `/app/candidatura/:id` — dettaglio completo della singola candidatura con scores, diff AI, CV preview e azioni
3. ResponsiveDetailPanel al posto del vecchio EditItemDrawer

> **Questo epic non era nel piano MVP.** Il piano prevedeva solo la lista nella dashboard home. È stata implementata una pagina dedicata con funzionalità di tracking e una pagina di dettaglio completa.

---

## Layout

Route `/app/candidature` — accessibile dalla sidebar (desktop) e tab bar (mobile).

---

## Sezioni

### 1. Bozze

- Sezione separata in alto, visivamente distinta (warning color)
- Mostra candidature con status `draft`
- Ogni bozza ha un pulsante "Riprendi" per tornare al wizard e completare
- Le bozze possono essere eliminate

### 2. Candidature attive

- Ordinate per data di creazione (più recenti in alto)
- Card per ogni candidatura
- Hover su una card → prefetch dei dati candidatura (`usePrefetchApplication`)

---

## Card candidatura

Ogni card mostra:

- **Ruolo** (titolo principale)
- **Azienda** (sottotitolo)
- **Match Score** — badge colorato
- **ATS Score** — badge colorato
- **Status** — chip colorato con `StatusChip` component
- **Data** — data relativa

---

## Gestione stati

| Status | Colore | Significato |
|--------|--------|-------------|
| `draft` | Warning | Bozza, non completata |
| `inviata` | Default | Candidatura inviata |
| `visualizzata` | Info | L'azienda ha visto la candidatura |
| `contattato` | Accent | L'azienda ha contattato il candidato |
| `follow-up` | Secondary | In attesa di follow-up |
| `ko` | Destructive | Candidatura rifiutata |

---

## Pagina CandidaturaDetail

Route `/app/candidatura/:id` — dettaglio completo di una singola candidatura.

### Contenuto

- **Scores:** match score e ATS score con visualizzazione prominente
- **ATS Checks:** lista dei controlli ATS superati/falliti (`ats_checks`)
- **Seniority:** livello di seniority rilevato
- **Learning Suggestions:** suggerimenti di apprendimento basati sui gap
- **Modifiche AI (collapsible):** sezione espandibile con la lista delle differenze tra CV originale e CV adattato (diff list)
- **CV Preview:** `CVSections` collassabile con il contenuto del CV adattato
- **Status selector:** 5 stati selezionabili come chip (inviata, visualizzata, contattato, follow-up, ko)
- **Notes:** textarea per appunti liberi del candidato

### Sticky Action Bar

Barra fissa in basso con 3 azioni:

- **Salva** — salva status e note modificati
- **Scarica PDF** — apre `ExportDrawer` per selezionare template e scaricare il PDF
- **Elimina** — eliminazione con conferma

---

## ResponsiveDetailPanel

Sostituisce il vecchio `EditItemDrawer`. Layout responsive:

- **Desktop:** Sheet laterale, larghezza 400px, slide-right
- **Mobile:** Drawer bottom-sheet, altezza 85vh

Usato sia dalla lista candidature che dalla pagina di dettaglio per azioni contestuali.

---

## Azioni

| Azione | Comportamento |
|--------|--------------|
| Cambia status | Aggiorna `applications.status` + `updated_at` |
| Aggiungi nota | Aggiorna `applications.notes` |
| Scarica PDF | Apre `ExportDrawer` → genera e scarica PDF |
| Elimina | Conferma → elimina application + tailored_cv associato |
| Riprendi bozza | Redirect a `/app/nuova` con dati pre-caricati |

---

## Hooks

| Hook | Scopo |
|------|-------|
| `useApplications` | Fetch candidature con join su `tailored_cvs` per recuperare `ats_score` |
| `usePrefetchApplication` | Prefetch dati candidatura su hover della card |

---

## Componenti chiave

| Componente | Scopo |
|------------|-------|
| `StatusChip` | Badge colorato per status candidatura |
| `ResponsiveDetailPanel` | Panel responsive (Sheet desktop 400px / Drawer mobile 85vh) |
| `ExportDrawer` | Pannello export con template picker + download PDF |

---

## Empty state

Se non ci sono candidature:
- Messaggio "Nessuna candidatura ancora"
- CTA per creare la prima candidatura
