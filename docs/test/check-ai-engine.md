# Check — AI Engine: Acceptance Criteria

Checklist per verificare le 6 Edge Functions: parse-cv, scrape-job, ai-prescreen, ai-tailor, cv-review, delete-account.

---

## A. parse-cv

- [ ] **A1** — Endpoint `POST /functions/v1/parse-cv` risponde correttamente
- [ ] **A2** — Richiede autenticazione (senza token: errore 401)
- [ ] **A3** — PDF standard: output JSON con tutti i campi (personal, summary, experience, education, skills, certifications, projects, extra)
- [ ] **A4** — Campi mancanti nel CV: restituiti come vuoti/null (non inventati)
- [ ] **A5** — Foto presente nel PDF: estratta e caricata su Storage con URL firmato
- [ ] **A6** — Foto assente: `photo_url` null, nessun errore
- [ ] **A7** — Summary assente nel CV: ne viene generato uno automaticamente
- [ ] **A8** — Lingua del CV preservata nell'output
- [ ] **A9** — Lingue con livello CEFR quando specificato
- [ ] **A10** — `raw_text` contiene il testo estratto dal PDF

---

## B. scrape-job

- [ ] **B1** — Endpoint `POST /functions/v1/scrape-job` risponde correttamente
- [ ] **B2** — Richiede autenticazione (senza token: errore 401)
- [ ] **B3** — Input URL valido: restituisce dati strutturati (company_name, role_title, location, job_type, description, requirements, required_skills, nice_to_have)
- [ ] **B4** — URL gia' scrappato (< 7 giorni): risposta dalla cache (piu' veloce)
- [ ] **B5** — Input testo: estrazione dati strutturati senza fetch HTTP
- [ ] **B6** — URL non raggiungibile: errore chiaro
- [ ] **B7** — Lingua dell'annuncio preservata nell'output
- [ ] **B8** — Pagina con molto HTML/JS: il testo viene estratto correttamente

---

## C. ai-prescreen

- [ ] **C1** — Endpoint `POST /functions/v1/ai-prescreen` risponde correttamente
- [ ] **C2** — Richiede autenticazione (senza token: errore 401)
- [ ] **C3** — Output contiene: dealbreakers, requirements_matrix, follow_up_questions, feasibility
- [ ] **C4** — Dealbreaker con severity `critical` o `significant`
- [ ] **C5** — Requirements classificati come `mandatory`, `preferred`, `nice_to_have`
- [ ] **C6** — Follow-up questions: massimo 5
- [ ] **C7** — Feasibility: valore `low`, `medium` o `high`
- [ ] **C8** — Output in italiano
- [ ] **C9** — CV perfettamente allineato al ruolo: nessun dealbreaker, feasibility `high`
- [ ] **C10** — CV completamente disallineato: dealbreaker presenti, feasibility `low`
- [ ] **C11** — Con `salary_expectations` nel body: output include `salary_analysis`
- [ ] **C12** — Senza `salary_expectations` e senza RAL nell'annuncio: `salary_analysis` assente
- [ ] **C13** — `salary_analysis.delta` e' coerente (positive se candidato chiede meno della posizione)
- [ ] **C14** — `salary_analysis.source` corretto ("user_profile", "job_posting", "estimated")

---

## D. ai-tailor

- [ ] **D1** — Endpoint `POST /functions/v1/ai-tailor` risponde correttamente
- [ ] **D2** — Richiede autenticazione (senza token: errore 401)
- [ ] **D3** — Output contiene: patches, structural_changes, match_score, ats_score, ats_checks, honest_score, skills_match
- [ ] **D4** — Le patch hanno formato `{ path, value, reason }`
- [ ] **D5** — match_score e ats_score sono numeri 0-100
- [ ] **D6** — ats_checks contiene 7 check con status `pass`, `warning` o `fail`
- [ ] **D7** — honest_score contiene confidence + contatori (experiences_added, skills_invented, dates_modified, ecc.)
- [ ] **D8** — Le patch non modificano date, nomi aziende, titoli di ruolo
- [ ] **D9** — Le patch non inventano esperienze o skill
- [ ] **D10** — Non vengono rimosse tutte le esperienze (minimo 2)
- [ ] **D11** — Non vengono rimosse piu' del 50% delle esperienze
- [ ] **D12** — Il CV output e' nella lingua dell'annuncio

---

## E. cv-review

