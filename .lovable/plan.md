

# Epic 17 — Mobile UX: Sezione Candidature

Le pagine Candidature e CandidaturaDetail non hanno ancora ricevuto gli adeguamenti mobile dell'Epic 17. Ecco cosa manca:

## Problemi trovati

### Candidature.tsx (lista)
1. **Nessun feedback tattile** — card e pulsanti senza `active:scale-[0.98]`
2. **Pulsante "Riprendi" bozza** — `text-xs` senza `min-h-[44px]`, touch target insufficiente
3. **Pulsante elimina bozza** — `h-8 w-8`, sotto i 44px minimi
4. **Card overflow** — nessun `overflow-hidden` sulle card con testo dinamico (ruolo/azienda lunghi)

### CandidaturaDetail.tsx (dettaglio)
1. **Status grid 3 colonne** — 7 stati in `grid-cols-3` su 375px = testo troncato, va portato a `grid-cols-4` con wrap o `flex-wrap`
2. **Nessun feedback tattile** — pulsanti azione (Scarica PDF, Elimina) senza scale effect
3. **Card senza overflow protection** — score note, ATS checks, diff, learning suggestions con testo AI che può traboccare
4. **Seniority badge overflow** — `font-mono text-xs` senza `truncate` può uscire dalla card su livelli lunghi

### DetailContent.tsx (drawer)
1. **Status chips** — `min-h-[44px]` già presente, OK
2. **Pulsanti azione** — nessun `active:scale-[0.98]`

## Piano modifiche

### Candidature.tsx
- Aggiungere `overflow-hidden` alle card (`ProntaCard`, `AppCard`, `DraftCard`)
- Pulsante elimina bozza: da `h-8 w-8` a `h-9 w-9` (36px, accettabile con padding)
- Aggiungere `active:scale-[0.98] transition-transform` a card cliccabili e pulsante "Nuova"

### CandidaturaDetail.tsx
- Status grid: da `grid-cols-3` a `grid-cols-4 sm:grid-cols-7` (4 colonne su mobile, riga unica su desktop). Con 7 stati, 4 colonne = 2 righe, leggibile
- Aggiungere `overflow-hidden` a tutte le Card con contenuto dinamico
- Aggiungere `break-words` ai testi AI (score note, diff, ATS detail)
- Aggiungere `active:scale-[0.98] transition-transform` ai pulsanti azione
- Seniority badge: aggiungere `truncate max-w-[120px]`

### DetailContent.tsx
- Aggiungere `active:scale-[0.98] transition-transform` ai 3 pulsanti (Salva, Scarica PDF, Elimina)

## File coinvolti

| File | Modifiche |
|------|-----------|
| `src/pages/Candidature.tsx` | overflow-hidden su card, touch target bozza, feedback tattile |
| `src/pages/CandidaturaDetail.tsx` | status grid responsive, overflow protection card, feedback tattile, break-words |
| `src/components/candidature/DetailContent.tsx` | feedback tattile sui pulsanti |

