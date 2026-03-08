# Verso Improvements v2 — Specifiche per Lovable

> **Contesto:** questo documento contiene le stories rimanenti che migliorano backend AI e frontend UX di Verso.
>
> **Stories completate e rimosse:** 1 (compact-cv), 2 (ai-fetch), 3 (validate-output), 4 (parse-cv prompt), 7 (severity score), 8 (patch validation), 9 (foto AI).
>
> **Stories rimanenti:** 5 (scrape-job), 6 (language policy parziale), 10-17 (frontend + database).

---

## Story 5 — `scrape-job`: upgrade modello + campi extra + pulizia HTML

### Problema

`scrape-job` usa `google/gemini-2.5-flash-lite`, un modello troppo debole per annunci complessi. Mancano campi utili per il seniority match e l'analisi retributiva: `seniority_level`, `salary_range`, `industry`.

### Cosa fare

**1. Cambiare modello** in `scrape-job/index.ts` (riga 175):

```
// PRIMA
model: "google/gemini-2.5-flash-lite"

// DOPO
model: "google/gemini-2.5-flash"
```

La cache a 7 giorni ammortizza l'aumento di costo.

**2. Aggiungere regola per requisiti impliciti nel system prompt:**

```
## IMPLICIT REQUIREMENTS
Deduce implicit requirements from context when clearly inferable:
- International team / global company / foreign HQ → language requirement (specify which)
- "Travel required" / multiple office locations → willingness to travel
- Startup / fast-paced environment → adaptability, autonomy
- "X+ years" in any form → extract as key requirement with the exact number
Do NOT invent requirements — only extract what is clearly implied by the text.
```

**3. Aggiungere campi allo schema tool** `extract_job_data` (NON aggiungerli ai `required`):

```javascript
seniority_level: {
  type: "string",
  enum: ["internship", "junior", "mid", "senior", "lead", "manager", "director", "executive"],
  description: "Inferred seniority level from job title, requirements, and years of experience mentioned"
},
salary_range: {
  type: "string",
  description: "Salary range if mentioned in the posting (preserve original format and currency)"
},
industry: {
  type: "string",
  description: "Industry or sector (e.g., 'fintech', 'healthcare', 'e-commerce')"
}
```

**4. Migliorare la pulizia HTML** (righe 94-103). Aggiungere rimozione di nav/header/footer:

```javascript
jobText = html
  .replace(/<nav[\s\S]*?<\/nav>/gi, "")
  .replace(/<header[\s\S]*?<\/header>/gi, "")
  .replace(/<footer[\s\S]*?<\/footer>/gi, "")
  .replace(/<script[\s\S]*?<\/script>/gi, "")
  .replace(/<style[\s\S]*?<\/style>/gi, "")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/\s+/g, " ")
  .trim();
```

### Criteri di accettazione

- [ ] Modello cambiato a `google/gemini-2.5-flash`
- [ ] System prompt include regola IMPLICIT REQUIREMENTS
- [ ] Schema include `seniority_level`, `salary_range`, `industry` (opzionali)
- [ ] Pulizia HTML migliorata (rimozione nav/header/footer)

---

## Story 6 — `ai-prescreen` e `ai-tailor`: chiarimento language policy

> **Stato:** Parzialmente completata. ai-prescreen ha già LANGUAGE EXAMPLES. Manca l'aggiunta in ai-tailor (analyze + tailor).

### Problema

La policy linguistica è definita diversamente in ogni funzione. Quando un utente ha un CV in italiano e si candida per un annuncio in inglese, il modello a volte sbaglia lingua (specie con annunci bilingui).

### Cosa fare

**1. Aggiungere esempi espliciti in `ai-prescreen`** (dopo la regola lingua):

```
## LANGUAGE EXAMPLES
- CV in Italian + Job posting in English → ALL output in Italian (dealbreakers, questions, notes)
- CV in English + Job posting in Italian → ALL output in Italian
- CV in German + Job posting in German → ALL output in Italian
The rule is simple: this is an Italian product. Analysis is ALWAYS in Italian. No exceptions.
```

