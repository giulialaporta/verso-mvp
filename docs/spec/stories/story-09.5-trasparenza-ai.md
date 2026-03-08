# Story 09.5 — Trasparenza AI (Implementata)

**Epic:** 09 — Legal, Privacy, Trasparenza AI
**Status:** Completata

---

## Cosa è stato implementato

Label di trasparenza per contenuti generati dall'AI, in conformità con l'EU AI Act.

### Comportamento

- Componente `AiLabel` mostra un'icona Robot + testo esplicativo
- Utilizzato in tutti i punti dove l'AI genera contenuto visibile all'utente:
  - Step Verifica (prescreen): "Analisi generata con AI — valore indicativo"
  - Step Revisione (score): "Punteggi calcolati con AI — valore indicativo"
  - Step Export (CV adattato): disclaimer sul CV generato
- Stile discreto: testo 11px, colore muted-foreground/70, icona Phosphor `Robot` duotone

### Componente

`src/components/AiLabel.tsx`
