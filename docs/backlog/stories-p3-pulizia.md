# P3 — Pulizia Tecnica (4 stories)

> **Queste stories non cambiano il comportamento visibile dell'app.** Migliorano manutenibilita', type safety e performance.
> **Ogni story e' un prompt autonomo per Lovable.**
>
> Ultimo aggiornamento: 2026-03-15

---

## Story P3.2 — Rimuovere dipendenze inutilizzate

### Problema

Il `package.json` contiene `zod` (v3.25.76) che non e' importato in nessun file `src/`.

### Cosa fare

Rimuovere `zod` da `package.json`. Verificare che l'app compili.

> **Nota:** `next-themes` e' usato da `src/components/ui/sonner.tsx`. `lucide-react` e `recharts` sono usati. NON rimuoverli.

### Criteri di accettazione

- [ ] `zod` rimosso dal `package.json`
- [ ] L'app compila senza errori

---

## Story P3.3 — Rinominare campo photo_base64 in photo_url

### Problema

Il campo `photo_base64` in `ParsedCV` contiene una signed URL, non base64. Il nome e' fuorviante.

### File coinvolti (7)

- `src/types/cv.ts` — definizione tipo
- `src/components/CVSections.tsx` — rendering foto
- `supabase/functions/parse-cv/index.ts` — estrazione foto
- `supabase/functions/ai-tailor/index.ts` — copia foto nel CV tailored
- `supabase/functions/cv-review/index.ts` — accesso foto
- `supabase/functions/_shared/compact-cv.ts` — compattazione CV

### Cosa fare

Rinominare `photo_base64` → `photo_url` in tutti i file sopra. Gestire fallback per dati gia' salvati in DB (`parsed_data` JSONB potrebbe contenere il vecchio nome).

### Criteri di accettazione

- [ ] Il tipo `ParsedCV` usa `photo_url`
- [ ] Tutti i 6 file aggiornati
- [ ] I CV gia' salvati con `photo_base64` continuano a funzionare (fallback: `data.photo_url ?? data.photo_base64`)

---

## Story P3.5 — Policy DELETE su job_cache

### Problema

La tabella `job_cache` non ha policy DELETE ne' funzione di pulizia. I record scaduti (> 7 giorni) si accumulano indefinitamente.

### Cosa fare

Creare migrazione con:
1. Policy DELETE su `job_cache` (solo service_role, o basata su TTL)
2. Funzione SQL `cleanup_expired_job_cache()` che elimina record con `created_at < now() - interval '7 days'`
3. (Opzionale) Schedule con `pg_cron` per eseguire la pulizia giornalmente

### Criteri di accettazione

- [ ] Esiste una policy DELETE su `job_cache`
- [ ] Esiste una funzione per pulire i record scaduti
- [ ] I record > 7 giorni vengono eliminati

---

## Story P3.7 — Spezzare Home.tsx in componenti

### Problema

`Home.tsx` contiene **906 righe** con almeno 8 componenti inline: `StatsBar`, `VirginState`, `RecentApplications`, `SalaryDisplay`, `CVCard`, `CVHistory`, `PlanCard`, `SalaryAnalysisCard`.

### Cosa fare

Estrarre ogni componente in `src/components/dashboard/`. `Home.tsx` resta orchestratore (< 200 righe).

### Componenti da estrarre

| Componente | Scopo |
|------------|-------|
| `StatsBar` | Barra con 3 statistiche (candidature, score, CV) |
| `VirginState` | Stato iniziale utente senza CV |
| `RecentApplications` | Lista 3 candidature recenti |
| `SalaryDisplay` | Editor inline RAL attuale/desiderata |
| `CVCard` | Card CV master con azioni (download, elimina, riattiva) |
| `CVHistory` | Lista CV archiviati |
| `PlanCard` | Card piano Free/Pro |

### Criteri di accettazione

- [ ] Componenti in file separati in `src/components/dashboard/`
- [ ] `Home.tsx` ridotto a < 200 righe
- [ ] Nessuna regressione funzionale
