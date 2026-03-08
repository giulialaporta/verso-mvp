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

## Edit Drawer

Click su una candidatura → apre un drawer (`EditItemDrawer`):

- **Cambio status:** dropdown con tutti gli stati disponibili
- **Note:** campo testo libero per appunti del candidato
- **Download CV:** link al PDF del CV adattato (se generato)
- **Elimina:** pulsante di eliminazione con conferma

**Layout:**
- Mobile: drawer slide-up
- Desktop: drawer slide-right

---

## Azioni

| Azione | Comportamento |
|--------|--------------|
| Cambia status | Aggiorna `applications.status` + `updated_at` |
| Aggiungi nota | Aggiorna `applications.notes` |
| Download CV | Apre `tailored_cvs.pdf_url` |
| Elimina | Conferma → elimina application + tailored_cv associato |
| Riprendi bozza | Redirect a `/app/nuova` con dati pre-caricati |

---

## Componenti chiave

| Componente | Scopo |
|------------|-------|
| `StatusChip` | Badge colorato per status candidatura |
| `EditItemDrawer` | Drawer per editing dettagli candidatura |

---

## Empty state

Se non ci sono candidature:
- Messaggio "Nessuna candidatura ancora"
- CTA per creare la prima candidatura
