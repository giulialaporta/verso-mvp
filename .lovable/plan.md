
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
