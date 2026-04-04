

# Backlog — 6 task in ordine di priorità

## 1. P0.1 — Sicurezza `compact-headline` (CRITICO)

`cv-formal-review` non esiste più come edge function separata (è integrata in `ai-tailor`). Resta solo `compact-headline` da fixare.

**Modifiche in `supabase/functions/compact-headline/index.ts`:**
- Sostituire `corsHeaders` hardcoded con `import { getCorsHeaders } from "../_shared/cors.ts"` e usare `getCorsHeaders(req)` in tutte le response
- Aggiungere verifica Bearer token con `createClient` + `auth.getUser()` → 401 se invalido
- Sanitizzare errori: restituire "Internal server error" invece di `e.message`

Deploy edge function dopo la modifica.

---

## 2. Epic 16.3 + 16.4 — Snellimento consensi

**16.3 — Cookie banner** è già implementato: `CookieBanner.tsx` ha già auto-dismiss 5s + scroll/click, nessun pulsante. Nessuna modifica necessaria.

**16.4 — Art. 9 inline** è già implementato: `Onboarding.tsx` ha già la checkbox inline nello Step 1 (riga 322-336), CTA disabilitata senza checkbox (riga 338), e salvataggio consent inline (righe 142-158). Il modal `SensitiveDataConsent` non è più usato nel wizard.

**Unica modifica:** eliminare `src/components/SensitiveDataConsent.tsx` che non è più importato da nessun componente attivo (solo da `Onboarding.tsx` per la funzione `hasSensitiveDataConsent` — questa va spostata inline o in un hook separato prima di eliminare il file).

---

## 3. Story 21.2 — PDF via servizio esterno

`render-cv/index.ts` esiste già e genera HTML. Manca la conversione HTML→PDF via PDFShift (o equivalente).

**Modifiche:**
- Verificare che il secret `PDFSHIFT_API_KEY` esista (o usare un'alternativa). Se manca, richiedere il secret all'utente.
- In `render-cv/index.ts`: dopo aver generato l'HTML, chiamare PDFShift API per convertire in PDF blob
- Restituire il PDF come `application/pdf` con header `Content-Disposition: attachment`
- Frontend: aggiornare il download per usare il blob restituito dall'edge function invece di `window.print()`

---

## 4. Story P3.8 — Fix layout DOCX

**Modifiche in `src/components/cv-templates/docx-generator.ts`:**
- `roleWithDate()` (riga 126): rimuovere tab stop. Riga 1 = ruolo bold (`spacing: { before: 320, after: 40 }`). La data va nella `companyLine` sottostante.
- `companyLine()` (riga 144): aggiungere la data: `"Azienda · Location · Data"` italic muted, `spacing: { after: 100 }`
- `degreeWithDate()` (riga 155): stessa logica — riga 1 = titolo bold, riga 2 = istituzione · periodo · voto
- Rimuovere import `TabStopType`, `TabStopPosition` se non usati altrove

---

## 5. Story 21.6 — Rimuovere react-pdf e template TSX vecchi

`react-pdf` non è nel `package.json` — già rimosso. Verificare se esistono template TSX residui in `src/components/cv-templates/` da eliminare.

---

## 6. P3.5 — Policy DELETE su `job_cache`

**Migrazione SQL:**
- Policy DELETE: `USING (false)` per bloccare delete client-side (solo service_role)
- Funzione `cleanup_expired_job_cache()` che elimina record con `created_at < now() - interval '7 days'`
- Opzionale: schedule con `pg_cron`

---

## Ordine di implementazione suggerito

1. **P0.1** — compact-headline auth + CORS (critico, 1 file)
2. **P3.8** — DOCX layout fix (1 file)
3. **16.3+16.4** — cleanup SensitiveDataConsent (spostare `hasSensitiveDataConsent`, eliminare componente)
4. **P3.5** — job_cache policy (1 migrazione)
5. **21.6** — verificare se ci sono template residui da eliminare
6. **21.2** — PDF export (richiede setup secret PDFShift, più complesso)

