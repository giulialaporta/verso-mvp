

# Fix: Lingua CV e Qualita' Parsing

## Problema 1: L'AI traduce il CV in italiano

Il system prompt di `parse-cv` e' scritto interamente in italiano ("Sei un esperto parser di CV..."), e le istruzioni utente dicono "Analizza questo CV". Questo spinge il modello a tradurre i contenuti in italiano anche quando il CV e' in inglese.

**Soluzione**: Riscrivere il system prompt in inglese (lingua neutra per l'AI) e aggiungere una regola esplicita:

> "CRITICAL: Preserve the EXACT original language of the CV. If the CV is in English, ALL extracted text MUST remain in English. If in Italian, keep it in Italian. NEVER translate any content."

Il prompt utente passa da "Analizza questo CV" a "Extract all structured data from this CV using the extract_cv_data tool. Preserve the original language exactly."

---

## Problema 2: Education — degree vs field mal separati

"Qualification to practice as an Engineer in Civil Engineering" viene spezzato male: il degree prende "Qualification to practice as an Engineer" troncato e il field non cattura "Civil Engineering" correttamente.

**Soluzione**: Aggiungere nel system prompt istruzioni specifiche per education:

> "For degree: use the FULL qualification title as written (e.g., 'Qualification to practice as an Engineer'). For field: use the specialization/discipline (e.g., 'Civil Engineering'). Do NOT split multi-word degree titles arbitrarily."

---

## Problema 3: Erasmus non riconosciuto

Il campo `program` esiste nel tool schema ma l'AI non lo popola. Il prompt menziona "program (Erasmus, ecc.)" ma troppo brevemente.

**Soluzione**: Rafforzare la descrizione del campo `program` nello schema:

```
program: {
  type: "string",
  description: "Exchange or special program name (e.g., Erasmus, Erasmus+, Double Degree, Study Abroad). Include the host institution and city if mentioned."
}
```

E aggiungere nel prompt: "If any education entry mentions an exchange program, Erasmus, study abroad, or similar, ALWAYS populate the 'program' field with the full program name and location."

---

## Problema 4: Enti certificazioni mancanti

Il campo `issuer` nello schema non ha description. L'AI lo ignora o lo popola male.

**Soluzione**: Aggiungere description esplicita:

```
issuer: {
  type: "string",
  description: "The organization or institution that issued the certification (e.g., 'Google', 'AWS', 'PMI', 'Ordine degli Ingegneri'). Extract the EXACT issuer name as written in the CV."
}
```

---

## Problema 5: Honors/publication non mostrati nella UI

I campi `honors`, `program`, `publication` esistono nel tipo ma `CVSections.tsx` non li visualizza nella sezione Education. L'utente non li vede nemmeno se l'AI li estrae.

**Soluzione**: Aggiungere la visualizzazione di questi campi in CVSections, sotto il voto:
- `honors` (es. "cum laude")
- `program` (es. "Erasmus Programme — Universidad de Sevilla")
- `publication` (es. titolo tesi)

---

## Riepilogo modifiche

| File | Modifica |
|------|----------|
| `supabase/functions/parse-cv/index.ts` | Riscrivere system prompt in inglese con regola anti-traduzione; migliorare descrizioni schema per education.program, certifications.issuer; rafforzare istruzioni per degree/field split |
| `src/components/CVSections.tsx` | Aggiungere visualizzazione di honors, program, publication nella sezione Education |

| Cosa NON cambia |
|------------------|
| Tipi TypeScript (i campi esistono gia') |
| Frontend (Nuova.tsx, Onboarding.tsx) |
| Altre edge functions |