**2. Aggiungere esempi espliciti in `ai-tailor` (analyze):**

```
## LANGUAGE EXAMPLES
- CV in Italian + Job posting in English:
  - score_note: in Italian ("Il candidato ha buone competenze tecniche ma...")
  - suggestions: in Italian ("Aggiungere certificazione AWS")
  - skills labels: in English (preserve job posting keywords for ATS matching)
- CV in English + Job posting in Italian:
  - score_note: in Italian
  - skills labels: in Italian (preserve job posting keywords)
```

**3. Aggiungere esempi espliciti in `ai-tailor` (tailor):**

```
## LANGUAGE EXAMPLES
- Job posting in English → ALL CV content patches in English:
  - summary: "Experienced full-stack developer..."
  - bullets: "Reduced deployment time by 40%..."
  - skills: ["React", "Node.js", "Docker"]
- Job posting in Italian → ALL CV content patches in Italian:
  - summary: "Sviluppatore full-stack con esperienza..."
  - bullets: "Riduzione del 40% dei tempi di deploy..."
- diff reasons and structural_changes reasons → ALWAYS in Italian:
  - "Rimossa esperienza non rilevante per il ruolo"
  - "Riformulato bullet con verbo d'azione e risultato misurabile"
```

### Criteri di accettazione

- [ ] Ogni funzione ha esempi concreti di language policy nel prompt
- [ ] Testato con: CV italiano + annuncio inglese → CV tailored in inglese, analisi in italiano
- [ ] Testato con: CV inglese + annuncio italiano → CV tailored in italiano, analisi in italiano

---

## Story 10 — Database: aggiungere colonna salary_expectations

### Cosa fare

Aggiungere una colonna JSONB nullable alla tabella `profiles`.

**Migration SQL:**

```sql
alter table profiles
  add column salary_expectations jsonb default null;
```

**Struttura del campo:**

```json
{
  "current_salary": 38000,
  "desired_minimum": 42000,
  "currency": "EUR"
}
```

**RLS:** nessuna modifica necessaria. La tabella `profiles` ha già RLS che limita l'accesso al proprio record.

### Criteri di accettazione

- [ ] Colonna `salary_expectations` (JSONB, nullable) aggiunta a `profiles`
- [ ] Nessun breaking change sui flussi esistenti

---

## Story 11 — Onboarding: sezione RAL opzionale

### Cosa fare

Nello step 3 dell'onboarding (preview + edit del CV), aggiungere una sezione in fondo, **dopo** tutte le sezioni del CV e **prima** del pulsante "Continua".

### Layout

Sezione con sfondo `--color-surface` (`#141518`), bordo `--color-border` (`#2A2D35`), border-radius 12px, padding 24px.

```
┌─────────────────────────────────────────────────┐
│  Aspettative economiche (opzionale)             │
│                                                 │
│  Queste info sono private e non appaiono nel CV.│
│  Servono per darti un'analisi più precisa       │
│  sulle posizioni.                               │
│                                                 │
│  RAL attuale o ultima        [€ ________]       │
│  RAL desiderata (minima)     [€ ________]       │
│                                                 │
│  [Salta]                                        │
└─────────────────────────────────────────────────┘
```

### Comportamento

- I due campi sono input numerici, placeholder "es. 35000"
- Suffisso "€/anno" visibile nel campo
- L'utente può compilarne uno, entrambi, o nessuno
- "Salta" chiude la sezione (collassa) e il pulsante "Continua" resta visibile sotto
- Se l'utente compila almeno un campo → al click su "Continua", salva in `profiles.salary_expectations`:
  ```json
  { "current_salary": 38000, "desired_minimum": 42000, "currency": "EUR" }
  ```
- Se l'utente non compila nulla → non salva nulla (il campo resta null)
- La sezione ha un'icona Phosphor `CurrencyEur` (duotone) nel titolo

### Stile

- Titolo: DM Sans 600 16px `--color-text-primary`
- Descrizione: DM Sans 400 13px `--color-text-secondary`
- Label campi: DM Sans 400 14px `--color-text-secondary`
- Input: sfondo `--color-surface-2`, bordo `--color-border`, testo `--color-text-primary`
- Link "Salta": DM Sans 400 13px `--color-text-muted`, underline on hover

