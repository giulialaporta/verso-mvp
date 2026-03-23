
## Obiettivo

Sbloccare davvero il flusso “Nuova candidatura” end-to-end, così da poter partire sia da URL sia da testo incollato senza essere rimandati indietro.

## Causa probabile individuata

Dalla lettura del codice emergono 2 problemi principali:

1. **Le funzioni backend del wizard non sono coerenti sull’autenticazione**
   - `scrape-job` usa già `auth.getUser()` e infatti il fix precedente era lì.
   - **`ai-prescreen` e `ai-tailor` usano ancora `auth.getClaims(token)`**.
   - Il flusso step 0 → step 1 lancia proprio queste due funzioni in parallelo, quindi basta che una fallisca per far “saltare” tutto.

2. **Il frontend gestisce male l’errore del pre-screening**
   - In `src/pages/Nuova.tsx`, se il blocco parallelo fallisce, fa:
     - toast errore
     - `updateStep(0)`
   - Quindi l’utente percepisce: “ho incollato l’annuncio ma torno indietro / non vado avanti”.
   - Inoltre il risultato già estratto nello step annuncio non viene preservato come fallback.

## Piano di implementazione

### 1) Correggere l’autenticazione di tutte le funzioni usate nel wizard
Aggiornerò le edge functions coinvolte nel percorso candidatura per usare lo stesso pattern già corretto:
- `supabase/functions/ai-prescreen/index.ts`
- `supabase/functions/ai-tailor/index.ts`

E farò anche uno sweep di coerenza su:
- `supabase/functions/cv-review/index.ts`

Approccio:
- leggere `Authorization`
- creare il client con quell’header
- validare l’utente con `supabase.auth.getUser()`
- usare `user.id` direttamente

Questo elimina il rischio che il wizard si rompa appena parte il pre-screening o l’analisi.

### 2) Rendere robusto il passaggio Step Annuncio → Step Verifica
In `src/pages/Nuova.tsx` cambierò la logica di `handleAnnuncioConfirm`:

- evitare che un errore in una delle chiamate parallele resetti tutto subito allo step 0
- usare una strategia più resiliente:
  - `ai-prescreen` e `ai-tailor analyze` gestiti separatamente
  - se il pre-screening fallisce, mostrare un errore chiaro ma **non perdere i dati dell’annuncio**
  - se l’analisi match/ATS fallisce, permettere comunque di restare nel flusso e ritentare allo step successivo dove possibile

Obiettivo UX:
- l’utente non deve mai “ripartire da zero” dopo aver già ottenuto l’estrazione dell’annuncio.

### 3) Migliorare i messaggi e il fallback nel primo step
In `src/components/wizard/StepAnnuncio.tsx` prevederò un comportamento più tollerante:

- mantenere la preview dell’annuncio estratto anche se fallisce il passaggio successivo
- distinguere meglio:
  - errore estrazione annuncio
  - errore verifica compatibilità
  - errore analisi AI temporanea
- se il testo è stato incollato manualmente e l’estrazione è valida, il flusso deve poter proseguire senza sembrare “rotto”

### 4) Verificare gli altri colli di bottiglia del wizard
Farò un controllo rapido dei punti successivi del journey per evitare un secondo blocco subito dopo il primo fix:
- salvataggio bozza `applications`
- caricamento CV master
- step tailoring
- export

Non prevedo modifiche database: il problema sembra di orchestrazione frontend + autenticazione backend, non di RLS.

## File da toccare

- `supabase/functions/ai-prescreen/index.ts`
- `supabase/functions/ai-tailor/index.ts`
- `supabase/functions/cv-review/index.ts` (allineamento preventivo)
- `src/pages/Nuova.tsx`
- `src/components/wizard/StepAnnuncio.tsx`

## Verifica end-to-end dopo il fix

Testerò il flusso completo su preview con sessione autenticata:

1. aprire `/app/nuova`
2. provare con **testo incollato**
3. verificare che compaia la card annuncio
4. confermare e controllare che si arrivi allo step verifica senza reset
5. proseguire fino a:
   - pre-screening
   - analisi
   - tailoring
   - export
6. controllare eventuali errori rete/log residui

## Risultato atteso

Dopo il fix:
- l’input annuncio via testo deve funzionare stabilmente
- l’URL, quando riesce a estrarre contenuto, deve avanzare senza rimbalzare indietro
- eventuali errori AI non devono distruggere lo stato del wizard
- il flusso candidatura deve essere finalmente testabile end-to-end
