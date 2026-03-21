Aggiorna le checklist di test in `docs/test/` in base alle epic attuali.

## Istruzioni

1. Leggi tutte le epic in `docs/spec/epics/`
2. Per ogni epic, verifica il file `docs/test/check-*.md` corrispondente:
   - **Esiste**: confronta con la spec. Aggiungi criteri mancanti, rimuovi obsoleti. Non resettare checkbox gia' marcate `[x]`.
   - **Non esiste**: crealo seguendo la struttura di `check-auth.md`
3. Aggiorna `docs/test/README.md` se hai creato nuovi file

## Struttura di ogni file check

- Titolo: `# Check — [Nome Area]: Acceptance Criteria`
- Sezioni raggruppate per flusso/funzionalita'
- Ogni criterio: `- [ ] **ID** — Descrizione chiara (azione + risultato atteso)`
- Coprire: happy path, errori, edge case, sicurezza, responsive

## Mapping epic → file test

| Epic | File |
|------|------|
| F1 — Auth + Setup | `check-auth.md` |
| F2 — Onboarding | `check-onboarding.md` |
| F3 — Nuova Candidatura | `check-nuova-candidatura.md` |
| F4 — AI Engine | `check-ai-engine.md` |
| F5 — Export + Dashboard | `check-export-dashboard.md` |
| F6 — Candidature | `check-candidature.md` |
| F8 + F9 — Impostazioni + Legal | `check-legal-privacy.md` |

## Fase finale — CLAUDE.md

Verifica che `CLAUDE.md` (root) e `docs/spec/CLAUDE_APP.md` abbiano tabelle struttura e conteggi corretti. Aggiorna se necessario.
