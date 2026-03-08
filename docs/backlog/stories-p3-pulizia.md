# P3 — Pulizia Tecnica (4 stories)

> **Queste stories non cambiano il comportamento visibile dell'app.** Migliorano manutenibilita', type safety e performance.
> **Ogni story e' un prompt autonomo per Lovable.**

---

## Story P3.2 — Rimuovere dipendenze inutilizzate

### Problema

Il `package.json` contiene `zod` che non e' importato in nessun file.

### Cosa fare

Rimuovere `zod` da `package.json`. Verificare che l'app compili.

> **Nota:** `lucide-react`, `recharts` e `next-themes` sono effettivamente usati. NON rimuoverli.

### Criteri di accettazione

- [ ] `zod` rimosso dal `package.json`
- [ ] L'app compila senza errori

---

## Story P3.3 — Rinominare campo photo_base64 in photo_url

### Problema

Il campo `photo_base64` in `ParsedCV` contiene una signed URL, non base64. Il nome e' fuorviante.

### Cosa fare

Rinominare `photo_base64` → `photo_url` in `src/types/cv.ts`, `parse-cv/index.ts`, e tutti i riferimenti frontend. Gestire fallback per dati gia' salvati.

### Criteri di accettazione

- [ ] Il tipo `ParsedCV` usa `photo_url`
- [ ] Tutte le occorrenze aggiornate
- [ ] I CV gia' salvati con `photo_base64` continuano a funzionare (fallback)

---

## Story P3.5 — Policy DELETE su job_cache

### Problema

La tabella `job_cache` non ha policy DELETE. I record si accumulano indefinitamente.

### Cosa fare

Creare migrazione con policy DELETE e funzione `cleanup_expired_job_cache()` che elimina record > 7 giorni.

### Criteri di accettazione

- [ ] Esiste una policy DELETE su `job_cache`
- [ ] Esiste una funzione per pulire i record scaduti

---

## Story P3.7 — Spezzare Home.tsx in componenti

### Problema

`Home.tsx` contiene componenti inline (`StatsBar`, `VirginState`, `RecentApplications`, `SalaryDisplay`, `CVCard`).

### Cosa fare

Estrarre ogni componente in `src/components/dashboard/`. `Home.tsx` resta orchestratore (< 200 righe).

### Criteri di accettazione

- [ ] Componenti in file separati in `src/components/dashboard/`
- [ ] `Home.tsx` ridotto a < 200 righe
- [ ] Nessuna regressione funzionale
