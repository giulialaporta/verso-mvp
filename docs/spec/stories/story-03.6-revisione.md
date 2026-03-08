# Story 03.6 — Step Revisione (Implementata)

**Epic:** 03 — Wizard Nuova Candidatura
**Status:** Completata

---

## Cosa è stato implementato

Step 5 del wizard: riepilogo visuale delle modifiche effettuate dal tailoring AI, con score compatti e diff collassabile.

### Comportamento

- Tre card compatte in griglia: Match %, ATS %, Confidence %
- Ogni card ha barra gradiente animata (colori semantici: rosso/giallo/verde)
- Card "Cosa abbiamo cambiato" con contatori: bullet riscritti, bullet aggiunti, esperienze rimosse, modifiche strutturali, esperienze mantenute, modifiche contenuto
- Sezione collassabile "Dettaglio modifiche" con lista diff: sezione, testo originale (barrato), testo suggerito (evidenziato in primary), motivo
- Warning se confidence < 90%: invito a rivedere le modifiche
- Label AI transparency: "Punteggi calcolati con AI — valore indicativo"
- CTA "Procedi all'export"

### Componente

`src/components/wizard/StepRevisione.tsx`

### Note

- La confidence viene ricalcolata lato client da `wizard-utils.ts` confrontando CV originale e adattato
- Non prevista nel piano MVP originale come step separato
