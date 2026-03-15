

## Piano rivisto — Agente revisione formale CV

### Cambio di approccio

L'agente lavora sul **contenuto strutturato**, non sul render. Quindi il prompt va riscritto per controllare solo ciò che è verificabile dal JSON. I controlli di layout/impaginazione restano responsabilità del codice dei template (react-pdf / docx-generator).

### Cosa cambia rispetto al piano originale

1. **Niente distinzione pdf/word** — il campo `format` è inutile perché l'agente non vede nessuno dei due formati. Lavora sul JSON pre-render.
2. **Prompt riscritto** — solo controlli testuali/formali verificabili dal JSON strutturato
3. **Modello: Haiku 4.5** invece di Sonnet 4 — è una revisione formale leggera, non serve il modello più potente. Riduce costi e latenza (~2s vs ~8s).
4. **Review automatica** — si attiva in background appena il CV tailored è pronto, non richiede click dell'utente. Quando l'utente arriva allo step Export, la review è già completata (o quasi).
5. **Download non bloccato** — se la review è ancora in corso, l'utente può comunque scaricare. Se è pronta, il CV viene aggiornato con le correzioni prima del download.

### Modifiche tecniche

#### 1. Nuova edge function `cv-formal-review/index.ts`

- Riceve: `{ cv: ParsedCV, template_id: string }`
- Modello: Claude Haiku 4.5 via `ai-provider.ts` (nuovo task `"cv-formal-review"`)
- System prompt focalizzato su:
  - Coerenza formato date (es. "Gen 2020" vs "01/2020" vs "2020")
  - Maiuscole consistenti nei ruoli e aziende
  - Separatore date uniforme ("–" vs "-" vs "—")
  - Lingua unica (no mix IT/EN involontario)
  - Bullet uniformi per lunghezza e struttura
  - Ripetizioni ravvicinate, punteggiatura inconsistente
  - Fluidità: frasi meccaniche → ritocco minimo
- Output via tool calling: `{ fixes: [{ section, field, problem, correction }], revised_cv: { ...same structure } }`
- Se nessun fix: `fixes: []` e `revised_cv` = input

#### 2. Aggiornare `ai-provider.ts`

- Aggiungere `"cv-formal-review"` al type `AiTask` e a `TASK_ROUTING` con Haiku 4.5

#### 3. Aggiornare `supabase/config.toml`

- `[functions.cv-formal-review]` con `verify_jwt = false`

#### 4. Modificare `StepExport.tsx`

- Lanciare la review in background con `useEffect` all'ingresso nello step
- Stato: `reviewStatus: "idle" | "reviewing" | "done"`, `reviewFixes`, `reviewedCv`
- Se la review è completata prima del download → usa `reviewedCv` per PDF/DOCX
- Se l'utente scarica prima che la review finisca → usa il CV originale
- Mostrare i fix in un pannello collapsible sotto i badge (match/ATS/confidence)
- Se `fixes` vuoto → badge "✓ Revisione OK"
- Se fix presenti → badge con conteggio + lista espandibile (sezione → problema → correzione)

### File coinvolti

| File | Modifica |
|------|----------|
| `supabase/functions/cv-formal-review/index.ts` | Nuova edge function |
| `supabase/functions/_shared/ai-provider.ts` | Nuovo task type |
| `supabase/config.toml` | Config funzione |
| `src/components/wizard/StepExport.tsx` | Review in background + UI fix list |

