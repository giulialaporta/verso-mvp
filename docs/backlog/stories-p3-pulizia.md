# P3 — Pulizia Tecnica (4 stories)

> **Queste stories non cambiano il comportamento visibile dell'app.** Migliorano manutenibilita', type safety e performance.
> **Ogni story e' un prompt autonomo per Lovable.**

---

## Story P3.2 — Rimuovere dipendenze inutilizzate

### Problema

Il `package.json` contiene dipendenze che non sono usate nel codice, aumentando il bundle size inutilmente.

### Cosa fare

Verificare e rimuovere le dipendenze non importate nel codice. In particolare:

- `zod` — non importato in nessun file

> **Nota:** `lucide-react`, `recharts` e `next-themes` erano nel backlog originale ma risultano effettivamente usati (lucide-react in 19+ file, recharts in ui/chart.tsx, next-themes in ui/sonner.tsx). NON rimuoverli.

### Criteri di accettazione

- [ ] Le dipendenze inutilizzate sono state rimosse dal `package.json`
- [ ] L'app compila senza errori
- [ ] Nessuna regressione funzionale

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

## Story P3.5 — Policy DELETE su job_cache

### Problema

La tabella `job_cache` non ha una policy di DELETE. I record si accumulano indefinitamente. Non c'e' modo di pulire la cache.

### Cosa fare

Creare una migrazione SQL:

```sql
-- Permetti al service role di eliminare cache scadute
CREATE POLICY "Service role can delete expired cache"
ON public.job_cache FOR DELETE
USING (true);

-- Funzione di pulizia chiamabile periodicamente
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

## Story P3.7 — Spezzare Home.tsx in componenti

### Problema

`src/pages/Home.tsx` contiene componenti inline (`StatsBar`, `VirginState`, `RecentApplications`, `SalaryDisplay`, `CVCard`) che andrebbero estratti.

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