- [ ] **E1** — Endpoint `POST /functions/v1/cv-review` risponde correttamente
- [ ] **E2** — Richiede autenticazione (senza token: errore 401)
- [ ] **E3** — Output contiene `reviewed_cv` con la stessa struttura JSON del CV input
- [ ] **E4** — Tutti i campi di testo sono nella lingua target (`detected_language`)
- [ ] **E5** — I bullet point iniziano con verbi d'azione
- [ ] **E6** — Nessun artefatto (prefissi, virgolette, markdown) nel testo
- [ ] **E7** — Skill duplicate rimosse
- [ ] **E8** — Cliche' generici rimossi (es. "Problem Solving", "Team Working")
- [ ] **E9** — Max 4-5 bullet per esperienza
- [ ] **E10** — Formato date uniforme in tutto il CV
- [ ] **E11** — Dati personali (nome, email, telefono, linkedin) NON modificati
- [ ] **E12** — Date, nomi aziende, titoli di studio NON modificati
- [ ] **E13** — Nessuna esperienza inventata o rimossa
- [ ] **E14** — Se la review fallisce: restituisce il CV originale con `review_failed: true`
- [ ] **E15** — `photo_base64` preservato dall'originale

---

## F. Sicurezza e resilienza

- [ ] **F1** — Le API key non sono esposte al client (passano dal gateway)
- [ ] **F2** — Tutte le chiamate AI passano solo attraverso edge functions (non dal browser diretto)
- [ ] **F3** — Token JWT scaduto: errore 401 (non errore generico)
- [ ] **F4** — Input malformato (JSON invalido): errore 400 con messaggio
- [ ] **F5** — Timeout dell'AI provider: errore gestito con messaggio comprensibile
- [ ] **F6** — Retry automatico su errori transitori (se implementato)
- [ ] **F7** — CORS dinamico: tutte le edge functions usano `getCorsHeaders(req)` con whitelist (verso-cv.lovable.app, localhost:5173, localhost:8080)
- [ ] **F8** — Nessuna edge function usa `Access-Control-Allow-Origin: *`

---

## G. delete-account

- [ ] **G1** — Endpoint `POST /functions/v1/delete-account` risponde correttamente
- [ ] **G2** — Richiede autenticazione (senza token: errore 401)
- [ ] **G3** — Non richiede body: usa il Bearer token per identificare l'utente
- [ ] **G4** — Crea audit log in `consent_logs` con tipo `account_deletion`
- [ ] **G5** — Anonimizza i `consent_logs` dell'utente (user_id sostituito con UUID anonimo)
- [ ] **G6** — Cancella file da Storage: `cv-uploads/*` e `cv-exports/*`
- [ ] **G7** — Cancella record DB in ordine FK: tailored_cvs -> applications -> master_cvs -> profiles
- [ ] **G8** — Cancella utente auth con service role
- [ ] **G9** — Output `{ "success": true }` in caso di successo
- [ ] **G10** — Errore: restituisce JSON con dettaglio dell'errore
- [ ] **G11** — I consent_logs vengono anonimizzati (non cancellati) per audit trail legale

---

## H. Configurazione modelli

- [ ] **H1** — `parse-cv` usa `google/gemini-2.5-flash`
- [ ] **H2** — `scrape-job` usa `google/gemini-2.5-flash`
- [ ] **H3** — `ai-prescreen` usa `google/gemini-2.5-pro`
- [ ] **H4** — `ai-tailor` usa `google/gemini-2.5-pro`
- [ ] **H5** — `cv-review` usa `google/gemini-2.5-flash`
- [ ] **H6** — Il fallback model resta `google/gemini-2.0-flash` per tutti
- [ ] **H7** — Il summary riscritto da ai-tailor e' specifico per il ruolo (non generico)
- [ ] **H8** — I bullet point contengono verbi d'azione e metriche
- [ ] **H9** — Il tempo di risposta di ai-tailor resta sotto i 30 secondi
- [ ] **H10** — Il tempo di risposta di ai-prescreen resta sotto i 20 secondi
- [ ] **H11** — Il tempo di risposta di cv-review resta sotto i 15 secondi

---

## I. Moduli condivisi

- [ ] **I1** — `_shared/ai-fetch.ts`: wrapper per chiamate AI con retry e parsing funziona
- [ ] **I2** — `_shared/compact-cv.ts`: compattazione CV riduce token senza perdere dati
- [ ] **I3** — `_shared/validate-output.ts`: validazione output AI rileva JSON malformati
- [ ] **I4** — `_shared/cors.ts`: CORS dinamico con whitelist origini funziona
