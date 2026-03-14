

# Riduzione Latenza AI — Piano di Ottimizzazione

## Analisi del problema

Il flusso completo di una candidatura effettua **6 chiamate AI sequenziali**:

```text
Step 0: scrape-job ──────────────────────────── ~3s (Gemini Flash)
Step 0→1: ai-prescreen ──────────────────────── ~8-15s (Sonnet 4)
Step 1→2: ai-tailor (analyze) ───────────────── ~8-15s (Sonnet 4)
Step 2→3: ai-tailor (tailor) + cv-review ────── ~15-25s (Sonnet 4 + Haiku)
                                        TOTALE: ~35-60s di attesa AI
```

L'utente attende in **3 blocchi separati**, il peggiore è Step 2→3 (~20s).

## 5 Interventi proposti (dal più impattante)

### 1. Parallelizzare prescreen + analyze (−8-15s)
Oggi `ai-prescreen` e `ai-tailor(analyze)` sono chiamate in **due step separati** ma usano gli stessi input (CV + job_data). Possono partire in parallelo quando l'utente conferma l'annuncio.

- Nel frontend (`Nuova.tsx`), al Step 0→1: lanciare `ai-prescreen` e `ai-tailor(analyze)` in `Promise.all`
- Il risultato di analyze viene salvato in state e usato allo Step 2 senza attendere
- L'utente vede le domande del prescreen, risponde, e quando procede lo score è già pronto

**Impatto**: elimina completamente l'attesa dello Step 1→2.

### 2. Eliminare cv-review come chiamata separata (−5-8s)
`cv-review` applica 10 regole di pulizia (lingua, bullet, artefatti). Oggi è una chiamata separata dopo il tailor. Può essere **integrata nel prompt di ai-tailor** aggiungendo le regole di review direttamente.

- Aggiungere le 10 regole di cv-review al `SYSTEM_PROMPT_TAILOR`
- Rimuovere la chiamata a `cv-review` da `handleGenerateCv` in `Nuova.tsx`
- Mantenere `cv-review` come edge function standalone per usi futuri

**Impatto**: una chiamata AI in meno, −5-8s nello step più lento.

### 3. Downgrade modello per analyze e prescreen (−40-60% latenza su quei task)
`ai-prescreen` e `ai-tailor(analyze)` sono task di **classificazione e scoring**, non di generazione testo. Non serve Sonnet 4.

- `ai-prescreen` → **Claude Haiku 4.5** (da ~12s a ~4s)
- `ai-tailor-analyze` → **Claude Haiku 4.5** (da ~12s a ~4s)
- Solo `ai-tailor` (mode=tailor) resta su Sonnet 4 (genera testo)

**Impatto**: prescreen + analyze passano da ~24s combinati a ~8s, risparmiando anche ~60% sui costi.

### 4. Prompt compaction (−10-20% latency across all calls)
I system prompt di `ai-tailor` sono ~2500 token ciascuno. Si possono compattare eliminando ridondanze e esempi non essenziali senza perdere qualità.

### 5. Progress indicator migliorato (latenza percepita)
Aggiungere feedback granulare durante le attese: "Analisi requisiti...", "Confronto competenze...", "Generazione CV..." con progress bar animata. Non riduce la latenza reale ma migliora drasticamente la percezione.

## Risultato atteso

```text
PRIMA:  Step 0→1: 12s | Step 1→2: 12s | Step 2→3: 20s = ~44s totali
DOPO:   Step 0→1: 4s  | Step 1→2: 0s  | Step 2→3: 12s = ~16s totali
                                                    Riduzione: ~65%
```

## Dettagli tecnici

### Modifiche a `ai-provider.ts`
- Cambiare routing: `ai-prescreen` e `ai-tailor-analyze` → `claude-haiku-4-5-20251001`

### Modifiche a `Nuova.tsx`
- `handleAnnuncioConfirm`: lanciare prescreen + analyze in parallelo con `Promise.all`
- `handleVerificaProceed`: usare il risultato di analyze già in cache (skip chiamata)
- `handleGenerateCv`: rimuovere la chiamata a `cv-review`

### Modifiche a `ai-tailor/index.ts`
- Aggiungere le 10 regole di review al `SYSTEM_PROMPT_TAILOR`
- Istruire il modello a restituire patch già "pulite" (bullet con verbi d'azione, lingua uniforme, no artefatti)

### Nessuna modifica a
- `parse-cv`, `scrape-job` (già ottimali)
- Struttura dati, schema DB, tipi TypeScript

