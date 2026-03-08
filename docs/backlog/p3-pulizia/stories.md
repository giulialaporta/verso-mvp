# P3 — Pulizia Tecnica (7 stories)

> **Queste stories non cambiano il comportamento visibile dell'app.** Migliorano manutenibilita', type safety e performance.
> **Ogni story e' un prompt autonomo per Lovable.**

---

## Story P3.1 — Rigenerare tipi Supabase

### Problema

I tipi auto-generati in `src/integrations/supabase/types.ts` non sono allineati con lo schema reale del database. Il codice e' pieno di `as any` per aggirare errori TypeScript. Colonne come `is_active`, `raw_text`, `source`, `photo_url`, `salary_expectations`, `user_answers`, `notes` non esistono nei tipi.

### Cosa fare

1. Rigenerare i tipi con `npx supabase gen types typescript --project-id <project-id> > src/integrations/supabase/types.ts`
2. Rimuovere tutti i `as any` nelle operazioni Supabase in:
   - `src/pages/Home.tsx`
   - `src/pages/Onboarding.tsx`
   - `src/pages/Candidature.tsx`
   - `src/pages/Nuova.tsx`
3. Sostituire ogni `as any` con il tipo corretto ora disponibile

### Criteri di accettazione

- [ ] `types.ts` riflette lo schema attuale del database
- [ ] Nessun `as any` rimasto nelle operazioni Supabase
- [ ] L'app compila senza errori TypeScript
- [ ] Nessuna regressione funzionale

---

## Story P3.2 — Rimuovere dipendenze inutilizzate

### Problema

Il `package.json` contiene dipendenze che non sono usate nel codice, aumentando il bundle size inutilmente.

### Cosa fare

Rimuovere le seguenti dipendenze (verificare prima che non siano effettivamente usate cercando gli import nel codice):

- `lucide-react` — l'app usa `@phosphor-icons/react`
- `react-hook-form` + `@hookform/resolvers` — i form usano `useState`
- `zod` — non usato
- `recharts` — non usato in nessun componente
- `next-themes` — l'app e' dark mode only, non usa theme switching
- `date-fns` — le date usano `toLocaleDateString`

Comando: `npm uninstall lucide-react react-hook-form @hookform/resolvers zod recharts next-themes date-fns`

Dopo la rimozione, verificare che l'app compili e funzioni.

### Criteri di accettazione

- [ ] Le dipendenze inutilizzate sono state rimosse dal `package.json`
- [ ] L'app compila senza errori
- [ ] Nessuna regressione funzionale
- [ ] Il bundle size e' ridotto

---

## Story P3.3 — Rinominare campo photo_base64 in photo_url

### Problema

Il campo `photo_base64` in `ParsedCV` (`src/types/cv.ts`) contiene in realta' una signed URL, non una stringa base64. Il nome e' fuorviante.

### Cosa fare

