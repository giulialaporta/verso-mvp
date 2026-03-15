# Check — AI Engine: Acceptance Criteria

**Ultimo test:** 2026-03-08 — Code review + DB query (edge functions non testate end-to-end via browser automation)

---

## A. parse-cv

- [x] **A1** — Endpoint `POST /functions/v1/parse-cv` risponde correttamente (verificato: utente ha CV parsato in DB)
- [x] **A2** — Richiede autenticazione (senza token: errore 401) (verificato da code review)
- [x] **A3** — PDF standard: output JSON con tutti i campi (personal, summary, experience, education, skills, certifications, projects, extra) (verificato da DB: parsed_data completo)
- [x] **A4** — Campi mancanti nel CV: restituiti come vuoti/null (non inventati) (verificato da code review: prompt specifica)
- [x] **A5** — Foto presente nel PDF: estratta e caricata su Storage con URL firmato (verificato da DB: photo_url presente)
- [x] **A6** — Foto assente: `photo_url` null, nessun errore (verificato da code review)
- [x] **A7** — Summary assente nel CV: ne viene generato uno automaticamente (verificato da code review: prompt specifica)
- [x] **A8** — Lingua del CV preservata nell'output (verificato da DB: CV in inglese, parsed_data in inglese)
- [x] **A9** — Lingue con livello CEFR quando specificato (verificato da DB: C2, B2, A2)
- [x] **A10** — `raw_text` contiene il testo estratto dal PDF (verificato da schema: campo presente)

---

## B. scrape-job

- [x] **B1** — Endpoint `POST /functions/v1/scrape-job` risponde correttamente (verificato: candidature create con job_description)
- [x] **B2** — Richiede autenticazione (senza token: errore 401) (verificato da code review)
- [ ] **B3** — Input URL valido: restituisce dati strutturati
- [x] **B4** — URL gia' scrappato (< 7 giorni): risposta dalla cache (piu' veloce) (verificato da code review: SHA-256 hash lookup in job_cache)
- [ ] **B5** — Input testo: estrazione dati strutturati senza fetch HTTP
- [ ] **B6** — URL non raggiungibile: errore chiaro
- [x] **B7** — Lingua dell'annuncio preservata nell'output (verificato da code review: prompt specifica)
- [ ] **B8** — Pagina con molto HTML/JS: il testo viene estratto correttamente

---

## C. ai-prescreen

- [x] **C1** — Endpoint `POST /functions/v1/ai-prescreen` risponde correttamente (verificato: candidatura con prescreen_data)
- [x] **C2** — Richiede autenticazione (senza token: errore 401) (verificato da code review)
- [x] **C3** — Output contiene: dealbreakers, requirements_matrix, follow_up_questions, feasibility (verificato da code review)
- [x] **C4** — Dealbreaker con severity `critical` o `significant` (verificato da code review)
- [x] **C5** — Requirements classificati come `mandatory`, `preferred`, `nice_to_have` (verificato da code review)
- [x] **C6** — Follow-up questions: massimo 5 (verificato da code review: prompt specifica max 5)
- [x] **C7** — Feasibility: valore `low`, `medium` o `high` (verificato da code review)
- [x] **C8** — Output in italiano (verificato da code review: prompt specifica)
- [ ] **C9** — CV perfettamente allineato al ruolo: nessun dealbreaker, feasibility `high`
- [ ] **C10** — CV completamente disallineato: dealbreaker presenti, feasibility `low`
- [x] **C11** — Con `salary_expectations` nel body: output include `salary_analysis` (verificato da code review)
- [x] **C12** — Senza `salary_expectations` e senza RAL nell'annuncio: `salary_analysis` assente (verificato da code review)
- [ ] **C13** — `salary_analysis.delta` e' coerente
- [ ] **C14** — `salary_analysis.source` corretto

---

## D. ai-tailor

