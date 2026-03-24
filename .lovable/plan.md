

# Piano di rafforzamento globale: CV ATS

## Differenze trovate

### A. Problemi FORMALI (template DOCX)

| # | ATS (Verso) | Atteso | Causa |
|---|---|---|---|
| 1 | Summary in un blocco unico monolitico | Summary in 4 paragrafi separati, arioso | Template non spezza su `\n\n` |
| 2 | "Management Engineering **in** Management Engineering" | "Management Engineering" senza duplicazione | Bug nel DOCX: concatena degree+field anche quando sono uguali |
| 3 | Hobbies come bullet list con trattini | Hobbies come testo inline separato da virgole | Template usa bullets per extra_sections |
| 4 | Lingue su una riga con descriptor tra parentesi: "B2 (Upper intermediate)" | Lingue su righe separate, formato compatto: "B2.2" | Template formatta tutto inline |
| 5 | Certificazioni: mancano "AI Product Builder 2026" e "Public Speaking 2021" | 4 certificazioni presenti | Problema di parsing o tailoring — da investigare |

### B. Problemi di CONTENUTO (AI tailor/prompt)

| # | ATS (Verso) | Atteso |
|---|---|---|
| 1 | Summary generico e buzzwordy: "AI and Automation Manager with over 12 years... Combining a data-driven mindset with AI governance expertise..." | Summary personale, narrativo, in prima persona, strutturato per paragrafi tematici |
| 2 | Description HYPE come muro di testo con tutto mescolato | Sotto-periodi chiari: "From June 2023, as Head of..., I:" + bullets, poi "From January 2021..., I:" + bullets |
| 3 | Bullet generici tipo "Led end-to-end AI initiatives from ideation to production deployment, including..." | Bullet piu' diretti e specifici: "Lead end-to-end delivery of conversational AI (multi-agent chatbots)..." |

### C. Problema di PARSING

| # | Problema |
|---|---|
| 1 | Sotto-periodi nella stessa azienda raggruppati in un'unica entry (gia' trattato con la regola "ruoli multipli", ma il parsing attuale potrebbe non separarli abbastanza bene quando sono sub-roles, non promozioni formali) |
| 2 | Certificazioni potenzialmente perse nel parsing |

## Piano di intervento

### 1) Template DOCX — Summary multi-paragrafo
**File:** `src/components/cv-templates/docx-generator.ts`

Spezzare il summary su `\n\n` e generare un `Paragraph` per ogni blocco, con spacing `after: 160` tra paragrafi.

### 2) Template DOCX — Fix duplicazione degree/field
**File:** `src/components/cv-templates/docx-generator.ts`

Nella sezione Education, evitare la concatenazione `degree in field` quando `field` e' gia' contenuto in `degree` (case-insensitive).

### 3) Template DOCX — Hobbies inline
**File:** `src/components/cv-templates/docx-generator.ts`

Per le extra_sections con titolo contenente "hobby"/"interest"/"hobbies", usare formato inline (virgole) invece di bullets.

### 4) Template DOCX — Lingue su righe separate
**File:** `src/components/cv-templates/docx-generator.ts`

Ogni lingua su una riga separata, formato compatto: "English - B2.2" senza descriptor ridondante.

### 5) AI Tailor — Summary narrativo e multi-paragrafo
**File:** `supabase/functions/ai-tailor/index.ts`

Aggiornare il prompt di tailoring nella sezione Summary:
- Richiedere 3-4 paragrafi brevi separati da `\n\n`
- Primo paragrafo: chi sei + traiettoria professionale
- Secondo: cosa fai oggi (team, mandate)
- Terzo: dove ti posizioni (strategia vs esecuzione)
- Quarto: valori (responsible AI, organizational readiness)
- Vietare liste di buzzword generiche
- Richiedere tono personale in prima persona

### 6) AI Tailor — Regola anti-rimozione certificazioni
**File:** `supabase/functions/ai-tailor/index.ts`

Aggiungere regola inviolabile: "NEVER remove certifications. All certifications from the original CV must appear in the tailored CV."

### 7) Parsing — Rafforzare estrazione certificazioni
**File:** `supabase/functions/parse-cv/index.ts`

Aggiungere nel prompt: "Extract ALL certifications, courses, training programs. Do not skip any. Include year, issuer, and full name."

### 8) Parsing — Sotto-periodi come entry separate
**File:** `supabase/functions/parse-cv/index.ts`

Rafforzare la regola esistente: quando una singola esperienza contiene sotto-periodi temporali espliciti (es. "From June 2023... From January 2021..."), ciascun sotto-periodo deve diventare un'entry separata nell'array experience con il proprio ruolo specifico e le proprie date.

## File da modificare

- `src/components/cv-templates/docx-generator.ts` — fix 1, 2, 3, 4
- `supabase/functions/ai-tailor/index.ts` — fix 5, 6
- `supabase/functions/parse-cv/index.ts` — fix 7, 8

## Risultato atteso

Un CV ATS che assomiglia strutturalmente e qualitativamente a quello "atteso": summary narrativo multi-paragrafo, nessuna duplicazione nei titoli di studio, certificazioni complete, hobbies inline, lingue ordinate, e contenuto piu' autentico e meno buzzwordy.

