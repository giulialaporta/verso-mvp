# Story 03.7 — Step Completa (Implementata)

**Epic:** 03 — Wizard Nuova Candidatura
**Status:** Completata

---

## Cosa è stato implementato

Step finale del wizard: conferma che il CV è pronto, con tre opzioni per proseguire.

### Comportamento

- Icona animata di successo (CheckCircle, scale-in con Framer Motion)
- Messaggio: "CV pronto!" con ruolo e azienda
- Tre CTA con animazione sequenziale (staggered fade-in):
  1. **"Ho inviato la candidatura"** → segna come `inviata`, redirect a `/app/candidature`
  2. **"La invierò dopo"** → resta come `draft`, redirect a `/app/home`
  3. **"Nuova candidatura"** → reset wizard per nuova candidatura

### Componente

`src/components/wizard/StepCompleta.tsx`
