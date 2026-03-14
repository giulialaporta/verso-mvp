

# Integrazione benchmark retributivi reali via Firecrawl

## Cosa cambia

1. **Nuovo file `supabase/functions/_shared/salary-benchmark.ts`** — utility che esegue 2 query Firecrawl Search mirate (es. `"Software Engineer" salary Italy Milano`) e compatta i risultati in contesto testuale per il prompt AI.

2. **`supabase/functions/ai-prescreen/index.ts`** — prima della chiamata AI, invoca `fetchSalaryBenchmarks()`. Se trova dati, li aggiunge come sezione `SALARY_BENCHMARKS` nel messaggio utente. Aggiorna il prompt per istruire l'AI a preferire dati benchmark. Aggiunge `"benchmark"` come source possibile nello schema. Fallback graceful se Firecrawl non è configurato o non restituisce risultati.

3. **`src/components/SalaryAnalysisCard.tsx`** — badge "Da benchmark" (colore verde distinto) quando `source === "benchmark"`. Il disclaimer in fondo cambia testo quando i dati sono da benchmark.

4. **`supabase/functions/ai-prescreen/index.ts` config** — aggiungere `verify_jwt = false` in config.toml (già presente? verifico).

## Dettaglio tecnico

### salary-benchmark.ts
```typescript
export async function fetchSalaryBenchmarks(params: {
  role_title: string;
  company_name?: string;
  location?: string;
  industry?: string;
}): Promise<{ raw_context: string; sources: { url: string; title: string }[] } | null>
```
- Costruisce 2 query: una in italiano (`RAL "{role}" {location} stipendio {company}`) e una in inglese (`"{role}" salary Italy {company}`)
- Chiama Firecrawl Search API direttamente (no edge function intermediaria, è codice server-side)
- Limita a 5 risultati per query, estrae titolo + snippet
- Ritorna null se FIRECRAWL_API_KEY mancante o 0 risultati

### Prompt update
Aggiunge alla sezione SALARY ANALYSIS:
```
- If SALARY_BENCHMARKS data is provided, use it as PRIMARY source for position_estimate. Set source = "benchmark".
- Cross-reference benchmark data with your own knowledge for validation.
- In "basis", cite the benchmark sources used.
```

### Schema update
`position_estimate.source` enum: `["job_posting", "estimated", "benchmark"]`
Nuovo campo opzionale `sources: [{ url, title }]` in salary_analysis

### Frontend
`SalaryAnalysisCard` — aggiunge in SOURCE_LABELS: `benchmark: "Da benchmark"` con colore primary/verde. Disclaimer aggiornato quando source è benchmark.

## File modificati

| File | Tipo |
|------|------|
| `supabase/functions/_shared/salary-benchmark.ts` | Nuovo |
| `supabase/functions/ai-prescreen/index.ts` | Modifica |
| `src/components/SalaryAnalysisCard.tsx` | Modifica |

Zero breaking changes. Se Firecrawl fallisce → fallback al comportamento attuale.

