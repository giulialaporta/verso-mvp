# Pulizia Tecnica (5 stories)

> **Queste stories non cambiano il comportamento visibile dell'app.** Migliorano manutenibilita', type safety, sicurezza e performance.
> **Ogni story e' un prompt autonomo per Lovable.**
>
> Ultimo aggiornamento: 2026-03-15

---

## ~~Story P0.1 — Sicurezza edge functions~~ ✅ IMPLEMENTATO

- `cv-formal-review` eliminata (non esiste più come edge function — sostituita da `normalizeCvText()` client-side)
- `compact-headline` fixata: usa `getCorsHeaders(req)` da `_shared/cors.ts` + autenticazione Bearer token

---

## ~~Story P3.8 — Fix layout DOCX ATS~~ ✅ IMPLEMENTATO

Tab stop rimossi. Layout 2 righe: ruolo bold (riga 1) + azienda · data italic muted (riga 2). Stessa struttura per formazione. Import `TabStopType`/`TabStopPosition` rimossi.

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

## ~~Story P3.5 — Policy DELETE su job_cache~~ ✅ IMPLEMENTATO

Migrazione `20260404150020`: policy DELETE `USING (false)` + funzione `cleanup_expired_job_cache()` che elimina record con `created_at < now() - interval '7 days'`.

---

## Story P3.7 — Spezzare Home.tsx in componenti

### Problema

`Home.tsx` contiene **697 righe** (ridotto da 906) con componenti inline: `HeroSection`, `VirginState`, `RecentApplications`, `CVCard`, `CVHistory`, `useCompactHeadline`.

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
