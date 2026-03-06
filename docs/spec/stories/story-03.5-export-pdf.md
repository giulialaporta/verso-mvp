# Story 03.5 — Export PDF (Implementata)

**Epic:** 03 — Wizard Nuova Candidatura
**Status:** Completata

---

## Cosa è stato implementato

Step 5 del wizard: selezione template, preview score, e download PDF del CV adattato.

### Comportamento

1. Selezione template (Classico o Minimal)
2. Preview pannelli ATS Score e Honest Score
3. Click "Scarica PDF"
4. Generazione PDF nel browser con `@react-pdf/renderer`
5. Download diretto del file
6. Upload automatico su Supabase Storage (`cv-exports/{userId}/{applicationId}/`)
7. URL salvato in `tailored_cvs.pdf_url`

### Template disponibili

- **Classico:** header scuro, body bianco, DM Sans
- **Minimal:** tutto bianco, Inter, linee sottili

### Nome file

`CV-{Nome}-{Azienda}.pdf`

### Salvataggio

Al completamento del wizard:
- Record in `applications` (company, role, job_url, job_description, match_score, ats_score, status='draft')
- Record in `tailored_cvs` (tailored_data, suggestions, skills_match, ats_score, ats_checks, honest_score, pdf_url, template_id)
