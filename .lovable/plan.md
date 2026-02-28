

# Fix Completo: parse-cv Flessibile + Estrazione Foto + Schema CV Arricchito

## Problema

Il parser attuale ha 3 difetti critici:

1. **Estrazione regex inaffidabile** -- il parsing usa regex sui byte grezzi del PDF, che fallisce su qualsiasi CV non banale (Canva, Word export, LinkedIn, Europass). Il test con il CV di Giulia ha restituito solo un'email.

2. **Schema troppo rigido** -- il tipo `ParsedCV` assume sezioni fisse con nomi specifici. Ma i CV reali hanno sezioni custom ("Volontariato", "Pubblicazioni", "Awards", "Conferenze", "Hobby", "Portfolio"), campi mancanti o extra (data di nascita, voto, lode, CEFR, tools). Tutto cio' che non rientra nello schema viene perso.

3. **Nessuna estrazione immagini** -- se il CV contiene una foto profilo (molto comune in Italia/Europa), questa viene persa. Per ricostruire il CV nell'Epic 5, la foto e' indispensabile.

---

## Soluzione

### Principio: schema "core + extra_sections"

Invece di un tipo monolitico che cerca di prevedere ogni possibile sezione, useremo uno schema con:
- **Campi strutturati per le sezioni universali** (personal, experience, education, skills)
- **Un array `extra_sections`** che cattura QUALSIASI altra sezione del CV (hobby, volontariato, pubblicazioni, awards, conferenze, portfolio, ecc.) senza perderla
- **Un campo `photo_base64`** per la foto profilo estratta dal PDF

### 1. Nuovo tipo `ParsedCV` (src/types/cv.ts)

```typescript
export type ParsedCV = {
  personal: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    date_of_birth?: string;
    linkedin?: string;
    website?: string;
  };
  photo_base64?: string; // foto profilo estratta, data URI o base64

  summary: string; // OBBLIGATORIO: estratto se esplicito, sintetizzato se assente

  experience?: {
    role: string;
    company: string;
    location?: string;
    start?: string;
    end?: string;
    current?: boolean;
    description?: string;  // narrativa
    bullets?: string[];    // punti elenco separati
  }[];

  education?: {
    institution: string;
    degree: string;
    field?: string;
    start?: string;
    end?: string;
    grade?: string;        // "110/110 con lode"
    honors?: string;
    program?: string;      // "Erasmus"
    publication?: string;
  }[];

  skills?: {
    technical?: string[];
    soft?: string[];
    tools?: string[];
    languages?: {
      language: string;
      level?: string;       // "B2"
      descriptor?: string;  // "Upper intermediate"
    }[];
  };

  certifications?: {
    name: string;
    issuer?: string;
    year?: string;
  }[];

  projects?: {
    name: string;
    description?: string;
  }[];

  extra_sections?: {
    title: string;          // nome sezione originale ("Hobby", "Volontariato", ecc.)
    items: string[];        // contenuti come array di stringhe
  }[];
};
```

Il campo `extra_sections` e' la chiave della flessibilita': qualsiasi sezione non standard viene catturata con il suo titolo originale e i suoi contenuti, senza perderla.

### 2. Migrazione DB

Aggiungere 3 colonne a `master_cvs`:
- `raw_text text` -- testo grezzo per debug e re-parsing
- `source text default 'upload'` -- origine del CV
- `photo_url text` -- URL della foto profilo salvata in storage

### 3. Riscrivere `parse-cv` Edge Function

#### 3a. Eliminare regex, usare multimodale
Sostituire completamente le righe 65-101 (regex + fallback) con:
1. Convertire i byte del PDF in base64
2. Inviarli a Gemini 2.5 Flash come input file multimodale
3. Il modello "vede" il PDF e ne estrae TUTTO il contenuto

