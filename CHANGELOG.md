# CHANGELOG — Verso

Registro cronologico delle modifiche al codebase.
Formato: `Data/Ora | Fonte | File modificati | Descrizione | Side effect`

---

| Data/Ora | Fonte | File modificati | Descrizione | Side effect |
|----------|-------|-----------------|-------------|-------------|
| 2026-03-26 14:00 | Claude Code | `CLAUDE.md`, `CHANGELOG.md` | Aggiunta sezione CHANGELOG nelle istruzioni di Claude; creato questo file con le entry storiche della sessione. | — |
| 2026-03-25 14:33 | Claude Code | `ai-tailor/index.ts`, `cv-review/index.ts`, `cv-formal-review/index.ts`, `docx-generator.ts`, `cv-templates/index.ts`, `StepExport.tsx` | Miglioramento qualità AI: aggiunta sezione VOICE & NARRATIVE nel prompt tailor (preserva voce del candidato, summary prescrittiva, bullet come evidence); Rule 10 cv-review riscritta con struttura in 3 step; bug fix cv-formal-review (ora riceve `lang` e usa abbreviazioni mesi corrette per lingua — Jan/Gen); bullet DOCX ▪/▸ → •; badge ATS-Safe su template Executive. Merge con commit Lovable in conflitto. | cv-formal-review ora usa `maxTokens: 8192`. Cambiamenti Lovable incorporati durante merge: DOCX completamente riscritto ATS-compliant, StepExport ridisegnato layout 2-card. |
| 2026-03-25 ~12:00 | Lovable | `docx-generator.ts`, `StepExport.tsx`, `cv-formal-review/index.ts`, `index.ts` | Lovable ha riscritto il DOCX generator con approccio ATS-compliant (single column, Word numbering, tab stops, sanitize em/en dash, GDPR footer); StepExport ridisegnato con pipeline reviewing→rendering→ready e layout 2-card "CV Recruiter + CV ATS"; aggiunto template `visual`. | Push in parallelo a Claude Code → conflitti risolti manualmente. |
| 2026-03-24 07:05 | Claude Code | `epic-04-ai-engine.md`, `epic-03-nuova-candidatura.md`, `check-ai-engine.md`, `check-nuova-candidatura.md`, `stories-p3-pulizia.md` | Sync spec/test/backlog post sessione Lovable: parse-cv aggiornata con 4 nuove sezioni (publications, volunteering, awards, conferences); StepAnnuncio con company opzionale, agency badge, parallelismo non-bloccante; aggiunta Story P3.8 (fix layout DOCX ATS). | Solo docs, nessun impatto su codice. |
| 2026-03-24 ~06:00 | Lovable | `CVSections.tsx`, `docx-generator.ts`, `cv.ts`, `ai-tailor/index.ts`, `parse-cv/index.ts`, `render-cv/index.ts`, `render-cv/templates.ts`, template HTML files | Aggiunta 4 nuove sezioni CV: Publications, Volunteering, Awards, Conferences. Aggiornati parser AI, template HTML (classico/minimal/executive/moderno), tipi TypeScript, editor sezioni UI. | Nuovi campi nel JSON del CV (`publications`, `volunteering`, `awards`, `conferences`) — da verificare compatibilità con export PDF/DOCX. |
