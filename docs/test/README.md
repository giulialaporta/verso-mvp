# Test — Checklist di verifica Verso

Questa cartella contiene le checklist di acceptance criteria per ogni area funzionale dell'app.
Ogni file e' una checklist con checkbox markdown (`- [ ]`) da usare per il test manuale.

---

## Come usare

1. Dopo ogni evoluzione su Lovable, lancia il comando `/test` in Claude Code
2. Claude aggiorna le checklist esistenti e ne crea di nuove se servono
3. Usa i file come prompt per Lovable o come guida per test manuale
4. Marca i risultati: `- [x]` pass, `- [ ]` non testato, `- [!]` fail

---

## Checklist disponibili

| File | Area | Epic |
|------|------|------|
| `check-auth.md` | Registrazione, Login, Logout, Password Reset, Google OAuth, Protezione Route | F1 |
| `check-onboarding.md` | Upload CV, Parsing AI, Preview + Edit | F2 |
| `check-nuova-candidatura.md` | Job input, Pre-screening, Tailoring, Score, Export | F3 |
| `check-ai-engine.md` | Edge Functions (parse-cv, scrape-job, ai-prescreen, ai-tailor) | F4 |
| `check-export-dashboard.md` | Export PDF, Dashboard Home | F5 |
| `check-candidature.md` | Lista candidature, Stati, Note, Bozze | F6 |

> I file non ancora creati verranno generati al primo lancio di `/test`.
