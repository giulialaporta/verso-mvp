

# Verifica Acceptance Criteria — Audit Completo

Riepilogo di tutti e 7 i file di test confrontati con il codice attuale.

## Legenda
- ✅ PASS — ⚠️ PARZIALE — ❌ FAIL — 🔍 TEST MANUALE

---

## 1. check-auth.md

| ID | Stato | Note |
|----|-------|------|
| A1–A2 | ✅ | Form con nome/email/password, `isFormValid` |
| A3 | ✅ | Pattern regex + `title` italiano (fix precedente) |
| A4–A5 | ✅ | `minLength={6}`, toast post-signup |
| A6–A7 | 🔍 | Test email manuale |
| A8–A9 | ✅ | `mapAuthError` gestisce tutti i casi |
| A10 | ✅ | Trigger `handle_new_user` |
| A11 | ✅ | `disabled={submitting}` |
| B1–B8 | ✅ | Login, errori, sessione, redirect, autofill |
| C1–C5 | ✅ | Logout completo |
| D1–D4 | ✅ | Password reset con messaggio generico |
| D5–D12 | 🔍 | Test email manuale |
| E1 | ✅ | Pulsanti Google + Apple |
| E2–E8 | 🔍 | Test OAuth manuale |
| F1–F5 | ✅ | ProtectedRoute, loading, deep link |
| G1 | ✅ | `disabled={submitting}` |
| G2–G3 | 🔍 | Test manuale |
| G4–G7 | ✅ | Password mascherata, responsive, Enter |

**Nessun fail nel codice.**

---

## 2. check-onboarding.md

| ID | Stato | Note |
|----|-------|------|
| A1 | ✅ | Home.tsx redirige a `/onboarding` se no CV + ha apps (fix precedente). VirginState se no CV + no apps |
| A2–A3 | ✅ | |
| B1–B8 | ✅ | Upload, validazione PDF, 10MB, drag&drop |
| C1–C12 | ✅ | Parsing, foto, summary auto, lingua |
| D1–D8 | ✅ | Preview, edit, suggerimenti, honesty note |
| E1–E5 | ✅ | Salvataggio, sostituzione CV |
| F1–F6 | 🔍 | Edge case manuali |

**Nessun fail.**

---

## 3. check-nuova-candidatura.md

| ID | Stato | Note |
|----|-------|------|
| A1–A6 | ✅ | URL scraping, cache, errori |
| B1–B4 | ✅ | Testo, AI extraction |
| C1–C15 | ✅ | Pre-screening, salary analysis, feasibility |
| D1–D9 | ✅ | Tailoring con validazioni onestà |
| E1–E5 | ✅ | Score animati, ATS checks, honest score |
| F1–F8 | ✅ | Template, PDF, storage, records |
| G1–G7 | 🔍 | Qualità PDF manuale |
| H1–H5 | ✅ | Bozze |
| I1–I5 | 🔍 | Edge case manuali |

**Nessun fail.**

---

## 4. check-candidature.md

| ID | Stato | Note |
|----|-------|------|
| A1–A2 | ✅ | Sidebar, ordine data |
| A3–A4 | ✅ | Match + ATS score con badge colorati (fix precedente) |
| A5 | ✅ | StatusChip |
| B1 | ✅ | Draft usa `warning` (fix precedente) |
| B2–B7 | ✅ | Tutti gli stati, cambio dal drawer |
| C1–C5 | ✅ | Bozze in sezione separata |
| D1 | ✅ | Drawer di dettaglio |
| **D2** | **❌** | **Drawer è sempre slide-up (Vaul). Su desktop dovrebbe essere slide-right (Sheet).** |
| D3–D7 | ✅ | Status selector, note, download, elimina |
| E1–E4 | ✅ | Eliminazione con cascade |
| F1–F4 | ✅ | Empty state, responsive, refresh |

**1 fail: D2 — drawer slide-right su desktop.**

---

## 5. check-ai-engine.md

