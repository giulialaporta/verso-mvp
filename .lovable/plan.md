

# Ottimizzazione Token AI -- Piano di Implementazione

## Panoramica

Tre interventi per ridurre i costi token del 30-40% senza toccare precisione o latenza.

---

## 1. scrape-job: modello piu' leggero

**Cosa**: cambiare il modello da `google/gemini-2.5-flash` a `google/gemini-2.5-flash-lite`.

**Perche'**: l'estrazione dati da un annuncio e' un task semplice (classificazione + estrazione campi). Flash-lite costa meno, e' piu' veloce, e la precisione su questo tipo di task e' identica.

**Modifica**: una riga in `supabase/functions/scrape-job/index.ts`, campo `model`.

---

## 2. scrape-job: cache URL

**Cosa**: creare una tabella `job_cache` che salva il risultato del parsing per URL. Se lo stesso annuncio viene analizzato di nuovo (stesso utente o altro), si restituisce il risultato dalla cache senza chiamare l'AI.

**Dettagli**:
- Nuova tabella `job_cache`: `id`, `url_hash` (MD5 dell'URL, unique), `job_data` (jsonb), `created_at`
- TTL di 7 giorni: la edge function ignora risultati piu' vecchi
- Lookup prima della chiamata AI; insert dopo la risposta AI
- La cache si applica SOLO quando l'input e' un URL (non testo libero)
- RLS: lettura pubblica (il dato dell'annuncio non e' sensibile), insert solo da service role (la edge function)

**Impatto**: ogni URL ripetuto = 0 token. Utile per annunci virali o candidature multiple allo stesso ruolo.

---

## 3. ai-tailor: output a patch invece di CV completo

**Cosa**: invece di far generare all'AI l'intero `tailored_cv` (che ripete al 80-90% l'originale), farle restituire solo le **modifiche** come array di patch.

**Come funziona**:

L'AI restituisce:
```text
tailored_patches: [
  { path: "summary", value: "Nuovo summary adattato..." },
  { path: "experience[0].bullets", value: ["bullet riscritto 1", "bullet 2"] },
  { path: "skills.technical", value: ["React", "TypeScript", "Node.js"] }
]
```

La edge function poi applica le patch sul CV originale lato server e restituisce il `tailored_cv` completo al frontend. Il frontend non cambia.

**Modifiche**:

1. **`supabase/functions/ai-tailor/index.ts`**:
   - Sostituire `tailored_cv` nel tool schema con `tailored_patches` (array di `{ path, value }`)
   - Aggiornare il system prompt: "Restituisci SOLO le sezioni modificate come patch, non l'intero CV"
   - Aggiungere funzione `applyPatches(originalCV, patches)` che produce il CV completo
   - Compattare il JSON del CV originale prima di inviarlo (rimuovere campi null/vuoti)
   - Il response al frontend resta identico (contiene `tailored_cv` completo)

2. **Frontend (`src/pages/Nuova.tsx`)**: nessuna modifica. Il contratto API resta lo stesso.

**Impatto stimato**: -40-60% sui token di output di ai-tailor (la chiamata piu' costosa del sistema).

---

## 4. ai-tailor: compattazione input JSON

**Cosa**: prima di inviare il CV all'AI, rimuovere:
- Campi con valore `null`, `undefined`, stringa vuota `""`
- Array vuoti `[]`
- `photo_base64` (inutile per l'analisi, puo' pesare migliaia di token)

**Come**: funzione utility `compactCV(parsed_data)` nella edge function. Il `photo_base64` viene salvato a parte e reinserito nel `tailored_cv` finale dopo le patch.

**Impatto**: -10-20% sui token di input.

---

## Riepilogo modifiche

| File | Azione |
|------|--------|
| `supabase/functions/scrape-job/index.ts` | Cambiare modello a flash-lite + aggiungere lookup/insert cache |
| `supabase/functions/ai-tailor/index.ts` | Patch-based output + compattazione input + apply patches |
| Migrazione DB | Creare tabella `job_cache` |

| Cosa NON cambia |
|------------------|
| Frontend (Nuova.tsx, tipi, componenti) |
| Contratto API (request/response shapes) |
| Precisione dell'analisi |
| parse-cv (gia' ottimale) |

---

## Impatto complessivo stimato

| Ottimizzazione | Risparmio token |
|----------------|----------------|
| scrape-job flash-lite | ~20% costo per chiamata |
| scrape-job cache URL | 100% per URL ripetuti |
| ai-tailor patch output | 40-60% token output |
| ai-tailor compattazione input | 10-20% token input |
| **Totale stimato** | **30-40% riduzione costi** |

