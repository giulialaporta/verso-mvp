

# Verifica Acceptance Criteria — Riepilogo completo

Ho esaminato tutti e 7 i file di test in `docs/test/` e confrontato ogni criterio con il codice sorgente attuale. Ecco il riepilogo tabellare con i risultati e i fix proposti per i criteri che falliscono.

---

## Legenda

- ✅ PASS — Il codice soddisfa il criterio
- ⚠️ PARZIALE — Funziona ma con limitazioni
- ❌ FAIL — Non implementato o rotto
- 🔍 MANUALE — Richiede test manuale (non verificabile solo da codice)

---

## 1. check-auth.md

| ID | Criterio | Stato | Note / Fix |
|----|----------|-------|------------|
| A1 | Form signup con Nome, Email, Password | ✅ | Presente in Login.tsx |
| A2 | Submit disabilitato se campi vuoti | ✅ | `isFormValid` controlla tutti i campi |
| A3 | Email formato invalido → errore inline | ⚠️ | Usa `type="email"` nativo HTML, non c'è validazione custom inline. **Fix**: aggiungere pattern validation con messaggio italiano |
| A4 | Password corta → errore | ✅ | `minLength={6}` + mapping errore Supabase |
| A5 | Messaggio post-signup | ✅ | `toast.success("Controlla la tua email...")` |
| A6 | Email conferma arriva | 🔍 | Test manuale |
| A7 | Link conferma → login funziona | 🔍 | Test manuale |
| A8 | Login pre-conferma → errore chiaro | ✅ | `mapAuthError` gestisce "email not confirmed" |
| A9 | Email già esistente → errore sicuro | ✅ | "user already registered" mappato a messaggio generico |
| A10 | Riga profiles creata | ✅ | Trigger `handle_new_user` presente |
| A11 | Loading durante submit | ✅ | `submitting` state + disabled |
| B1 | Login corretto → redirect | ✅ | `navigate(fromPath)` |
| B2 | Password sbagliata → errore italiano | ✅ | "Email o password non corretti" |
| B3 | Email non registrata → errore sicuro | ✅ | Stesso messaggio di B2 |
| B4 | Loading su Accedi | ✅ | `submitting` state |
| B5 | Sessione persiste refresh | ✅ | `supabase.auth.getSession()` in AuthContext |
| B6 | Sessione persiste chiusura tab | ✅ | Supabase default localStorage |
| B7 | Utente autenticato su /login → redirect | ✅ | `if (user) return <Navigate to={fromPath}>` |
| B8 | Paste e autofill | ✅ | Input standard HTML |
| C1 | Logout accessibile | ✅ | Sidebar e bottom bar hanno logout |
| C2 | Logout → redirect /login | ✅ | `signOut()` + onAuthStateChange |
| C3 | Back button post-logout → protetto | ✅ | ProtectedRoute controlla user |
| C4 | Visita /app/home post-logout → login | ✅ | ProtectedRoute redirect |
| C5 | Nuovo login post-logout | ✅ | Funzionamento standard |
| D1 | Link "Password dimenticata?" | ✅ | Presente nel form login |
| D2 | Campo email per reset | ✅ | `isForgot` view |
| D3 | Messaggio conferma | ✅ | toast.success |
| D4 | Email non registrata → stesso messaggio | ⚠️ | Supabase di default potrebbe non restituire errore per email inesistente, ma se lo fa, passa per `mapAuthError` che mostra messaggio generico. **OK in pratica** |
| D5–D12 | Flusso reset completo | 🔍 | Test manuale (il codice ResetPassword.tsx è completo) |
| E1 | Pulsante Google | ✅ | Presente (con Apple) |
| E2–E8 | Flusso Google OAuth | 🔍 | Test manuale |
| F1 | /app/* protetto | ✅ | ProtectedRoute |
| F2 | /onboarding protetto | ✅ | ProtectedRoute |
| F3 | Loading durante auth state | ✅ | Spinner in ProtectedRoute e Login |
| F4 | Sessione scaduta → login | ✅ | AuthContext gestisce TOKEN_REFRESHED fallito |
| F5 | Deep link dopo login | ✅ | `location.state.from` salvato e usato |
| G1 | Doppio click prevenuto | ✅ | `disabled={submitting}` |
| G2 | Due tab simultanee | 🔍 | Test manuale |
| G3 | Perdita connessione | ⚠️ | Toast errore generico, ma non c'è gestione specifica offline. **Fix**: aggiungere check `navigator.onLine` |
| G4 | Campo password mascherato | ✅ | `type="password"` |
| G5 | Nessun dato sensibile in console | 🔍 | Test manuale (nessun console.log di password nel codice) |
| G6 | Responsive | ✅ | `max-w-sm` + px-4 |
| G7 | Enter per submit | ✅ | `<form onSubmit>` standard |

---

## 2. check-onboarding.md

| ID | Criterio | Stato | Note / Fix |
|----|----------|-------|------------|
| A1 | Redirect a /onboarding se no CV | ❌ | **Non implementato nel codice!** Non c'è logica in Home.tsx o ProtectedRoute che controlla se l'utente ha un CV e redirige. L'utente vede semplicemente lo stato "Nessun CV" nella dashboard. **Fix**: aggiungere redirect automatico in Home.tsx se no master_cv |
| A2 | Se ha CV → no redirect | ✅ | Dashboard carica normalmente |
| A3 | /onboarding protetto | ✅ | ProtectedRoute wrappa /onboarding |
| B1–B8 | Upload drag & drop, validazioni, file info | ✅ | Tutto implementato in Onboarding.tsx |
| C1–C12 | Parsing AI con skeleton, dati, foto, retry | ✅ | Implementato |
| D1–D6 | Preview + Edit inline | ✅ | CVSections + drawer |
| D7 | Suggerimenti AI | ✅ | CVSuggestions componente |
| D8 | Honesty note | ✅ | "Verso conosce solo quello che hai scritto..." |
| E1–E4 | Salvataggio e redirect | ✅ | handleSave salva in master_cvs e redirect |
| E5 | Sostituzione CV | ✅ | Deattiva CV precedenti prima di inserire |
| F1–F6 | Edge case | 🔍 | Test manuale |

---

## 3. check-nuova-candidatura.md

| ID | Criterio | Stato | Note / Fix |
|----|----------|-------|------------|
| A1–A6 | Job Input URL | ✅ | Scraping, cache, errori gestiti |
| B1–B4 | Job Input Testo | ✅ | Textarea + AI extraction |
| C1–C10 | Pre-screening AI | ✅ | Tutto implementato |
| C11 | salary_expectations → card | ✅ | Fetch da profilo, passa a ai-prescreen |
| C12 | RAL nell'annuncio → card | ✅ | Il prompt AI gestisce entrambi i casi |
| C13 | Card con dati corretti | ✅ | SalaryAnalysisCard con barre, delta, nota |
| C14 | Badge fonte corretto | ✅ | SOURCE_LABELS mappa user_profile/job_posting/estimated |
| C15 | No dati retributivi → no card | ✅ | `{prescreenResult.salary_analysis && <SalaryAnalysisCard>}` |
| D1–D9 | CV Tailoring | ✅ | ai-tailor con mode analyze + tailor |
| E1–E2 | Match/ATS Score animati | ✅ | useAnimatedCounter + gradient bar |
| E3 | 7 check ATS | ✅ | ats_checks con pass/warning/fail |
| E4 | Honest Score | ✅ | computeConfidence frontend |
| E5 | Confidence < 90 → warning | ✅ | Warning sotto i 90 nel StepRevisione |
| F1–F2 | Template selector | ✅ | Classico + Minimal (altri locked) |
| F3 | Preview scores | ✅ | Badge Match/ATS/Confidence |
| F4 | Download PDF | ✅ | react-pdf/renderer → blob → download |
| F5 | Nome file | ✅ | `CV-{Nome}-{Azienda}.pdf` |
| F6 | Upload Storage | ✅ | cv-exports bucket |
| F7 | Record applications | ✅ | Creato come draft, aggiornato |
| F8 | Record tailored_cvs | ✅ | Insert con tutti i campi |
| G1–G7 | Template PDF qualità | 🔍 | Richiede ispezione PDF manuale |
| H1–H5 | Bozze | ✅ | Draft creation + resumption |
| I1–I5 | Edge case | 🔍 | Test manuale |

---

## 4. check-candidature.md

| ID | Criterio | Stato | Note / Fix |
|----|----------|-------|------------|
| A1 | Accessibile da sidebar/tab | ✅ | navItems include /app/candidature |
| A2 | Ordinate per data | ✅ | `.order("created_at", { ascending: false })` |
| A3 | Card con ruolo, azienda, score, status, data | ⚠️ | Match score mostrato, **ATS score mancante nella card**. **Fix**: aggiungere ATS score badge nell'AppCard |
| A4 | Badge colorati | ⚠️ | Solo match score con `text-primary`. **Fix**: aggiungere badge ATS con colore secondary |
| A5 | StatusChip | ✅ | Presente |
| B1 | Draft → chip warning | ❌ | StatusChip per draft usa `bg-muted/40 text-muted-foreground`, non warning. **Fix**: cambiare stile draft in StatusChip a warning |
| B2–B6 | Chip per ogni status | ✅ | STATUS_STYLES copre tutti |
| B7 | Cambio status dal drawer | ✅ | handleStatusSave aggiorna status + updated_at (via trigger) |
| C1 | Bozze in sezione separata | ✅ | Sezione con `border-warning/30` |
| C2 | Pulsante "Riprendi" | ✅ | Navigazione a `/app/nuova?draft=` |
| C3 | Riprendi → dati pre-caricati | ✅ | Draft resumption in Nuova.tsx |
| C4 | Bozze eliminabili | ✅ | AlertDialog + handleDelete |
| C5 | Bozza completata → attive | ✅ | Status cambia da draft |
| D1 | Drawer di dettaglio | ✅ | Drawer con Vaul |
| D2 | Slide-up mobile / slide-right desktop | ❌ | Usa sempre `<Drawer>` (Vaul) che è slide-up su tutte le piattaforme. **Fix**: usare Sheet su desktop, Drawer su mobile |
| D3 | Dropdown status | ✅ | Chip selezionabili (non dropdown ma UI funzionale) |
| D4 | Campo note | ✅ | Textarea in drawer |
| D5 | Note persistono | ✅ | Salvate in applications.notes |
| D6 | Download CV | ✅ | ExportDrawer per PDF |
| D7 | Elimina con conferma | ✅ | AlertDialog |
| E1–E4 | Eliminazione | ✅ | Conferma + delete tailored_cvs + refresh lista |
| F1 | Empty state | ✅ | Messaggio + CTA |
| F2 | Molte candidature | ✅ | Nessun limite visuale |
| F3 | Responsive | ✅ | max-w-xl + px-4 |
| F4 | Refresh → ricarica | ✅ | useEffect fetch |

---

## 5. check-ai-engine.md

| ID | Criterio | Stato | Note / Fix |
|----|----------|-------|------------|
| A1–A10 | parse-cv | ✅ | Implementato con auth, foto, summary auto |
| B1–B8 | scrape-job | ✅ | Auth, cache, testo, URL, errori |
| C1–C10 | ai-prescreen base | ✅ | Auth, output strutturato, italiano |
| C11 | salary_expectations → salary_analysis | ✅ | Appena implementato (Story 17) |
| C12 | No salary → no salary_analysis | ✅ | Prompt e schema opzionale |
| C13 | Delta coerente | ✅ | Definito nel prompt |
| C14 | Source corretto | ✅ | user_profile / job_posting / estimated |
| D1–D12 | ai-tailor | ✅ | Implementato con validazioni onestà |
| E1 | API key non esposte | ✅ | Passano dal gateway Lovable AI |
| E2 | Chiamate AI solo da edge functions | ✅ | Solo supabase.functions.invoke |
| E3 | JWT scaduto → 401 | ✅ | Auth check in tutte le functions |
| E4 | Input malformato | ⚠️ | Errore 500 generico, non 400 specifico. **Fix**: aggiungere validazione body con risposta 400 |
| E5 | Timeout AI | ⚠️ | Errore generico, non timeout-specifico |
| E6 | Retry automatico | ❌ | Non implementato. **Fix**: aggiungere retry in ai-fetch.ts |

---

## 6. check-export-dashboard.md

| ID | Criterio | Stato | Note / Fix |
|----|----------|-------|------------|
| A1–A5 | Export PDF | ✅ | Download, nome file, storage, pdf_url |
| B1–B7 | Template Classico | 🔍 | Test manuale PDF |
| C1–C5 | Template Minimal | 🔍 | Test manuale PDF |
| D1–D6 | Qualità ATS | 🔍 | Test manuale PDF |
| E1 | Saluto con nome | ✅ | Home.tsx usa full_name |
| E2 | Messaggio onboarding | ✅ | Stato "nessun CV" |
| E3 | CTA → /onboarding | ✅ | Pulsante presente |
| E4 | Nessuna stat senza CV | ✅ | Condizionale |
| F1–F5 | Dashboard con CV | ✅ | CV card, azioni, CTA |
| G1–G5 | Dashboard con candidature | ✅ | Stats, candidature recenti |
| H1–H5 | Edge case dashboard | 🔍 | Test manuale |

---

## 7. check-persistenza.md

| ID | Criterio | Stato | Note / Fix |
|----|----------|-------|------------|
| A1–A8 | Persistenza sessione | ✅ | AuthContext gestisce correttamente |
| B1–B8 | Persistenza CV Master | ✅ | master_cvs con insert/deactivate |
| C1–C7 | Persistenza bozze | ✅ | Draft salvato come record applications |
| D1–D5 | Persistenza candidatura completa | ✅ | applications + tailored_cvs |
| E1–E7 | Persistenza status e note | ✅ | update via drawer |
| F1–F3 | Persistenza eliminazione | ✅ | Delete cascade manuale |
| F4 | PDF eliminato da Storage | ❌ | **Il PDF in cv-exports NON viene eliminato** quando si elimina una candidatura. **Fix**: aggiungere `supabase.storage.from("cv-exports").remove()` in handleDelete |
| F5 | Stats aggiornate post-eliminazione | ⚠️ | Dashboard non rifa' fetch automaticamente dopo eliminazione dalla pagina candidature. Aggiornamento solo al navigare. **Accettabile** |
| G1 | RAL nell'onboarding visibile | ⚠️ | La RAL è salvata nel profilo ma **non c'è modo di vederla/modificarla nella dashboard**. **Fix**: aggiungere sezione RAL nella Home |
| G2 | salary_expectations nel DB | ✅ | Salvato in profiles.salary_expectations |
| G3 | salary_expectations → pre-screening | ✅ | Fetch in handleAnnuncioConfirm |
| G4 | Card coerente | ✅ | SalaryAnalysisCard |
| G5 | Modifica → nuovi valori | ❌ | **Non c'è modo di modificare salary_expectations** dopo l'onboarding. **Fix**: aggiungere editor nella dashboard/profilo |
| H1–H4 | Consistenza cross-pagina | ✅ | Funziona via query separate |

---

## Riepilogo Fallimenti e Fix Proposti

| # | Criterio | Severità | Fix proposto |
|---|----------|----------|-------------|
| 1 | **A1 Onboarding** — No redirect automatico a /onboarding | Media | Aggiungere logica in Home.tsx: se no master_cv, redirect a /onboarding |
| 2 | **A3 Candidature** — ATS score mancante nella card | Bassa | Aggiungere `ats_score` badge nell'AppCard |
| 3 | **B1 Candidature** — Draft chip non è warning | Bassa | Cambiare StatusChip draft da muted a warning |
| 4 | **D2 Candidature** — Drawer non slide-right su desktop | Bassa | Usare Sheet su desktop (md:) |
| 5 | **F4 Persistenza** — PDF orfano in Storage | Media | Aggiungere delete da cv-exports in handleDelete |
| 6 | **G1/G5 Persistenza** — salary_expectations non visualizzabile/modificabile | Media | Aggiungere sezione nella Home con editor RAL |
| 7 | **E4 AI Engine** — Input malformato → errore generico | Bassa | Validazione body con risposta 400 |
| 8 | **E6 AI Engine** — No retry automatico | Bassa | Retry con backoff in ai-fetch.ts |
| 9 | **A3 Auth** — Validazione email custom | Bassa | Pattern regex + messaggio italiano |

