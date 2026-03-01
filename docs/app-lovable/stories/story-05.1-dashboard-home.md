# Story 05.1 — Dashboard Home (Implementata)

**Epic:** 05 — Export + Dashboard
**Status:** Completata

---

## Cosa è stato implementato

Pagina `/app/home` con 3 stati diversi in base ai dati dell'utente.

### Stato 1: Nessun CV

- Saluto "Ciao [Nome]"
- Messaggio di benvenuto / onboarding
- CTA "Carica il tuo CV" → `/onboarding`

### Stato 2: CV caricato, nessuna candidatura

- CV card con anteprima (esperienze, formazione)
- Azioni: elimina CV, carica nuovo
- CTA "Nuova candidatura" → `/app/nuova`

### Stato 3: CV + candidature

- **CV Card:** preview dati principali, azioni gestione
- **Stats:** candidature attive, score medio match, stato CV
- **Candidature recenti:** ultime 3, card con ruolo/azienda/score/data
- **CTA:** "Nuova candidatura"