- [x] **D1** — Endpoint `POST /functions/v1/ai-tailor` risponde correttamente (verificato: candidatura con tailored_cvs)
- [x] **D2** — Richiede autenticazione (verificato da code review)
- [x] **D3** — Output contiene: patches, structural_changes, match_score, ats_score, ats_checks, honest_score, skills_match (verificato da code review + DB schema)
- [x] **D4** — Le patch hanno formato `{ path, value, reason }` (verificato da code review)
- [x] **D5** — match_score e ats_score sono numeri 0-100 (verificato da DB: 87, 85)
- [x] **D6** — ats_checks contiene 7 check con status `pass`, `warning` o `fail` (verificato via screenshot: 7 checks visibili)
- [x] **D7** — honest_score contiene confidence + contatori (verificato da code review)
- [x] **D8** — Le patch non modificano date, nomi aziende, titoli di ruolo (verificato da code review: prompt specifica)
- [x] **D9** — Le patch non inventano esperienze o skill (verificato da code review: prompt specifica)
- [x] **D10** — Non vengono rimosse tutte le esperienze (minimo 2) (verificato da code review: validate-output)
- [x] **D11** — Non vengono rimosse piu' del 50% delle esperienze (verificato da code review: validate-output)
- [x] **D12** — Il CV output e' nella lingua dell'annuncio (verificato da code review)
- [ ] **D13** — Pro gate server-side: utente Free con `free_apps_used >= 1` → 403 `UPGRADE_REQUIRED`
- [ ] **D14** — Utente Pro: nessun blocco, tailoring procede normalmente
- [ ] **D15** — Frontend intercetta 403 e fa redirect a `/upgrade`

---

## E. cv-review

- [x] **E1** — Endpoint `POST /functions/v1/cv-review` risponde correttamente (verificato da code review)
- [x] **E2** — Richiede autenticazione (verificato da code review)
- [x] **E3** — Output contiene `reviewed_cv` con la stessa struttura JSON del CV input (verificato da code review)
- [x] **E4** — Tutti i campi di testo sono nella lingua target (verificato da code review)
- [x] **E5** — I bullet point iniziano con verbi d'azione (verificato da code review: prompt specifica)
- [x] **E6** — Nessun artefatto (prefissi, virgolette, markdown) nel testo (verificato da code review: prompt specifica)
- [x] **E7** — Skill duplicate rimosse (verificato da code review)
- [x] **E8** — Cliche' generici rimossi (verificato da code review)
- [x] **E9** — Max 4-5 bullet per esperienza (verificato da code review)
- [x] **E10** — Formato date uniforme in tutto il CV (verificato da code review)
- [x] **E11** — Dati personali (nome, email, telefono, linkedin) NON modificati (verificato da code review)
- [x] **E12** — Date, nomi aziende, titoli di studio NON modificati (verificato da code review)
- [x] **E13** — Nessuna esperienza inventata o rimossa (verificato da code review)
- [x] **E14** — Se la review fallisce: restituisce il CV originale con `review_failed: true` (verificato da code review)
- [x] **E15** — `photo_base64` preservato dall'originale (verificato da code review)

---

## F. Sicurezza e resilienza

- [x] **F1** — Le API key non sono esposte al client (passano dal gateway) (verificato: usa Lovable AI gateway)
- [x] **F2** — Tutte le chiamate AI passano solo attraverso edge functions (non dal browser diretto) (verificato da code review)
- [x] **F3** — Token JWT scaduto: errore 401 (non errore generico) (verificato da code review)
- [ ] **F4** — Input malformato (JSON invalido): errore 400 con messaggio
- [ ] **F5** — Timeout dell'AI provider: errore gestito con messaggio comprensibile
- [ ] **F6** — Retry automatico su errori transitori (se implementato)
- [x] **F7** — CORS dinamico: tutte le edge functions usano `getCorsHeaders(req)` con whitelist (verificato da code review: cors.ts)
- [x] **F8** — Nessuna edge function usa `Access-Control-Allow-Origin: *` (verificato da code review)

---

## G. delete-account

- [x] **G1** — Endpoint `POST /functions/v1/delete-account` risponde correttamente (verificato da code review)
- [x] **G2** — Richiede autenticazione (verificato da code review)
- [x] **G3** — Non richiede body: usa il Bearer token per identificare l'utente (verificato da code review)
- [x] **G4** — Crea audit log in `consent_logs` con tipo `account_deletion` (verificato da code review)
- [x] **G5** — Anonimizza i `consent_logs` dell'utente (user_id sostituito con UUID anonimo) (verificato da code review)
- [x] **G6** — Cancella file da Storage: `cv-uploads/*` e `cv-exports/*` (verificato da code review)
- [x] **G7** — Cancella record DB in ordine FK: tailored_cvs -> applications -> master_cvs -> profiles (verificato da code review)
- [x] **G8** — Cancella utente auth con service role (verificato da code review)
- [x] **G9** — Output `{ "success": true }` in caso di successo (verificato da code review)
- [x] **G10** — Errore: restituisce JSON con dettaglio dell'errore (verificato da code review)
- [x] **G11** — I consent_logs vengono anonimizzati (non cancellati) per audit trail legale (verificato da code review)

