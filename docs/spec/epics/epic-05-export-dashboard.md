# Epic 05 — Export PDF + Dashboard Home (Implementato)

---

## Cosa è stato costruito

1. Sistema template PDF con 2 layout (entrambi free)
2. Generazione PDF nel browser con download + upload automatico
3. Dashboard home con 3 stati, statistiche, CV card collapsible e gestione CV
4. Pagina CVEdit per modificare il CV master senza ri-upload

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
- Flusso onboarding a 3 step visualizzato con card locked (non solo CTA)
- I 3 step sono bloccati e indicano la sequenza: carica CV → compila dati → crea candidatura
- Click sullo step 1 → redirect a `/onboarding`
- Vista di benvenuto che guida l'utente passo dopo passo

### Stato 2: CV caricato, nessuna candidatura

- Saluto "Ciao [Nome]"
- CV Card collapsible (vedi sotto)
- CTA "Nuova candidatura" → redirect a `/app/nuova`

### Stato 3: CV + candidature presenti

**PlanCard:**
- Componente che mostra lo stato del piano (Free/Pro/Pro in scadenza)
- **Free:** "Piano Free" con info limite candidature
- **Pro:** "Versō Pro" con badge accent e data rinnovo
- **Pro in scadenza** (`cancel_at_period_end`): mostra data scadenza

**StatsBar:**
- 3 card con icone Phosphor:
  - **Briefcase** — numero candidature attive
  - **ChartLineUp** — score medio di match
  - **FileText** — stato CV (caricato/aggiornato)

**CTA "Nuova candidatura":**
- Se utente Free con `free_apps_used >= 1` → redirect a `/upgrade` (pro gate via `useProGate`)
- Se utente Pro o Free con 0 candidature → redirect a `/app/nuova`

**Post-upgrade polling:**
- Se query param `upgrade=success` → polling `check-subscription` fino a `is_pro = true` → toast di benvenuto

**CV Card (collapsible):**
- Espandibile/collassabile con toggle
- Mostra `CVSections` editabile inline (esperienze, formazione, competenze)
- `SalaryDisplay` integrato: mostra RAL attuale e RAL desiderata con toggle per edit inline
- Azioni CV:
  - **Modifica CV** → redirect a `/app/cv-edit`
  - **Soft delete** → imposta `is_active = false`, il CV non è più visibile ma resta in DB
  - **Riattivazione** → possibilità di riattivare un CV precedente (ripristina `is_active = true`)
  - **Hard delete** → elimina file da Supabase Storage + record dal DB (con conferma)

**Candidature recenti:**
- Mostra le ultime 3 candidature
- Card con: ruolo, azienda, match score, ATS score, data
- Hover su una card → prefetch dei dati candidatura (`usePrefetchApplication`)
- Link a pagina completa candidature

---

## 4. Pagina CVEdit

Route `/app/cv-edit` — pagina dedicata alla modifica del CV master.

- Permette di modificare il CV caricato senza dover fare un nuovo upload
- Editing inline delle sezioni del CV (esperienze, formazione, competenze, ecc.)
- Salvataggio modifiche su DB
- Redirect alla home dopo il salvataggio

---

## Componenti chiave

| Componente | Scopo |
|------------|-------|
| `ClassicoTemplate` | Template PDF tradizionale |
| `MinimalTemplate` | Template PDF moderno/pulito |
| `ExportDrawer` | Pannello export con template picker + score |
| `StatsBar` | 3 card statistiche con icone Phosphor (interno a Home.tsx) |
| `RecentApplications` | Lista ultime 3 candidature con hover prefetch (interno a Home.tsx) |
| `CVCard` | Card collapsible con CVSections editabile e azioni CV (interno a Home.tsx) |
| `SalaryDisplay` | Mostra RAL attuale/desiderata con inline edit (interno a Home.tsx) |
| `PlanCard` | Card stato piano Free/Pro/Expiring (interno a Home.tsx) |

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