| ID | Stato | Note |
|----|-------|------|
| A1–A10 | ✅ | parse-cv completo |
| B1–B8 | ✅ | scrape-job completo |
| C1–C14 | ✅ | ai-prescreen completo con salary |
| D1–D12 | ✅ | ai-tailor con validazioni |
| E1–E3 | ✅ | Sicurezza, gateway, JWT |
| E4 | ✅ | Body validation con 400 (presente in ai-prescreen e ai-tailor) |
| E5 | ⚠️ | Errore generico per timeout, non specifico |
| E6 | ✅ | Retry con backoff in ai-fetch.ts |
| F1 | ✅ | parse-cv → `gemini-2.5-flash` |
| F2 | ✅ | scrape-job → `gemini-2.5-flash` |
| F3 | ✅ | ai-prescreen → `gemini-2.5-pro` |
| F4 | ✅ | ai-tailor → `gemini-2.5-pro` |
| F5 | ✅ | Fallback → `gemini-2.0-flash` |
| F6–F9 | 🔍 | Qualità output e tempi: test manuale |

**Nessun fail critico.** E5 parziale ma non bloccante.

---

## 6. check-export-dashboard.md

| ID | Stato | Note |
|----|-------|------|
| A1–A5 | ✅ | Export PDF, storage path privato |
| B1–B7 | 🔍 | Template Classico: test PDF manuale |
| C1–C5 | 🔍 | Template Minimal: test PDF manuale |
| D1–D6 | 🔍 | Qualità ATS: test PDF manuale |
| E1–E4 | ✅ | Dashboard stato 1 (VirginState) |
| F1–F5 | ✅ | Dashboard stato 2 (CV, no apps) |
| G1–G5 | ✅ | Dashboard stato 3 (CV + apps), ATS score nelle recent |
| H1–H5 | 🔍 | Edge case manuali |

**Nessun fail.**

---

## 7. check-persistenza.md

| ID | Stato | Note |
|----|-------|------|
| A1–A8 | ✅ | Sessione |
| B1–B8 | ✅ | CV Master |
| C1–C7 | ✅ | Bozze |
| D1–D5 | ✅ | Candidatura completa |
| E1–E7 | ✅ | Status e note |
| F1–F3 | ✅ | Eliminazione cascade |
| F4 | ✅ | PDF eliminato da Storage (fix precedente) |
| F5 | ⚠️ | Stats si aggiornano solo navigando, non in tempo reale |
| G1–G2 | ✅ | Salary visibile e nel DB |
| G3–G4 | ✅ | Salary usata nel pre-screening |
| G5 | ✅ | Editor RAL nella dashboard (fix precedente) |
| H1–H4 | ✅ | Consistenza cross-pagina |

**Nessun fail.**

---

## Riepilogo Finale

| Checklist | Pass | Parziale | Fail | Manuale |
|-----------|------|----------|------|---------|
| Auth | 33 | 0 | 0 | 12 |
| Onboarding | 24 | 0 | 0 | 6 |
| Nuova Candidatura | 38 | 0 | 0 | 12 |
| Candidature | 22 | 0 | **1** | 0 |
| AI Engine | 25 | 1 | 0 | 4 |
| Export + Dashboard | 15 | 0 | 0 | 16 |
| Persistenza | 29 | 1 | 0 | 0 |
| **Totale** | **186** | **2** | **1** | **50** |

---

## Unico Fix Necessario

### D2 — Drawer slide-right su desktop per dettaglio candidatura

**Problema**: `Candidature.tsx` usa sempre `<Drawer>` (Vaul) che è slide-up su tutte le piattaforme. Il criterio richiede slide-right su desktop.

**Fix**:
1. In `Candidature.tsx`, importare `Sheet` / `SheetContent` da `@/components/ui/sheet`
2. Usare un hook `useIsMobile()` per selezionare il componente
3. Su mobile (`< md`): mantenere `<Drawer>` (slide-up)
4. Su desktop (`>= md`): usare `<Sheet side="right">` (slide-right)
5. Il contenuto interno (status selector, note, download, elimina) resta identico — solo il wrapper cambia

Nessuna modifica al backend o alle edge functions.

