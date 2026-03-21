

# Fix: Bottone DOCX non visibile

## Problema

Il layout a 2 colonne (`grid-cols-2`) mette la card CV Recruiter (con la preview A4 molto alta) a sinistra e la card CV ATS a destra. Su viewport 919px, la preview A4 occupa quasi tutto lo schermo, e la card ATS finisce sotto il fold — l'utente deve scrollare molto per trovarla.

## Soluzione

Riorganizzare il layout dello `StepExport` per mettere i due bottoni di download **in alto, ben visibili**, seguiti dalle preview sotto.

### Nuovo layout

1. **Header** (titolo + subtitle) — invariato
2. **Banner review** — invariato  
3. **Badges** (Match, ATS, Confidence) — invariato
4. **Sezione download** — **NUOVA**: una riga con 2 bottoni affiancati ben evidenti:
   - `Stampa / Salva PDF` (primary)
   - `Scarica DOCX` (outline)
5. **Preview affiancate** — le due card con preview restano sotto, ma senza i bottoni (che sono già sopra)
6. **Template teaser + Skip** — invariati

### File da modificare

- `src/components/wizard/StepExport.tsx`: spostare i bottoni fuori dalle card preview e metterli in una sezione dedicata sopra le preview

### Dettagli

- I bottoni vengono estratti dalle card e posizionati in un `div` con `grid grid-cols-2 gap-3` subito dopo i badges
- Le card preview restano sotto con solo il titolo e l'anteprima (senza bottone)
- Su mobile (`grid-cols-1`) i bottoni si impilano verticalmente
- Questo garantisce che l'utente veda immediatamente entrambe le opzioni di download senza scrollare

