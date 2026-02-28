

# Aggiungi bottone "Annulla" e timeout al caricamento

## Problema
Quando lo scraping di un URL si blocca (siti come Ashby, Lever, ecc.), l'utente resta bloccato su "Analisi in corso..." senza poter fare nulla. Non c'e' modo di interrompere ne' un timeout automatico.

## Soluzione

### 1. Bottone "Annulla" durante il caricamento (`src/pages/Nuova.tsx`)
- Aggiungere un `AbortController` come ref nel componente `Step1`
- Quando l'utente clicca "Annulla", il controller viene abortito, il loading si ferma e appare un messaggio che suggerisce di usare il tab Testo
- Il bottone "Analizza" durante il loading diventa un bottone "Annulla" rosso

### 2. Timeout automatico di 25 secondi (`src/pages/Nuova.tsx`)
- Wrappare la chiamata `supabase.functions.invoke` con un `AbortController` e un timeout di 25 secondi
- Se scade, mostrare un toast: "Il sito non risponde. Copia il testo dell'annuncio e incollalo nel tab Testo."
- Switchare automaticamente al tab "Testo"

### 3. Timeout sul fetch nell'edge function (`supabase/functions/scrape-job/index.ts`)
- Aggiungere `signal: AbortSignal.timeout(10000)` al `fetch()` dell'URL
- Se il fetch scade, restituire un errore chiaro invece di bloccarsi

### 4. Domini problematici (`src/pages/Nuova.tsx`)
- Estendere `getDomainHint()` per includere `ashbyhq.com`, `lever.co`, `greenhouse.io`

## Comportamento risultante

1. L'utente incolla un URL e clicca "Analizza"
2. Il bottone diventa "Annulla" (rosso, con icona X)
3. Se il sito non risponde entro 25s, o l'utente clicca Annulla:
   - Toast: "Il sito non risponde. Copia il testo dell'annuncio e usa il tab Testo."
   - Tab automaticamente switchato su "Testo"
   - Loading terminato

## File coinvolti

| File | Modifica |
|------|----------|
| `src/pages/Nuova.tsx` | AbortController, bottone Annulla, timeout 25s, domini extra |
| `supabase/functions/scrape-job/index.ts` | `AbortSignal.timeout(10000)` sul fetch URL |