### Criteri di accettazione

- [ ] Sezione RAL visibile nello step 3 dell'onboarding, dopo le sezioni CV
- [ ] Campi opzionali — nessun blocco se vuoti
- [ ] Salvataggio in `profiles.salary_expectations` al click "Continua"
- [ ] Se nessun campo compilato → niente salvataggio, il campo resta null

---

## Story 12 — Dashboard: mostrare e modificare RAL

### Cosa fare

Nella CV card della dashboard (`/app/home`), aggiungere una riga sotto le info del CV che mostra la RAL se compilata.

### Comportamento

**Se `profiles.salary_expectations` è compilato:**
- Mostrare una riga: `RAL attuale: €38.000 · Desiderata: €42.000+` con icona Phosphor `CurrencyEur` e icona `PencilSimple` per editare
- Click sull'icona apre un inline edit (stessa meccanica delle skill chips) con i due campi
- Salvataggio immediato al blur o Enter

**Se non compilato:**
- Mostrare: `Aggiungi aspettative RAL` come link cliccabile con icona `CurrencyEur`
- Click apre gli stessi due campi inline

### Stile

- Testo: DM Sans 400 13px `--color-text-secondary`
- Valori RAL: DM Sans 500 13px `--color-text-primary`
- Icona edit: 16px `--color-text-muted`, hover `--color-text-secondary`

### Criteri di accettazione

- [ ] RAL mostrata nella CV card se compilata
- [ ] Edit inline funzionante
- [ ] Aggiunta RAL possibile se non ancora compilata
- [ ] Salvataggio in `profiles.salary_expectations`

---

## Story 13 — Aggiornare lo step indicator a 6 step

### Cosa fare

Lo step indicator in alto nel wizard (`/app/nuova`) attualmente mostra 5 step. Aggiornarlo a 6.

### Step labels

| # | Label |
|---|-------|
| 1 | Annuncio |
| 2 | Analisi |
| 3 | Tailoring |
| 4 | Revisione |
| 5 | Export |
| 6 | Completa |

### Stile (invariato)

- Step completato: dot `#A8FF78` + label DM Sans 400 13px `--color-text-secondary`
- Step attuale: dot `#A8FF78` pulsante + label `--color-text-primary`
- Step futuro: dot `--color-border` + label `--color-text-muted`
- Navigazione back: freccia `ArrowLeft` in alto a sinistra

### Criteri di accettazione

- [ ] 6 dot nello step indicator
- [ ] Labels aggiornate
- [ ] Navigazione back funziona su tutti e 6 gli step

---

## Story 14 — Wizard step 4: trasformare Score in Revisione

### Contesto

Lo step 4 attuale mostra Match Score, ATS Score e Honest Score come numeri/contatori. Con questa story diventa "Revisione": un riepilogo chiaro di cosa è cambiato, con possibilità di vedere il confronto originale vs adattato.

### Prerequisito dati

Il response di `ai-tailor` contiene già un campo `diff[]` con questa struttura:

```json
{
  "section": "experience",
  "index": 0,
  "original": "Ho gestito il team",
  "suggested": "Coordinato team di 3 sviluppatori, riducendo il time-to-market del 25%",
  "reason": "Aggiunto verbo d'azione e risultato misurabile",
  "patch_path": "experience[0].bullets[2]"
}
```

E contiene `structural_changes[]`:

```json
{
  "action": "removed",
  "section": "experience",
  "item": "Cameriere presso Bar Roma (2018)",
  "reason": "Esperienza non rilevante per il ruolo"
}
```

**Oggi questi dati vengono ignorati dal frontend.** Con questa story vengono finalmente mostrati.

### Layout — 3 blocchi

**Blocco 1: Score (compatto, in alto)**

Due barre affiancate (desktop) o stacked (mobile):
```
Match: 74/100  [▓▓▓▓▓▓▓▓▓░]     ATS: 82/100  [▓▓▓▓▓▓▓▓▓▓░]
```
Stesse barre animate di oggi ma più compatte (altezza 8px anziché 12px).

