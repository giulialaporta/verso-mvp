# Epic 06 — Pagina Candidature (Tracker) (Implementato)

---

## Cosa è stato costruito

Pagina `/app/candidature` — lista di tutte le candidature dell'utente con gestione stati, note, e download CV adattato.

> **Questo epic non era nel piano MVP.** Il piano prevedeva solo la lista nella dashboard home. È stata implementata una pagina dedicata con funzionalità di tracking.

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

## Detail Panel (responsive)

Click su una candidatura → apre un pannello di dettaglio:

- **Info:** ruolo, azienda, data, match score
- **Cambio status:** chip selezionabili (non dropdown) per tutti gli stati disponibili
- **Note:** campo testo libero per appunti del candidato
- **Salva:** pulsante per salvare status e note
- **Download CV:** pulsante per scaricare il PDF del CV adattato (via ExportDrawer)
- **Elimina:** pulsante di eliminazione con AlertDialog di conferma

**Layout responsive (`ResponsiveDetailPanel`):**
- Mobile: `Drawer` slide-up (max 85vh)
- Desktop: `Sheet` slide-right (400px)

---

## Azioni

| Azione | Comportamento |
|--------|--------------|
| Cambia status | Seleziona chip → click Salva → aggiorna `applications.status` + `updated_at` |
| Aggiungi nota | Scrive nel campo → click Salva → aggiorna `applications.notes` |
| Download CV | Carica `tailored_cvs` → apre ExportDrawer con template PDF |
| Elimina | AlertDialog conferma → elimina application + tailored_cv + PDF da Storage |
| Riprendi bozza | Redirect a `/app/nuova?draft=<id>` con dati pre-caricati |

---

## Componenti chiave

| Componente | Scopo |
|------------|-------|
| `StatusChip` | Badge colorato per status candidatura |
| `ResponsiveDetailPanel` | Wrapper responsive (Drawer mobile / Sheet desktop) |
| `DetailContent` | Contenuto del pannello: info, status, note, azioni |
| `ExportDrawer` | Drawer per export/download PDF |

---

## Empty state

Se non ci sono candidature:
- Messaggio "Nessuna candidatura ancora"
- CTA per creare la prima candidatura