1. In `src/types/cv.ts`: rinominare `photo_base64` in `photo_url`
2. In `supabase/functions/parse-cv/index.ts`: aggiornare il campo nell'output
3. Cercare e sostituire tutte le occorrenze di `photo_base64` nel codice frontend
4. Il campo `photo_url` nella tabella `master_cvs` resta invariato (e' un campo separato)

**Attenzione:** i dati gia' salvati in `parsed_data` JSONB avranno ancora il vecchio nome. Gestire il fallback:

```typescript
const photoUrl = parsedData.photo_url ?? parsedData.photo_base64;
```

### Criteri di accettazione

- [ ] Il tipo `ParsedCV` usa `photo_url` invece di `photo_base64`
- [ ] Tutte le occorrenze nel codice sono aggiornate
- [ ] I CV gia' salvati con `photo_base64` continuano a funzionare (fallback)
- [ ] I nuovi CV salvano il campo come `photo_url`

---

## Story P3.4 — Auth consistente nelle Edge Functions

### Problema

`parse-cv` usa `supabase.auth.getUser()` (verifica server-side del token), le altre funzioni usano metodi diversi. L'approccio dovrebbe essere uniforme.

### Cosa fare

In tutte e 4 le Edge Functions, usare lo stesso pattern di autenticazione:

```typescript
const authHeader = req.headers.get("Authorization");
if (!authHeader) {
  return new Response(
    JSON.stringify({ error: "Token di autenticazione mancante" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: authHeader } },
});

const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  return new Response(
    JSON.stringify({ error: "Non autorizzato" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

### Criteri di accettazione

- [ ] Tutte e 4 le Edge Functions usano `getUser()` per l'autenticazione
- [ ] Token mancante: errore 401 con messaggio chiaro
- [ ] Token invalido/scaduto: errore 401
- [ ] Il flusso dell'app funziona normalmente

---

## Story P3.5 — Policy DELETE su job_cache

### Problema

La tabella `job_cache` non ha una policy di DELETE. I record si accumulano indefinitamente. Non c'e' modo di pulire la cache.

### Cosa fare

Creare una migrazione SQL:

```sql
-- Permetti al service role di eliminare cache scadute
-- (le RLS policies non bloccano il service role, ma e' buona pratica documentare)
CREATE POLICY "Service role can delete expired cache"
ON public.job_cache FOR DELETE
USING (true);

-- Opzionale: creare una funzione di pulizia chiamabile periodicamente
CREATE OR REPLACE FUNCTION cleanup_expired_job_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.job_cache
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Criteri di accettazione

- [ ] Esiste una policy DELETE su `job_cache`
- [ ] Esiste una funzione per pulire i record scaduti
- [ ] La cache continua a funzionare normalmente per i record validi

---

## Story P3.6 — Spezzare Nuova.tsx in componenti

### Problema

`src/pages/Nuova.tsx` e' un monolite di ~1450 righe con 6 componenti step, utility functions e tipi, tutto in un unico file.

### Cosa fare

Creare la cartella `src/components/wizard/` e estrarre:

| File | Contenuto |
|------|-----------|
| `StepAnnuncio.tsx` | Step 1 — Job input (URL/testo) |
| `StepPrescreen.tsx` | Step 2 — Pre-screening AI |
| `StepTailoring.tsx` | Step 3 — CV tailoring |
| `StepAnalisi.tsx` | Step 4 — Score e analisi |
| `StepExport.tsx` | Step 5 — Export PDF |
| `wizard-utils.ts` | Utility: `applyPatchesFrontend`, `ATS_LABELS_IT`, tipi locali |

`Nuova.tsx` resta come orchestratore del wizard: gestisce lo state, gli step, e importa i componenti.

### Criteri di accettazione

- [ ] Ogni step e' un componente separato in `src/components/wizard/`
- [ ] `Nuova.tsx` e' ridotto a < 300 righe (orchestratore)
- [ ] Nessuna regressione funzionale (tutti e 5 gli step funzionano)
- [ ] `ATS_LABELS_IT` e' definito in un solo posto (wizard-utils.ts) e importato dove serve

---

## Story P3.7 — Spezzare Home.tsx in componenti

### Problema

`src/pages/Home.tsx` e' ~770 righe con 5 componenti inline (`StatsBar`, `VirginState`, `RecentApplications`, `SalaryDisplay`, `CVCard`).

### Cosa fare

Creare la cartella `src/components/dashboard/` e estrarre:

| File | Contenuto |
|------|-----------|
| `StatsBar.tsx` | Barra statistiche in alto |
| `VirginState.tsx` | Stato senza CV |
| `RecentApplications.tsx` | Lista candidature recenti |
| `CVCard.tsx` | Card preview CV master |

`Home.tsx` resta come orchestratore: fetch dati, gestisce i 3 stati, importa i componenti.

### Criteri di accettazione

- [ ] Ogni componente e' in un file separato in `src/components/dashboard/`
- [ ] `Home.tsx` e' ridotto a < 200 righe
- [ ] Nessuna regressione funzionale (tutti e 3 gli stati della dashboard funzionano)
