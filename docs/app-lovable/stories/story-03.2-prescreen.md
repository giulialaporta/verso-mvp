# Story 03.2 — Pre-screening AI (Implementata)

**Epic:** 03 — Wizard Nuova Candidatura
**Status:** Completata

---

## Cosa è stato implementato

Step 2 del wizard: analisi di pre-screening che confronta il CV del candidato con i requisiti dell'annuncio. Identifica gap critici e genera domande di approfondimento.

> **Questa feature non era nel piano MVP.** È stata aggiunta durante lo sviluppo.

### Comportamento

1. Avviato automaticamente dopo step 1
2. Chiama Edge Function `ai-prescreen`
3. Mostra dealbreaker (gap non colmabili) con severità critical/significant
4. Mostra matrice requisiti (mandatory/preferred/nice_to_have)
5. Presenta follow-up questions (max 5) per gap colmabili
6. L'utente può rispondere alle domande
7. Risposte salvate in `applications.user_answers` (JSONB)
8. Le risposte migliorano il tailoring successivo

### Valutazione feasibility

- **low:** gap critici, candidatura difficile
- **medium:** gap colmabili, candidatura possibile
- **high:** buon match, candidatura consigliata

### Output in italiano
