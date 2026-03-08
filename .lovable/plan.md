

# Piano: Creare stories mancanti in docs/spec/stories

## Analisi gap

**14 stories esistenti** coprono Epic 01, 02, 03 (parziale), 05 (parziale), 06 (parziale).

**Stories mancanti** (feature implementate senza documentazione):

| ID | Story | Epic di riferimento |
|----|-------|---------------------|
| 03.6 | Step Revisione (diff view + score compatti) | Epic 03 |
| 03.7 | Step Completa (prossimi passi) | Epic 03 |
| 04.1 | Edge Function parse-cv | Epic 04 |
| 04.2 | Edge Function scrape-job | Epic 04 |
| 04.3 | Edge Function ai-prescreen | Epic 04 |
| 04.4 | Edge Function ai-tailor | Epic 04 |
| 04.5 | Edge Function cv-review | Epic 04 |
| 06.2 | Dettaglio Candidatura | Epic 06 |
| 08.1 | Pagina Impostazioni (account, privacy, zona pericolosa) | Epic 08 (backlog → implementato) |
| 09.1 | Database consent_logs | Epic 09 (backlog → implementato) |
| 09.2 | Pagine legali (T&C, Privacy, Cookie Policy) | Epic 09 |
| 09.3 | Consensi in registrazione | Epic 09 |
| 09.4 | Consenso dati sensibili pre-upload | Epic 09 |
| 09.5 | Trasparenza AI (disclaimer + label) | Epic 09 |
| 09.6 | Cookie banner | Epic 09 |
| 09.7 | Sezione Privacy in Impostazioni | Epic 09 |
| 09.8 | Eliminazione account (Edge Function + UI) | Epic 09 |
| 09.9 | Export dati personali | Epic 09 |
| 09.10 | Pseudonimizzazione consensi (user_hash) | Epic 09 |
| 10.1 | CV Edit (editor master CV) | Nuova — non in epic |
| 10.2 | Salary Analysis Card | Nuova — non in epic |
| 10.3 | Template unlock (tutti free) | Nuova — non in epic |

## Cosa creare

**22 file** in `docs/spec/stories/`, seguendo esattamente il template delle stories esistenti:

```
# Story XX.Y — Nome Story (Implementata)

**Epic:** XX — Nome Epic
**Status:** Completata

---

## Cosa è stato implementato

[descrizione 2-3 righe]

### Comportamento
[lista comportamenti]

### Note / Differenze dal piano MVP
[se applicabile]
```

Ogni story sara' concisa (stesse dimensioni delle esistenti, ~30-60 righe), documentando solo il comportamento implementato.

## File da creare

1. `story-03.6-revisione.md`
2. `story-03.7-completa.md`
3. `story-04.1-parse-cv.md`
4. `story-04.2-scrape-job.md`
5. `story-04.3-ai-prescreen.md`
6. `story-04.4-ai-tailor.md`
7. `story-04.5-cv-review.md`
8. `story-06.2-dettaglio-candidatura.md`
9. `story-08.1-impostazioni.md`
10. `story-09.1-consent-db.md`
11. `story-09.2-pagine-legali.md`
12. `story-09.3-consensi-registrazione.md`
13. `story-09.4-consenso-dati-sensibili.md`
14. `story-09.5-trasparenza-ai.md`
15. `story-09.6-cookie-banner.md`
16. `story-09.7-privacy-impostazioni.md`
17. `story-09.8-eliminazione-account.md`
18. `story-09.9-export-dati.md`
19. `story-09.10-pseudonimizzazione-consensi.md`
20. `story-10.1-cv-edit.md`
21. `story-10.2-salary-analysis.md`
22. `story-10.3-template-unlock.md`

