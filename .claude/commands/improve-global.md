Scansione completa del backlog vs codice reale, senza dipendere dal diff. Usa questo comando periodicamente (ogni 3-4 sessioni Lovable, o quando sospetti che il backlog sia sfasato rispetto al codice).

> **Differenza da `/improve`:** `/improve` e' diff-based — analizza solo i file toccati dall'ultimo push Lovable. `/improve-global` ignora il diff e confronta direttamente ogni story del backlog con il codice corrente.

## Fase 1 — Leggi il backlog

1. Leggi `docs/backlog/README.md` per l'indice completo
2. Per ogni epic nel backlog, leggi il file corrispondente
3. Identifica tutte le stories con stato `⏳ Da fare` o senza stato (ignora quelle gia' barrate `~~` o marcate `✅`)

## Fase 2 — Verifica ogni story nel codice

Per ogni story ancora aperta:

1. Leggi i criteri di accettazione della story
2. Identifica i file specifici citati (edge functions, componenti, shared modules)
3. Leggi quei file e cerca le implementazioni specifiche (funzioni, pattern, comportamenti descritti nei criteri)
4. Classifica:
   - **✅ Implementato** — tutti i criteri soddisfatti
   - **⚠️ Parziale** — alcuni criteri soddisfatti, altri no (specifica quali mancano)
   - **⏳ Da fare** — nessun criterio soddisfatto

## Fase 3 — Aggiorna il backlog

Per ogni story verificata:
- Implementata → barra con `~~` e marca `✅ Implementato`
- Parziale → aggiorna la descrizione con `⚠️ Parziale — manca: [cosa]`
- Da fare → lascia invariata

Se una intera epic e' completata:
- **Elimina il file** dal backlog
- Aggiorna `docs/backlog/README.md`: aggiungi l'epic alla riga "Archivio"

## Fase 4 — Sync spec (solo dove necessario)

Se hai trovato stories implementate che introducono behavior NON documentati in `docs/spec/epics/`:
- Aggiorna le epic di spec coinvolte
- Aggiorna i file test in `docs/test/` se necessario

Non riscrivere spec gia' corrette — solo aggiunte dove manca.

## Fase 5 — Riepilogo

Mostra:
- Stories trovate implementate (non erano marcate)
- Stories parziali con dettaglio cosa manca
- Spec/test aggiornati
- Stato backlog aggiornato

## Regole

- Vai per file specifici — non fare grep generici su tutto il codebase
- Fidati dei criteri di accettazione come guida per la ricerca
- Se un criterio non e' verificabile dal codice (es. "testato manualmente"), assumilo come non verificato e lascia la story aperta
- Scrivi tutto in italiano
