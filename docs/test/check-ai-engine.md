# Check — AI Engine: Acceptance Criteria

Checklist per verificare le 4 Edge Functions: parse-cv, scrape-job, ai-prescreen, ai-tailor.

---

## A. parse-cv

- [ ] **A1** — Endpoint `POST /functions/v1/parse-cv` risponde correttamente
- [ ] **A2** — Richiede autenticazione (senza token: errore 401)
- [ ] **A3** — PDF standard: output JSON con tutti i campi (personal, summary, experience, education, skills, certifications, projects, extra_sections)
- [ ] **A4** — Campi mancanti nel CV: restituiti come `null` (non stringa vuota, non inventati)
- [ ] **A5** — Foto persona nel PDF: AI rileva `has_photo: true`, foto estratta e caricata su Storage con URL firmato
- [ ] **A6** — Foto assente: `has_photo: false`, `photo_url` null, nessun errore
- [ ] **A7** — Logo/icona nel PDF (non foto persona): `has_photo: false` (non confusa con foto)
- [ ] **A8** — Summary assente nel CV: ne viene generato uno automaticamente (2-3 frasi)
- [ ] **A9** — Lingua del CV preservata nell'output (mai tradotta)
- [ ] **A10** — Lingue con livello CEFR + descriptor originale (es. `level: "C1", descriptor: "ottimo"`)
- [ ] **A11** — `raw_text` restituisce `"multimodal"` (input diretto PDF)
- [ ] **A12** — CV multi-colonna: sia colonna principale che sidebar vengono estratte
- [ ] **A13** — Separazione description/bullets: testo narrativo in `description`, punti elenco in `bullets`, mai duplicati
- [ ] **A14** — Sezioni non standard catturate in `extra_sections` (es. Volontariato, Hobby)
- [ ] **A15** — Input `filePath`: il PDF viene scaricato da Storage (non piu' base64 nel body)

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
- [ ] **D3** — Output contiene: patches, structural_changes, match_score, ats_score, ats_checks, honest_score, skills_match, skipped_patches
- [ ] **D4** — Le patch hanno formato `{ path, value, reason }`
- [ ] **D5** — match_score e ats_score sono numeri 0-100
- [ ] **D13** — Patch con path invalido (index out of bounds): skippata senza crash, riportata in `skipped_patches`
- [ ] **D14** — `skills_match.missing` include `severity` (critical/moderate/minor) per ogni skill mancante
- [ ] **D15** — Score adjustment: skill critical mancanti penalizzano piu' di moderate/minor
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
- [ ] **E6** — Retry automatico su errori transitori (max 2 retry, backoff 1s/3s)
- [ ] **E7** — Fallback model: se il modello primario fallisce dopo retry → tentativo con `gemini-2.0-flash`
- [ ] **E8** — Errori 401/402/429: non vengono retried (non-retryable)
- [ ] **E9** — Validazione output AI: campi mancanti loggati come warning (non bloccano la response)

---

## F. Configurazione modelli

- [ ] **F1** — `parse-cv` usa `google/gemini-2.5-flash`
- [ ] **F2** — `scrape-job` usa `google/gemini-2.5-flash`
- [ ] **F3** — `ai-prescreen` usa `google/gemini-2.5-pro`
- [ ] **F4** — `ai-tailor` usa `google/gemini-2.5-pro`
- [ ] **F5** — Il fallback model resta `google/gemini-2.0-flash` per tutti
- [ ] **F6** — Il summary riscritto da ai-tailor e' specifico per il ruolo (non generico)
- [ ] **F7** — I bullet point contengono verbi d'azione e metriche
- [ ] **F8** — Il tempo di risposta di ai-tailor resta sotto i 30 secondi
- [ ] **F9** — Il tempo di risposta di ai-prescreen resta sotto i 20 secondi
