# Check — AI Engine: Acceptance Criteria

Checklist per verificare le 4 Edge Functions: parse-cv, scrape-job, ai-prescreen, ai-tailor.

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

## E. Sicurezza e resilienza

- [ ] **E1** — Le API key non sono esposte al client (passano dal gateway)
- [ ] **E2** — Tutte le chiamate AI passano solo attraverso edge functions (non dal browser diretto)
- [ ] **E3** — Token JWT scaduto: errore 401 (non errore generico)
- [ ] **E4** — Input malformato (JSON invalido): errore 400 con messaggio
- [ ] **E5** — Timeout dell'AI provider: errore gestito con messaggio comprensibile
- [ ] **E6** — Retry automatico su errori transitori (se implementato)
