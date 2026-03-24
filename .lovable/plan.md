

## Obiettivo

Aggiungere un'istruzione esplicita nel system prompt di `parse-cv` per impedire il raggruppamento di ruoli multipli nella stessa azienda. Ogni posizione deve essere un elemento separato nell'array `experience`.

## Problema attuale

Il prompt non specifica come gestire il caso di una persona che ha avuto piu ruoli nella stessa azienda (es. promozioni, cambi di ruolo). L'AI potrebbe raggruppare tutto sotto un unico blocco aziendale, perdendo la cronologia delle singole posizioni.

## Intervento

### Aggiungere regola nel system prompt di `parse-cv/index.ts`

Nella sezione delle regole del system prompt, aggiungere una regola chiara:

```
## MULTIPLE ROLES AT SAME COMPANY
If a person held multiple roles/positions at the same company (e.g. promotions, 
role changes), each role MUST be a SEPARATE entry in the "experience" array.
Do NOT group or merge them into a single entry.
Each entry must have its own role title, dates, description, and bullets.
The company name will be repeated — this is correct and expected.

Example: if someone was "Junior Developer" then "Senior Developer" at Acme Corp,
output TWO separate experience entries, both with company "Acme Corp".
```

## File da modificare

- `supabase/functions/parse-cv/index.ts` — aggiunta regola nel system prompt

