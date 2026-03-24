

# Fix: campi vuoti nel parsing del CV

## Problema

Quando il CV viene parsato, l'AI restituisce campi con stringhe vuote `""`, `null`, o valori placeholder (es. "None", "N/A") per informazioni non presenti nel documento. Questi campi vuoti vengono poi mostrati nell'interfaccia di preview, creando un risultato disordinato. La utility `compactCV` che rimuove questi valori esiste gia' ma viene usata solo nel tailoring e prescreen — non dopo il parsing.

## Intervento

### 1) Applicare `compactCV` al risultato del parsing — server-side

**File:** `supabase/functions/parse-cv/index.ts`

Dopo la validazione del risultato AI (`validateOutput`), applicare `compactCV` al `parsedCV` per rimuovere:
- Stringhe vuote `""`
- Valori `null` / `undefined`
- Placeholder come "None", "N/A", "Non specificato"
- Array vuoti

Questo pulisce i dati PRIMA che arrivino al frontend.

### 2) Rafforzare il prompt per ridurre i campi vuoti alla fonte

**File:** `supabase/functions/parse-cv/index.ts`

Aggiornare la regola NULL HANDLING nel system prompt:
- Istruire esplicitamente l'AI a **omettere completamente** i campi non presenti nel CV invece di restituire stringhe vuote
- Aggiungere: "Do NOT return empty strings. If a field has no value, omit it entirely from the output."

### 3) Nascondere campi vuoti nella preview (non-editable)

**File:** `src/components/CVSections.tsx`

Nella modalita' non-editable (onboarding preview), i campi con valore vuoto o assente non devono essere renderizzati. Verificare che le condizioni di rendering usino il pattern `value && <element>` invece di `value !== undefined`.

## File da modificare

- `supabase/functions/parse-cv/index.ts` — import compactCV + applicazione + prompt update
- `src/components/CVSections.tsx` — nascondere campi vuoti in preview

## Risultato atteso

Il parsing restituisce solo campi effettivamente presenti nel CV. La preview mostra un risultato pulito senza righe vuote o placeholder.