---

## G-bis. cv-formal-review

- [ ] **G-bis.1** — Endpoint `POST /functions/v1/cv-formal-review` risponde correttamente
- [ ] **G-bis.2** — Input: `{ cv, template_id }` — restituisce `{ fixes, revised_cv }`
- [ ] **G-bis.3** — Se nessuna correzione: `fixes` vuoto, `revised_cv` identico all'input
- [ ] **G-bis.4** — Uniforma formato date in tutto il CV
- [ ] **G-bis.5** — Rileva e corregge mix lingue involontario
- [ ] **G-bis.6** — Bullet point uniformi per struttura
- [ ] **G-bis.7** — Se errore: restituisce 500 con messaggio (nessun blocco del flusso)

---

## G-ter. integrity-check (modulo condiviso)

- [ ] **G-ter.1** — Reverte campi immutabili (date, nomi azienda, ruoli, titoli di studio) se modificati
- [ ] **G-ter.2** — Rileva metriche fabbricate nei bullet point
- [ ] **G-ter.3** — Rimuove certificazioni inventate (non presenti nell'originale)
- [ ] **G-ter.4** — Ripristina certificazioni eliminate
- [ ] **G-ter.5** — Restituisce `IntegrityResult` con warnings e conteggi revert
- [ ] **G-ter.6** — Integrato in `ai-tailor` dopo l'applicazione delle patch

---

## H. Configurazione modelli (aggiornata — migrazione AI)

- [ ] **H1** — `parse-cv` usa Anthropic Claude Sonnet 4 come primario
- [ ] **H2** — `scrape-job` usa Google AI Gemini 2.5 Flash come primario
- [ ] **H3** — `ai-prescreen` usa Anthropic Claude Haiku 4.5 come primario
- [ ] **H4** — `ai-tailor` (mode tailor) usa Anthropic Claude Sonnet 4 come primario
- [ ] **H4b** — `ai-tailor` (mode analyze, task `ai-tailor-analyze`) usa Anthropic Claude Haiku 4.5
- [ ] **H5** — `cv-review` usa Anthropic Claude Haiku 4.5 come primario
- [ ] **H5b** — `cv-formal-review` usa Anthropic Claude Haiku 4.5 come primario
- [ ] **H6** — Fallback: Gemini 2.5 Flash per funzioni Anthropic, Lovable Gateway per scrape-job
- [ ] **H7** — Il summary riscritto da ai-tailor e' specifico per il ruolo (non generico)
- [ ] **H8** — I bullet point contengono verbi d'azione e metriche
- [ ] **H9** — Il tempo di risposta di ai-tailor resta sotto i 30 secondi
- [ ] **H10** — Il tempo di risposta di ai-prescreen resta sotto i 20 secondi
- [ ] **H11** — Il tempo di risposta di cv-review resta sotto i 15 secondi

---

## I. Moduli condivisi

- [ ] **I1** — `_shared/ai-provider.ts`: multi-provider routing con retry, fallback e cost logging (sostituisce ai-fetch.ts)
- [ ] **I1b** — `_shared/integrity-check.ts`: validazione post-patch CV tailored vs originale
- [x] **I2** — `_shared/compact-cv.ts`: compattazione CV riduce token senza perdere dati (verificato da code review)
- [x] **I3** — `_shared/validate-output.ts`: validazione output AI rileva JSON malformati (verificato da code review)
- [x] **I4** — `_shared/cors.ts`: CORS dinamico con whitelist origini funziona (verificato da code review)

---

## J. Tabella `ai_usage_logs`

- [ ] **J1** — Tabella `ai_usage_logs` esiste con colonne: task, provider, model, tokens_in, tokens_out, cost_usd, duration_ms, is_fallback
- [ ] **J2** — RLS attiva con policy "No user access" (`USING (false)`)
- [ ] **J3** — Ogni chiamata AI logga una riga (fire-and-forget)
- [ ] **J4** — Il costo calcolato e' coerente con i rate per modello
- [ ] **J5** — Le chiamate fallback sono marcate con `is_fallback = true`
