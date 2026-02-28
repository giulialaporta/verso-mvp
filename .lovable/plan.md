

# Ottimizzazione versione mobile

## Problemi identificati

Dallo screenshot a 375px emergono 3 problemi:

1. **Nessun padding-top**: il contenuto ("Ciao, Giulia") parte a filo con il bordo superiore dello schermo, senza respiro. Su mobile manca completamente un margine superiore sicuro.

2. **Navbar bottom sproporzionata**: la tab bar occupa `h-16` (64px) ma ha solo 2 tab (Home e Candidature) distribuiti con `justify-around` su tutta la larghezza. Le icone (22px) e il testo sono piccoli rispetto allo spazio. Risultato: troppo spazio vuoto, navbar visivamente "smorta".

3. **Pagina Nuova mancante di padding mobile**: i wrapper `mx-auto max-w-2xl space-y-6` non hanno `px-4` su mobile, quindi il contenuto tocca i bordi.

4. **Filename ancora visibile**: nella CV Card il filename raw ("CV GIulia La Porta_01_2026.pdf") appare sotto il nome, anche quando c'e' il nome parsed. Andrebbe mostrato solo se non ci sono dati di esperienza.

## Modifiche

### `src/components/AppShell.tsx`

**Mobile wrapper**: Aggiungere padding-top sicuro (`pt-6`) al container mobile per dare respiro in alto.

**MobileTabBar**:
- Ridurre altezza da `h-16` a `h-14` (56px) — piu' proporzionata con 2 tab
- Aggiornare `pb-20` del wrapper a `pb-16` di conseguenza
- Aggiungere `px-8` o `justify-center gap-16` per avvicinare i 2 tab e non disperderli su tutta la larghezza
- Aumentare leggermente touch target dei bottoni con padding interno

### `src/pages/Nuova.tsx`

Aggiungere `px-4` ai wrapper di Step1, Step2, Step3 che attualmente usano solo `mx-auto max-w-2xl space-y-6` senza padding laterale.

### `src/pages/Home.tsx` — CV Card subtitle

Il filename appare come fallback ma la condizione lo mostra anche quando non dovrebbe. Il codice attuale funziona correttamente (experience[0] ha priorita'), ma dallo screenshot si vede il filename — probabilmente `experience` e' un array vuoto nel parsed_data. Aggiungere un check: se `parsed_data?.personal?.name` esiste, non mostrare mai il filename raw.

## Riepilogo

| File | Modifica |
|------|----------|
| `src/components/AppShell.tsx` | pt-6 al wrapper mobile, navbar h-14 + tab centrati, pb-16 |
| `src/pages/Nuova.tsx` | px-4 ai 3 step wrapper su mobile |
| `src/pages/Home.tsx` | Nascondere filename raw se il nome parsed esiste |

