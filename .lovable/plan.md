
# Gestione CV: Visualizzazione dati estratti + Elimina e Ricarica

## Cosa faremo
Trasformare la Home page in un hub che mostra i dati estratti dal CV caricato, con la possibilita di eliminarlo e caricarne uno nuovo.

## Modifiche previste

### 1. `src/pages/Home.tsx` — Espansione completa

Quando l'utente ha un CV caricato, la Home mostrera:

- **Card "Il tuo CV"** con i dati estratti dal `parsed_data` (dati personali, esperienza, formazione, competenze, lingue, certificazioni) — riutilizzando lo stesso layout a sezioni gia presente nel preview dell'Onboarding (icone Phosphor + label mono uppercase)
- **Pulsante "Elimina CV"** (variante ghost/destructive) che:
  1. Mostra un dialog di conferma (`AlertDialog`)
  2. Elimina il record da `master_cvs`
  3. Elimina il file dal bucket `cv-uploads` (se `file_url` presente)
  4. Aggiorna lo stato locale per tornare alla vista "Carica il tuo CV"
- **Pulsante "Carica nuovo CV"** che reindirizza a `/onboarding`
- **Card CTA** per nuova candidatura (come adesso)

### 2. Flusso dati

La Home fetchera `master_cvs` con `select("*")` invece di `select("id")` per ottenere `parsed_data`, `file_name` e `file_url`. Il tipo `ParsedCV` sara estratto in un file condiviso `src/types/cv.ts` per evitare duplicazione con Onboarding.

### 3. Struttura UI

```text
+-------------------------------------+
| Ciao, Marco                         |
| Il tuo CV e pronto.                 |
+-------------------------------------+
| [Il tuo CV]                         |
|  Dati personali: Marco Rossi, ...   |
|  Esperienza: 3 posizioni            |
|  Competenze: React, TS, ...         |
|  Formazione: Laurea in...           |
|  Lingue: IT, EN                     |
|                                     |
|  [Elimina CV]  [Carica nuovo CV]    |
+-------------------------------------+
| [Nuova candidatura ->]              |
+-------------------------------------+
```

### 4. Nuovo file `src/types/cv.ts`

Tipo `ParsedCV` condiviso tra `Home.tsx` e `Onboarding.tsx` per evitare duplicazione.

## Dettagli tecnici

- `AlertDialog` di shadcn per conferma eliminazione
- Eliminazione: `supabase.from("master_cvs").delete()` + `supabase.storage.from("cv-uploads").remove()`
- Nessuna modifica al backend o allo schema DB
- Animazioni Framer Motion per transizione tra stato "con CV" e "senza CV"