**Blocco 2: Cosa abbiamo cambiato**

Card sfondo `--color-surface`, padding 20px:

```
Cosa abbiamo cambiato

✏️  4 bullet riscritti su 18
🔄  2 esperienze riordinate
✂️  1 esperienza rimossa
📝  Summary riscritto
🏷️  3 skill irrilevanti rimosse

Nessuna informazione inventata.
Date, aziende e titoli invariati. ✓

Confidence: 94%  ✓ Verificato
```

**Come costruire i dati per questo blocco:**

Il frontend ha accesso sia al CV originale (`original_cv` dal response di `ai-tailor`) che al CV tailored (dopo applicazione patches). Calcolare le differenze:

```typescript
// Esperienze
const expOriginal = originalCV.experience?.length || 0;
const expTailored = tailoredCV.experience?.length || 0;
const expRemoved = expOriginal - expTailored;

// Bullet riscritti: contare le entries in diff[] dove section === "experience"
const bulletsRewritten = diff.filter(d => d.section === "experience" && d.original !== d.suggested).length;

// Bullet totali nel CV originale
const bulletsTotal = originalCV.experience?.reduce((sum, exp) => sum + (exp.bullets?.length || 0), 0) || 0;

// Summary riscritto: cercare in diff[] dove section === "summary"
const summaryRewritten = diff.some(d => d.section === "summary");

// Skill rimosse: confrontare arrays
const skillsOriginal = [...(originalCV.skills?.technical || []), ...(originalCV.skills?.soft || []), ...(originalCV.skills?.tools || [])];
const skillsTailored = [...(tailoredCV.skills?.technical || []), ...(tailoredCV.skills?.soft || []), ...(tailoredCV.skills?.tools || [])];
const skillsRemoved = skillsOriginal.filter(s => !skillsTailored.includes(s)).length;

// Sezioni rimosse
const sectionsRemoved = structural_changes.filter(c => c.action === "removed").map(c => c.item);
```

**Confidence score — calcolo frontend:**

```
confidence = 100
  - (expRemoved / expOriginal) * 15
  - (bulletsRewritten / bulletsTotal) * 25
  - (summaryRewritten ? 5 : 0)
  - (skillsRemoved * 2)
  - (sectionsRemoved.length * 5)

// Floor a 0, cap a 100
confidence = Math.max(0, Math.min(100, Math.round(confidence)))
```

