# Story 03.3 — CV Tailoring Patch-Based (Implementata)

**Epic:** 03 — Wizard Nuova Candidatura
**Status:** Completata

---

## Cosa è stato implementato

Step 3 del wizard: tailoring AI del CV con approccio patch-based (solo le modifiche necessarie, non un CV completo sostitutivo).

### Comportamento

1. Chiama Edge Function `ai-tailor` con CV + job posting + analisi prescreen + risposte utente
2. Riceve patch JSON (path → nuovo valore)
3. Applica le patch al CV master per generare il CV adattato
4. Mostra risultato del tailoring

### Due livelli di tailoring

**Strutturale:**
- Rimozione esperienze irrilevanti (mai tutte, minimo 2)
- Riordino per rilevanza rispetto al ruolo
- Condensazione bullet secondari

**Contenutistico:**
- Riscrittura summary allineato al ruolo
- Bullet con verbi d'azione + metriche
- Riordino skill per rilevanza
- Keyword dall'annuncio inserite naturalmente

### Protezioni

- Mai inventare esperienze/skill
- Mai modificare date/nomi azienda/titoli
- Max 50% rimozione esperienze
- CV output nella lingua dell'annuncio

### Differenza dal piano MVP

Il piano prevedeva output = CV completo. Implementato = patch JSON (più efficiente, tracciabile).
