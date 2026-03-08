# Story 10.2 — Salary Analysis Card (Implementata)

**Epic:** 10 — Feature aggiuntive
**Status:** Completata

---

## Cosa è stato implementato

Componente di analisi retributiva mostrato nello Step Verifica del wizard, quando `salary_analysis` è presente nella risposta di `ai-prescreen`.

### Comportamento

- Condizionale: appare solo se `salary_analysis` è nel response di prescreen
- Header: icona CurrencyEur + "Analisi Retributiva" + badge delta colorato
- Due barre orizzontali proporzionali animate (Framer Motion):
  - "La tua aspettativa" (da profilo utente)
  - "Range posizione" (da annuncio o stimato)
- Ogni barra mostra: label, range RAL formattato (es. "€35K–42K"), badge fonte (Da te / Dall'annuncio / Stimata)
- Delta: positivo (verde ↑) / neutro (giallo →) / negativo (rosso ↓) con percentuale
- Nota AI contestuale
- Disclaimer: "I dati retributivi sono indicativi..."

### Input dati

- `salary_expectations` letto dal profilo utente e passato a `ai-prescreen`
- Se assente nel profilo: l'AI può comunque stimare se il range è esplicito nell'annuncio

### Componente

`src/components/SalaryAnalysisCard.tsx`
