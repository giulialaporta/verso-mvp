# Riduzione Latenza AI ✅

## Implementato

1. **Parallelizzazione prescreen + analyze** — `Promise.all` in `handleAnnuncioConfirm`, risultato analyze cachato in ref e usato istantaneamente allo Step 2 (−8-15s)
2. **cv-review integrato nel prompt tailor** — Le 10 regole di qualità ora sono nel `SYSTEM_PROMPT_TAILOR`, eliminata la chiamata separata (−5-8s)  
3. **Downgrade modelli** — `ai-prescreen` e `ai-tailor-analyze` ora usano Claude Haiku 4.5 (−40-60% latenza, −60% costi)
4. **Progress indicator** — Già presente con animazioni staggered in StepVerifica e StepTailoring

## Risultato atteso

```
PRIMA:  Step 0→1: 12s | Step 1→2: 12s | Step 2→3: 20s = ~44s
DOPO:   Step 0→1: 4s  | Step 1→2: 0s  | Step 2→3: 12s = ~16s  (−65%)
```

# Protezione Esperienze CV ✅

## Implementato

1. **Prompt EXPERIENCE PROTECTION riscritto** — L'AI non può MAI rimuovere esperienze, solo riordinare e condensare
2. **Enum structural_changes aggiornato** — Rimossa l'azione "removed", ammesse solo "reordered" e "condensed"
3. **Seniority overqualified** — Se il candidato è più senior del ruolo, l'esperienza extra viene valorizzata come punto di forza
4. **Level 1 tailoring aggiornato** — Le esperienze non vengono mai rimosse, solo progetti/certificazioni irrilevanti

# Agente Revisione Formale CV ✅

## Implementato

1. **Nuova edge function `cv-formal-review`** — Claude Haiku 4.5 via `ai-provider.ts`, controlla coerenza date, maiuscole, separatori, lingua unica, bullet uniformi, punteggiatura, fluidità
2. **Task routing aggiornato** — Nuovo task `cv-formal-review` in `ai-provider.ts` con Haiku 4.5 + fallback Gemini 2.5 Flash
3. **Review automatica in background** — Si attiva con `useEffect` all'ingresso nello step Export, senza click dell'utente
4. **Download non bloccato** — L'utente può scaricare subito; se la review è pronta, il CV revisionato viene usato automaticamente
5. **UI correzioni** — Badge nel pannello score (reviewing/OK/N correzioni) + pannello collapsible con dettaglio fix (sezione → campo → problema → correzione)

# Anti-Hallucination & Integrity Check ✅

## Implementato

### 1. Prompt Hardening (`ai-tailor/index.ts`)
- Aggiunta sezione **ANTI-HALLUCINATION — ABSOLUTE RULES** con 11 regole esplicite
- Vietato inventare metriche, percentuali, importi, dimensioni team
- Vietato modificare ruoli, aziende, location, date — copia carattere-per-carattere
- Vietato modificare titoli di studio, voti, honors
- Vietato aggiungere/rimuovere certificazioni
- Bullet riformulato: "action verb + impact, metriche SOLO se presenti nell'originale"
- Summary: preservare identità professionale reale

### 2. Integrity Check server-side (`_shared/integrity-check.ts`)
- Validazione post-patch che confronta CV tailored con originale
- **Campi immutabili experience**: role, company, location, start, end → revert automatico
- **Campi immutabili education**: institution, degree, field, grade, honors, program, publication → revert automatico
- **Certificazioni**: inventate rimosse, rimosse ripristinate (match fuzzy per nome)
- **Metriche fabbricate**: regex scan per `\d+%`, `€\d+`, `\d+[KMB]+`, `team of \d+` — revert bullet se metrica assente nell'originale
- **Dati personali**: name, email, phone, location, linkedin protetti
- **Education inventate**: rimosse; education rimosse: ripristinate

### 3. Honest Score server-computed
- L'AI non si auto-valuta più — i contatori sono calcolati server-side
- Nuovi campi: `dates_modified`, `roles_changed`, `companies_changed`, `degrees_changed`, `metrics_fabricated`, `certs_invented`, `certs_removed`
- Flag `server_validated: true` per distinguere dal vecchio self-report
- Conteggio `reverts` con dettaglio per categoria

## Root cause risolte
- ✅ "action verb + measurable result" → non incentiva più l'invenzione di metriche
- ✅ Nessuna enforcement server-side → integrity-check.ts valida ogni campo
- ✅ honest_score self-reported → calcolato server-side
- ✅ validate-output solo tipi → integrity check confronta contenuto
