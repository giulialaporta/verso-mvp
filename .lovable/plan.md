

# Aggiungere 4 nuove sezioni al CV: Pubblicazioni, Volontariato, Premi, Conferenze

## Panoramica

Aggiungere supporto completo per 4 nuove sezioni strutturate nel CV: **Pubblicazioni accademiche**, **Volontariato**, **Premi e riconoscimenti**, **Conferenze e presentazioni**. Ogni sezione deve essere supportata end-to-end: tipo dati, parsing AI, tailoring AI, visualizzazione UI, editing, e generazione DOCX ATS.

## Interventi

### 1) Tipo dati — `src/types/cv.ts`

Aggiungere 4 nuovi campi opzionali a `ParsedCV`:

- `publications?: { title, journal/publisher, year, doi/link, authors? }[]`
- `volunteering?: { role, organization, start?, end?, current?, description? }[]`
- `awards?: { name, issuer?, year?, description? }[]`
- `conferences?: { title, event, year?, role? (speaker/attendee/organizer) }[]`

### 2) Parsing AI — `supabase/functions/parse-cv/index.ts`

- Aggiungere nel **section mapping** del system prompt i titoli di sezione multilingua (es. "Pubblicazioni", "Publications", "Veröffentlichungen", "Volontariato", "Volunteer Work", "Premi", "Awards", ecc.)
- Aggiungere le **4 sezioni allo schema del tool** `extract_cv_data` con i campi strutturati
- Istruire l'AI a estrarre queste sezioni quando presenti, e a NON metterle in `extra_sections`

### 3) Tailoring AI — `supabase/functions/ai-tailor/index.ts`

- Aggiungere le 4 sezioni allo schema del tool di tailoring
- Regola: non rimuovere mai pubblicazioni, premi, volontariato o conferenze dal CV originale (come gia fatto per le certificazioni)

### 4) Visualizzazione UI — `src/components/CVSections.tsx`

Aggiungere 4 nuove `Section` nella preview, con:
- Icone appropriate (Book, HandHeart, Trophy, Microphone da Phosphor)
- Supporto editing con drawer (aggiungere ai tipi di `editingItem`)
- Pulsanti aggiungi/rimuovi/modifica come le sezioni esistenti

### 5) Template DOCX ATS — `src/components/cv-templates/docx-generator.ts`

- Aggiungere header multilingua per le 4 sezioni
- Generare i blocchi DOCX con lo stesso stile delle sezioni esistenti (titolo + metadata)

### 6) Template HTML (render-cv) — `supabase/functions/render-cv/templates/*.html`

- Aggiungere i blocchi `{{#if publications}}...{{/if}}` nei 4 template HTML per i PDF visivi

## File da modificare

| File | Intervento |
|------|-----------|
| `src/types/cv.ts` | 4 nuovi tipi |
| `supabase/functions/parse-cv/index.ts` | Prompt + schema tool |
| `supabase/functions/ai-tailor/index.ts` | Schema tool + regola preservazione |
| `src/components/CVSections.tsx` | 4 sezioni UI + editing drawer |
| `src/components/cv-templates/docx-generator.ts` | 4 sezioni DOCX |
| `supabase/functions/render-cv/templates/classico.html` | Blocchi HTML |
| `supabase/functions/render-cv/templates/minimal.html` | Blocchi HTML |
| `supabase/functions/render-cv/templates/moderno.html` | Blocchi HTML |
| `supabase/functions/render-cv/templates/executive.html` | Blocchi HTML |

## Risultato atteso

Un CV che puo contenere pubblicazioni accademiche, esperienze di volontariato, premi/riconoscimenti e conferenze come sezioni strutturate native — non piu relegate a `extra_sections` con testo libero.

