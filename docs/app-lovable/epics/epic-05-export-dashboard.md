# Epic 05 — Export PDF + Dashboard Home (Implementato)

---

## Cosa è stato costruito

1. Sistema template PDF con 2 layout (entrambi free)
2. Generazione PDF nel browser con download + upload automatico
3. Dashboard home con 3 stati e statistiche

> **Differenza dal piano MVP:** il piano prevedeva 4 template (2 free + 2 pro), export DOCX, e drawer ATS separato. Implementati 2 template free, export solo PDF, e pannelli ATS/Honest Score integrati nel wizard.

---

## 1. Template PDF

Ogni template è un componente `@react-pdf/renderer` che riceve il JSON del CV adattato (`tailored_data`) e lo renderizza.

### Template 1: Classico

- Header scuro (`#141518`) con nome completo (DM Sans 600 22px, bianco)
- Email | telefono | località sotto (DM Sans 400 11px, grigio chiaro)
- Body sfondo bianco con testo nero
- Sezioni: Profilo → Esperienza → Formazione → Competenze → Certificazioni → Progetti
- Titoli sezione: DM Sans 600 12px uppercase, con linea sotto
- Competenze come testo inline separato da " · "
- Formato A4, margini 24mm

### Template 2: Minimal

- Tutto sfondo bianco, nessun header colorato
- Nome in Inter 600 24px, dati contatto in Inter 400 10px separati da " | "
- Linea sottile (0.5px, grigio chiaro) tra le sezioni
- Titoli sezione: Inter 600 11px uppercase
- Massima pulizia e leggibilità
- Formato A4, margini 22mm

### Best practice ATS (entrambi i template)

- Layout single-column
- Heading standard
- Testo selezionabile
- Font 10-12pt
- Margini ≥ 20mm
- Nessuna immagine per testo, nessuna tabella

---

## 2. Generazione e Download PDF

**Flusso:**
1. Utente seleziona template (Classico o Minimal) nello step 5 del wizard
2. Preview dei pannelli ATS Score e Honest Score
3. Click "Scarica PDF"
4. Generazione nel browser con `@react-pdf/renderer`
5. Download diretto
6. Upload automatico su Supabase Storage: `cv-exports/{userId}/{applicationId}/{filename}`
7. URL pubblico salvato in `tailored_cvs.pdf_url`
8. Template scelto salvato in `tailored_cvs.template_id`

**Nome file:** `CV-{Nome}-{Azienda}.pdf` (es. `CV-Marco-Rossi-Acme-Corp.pdf`)

---

## 3. Dashboard Home

Route `/app/home` — pagina principale dopo il login.

### Stato 1: Nessun CV (virgin state)

- Saluto "Ciao [Nome]"
- Messaggio onboarding
- CTA "Carica il tuo CV" → redirect a `/onboarding`
- Vista di benvenuto che guida l'utente

### Stato 2: CV caricato, nessuna candidatura

- Saluto "Ciao [Nome]"
- CV card con anteprima dati (esperienze, formazione)
- Possibilità di eliminare il CV o caricarne uno nuovo
- CTA "Nuova candidatura" → redirect a `/app/nuova`

### Stato 3: CV + candidature presenti

**CV Card:**
- Preview del CV con dati principali
- Azioni: elimina CV, carica nuovo

**Stats (in alto):**
- Numero candidature attive
- Score medio di match
- Stato CV (caricato/aggiornato)

**Candidature recenti:**
- Mostra le ultime 3 candidature
- Card con: ruolo, azienda, match score, ATS score, data
- Link a pagina completa candidature

---

## Componenti chiave

| Componente | Scopo |
|------------|-------|
| `ClassicoTemplate` | Template PDF tradizionale |
| `MinimalTemplate` | Template PDF moderno/pulito |
| `ExportDrawer` | Pannello export con template picker + score |

---

## Cosa NON è stato implementato (rispetto al piano MVP)

| Feature | Stato |
|---------|-------|
| Template Executive (Pro) | Non implementato |
| Template Moderno (Pro) | Non implementato |
| Sistema Free/Pro template | Non implementato (entrambi free) |
| Export DOCX | Non implementato |
| Preview PDF live nel drawer | Parziale |
| Badge "ATS-Ready ✓" | Non implementato come badge |
| Seniority warning sulle card | Non implementato come tooltip |
| Honest Score accordion nel drawer | Integrato nel wizard |
