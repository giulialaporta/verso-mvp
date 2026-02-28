

# Piano: Ripresa bozze, eliminazione candidature, download PDF

## Panoramica

Tre problemi da risolvere + una feature nuova (export PDF):

1. **"Riprendi" ricomincia da capo** — il bottone naviga a `/app/nuova` senza passare l'ID della bozza, quindi il wizard ricomincia sempre dallo Step 1 vuoto
2. **Non si possono eliminare candidature attive** — il bottone elimina esiste solo per le bozze
3. **Download PDF** — implementare il template system dell'Epic 5 con `@react-pdf/renderer`

---

## 1. Ripresa bozze (Riprendi dove avevi lasciato)

### Problema
Il bottone "Riprendi" fa `navigate("/app/nuova")` senza contesto. Il wizard parte sempre da zero e crea un nuovo draft.

### Soluzione

**Candidature.tsx:**
- Cambiare il bottone "Riprendi" per navigare con l'ID della bozza: `navigate("/app/nuova?draft=<id>")`

**Nuova.tsx:**
- Leggere il query param `draft` dall'URL
- Se presente, caricare i dati dell'application dal DB (`company_name`, `role_title`, `job_description`, `job_url`, `match_score`, `status`)
- Controllare se esiste gia' un `tailored_cvs` per quell'application:
  - **Se esiste** (l'AI ha gia' finito): saltare direttamente allo Step 2 o Step 3 con i dati caricati
  - **Se non esiste** ma c'e' `job_description`: rilanciare l'analisi AI dallo Step 1 con i dati pre-compilati
  - **Se non esiste** e non c'e' `job_description`: mostrare Step 1 vuoto (caso raro)
- Usare `applicationId` dalla bozza esistente (non crearne uno nuovo)
- Lo stato del wizard (`step`, `jobData`, `tailorResult`, `applicationId`) viene derivato dai dati DB

### Persistenza tra desktop/mobile
Il cambio di viewport causa un remount dell'AppShell (da mobile layout a sidebar layout). Il componente `Nuova` viene smontato e rimontato, perdendo tutto lo state.
- Soluzione: salvare `step` e `applicationId` corrente come query params nell'URL (`?draft=<id>&step=2`). Al mount, se presenti, riprendere da li'.

---

## 2. Eliminazione candidature attive

### Problema
Il bottone elimina con AlertDialog esiste solo nella sezione bozze. Le candidature attive possono solo cambiare stato.

### Soluzione

**Candidature.tsx:**
- Aggiungere un bottone "Elimina" nel drawer di dettaglio della candidatura (in fondo, sotto il bottone Salva)
- Stesso pattern AlertDialog gia' usato per le bozze
- Stessa funzione `handleDelete` che elimina prima `tailored_cvs` e poi `applications`
- Chiudere il drawer dopo l'eliminazione

---

## 3. Download PDF con Template System (Epic 5)

### Installazione
- `@react-pdf/renderer` per generare PDF nel browser

### Template: Classico (Free, default)
Un componente React PDF che riceve il JSON del CV adattato (`tailored_cv`) e genera un PDF A4:
- Header scuro (#141518) con nome, email, telefono, localita'
- Body bianco con sezioni: Profilo, Esperienza, Formazione, Competenze, Certificazioni, Progetti
- Titoli sezione in uppercase con linea sottile
- Font: DM Sans (registrato via Google Fonts TTF)
- Competenze come testo inline separato da " . "
- Margini 24mm

### Template: Minimal (Free)
- Sfondo bianco, nessun header colorato
- Nome grande, dati contatto separati da " | "
- Linea sottile tra sezioni
- Font: Inter
- Margini 22mm

### Integrazione nello Step 3 del wizard

**Nuova.tsx (Step 3):**
- Il bottone "Scarica PDF" (attualmente disabilitato) apre un Drawer
- Il Drawer contiene:
  - Pannello ATS Check (score + lista check colorati)
  - Pannello Honest Score (accordion, collassato di default)
  - Template picker (griglia 2 colonne: Classico e Minimal selezionabili, Executive e Moderno con lucchetto "Pro")
  - Bottone "Scarica PDF" che genera e scarica il file
- Nome file: `CV-[Nome]-[Azienda].pdf`
- Upload del PDF su Storage (bucket `cv-exports`) e salvataggio URL in `tailored_cvs.pdf_url`

### Drawer Candidature (download da candidature salvate)
- Nel drawer di dettaglio delle candidature attive, aggiungere un bottone "Scarica PDF" che:
  - Carica `tailored_cvs.tailored_data` dal DB
  - Genera il PDF con il template salvato
  - Trigger download

---

## File coinvolti

| File | Modifica |
|------|----------|
| `src/pages/Nuova.tsx` | Query param `draft`, caricamento bozza da DB, URL state per step, drawer export PDF, template picker |
| `src/pages/Candidature.tsx` | Navigate con `?draft=<id>`, bottone elimina nel drawer attivi, bottone scarica PDF |
| `src/components/cv-templates/ClassicoTemplate.tsx` | **Nuovo** — template PDF Classico con @react-pdf/renderer |
| `src/components/cv-templates/MinimalTemplate.tsx` | **Nuovo** — template PDF Minimal |
| `src/components/cv-templates/index.ts` | **Nuovo** — export centralizzato dei template |
| `src/components/ExportDrawer.tsx` | **Nuovo** — drawer con ATS panel, honest score, template picker, download |

### Migrazione DB
- Creare bucket Storage `cv-exports` (se non esiste)
- Aggiungere colonna `pdf_url` a `tailored_cvs` (se non esiste gia')

---

## Ordine di implementazione

1. Ripresa bozze (query params + caricamento da DB)
2. Eliminazione candidature attive (bottone nel drawer)
3. Template PDF (Classico + Minimal con @react-pdf/renderer)
4. Export Drawer (ATS panel + template picker + download)
5. Integrazione nel wizard Step 3 e nel drawer Candidature

