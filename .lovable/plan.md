

# Miglioramento prompt analisi retributiva

## Contesto

`scrape-job` già estrae `company_name`, `industry` e `seniority_level` dal job posting. Questi dati arrivano in `ai-prescreen` come parte di `job_data`, ma il prompt attuale non istruisce l'AI a usarli per affinare le stime salariali quando la fonte è "estimated".

Inoltre manca `company_size` nell'estrazione — informazione spesso presente negli annunci ("multinazionale", "startup", "PMI", "500+ dipendenti").

## Modifiche

### 1. `scrape-job/index.ts` — Aggiungere `company_size` allo schema di estrazione

Aggiungere un campo opzionale `company_size` nel tool schema:
```
company_size: { type: "string", description: "Company size if detectable (startup, PMI, mid-size, enterprise, or employee count)" }
```

### 2. `ai-prescreen/index.ts` — Arricchire la sezione SALARY ANALYSIS del prompt

Sostituire la sezione `## SALARY ANALYSIS` con istruzioni più precise:

```
## SALARY ANALYSIS
If the user message includes SALARY_EXPECTATIONS or the job posting explicitly mentions a salary range/RAL:
- Produce a "salary_analysis" object in your response

For candidate_estimate:
- Use the provided salary_expectations if available; source = "user_profile"

For position_estimate:
- If the job posting states an explicit salary/RAL range → use it, source = "job_posting"
- Otherwise ESTIMATE using ALL available context, source = "estimated":
  - **Company name**: use your knowledge of the company's typical compensation
  - **Industry/sector**: tech vs manufacturing vs finance have different pay bands
  - **Company size**: startups vs enterprise pay differently; larger companies often offer higher base
  - **Seniority level**: junior/mid/senior/lead/executive dramatically affects range
  - **Location**: adjust for cost of living (Milan vs remote vs smaller cities)
  - **Role type**: IC vs management, niche vs common roles
  - In the "basis" field, explicitly list which factors you used (e.g. "Stima basata su: ruolo Senior in fintech a Milano, azienda mid-size")

Calculate delta, delta_percentage, and note as before.
If NEITHER salary_expectations NOR a salary range in the posting is available, do NOT include salary_analysis.
```

### 3. `ai-prescreen/index.ts` — Arricchire il tool schema `salary_analysis`

Aggiungere `estimation_factors` come campo opzionale nell'oggetto `position_estimate`:
```
estimation_factors: { type: "array", items: { type: "string" }, description: "Factors used for estimation when source is 'estimated' (e.g. 'industry: fintech', 'seniority: senior', 'location: Milano')" }
```

## File da modificare

| File | Modifica |
|------|----------|
| `scrape-job/index.ts` | Aggiungere `company_size` al tool schema (1 riga) |
| `ai-prescreen/index.ts` | Riscrivere sezione SALARY ANALYSIS del prompt + aggiungere `estimation_factors` al tool schema |

Nessuna modifica al frontend — `SalaryAnalysisCard.tsx` può opzionalmente mostrare i fattori in futuro, ma non è necessario ora.

