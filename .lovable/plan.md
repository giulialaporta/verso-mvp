

# Immagine LinkedIn brand-aligned per Verso

## Approccio

Creare una pagina dedicata `/linkedin-card` che renderizza una card 1200x627px (formato ottimale LinkedIn) con il brand system di Verso. L'utente potrà fare screenshot o scaricarla. Questo garantisce allineamento perfetto al brand (colori, font, layout) rispetto a un'immagine generata da AI.

## Contenuto della card

- Sfondo: `--color-bg` (#0C0D10) con griglia sottile e glow radiale verde
- Logo "VERSO" in Syne 800 con la "O" accent-colored
- Claim: "Il tuo CV, alla sua versione migliore." in Syne 700
- Mockup stilizzato: la card score dell'hero (compatibilità 78%, skill pills, barra gradiente)
- Sottotitolo: "AI-powered CV tailoring" in JetBrains Mono, muted
- Angolo basso: "verso-cv.lovable.app" in mono muted

## File

- `src/pages/LinkedInCard.tsx` — pagina con layout fisso 1200x627
- `src/App.tsx` — aggiungere route `/linkedin-card`

La pagina non sarà linkata nella nav, serve solo per generare l'immagine.

