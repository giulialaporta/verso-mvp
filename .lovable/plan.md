

# Aggiungere slide Customer Journey al pitch

## Obiettivo

Inserire una nuova slide (tra Slide 2 e l'attuale Slide 3) che illustri il percorso utente completo dentro Verso, mostrando le sezioni e funzionalita' principali in modo visuale.

## Nuova Slide 3 — "Il percorso utente"

**Titolo**: "Come funziona Verso — passo dopo passo"

**Layout**: timeline orizzontale con 6 step del wizard, ciascuno come card compatta con numero, nome e descrizione breve:

1. **Onboarding** — "Carica il CV e completa il profilo. Verso analizza e struttura tutto automaticamente."
2. **Annuncio** — "Incolla URL o testo dell'offerta. AI estrae azienda, ruolo, requisiti."
3. **Pre-screening** — "Dealbreaker, skill gap, domande di follow-up. Ti dice subito se vale la pena candidarti."
4. **CV su misura** — "Patch-based tailoring: riscrive solo quello che serve, senza inventare nulla."
5. **Revisione e export** — "Revisione formale automatica. Scarica PDF (design) + DOCX (ATS-ready)."
6. **Dashboard** — "Traccia tutte le candidature. Stato, score, storico in un unico posto."

**Sotto la timeline**: 3 mini-badge orizzontali con le funzionalita' trasversali:
- "Match score + ATS score + Honest score"
- "Integrity check su ogni modifica"
- "Supporto italiano e inglese"

## Modifiche a `src/pages/Pitch.tsx`

- Creare `Slide3Journey` come nuova funzione componente con la timeline a 6 step
- Rinominare l'attuale `Slide3` in `Slide4Product`, `Slide4` in `Slide5Stack`, `Slide5` in `Slide6Roadmap`
- Aggiornare `TOTAL` a 6 e `SLIDES` array di conseguenza
- Layout timeline: griglia `grid-cols-3` su 2 righe (3+3) con linea connettrice, oppure `grid-cols-6` compatta su desktop. Ogni step ha numero verde, titolo bianco, descrizione grigia

