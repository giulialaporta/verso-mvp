
# Fix: Language In = Language Out

## Problema
Il system prompt e il tool schema sono interamente in italiano. Questo crea un bias fortissimo che spinge il modello a generare output in italiano anche quando l'annuncio e' in inglese.

Punti critici:
1. **System prompt** tutto in italiano (istruzioni, esempi, sezione "CALIBRAZIONE MERCATO ITALIANO")
2. **Tool schema descriptions** in italiano ("Punteggio di match", "Percorso nel JSON", "Nuovo valore per il campo")
3. **Enum values** in italiano: `"essenziale"`, `"importante"`, `"utile"` -- forzano output italiano
4. **Nessuna istruzione esplicita** sulla lingua da usare per i contenuti del CV vs la lingua delle istruzioni

## Soluzione

Riscrivere il system prompt e il tool schema in **inglese**, e aggiungere un'istruzione esplicita di rilevamento lingua come primo passo del ragionamento.

### Modifiche in `supabase/functions/ai-tailor/index.ts`

**1. System prompt in inglese**
- Tutte le istruzioni passano in inglese per eliminare il bias
- La regola LANGUAGE IN = LANGUAGE OUT viene rafforzata e messa in cima, come primissima istruzione
- Aggiunta di un campo `detected_language` nel tool output per forzare il modello a dichiarare esplicitamente la lingua rilevata prima di generare i contenuti
- La sezione "Calibrazione mercato italiano" resta ma viene riformulata come "European market calibration" (informazione utile, non bias linguistico)

**2. Tool schema in inglese**
- Tutte le `description` passano in inglese
- Le enum `importance` passano da `["essenziale", "importante", "utile"]` a `["essential", "important", "nice_to_have"]`
- Aggiunta del campo `detected_language` (stringa) come campo required nel tool output

**3. Messaggio utente invariato**
- Il messaggio utente continua a passare il CV e l'annuncio cosi' come sono -- la lingua dell'annuncio guida l'output

### Impatto sul frontend
- Il campo `importance` nelle skills_missing passa da valori italiani a inglesi. Verificare che `Nuova.tsx` e `Candidature.tsx` gestiscano i nuovi valori (o li mostrino direttamente senza traduzione).

### File coinvolti

| File | Modifica |
|------|----------|
| `supabase/functions/ai-tailor/index.ts` | Riscrittura prompt + schema in inglese, aggiunta `detected_language` |
| `src/pages/Nuova.tsx` | Aggiornare eventuali riferimenti a "essenziale"/"importante"/"utile" |
