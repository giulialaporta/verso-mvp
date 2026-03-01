
# Piano di azione — Verso Improvements v2 + Fix lingua CV

## Panoramica

17 stories dal documento + 1 fix aggiuntivo (coerenza linguistica del CV finale). Totale: 18 interventi, organizzati in 3 fasi sequenziali.

## Fix aggiuntivo -- Coerenza linguistica CV finale

**Problema:** il CV tailored esce con sezioni in lingue diverse (bullets in inglese, summary in italiano, o viceversa). La language policy nel prompt di `ai-tailor` dice "stessa lingua del job posting" ma non lo enforza abbastanza.

**Soluzione:** aggiungere al `SYSTEM_PROMPT_TAILOR` una regola esplicita:

```text
## LANGUAGE CONSISTENCY — ABSOLUTE RULE
The ENTIRE tailored CV content MUST be in ONE single language: the language of the job posting.
This means ALL of the following must be in the SAME language:
- summary
- ALL experience descriptions and bullets (every single one)
- ALL skill labels (technical, soft, tools)
- ALL education descriptions
- ALL certification names (keep original if proper nouns)
- ALL project descriptions

NEVER mix languages within the CV. If the job posting is in English, the ENTIRE CV must be in English.
If the job posting is in Italian, the ENTIRE CV must be in Italian.

Common mistake to AVOID: translating some bullets but leaving others in the original language.
Check EVERY bullet and EVERY section before finalizing.
```

Questo fix viene integrato nella Story 6 (language policy).

---

## Fase 1 -- Moduli shared (Stories 1-3)

### Story 1: `_shared/compact-cv.ts`
- Creare `supabase/functions/_shared/compact-cv.ts` con la versione unificata (filtro placeholder incluso)
- Rimuovere `compactCV` locale da `ai-prescreen/index.ts` (righe 106-129) e `ai-tailor/index.ts` (righe 10-34)
- Aggiungere import condiviso in entrambe

### Story 2: `_shared/ai-fetch.ts`
- Creare `supabase/functions/_shared/ai-fetch.ts` con retry (max 2, backoff 1s/3s), fallback su `google/gemini-2.0-flash`
- Errori 401/402/429 non retried
- Integrare in tutte e 4 le funzioni al posto delle chiamate `fetch` dirette

### Story 3: `_shared/validate-output.ts`
- Creare validatore con regole per ciascuna funzione
- Integrazione non bloccante (log warning, default a 0 per score mancanti)

---

## Fase 2 -- Miglioramenti Edge Functions (Stories 4-9 + fix lingua)

### Story 4: `parse-cv` prompts migliorati
- Aggiungere al system prompt: section mapping multilingua, regola multi-column layout, separazione description/bullets, normalizzazione CEFR, few-shot example, null handling

### Story 5: `scrape-job` upgrade
- Modello da `gemini-2.5-flash-lite` a `gemini-2.5-flash`
- Aggiungere regola IMPLICIT REQUIREMENTS nel prompt
- Aggiungere campi `seniority_level`, `salary_range`, `industry` allo schema (opzionali)
- Migliorare pulizia HTML (rimuovere nav/header/footer)

### Story 6: Language policy + Fix coerenza CV (UNIFICATA)
- Aggiungere esempi concreti di language policy in `ai-prescreen` e `ai-tailor` (analyze + tailor)
- Aggiungere la regola LANGUAGE CONSISTENCY nel prompt tailor per garantire che il CV finale sia tutto in una lingua

### Story 7: Score adjustment con severity
- Aggiungere `severity` (critical/moderate/minor) e `years_to_bridge` allo schema `skills_missing`
- Aggiungere istruzione SKILL GAP SEVERITY nel prompt
- Riscrivere `adjustScore` per usare severity con cap differenziati

### Story 8: Validazione patches
- Riscrivere `applyPatches` con validazione path e bounds check
- Aggiungere change-ratio check (warning se > 60%)
- Restituire `skipped_patches` nella response

### Story 9: Miglioramento estrazione foto
- Delegare rilevamento foto all'AI (has_photo + photo_position nello schema)
- Migliorare euristica binaria (range 5KB-500KB, selezione per dimensione ideale)
- Upload condizionato a conferma AI

---

## Fase 3 -- Frontend + Database (Stories 10-17)

### Story 10: DB migration
- Aggiungere colonna `salary_expectations` (JSONB, nullable) a `profiles`

### Story 11: Onboarding RAL
- Sezione "Aspettative economiche" nello step 3 dell'onboarding
- Due campi numerici (RAL attuale, RAL desiderata), opzionali
- Salvataggio in `profiles.salary_expectations`

### Story 12: Dashboard RAL
- Mostrare RAL nella CV card della dashboard se compilata
- Edit inline per modificarla
- Link per aggiungerla se assente

### Story 13: Step indicator a 6 step
- Aggiornare labels: Annuncio, Analisi, Tailoring, Revisione, Export, Completa
- 6 dot nel wizard

### Story 14: Step 4 diventa "Revisione"
- Blocco 1: Score compatti (match + ATS) con barre 8px
- Blocco 2: "Cosa abbiamo cambiato" con contatori calcolati dal confronto CV originale vs tailored (non dall'AI)
- Confidence calcolato lato frontend con formula deterministica
- Blocco 3: Diff collassata con toggle, mostra originale/suggerito/reason per ogni modifica

### Story 15: Step 5 "Export" full-page
- Template cards selezionabili con miniatura
- Preview PDF live con `@react-pdf/renderer`
- Pulsante "Scarica PDF" primario full-width
- Badge ATS + Confidence compatti in basso

### Story 16: Step 6 "Prossimi passi" (nuovo)
- 3 azioni: "Ho inviato" (status inviata, redirect candidature), "La inviero' dopo" (resta draft, redirect home), "Nuova candidatura" (redirect /app/nuova)

### Story 17: Analisi Retributiva nello step 2
- Sezione condizionale (appare solo se `salary_analysis` presente nella response)
- Barre comparative con badge fonte
- Delta colorato (verde/giallo/rosso)
- Aggiornare `ai-prescreen` per accettare e usare `salary_expectations` dal body

---

## Riepilogo file coinvolti

| File | Azione | Stories |
|------|--------|---------|
| `supabase/functions/_shared/compact-cv.ts` | Nuovo | 1 |
| `supabase/functions/_shared/ai-fetch.ts` | Nuovo | 2 |
| `supabase/functions/_shared/validate-output.ts` | Nuovo | 3 |
| `supabase/functions/parse-cv/index.ts` | Modifica | 2, 3, 4, 9 |
| `supabase/functions/scrape-job/index.ts` | Modifica | 2, 3, 5 |
| `supabase/functions/ai-prescreen/index.ts` | Modifica | 1, 2, 3, 6, 17 |
| `supabase/functions/ai-tailor/index.ts` | Modifica | 1, 2, 3, 6, 7, 8 |
| `src/pages/Onboarding.tsx` | Modifica | 11 |
| `src/pages/Home.tsx` | Modifica | 12 |
| `src/pages/Nuova.tsx` | Modifica | 13, 14, 15, 16, 17 |
| Migration SQL | Nuovo | 10 |

## Ordine di esecuzione

```text
Fase 1:  Story 1 -> 2 -> 3
Fase 2:  Story 4 -> 5 -> 6+fix lingua -> 7 -> 8 -> 9
Fase 3:  Story 10 -> 11 -> 12 -> 13 -> 14 -> 15 -> 16 -> 17
```

Ogni story e' un prompt implementabile singolarmente. Le dipendenze sono rispettate dall'ordine.