#### 3b. Estrazione foto profilo
Il prompt AI deve istruire il modello a:
- Identificare se il CV contiene una foto/immagine del candidato
- Se presente, descriverla (il modello non puo' estrarre bytes di immagini embedded)

Per l'estrazione vera della foto, useremo un approccio in due fasi:
1. Il modello AI segnala `has_photo: true` se rileva una foto
2. La Edge Function cerca gli stream immagine nel PDF (marker JPEG `FFD8` / PNG `89504E47`) ed estrae il primo blob immagine trovato
3. La foto viene salvata nel bucket `cv-uploads` come `{userId}/photo_{timestamp}.jpg`
4. L'URL viene restituito come `photo_url` nella risposta

#### 3c. System prompt flessibile
Il prompt deve specificare:
- I campi strutturati (personal, experience, education, skills, certifications, projects)
- Il campo `summary` e' **obbligatorio**: se non c'e' una sezione esplicita, sintetizzare 2-3 frasi
- **Qualsiasi sezione non standard** (Hobby, Volontariato, Pubblicazioni, Awards, Referenze, Conferenze, Portfolio, ecc.) va catturata in `extra_sections` con titolo originale e contenuti
- Separare `description` (narrativa) da `bullets` (punti elenco) nelle esperienze
- Categorizzare skills in 4 gruppi: technical, soft, tools, languages (con livello CEFR)
- Estrarre gradi, lode, pubblicazioni dall'education
- `has_photo: true/false` per segnalare la presenza di una foto

#### 3d. Modello
Usare `google/gemini-2.5-flash` (multimodale stabile, legge PDF nativamente).

#### 3e. Risposta arricchita
La response JSON includera':
```text
{
  parsed_data: { ... nuovo schema completo ... },
  raw_text: "multimodal",
  has_photo: true/false,
  photo_url: "path/to/photo.jpg" // se estratta
}
```

### 4. Aggiornare `ai-tailor` -- Schema tailored_cv

Il `tailored_cv` in output (righe 137-149) usa ancora la vecchia struttura. Deve riflettere il nuovo schema:
- `experience` con `role`, `bullets[]`, `start`/`end`
- `skills` come oggetto con 4 categorie
- `extra_sections` preservate intatte (l'AI non deve toccarle)
- `photo_base64` / `photo_url` passati through senza modifiche

Aggiungere al system prompt:
- Il `tailored_cv` deve contenere TUTTE le sezioni, incluse `extra_sections`
- L'AI puo' modificare SOLO: summary, description/bullets, ordine skills
- L'AI NON puo' modificare: date, nomi, gradi, foto, extra_sections, dati personali

### 5. Aggiornare `CVSections.tsx`

Adattare il rendering ai nuovi campi:
- **Summary**: mostrare sempre, come paragrafo sotto i dati personali
- **Photo**: mostrare foto profilo se presente (thumbnail circolare)
- **Personal**: data di nascita, LinkedIn come link, website
- **Experience**: `role` @ `company` (location), start-end/Current, narrativa + lista bullets
- **Education**: degree in field, institution, year, grade, honors, publication
- **Skills**: 4 gruppi (Tecniche, Trasversali, Strumenti, Lingue con CEFR)
- **Extra sections**: rendering dinamico -- per ogni sezione in `extra_sections`, mostrare titolo e items
- Rimuovere la vecchia sezione `languages` separata

### 6. Aggiornare `Onboarding.tsx`

Nel `handleSave`, aggiungere:
- `raw_text` e `source: "upload"` all'insert in `master_cvs`
- `photo_url` se presente nella risposta del parser
- Salvare la foto nel bucket se arriva come base64

### 7. Aggiornare `Nuova.tsx`

- I riferimenti a `skills` devono passare da `string[]` a `skills.technical/soft/tools/languages`
- Il `renderCV` nello Step 3 deve usare il nuovo schema (role, bullets, skills categorizzate, extra_sections)
- La foto deve apparire nel CV preview

---

## Riepilogo file coinvolti

| File | Modifica |
|------|----------|
| Migrazione DB | +3 colonne su master_cvs (raw_text, source, photo_url) |
| `src/types/cv.ts` | Nuovo schema flessibile con extra_sections e photo |
| `supabase/functions/parse-cv/index.ts` | PDF multimodale + estrazione foto + schema flessibile |
| `supabase/functions/ai-tailor/index.ts` | Schema tailored_cv allineato + preservazione extra_sections |
| `src/components/CVSections.tsx` | Rendering completo (photo, summary, role/bullets, skills 4 gruppi, extra_sections dinamiche) |
| `src/pages/Onboarding.tsx` | Salvataggio raw_text, source, photo_url |
| `src/pages/Nuova.tsx` | Rendering CV con nuovo schema + foto |

## Strategia estrazione foto dal PDF

L'estrazione di immagini embedded in un PDF e' complessa. La strategia proposta:

1. **Ricerca marker JPEG/PNG nei byte del PDF**: cercare le sequenze `FF D8 FF` (JPEG) o `89 50 4E 47` (PNG) nei byte raw
2. **Estrazione del primo blob trovato**: in un CV, la prima (e spesso unica) immagine e' la foto profilo
3. **Salvataggio in storage**: upload nel bucket `cv-uploads` sotto `{userId}/photo_{timestamp}.{ext}`
4. **Fallback**: se l'estrazione fallisce, il campo `photo_url` resta null -- nessun errore bloccante

Questa strategia funziona per la maggior parte dei PDF con immagini non compresse (JPEG inline). Per PDF con immagini in stream Flate/DCT, potrebbe non funzionare, ma copre il caso piu' comune dei CV con foto.

---

## Risultato atteso

Con qualsiasi CV (semplice o complesso), il sistema estrarra':
- Tutti i dati strutturati standard (personal, experience, education, skills, certifications)
- Il summary (estratto o sintetizzato)
- La foto profilo (se presente)
- Tutte le sezioni custom (hobby, volontariato, pubblicazioni, awards, ecc.) senza perderle
- Dati granulari (voti, lode, CEFR, tools, bullets separati dalla narrativa)

Tutto pronto per la ricostruzione PDF nell'Epic 5.

