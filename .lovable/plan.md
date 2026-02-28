

# Fix CV Card in Home: rimuovere ridondanze e rendere utile

## Il problema

1. **Nome ripetuto 2 volte**: la sezione "Dati personali" mostra il nome come summary del collapsible ("Dati personali — Mario Rossi") E poi lo ripete dentro il contenuto espanso come testo bold. Inutile.

2. **Non si capisce quale CV e' caricato**: il filename ("CV_Giulia_La_Porta.pdf") non dice nulla sul contenuto. Serve un riassunto rapido del CV: ultimo ruolo, competenze principali, qualcosa che aiuti a riconoscerlo.

## Soluzione

### `src/components/CVSections.tsx` — Fix nome ripetuto

Nella sezione "Dati personali" in modalita' collapsible, il nome appare gia' come `summary` nel trigger. Dentro il contenuto espanso, mostrare solo email, telefono, location — **rimuovere la riga `<p className="font-medium">{data.personal.name}</p>`** che duplica il nome.

### `src/pages/Home.tsx` — CV Card piu' informativa

Sostituire l'header generico "Il tuo CV" + filename con un riassunto significativo:

- **Titolo**: nome completo dal parsed_data (es. "Giulia La Porta") invece di "Il tuo CV"
- **Sotto-titolo**: ultimo ruolo + azienda dall'esperienza piu' recente (es. "Product Manager · Acme Corp"), oppure il filename come fallback se non ci sono dati estratti
- **Rimuovere** la riga del filename raw — non serve piu'

Layout risultante della CV Card:

```text
+------------------------------------------+
| [icon] Giulia La Porta                   |
| Product Manager · Acme Corp              |
+------------------------------------------+
| > Dati personali — Giulia La Porta       |
|   email, telefono, citta'                |
| > Esperienza — 3 posizioni              |
| > Competenze — 12                        |
| ...                                      |
+------------------------------------------+
| [Elimina CV]  [Carica nuovo CV]          |
+------------------------------------------+
```

## Riepilogo modifiche

| File | Cosa cambia |
|------|-------------|
| `src/components/CVSections.tsx` | Rimuovere `<p>{data.personal.name}</p>` dentro la sezione Dati personali (il nome e' gia' nel summary) |
| `src/pages/Home.tsx` | CV Card: titolo = nome dal CV, sottotitolo = ultimo ruolo + azienda, rimuovere filename raw |

Nessuna modifica backend, nessun nuovo file.