Se il calcolo rileva esperienze inventate (presenti nel tailored ma non nell'originale) → `confidence = 0` e mostrare flag "Attenzione: verificare manualmente il CV".

La label "✓ Verificato" appare SEMPRE (è calcolato dal codice, non dall'AI). Rimuovere i contatori dell'honest score generato dall'AI — usare solo quelli calcolati qui.

**Icone Phosphor:** `PencilSimple` (bullet riscritti), `ArrowsClockwise` (riordinate), `Scissors` (rimosse), `TextAlignLeft` (summary), `Tag` (skill).

**Blocco 3: Confronto dettagliato (collassato di default)**

Toggle "Mostra modifiche" che espande una lista di diff:

```
▶ Mostra modifiche (7)

[quando espanso:]

Summary
  - "Sviluppatore con 6 anni di esperienza in ambito web."
  + "Full-stack developer con 6 anni in fintech, specializzato in React e Node.js."
  ↳ Riscritto per il ruolo target

Esperienza — Acme Corp, Bullet 3
  - "Ho gestito il team"
  + "Coordinato team di 3 sviluppatori, riducendo il time-to-market del 25%"
  ↳ Aggiunto verbo d'azione e risultato misurabile

Struttura — Esperienza rimossa
  ✂️ Cameriere presso Bar Roma (2018)
  ↳ Esperienza non rilevante per il ruolo

[... altre diff ...]
```

Stile diff:
- Riga rimossa (`-`): DM Sans 400 13px, sfondo `rgba(255,107,107,0.08)`, testo `#FF6B6B`
- Riga aggiunta (`+`): DM Sans 400 13px, sfondo `rgba(168,255,120,0.08)`, testo `#A8FF78`
- Reason (`↳`): DM Sans 400 12px `--color-text-muted`, italic

Usare il campo `diff[]` dal response di `ai-tailor` per popolare la lista. Per i `structural_changes`, usare `item` e `reason`.

### Criteri di accettazione

- [ ] Score compatti in alto (match + ATS)
- [ ] Blocco "Cosa abbiamo cambiato" con contatori calcolati dal confronto CV originale vs tailored
- [ ] Confidence calcolato dal frontend, non dall'AI
- [ ] Label "✓ Verificato" presente
- [ ] Diff collassata di default, espandibile con toggle
- [ ] Ogni diff mostra originale, suggerito, e reason
- [ ] Structural changes (esperienze rimosse) mostrate nella diff

---

## Story 15 — Wizard step 5: export come step completo

### Contesto

Oggi l'export PDF è lo step 5 del wizard ma ha un layout tipo modale. Con questa story diventa uno step a pieno schermo con preview live del PDF.

### Layout

```
┌──────────────────────────────────────────────────────┐
│  Esporta il tuo CV                                   │
│                                                      │
│  Scegli il template                                  │
│                                                      │
│  ┌────────────┐    ┌────────────┐                   │
│  │  ┌──────┐  │    │  ┌──────┐  │                   │
│  │  │ mini │  │    │  │ mini │  │                   │
│  │  │ prev │  │    │  │ prev │  │                   │
│  │  └──────┘  │    │  └──────┘  │                   │
│  │  Classico  │    │  Minimal   │                   │
│  │   ● sel    │    │   ○        │                   │
│  └────────────┘    └────────────┘                   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │                                              │   │
│  │         [Preview PDF — rendering live        │   │
│  │          del template selezionato con         │   │
│  │          i dati del CV tailored.              │   │
│  │          Aspect ratio A4, max-height 500px,   │   │
│  │          scrollabile se necessario]           │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │          📥  Scarica PDF                     │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ATS Score: 82/100 ✓      Confidence: 94% ✓         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Comportamento

- **Template cards:** due card selezionabili con miniatura del template. Card selezionata: bordo `--color-accent` 2px. Card non selezionata: bordo `--color-border`.
- **Preview PDF:** usare `@react-pdf/renderer` per rendering live del CV tailored con il template selezionato. Container con sfondo bianco, aspect ratio A4 (210:297), max-height 500px, overflow-y scroll, border-radius 8px, box-shadow sottile.
- **Cambio template:** la preview si aggiorna live (ri-rendering).
- **Pulsante "Scarica PDF":** bottone primario full-width, sfondo `--color-accent`, testo `#0C0D10`, DM Sans 600 16px. Icona Phosphor `DownloadSimple` a sinistra.
- **Badge qualità in basso:** ATS Score e Confidence in una riga, stile chip piccoli. Verde se > 70, giallo se 40-70, rosso se < 40.
- **Al click "Scarica PDF":** genera PDF, download, upload su Storage, salva URL in `tailored_cvs.pdf_url`. Dopo il download → abilita il pulsante "Continua →" per andare allo step 6.

### Differenze rispetto ad oggi

- Non è una modale, è uno step full-page del wizard con step indicator in alto
- La preview è un rendering live del PDF, non solo i pannelli score
- I badge ATS/Confidence sono un riassunto compatto, non i pannelli espansi
- Dopo il download il wizard prosegue (step 6), non si chiude

### Criteri di accettazione

- [ ] Step 5 è una pagina completa del wizard (non modale)
- [ ] Template selezionabile con bordo accent
- [ ] Preview PDF live che si aggiorna al cambio template
- [ ] Pulsante "Scarica PDF" primario full-width
- [ ] Badge ATS Score e Confidence in basso
- [ ] Dopo download → pulsante "Continua →" abilitato per step 6
- [ ] Step indicator in alto mostra 6 step

---

## Story 16 — Wizard step 6: Prossimi passi (nuovo)

### Contesto

Oggi il wizard finisce dopo l'export. La candidatura viene salvata con status `draft` e l'utente viene rediretto alla home. Non c'è uno step di chiusura che guida l'utente.

### Layout

```
┌──────────────────────────────────────────────────────┐
│  Candidatura pronta!                                 │
│                                                      │
│  CV adattato per:                                    │
│  Senior Frontend Developer presso Acme Corp          │
│  Match: 74/100                                       │
│                                                      │
│  ────────────────────────────────                    │
│                                                      │
│  Cosa vuoi fare ora?                                 │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  ✅  Ho inviato la candidatura               │   │
│  │      Segna come "Inviata" e traccia          │   │
│  │      lo stato in Candidature                  │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  📋  La invierò dopo                         │   │
│  │      Salva come bozza.                        │   │
│  │      La trovi in Candidature                  │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  ➕  Nuova candidatura                        │   │
│  │      Inizia subito con un altro annuncio      │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Comportamento

- **Titolo:** Syne 700 24px `--color-text-primary`. Icona Phosphor `Target` in accent.
- **Sottotitolo:** ruolo + azienda da `applications` record. Match score con colore (verde/giallo/rosso).
- **3 card azione:** sfondo `--color-surface`, bordo `--color-border`, hover border `--color-accent`, padding 16px, border-radius 12px, cursor pointer. Icone Phosphor: `CheckCircle`, `ClipboardText`, `Plus`.

**Click "Ho inviato la candidatura":**
1. Update `applications` record: `status = 'inviata'`
2. Toast: "Candidatura segnata come inviata"
3. Redirect a `/app/candidature`

**Click "La invierò dopo":**
1. Il record `applications` resta con `status = 'draft'` (già salvato nello step 5)
2. Redirect a `/app/home`

**Click "Nuova candidatura":**
1. Il record `applications` resta con `status = 'draft'`
2. Redirect a `/app/nuova` (nuovo wizard pulito)

### Salvataggio

Il record in `applications` e `tailored_cvs` viene già creato nello step 5 (export). Lo step 6 aggiorna solo lo status se l'utente sceglie "Ho inviato la candidatura".

**Importante:** spostare la creazione dei record da "al click Scarica PDF" a "all'ingresso dello step 5" (o alla fine dello step 4). In questo modo il record esiste già quando l'utente arriva allo step 6, indipendentemente dal fatto che abbia scaricato il PDF o meno.

### Criteri di accettazione

- [ ] Step 6 visibile dopo lo step 5
- [ ] Mostra ruolo, azienda, match score
- [ ] "Ho inviato" → update status a `inviata`, redirect a `/app/candidature`
- [ ] "La invierò dopo" → status resta `draft`, redirect a `/app/home`
- [ ] "Nuova candidatura" → redirect a `/app/nuova`
- [ ] Step indicator mostra 6 step, step 6 evidenziato

---

## Story 17 — Wizard step 2: aggiungere Analisi Retributiva

### Contesto

Lo step 2 del wizard mostra il pre-screening. Con questa story si aggiunge una sezione "Analisi Retributiva" tra il pre-screening e le follow-up questions.

> **Questa story va per ultima** perché dipende dall'aggiornamento della Edge Function `ai-prescreen` (stories 1-9). Se la Edge Function non è ancora aggiornata, la sezione non appare (backward compatible).

### Prerequisito dati

La Edge Function `ai-prescreen` verrà aggiornata per restituire un campo aggiuntivo `salary_analysis` nel response:

```json
{
  "salary_analysis": {
    "candidate_estimate": {
      "min": 35000,
      "max": 42000,
      "source": "user_provided",
      "basis": "Indicata dall'utente"
    },
    "position_estimate": {
      "min": 45000,
      "max": 55000,
      "source": "explicit",
      "basis": "Indicata nell'annuncio: €45-55K"
    },
    "delta": "positive",
    "delta_percentage": "+20-30%",
    "note": "La posizione offre un incremento significativo rispetto alla RAL attuale."
  }
}
```

Valori possibili per `delta`: `"positive"` | `"neutral"` | `"negative"`.
Valori possibili per `source`: `"user_provided"` | `"explicit"` | `"ai_estimated"`.

**Importante:** quando il frontend chiama `ai-prescreen`, deve passare `salary_expectations` dal profilo utente nel body della request (se disponibile):

```json
{
  "job_data": { ... },
  "salary_expectations": { "current_salary": 38000, "desired_minimum": 42000, "currency": "EUR" }
}
```

### Layout

Card con sfondo `--color-surface`, padding 20px, border-radius 12px:

```
┌─────────────────────────────────────────────────┐
│  Analisi Retributiva                            │
│                                                 │
│  La tua RAL          €35-42K   [badge: fonte]   │
│  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░                     │
│                                                 │
│  RAL posizione       €45-55K   [badge: fonte]   │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░                     │
│                                                 │
│  Delta: +20-30% ↑                               │
│  "La posizione offre un incremento              │
│   significativo rispetto alla tua RAL attuale." │
│                                                 │
│  Le stime sono indicative e basate su dati      │
│  di mercato generali.                           │
└─────────────────────────────────────────────────┘
```

### Comportamento

- Le due barre orizzontali usano lo stesso gradiente `--gradient-score` ma con scala relativa (la barra più grande = 100%)
- Badge fonte:
  - `source: "user_provided"` → chip "Da te" sfondo `rgba(168,255,120,0.12)` testo `#A8FF78`
  - `source: "explicit"` → chip "Dall'annuncio" sfondo `rgba(93,187,255,0.12)` testo `#5DBBFF`
  - `source: "ai_estimated"` → chip "Stimata" sfondo `rgba(139,143,168,0.12)` testo `#8B8FA8`
- Colore delta:
  - `positive` → `#A8FF78` con freccia ↑
  - `neutral` → `#FFD166` con freccia →
  - `negative` → `#FF6B6B` con freccia ↓
- Disclaimer: DM Sans 400 12px `--color-text-muted`, icona Phosphor `Info` 14px

### Se `salary_analysis` non è presente nel response

Non mostrare la sezione. Nessun errore, nessun placeholder. Backward compatible.

### Criteri di accettazione

- [ ] Sezione "Analisi Retributiva" visibile nello step 2 se `salary_analysis` è nel response
- [ ] Badge fonte corretto per candidato e posizione
- [ ] Colore delta corretto (verde/giallo/rosso)
- [ ] Disclaimer sempre visibile
- [ ] Se `salary_analysis` assente → sezione nascosta, nessun errore
- [ ] `salary_expectations` dal profilo inviato nella request a `ai-prescreen`

---

## Riepilogo stories e ordine di esecuzione

### Fase 1 — Backend (rimanenti)

| # | Story | Cosa | Effort |
|---|-------|------|--------|
| 5 | `scrape-job` upgrade | Modello flash + campi salary/seniority/industry | Basso |
| 6 | Language policy (parziale) | Esempi concreti in tailor (analyze + tailor) | Basso |

### Fase 2 — Frontend + Database

| # | Story | Cosa | Effort |
|---|-------|------|--------|
| 10 | DB migration | Colonna `salary_expectations` | Basso |
| 11 | Onboarding RAL | Sezione RAL opzionale nello step 3 | Basso |
| 12 | Dashboard RAL | Mostrare/editare RAL nella CV card | Basso |
| 13 | Step indicator | Da 5 a 6 step | Basso |
| 14 | Revisione (step 4) | Honest score calcolato + diff view | Alto |
| 15 | Export (step 5) | Full-page con preview PDF live | Medio |
| 16 | Prossimi passi (step 6) | Nuovo step finale con 3 azioni | Medio |
| 17 | Analisi Retributiva | Sezione salary nello step 2 (dipende da backend) | Medio |

### Ordine di esecuzione

```
FASE 1 (backend):    5 → 6
FASE 2 (frontend):   10 → 11 → 12 → 13 → 14 → 15 → 16 → 17
```

> **Story 17 va per ultima** perché dipende dall'aggiornamento di `ai-prescreen` (fase 2). Tutte le altre stories frontend sono indipendenti dal backend AI.

---

*Verso Improvements v2 — Specifiche Lovable — 2026-03-01*
