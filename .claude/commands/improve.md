Analizza le ultime modifiche da Lovable, sincronizza spec e test, pulisci il backlog.

## Fase 1 — Pull e analisi diff

1. Esegui `git pull`
2. `git log --oneline -20` per identificare i commit Lovable (NON firmati "Co-Authored-By: Claude")
3. `git diff <ultimo-commit-claude>..HEAD` per capire cosa e' cambiato
4. Leggi i file modificati per capire nel dettaglio cosa e' stato fatto

## Fase 2 — Sync spec + test (passata unica)

Le spec in `docs/spec/` sono la fotografia dell'app reale. I test in `docs/test/` coprono le spec.

Per ogni epic toccata dalle modifiche Lovable:

1. Leggi l'epic in `docs/spec/epics/`
2. Aggiornala con i nuovi behavior, rimuovi quelli eliminati
3. Leggi il file test corrispondente in `docs/test/`
4. Aggiorna la checklist test nella stessa passata (l'epic e' gia' in contesto)
5. Non resettare checkbox gia' marcate `[x]`

Se Lovable ha aggiunto un blocco funzionale nuovo (non coperto da nessuna epic):
- Crea una nuova epic
- Crea il file test corrispondente

Aggiorna `docs/spec/CLAUDE_APP.md` se necessario (route, edge functions, stack, flusso app, tabella MVP).

Mapping epic → test:

| Epic | File test |
|------|-----------|
| F1 — Auth + Setup | `check-auth.md` |
| F2 — Onboarding | `check-onboarding.md` |
| F3 — Nuova Candidatura | `check-nuova-candidatura.md` |
| F4 — AI Engine | `check-ai-engine.md` |
| F5 — Export + Dashboard | `check-export-dashboard.md` |
| F6 — Candidature | `check-candidature.md` |
| F8 + F9 — Impostazioni + Legal | `check-legal-privacy.md` |

> **Principio:** se una feature e' nel codice ma non nelle spec, aggiungila. Se e' nelle spec ma non nel codice, rimuovila.

## Fase 3 — Pulire il backlog

1. Leggi `docs/backlog/README.md` per l'indice
2. Per ogni **epic** nel backlog, verifica se e' stata implementata (confronta con le epic appena create/aggiornate in `docs/spec/epics/`). Se implementata → **elimina il file dal backlog** e aggiorna `docs/backlog/README.md`.
3. Per ogni **story** nel backlog, verifica se e' implementata **solo nei file toccati dal diff** (non greppare tutto il codebase)
4. Implementata → rimuovila. Parziale → aggiorna. File vuoto → eliminalo.
5. Aggiorna conteggi e `docs/backlog/README.md`

## Fase 4 — Problemi (solo critici)

Analizza **solo i file del diff** cercando:
- **Sicurezza:** auth, input validation, dati esposti
- **Correttezza:** bug, logica rotta, testi in inglese

NON cercare: style, naming, performance, duplicazioni. Solo cio' che rompe o espone.

Se trovi problemi, aggiungili al backlog con formato: Problema, Cosa fare, Criteri di accettazione.

## Fase 5 — Riepilogo + CLAUDE.md

1. Mostra:
   - Cosa ha fatto Lovable (3-5 righe)
   - Spec/test aggiornati
   - Stories rimosse dal backlog
   - Problemi trovati
   - Stato backlog

2. Aggiorna `CLAUDE.md` (root) e `docs/spec/CLAUDE_APP.md`:
   - Tabelle struttura cartella aggiornate?
   - Conteggi corretti?
   - Path e link validi?

## Regole

- Non duplicare miglioramenti gia' nel backlog
- Concentrati su problemi reali, non preferenze stilistiche
- Prioritizza sicurezza > correttezza > UX > pulizia
- Scrivi tutto in italiano
