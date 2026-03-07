# Upgrade modelli AI — da Gemini Flash a Pro

> **Obiettivo:** Migliorare la qualita' dei contenuti generati dall'AI, in particolare la riscrittura del CV.
> **Approccio:** Usare Gemini 2.5 Pro per le funzioni che impattano la qualita' dell'output, tenere Flash per quelle leggere.
> **Effort:** Basso. Ogni story e' un cambio di una riga + test.

---

## Story 1 — Upgrade ai-tailor a Gemini 2.5 Pro

### Problema

`ai-tailor` usa `google/gemini-2.5-flash`, un modello ottimizzato per velocita' ma non per qualita' di scrittura. Questo impatta direttamente il CV finale che l'utente scarica: bullet point generici, summary banali, keyword stuffing innaturale.

### Cosa fare

**File:** `supabase/functions/ai-tailor/index.ts`

Sostituire tutte le occorrenze di:
```typescript
model: "google/gemini-2.5-flash"
```
con:
```typescript
model: "google/gemini-2.5-pro"
```

Ci sono 2 occorrenze nel file (riga 494 e riga 529). Cambiarle entrambe.

**Non modificare il fallback** in `_shared/ai-fetch.ts` — quello resta `google/gemini-2.0-flash` come rete di sicurezza.

### Come testare

Eseguire il wizard completo con lo stesso CV e lo stesso annuncio prima e dopo il cambio. Confrontare:
- Qualita' del summary riscritto (deve essere specifico per il ruolo, non generico)
- Bullet point (devono avere verbi d'azione + metriche, non frasi vaghe)
- Keyword integration (parole chiave dall'annuncio usate in modo naturale, non forzate)
- Tempo di risposta (Pro e' piu' lento di Flash — verificare che resti sotto i 30 secondi)

### Criteri di accettazione

- [ ] `ai-tailor` usa `google/gemini-2.5-pro`
- [ ] Il summary riscritto e' specifico per il ruolo (non generico)
- [ ] I bullet point contengono verbi d'azione e metriche
- [ ] Le keyword dall'annuncio sono integrate in modo naturale
- [ ] Il tempo di risposta resta sotto i 30 secondi
- [ ] Il fallback model resta invariato (`gemini-2.0-flash`)
- [ ] Le protezioni esistenti funzionano ancora (no esperienze inventate, no date modificate, minimo 2 esperienze)

---

## Story 2 — Upgrade ai-prescreen a Gemini 2.5 Pro

### Problema

`ai-prescreen` usa `google/gemini-2.5-flash`. L'analisi dei gap e la classificazione dei requisiti beneficiano di un modello piu' capace: dealbreaker piu' accurati, domande di follow-up piu' pertinenti, salary analysis piu' precisa.

### Cosa fare

**File:** `supabase/functions/ai-prescreen/index.ts`

Sostituire:
```typescript
model: "google/gemini-2.5-flash"
```
con:
```typescript
model: "google/gemini-2.5-pro"
```

1 occorrenza nel file (riga 210).

### Come testare

Testare con 3 scenari:
1. CV molto allineato al ruolo → feasibility `high`, nessun dealbreaker
2. CV parzialmente allineato → gap identificati, domande di follow-up pertinenti
3. CV completamente disallineato → dealbreaker chiari, feasibility `low`

### Criteri di accettazione

- [ ] `ai-prescreen` usa `google/gemini-2.5-pro`
- [ ] I dealbreaker sono accurati (non segnala gap inesistenti)
- [ ] Le domande di follow-up sono pertinenti ai gap reali
- [ ] La feasibility riflette il reale allineamento CV-ruolo
- [ ] La salary analysis (se presente) ha stime ragionevoli
- [ ] Il tempo di risposta resta sotto i 20 secondi

---

## Story 3 — Verificare parse-cv e scrape-job restano su Flash

### Problema

Non e' un problema — e' una verifica. `parse-cv` e `scrape-job` restano su `google/gemini-2.5-flash` perche':
- `parse-cv`: il parsing multimodale di Flash e' gia' buono per estrazione dati strutturati da PDF
- `scrape-job`: estrae testo da HTML, non serve un modello potente

### Cosa fare

Nessuna modifica al codice. Verificare solo che:

**File:** `supabase/functions/parse-cv/index.ts` — riga 125
```typescript
model: "google/gemini-2.5-flash"  // deve restare cosi'
```

**File:** `supabase/functions/scrape-job/index.ts` — riga 166
```typescript
model: "google/gemini-2.5-flash"  // deve restare cosi'
```

### Criteri di accettazione

- [ ] `parse-cv` usa `google/gemini-2.5-flash` (non cambiato)
- [ ] `scrape-job` usa `google/gemini-2.5-flash` (non cambiato)
- [ ] Entrambe le funzioni continuano a funzionare normalmente

---

## Riepilogo configurazione finale

| Funzione | Modello | Motivo |
|----------|---------|--------|
| `scrape-job` | `google/gemini-2.5-flash` | Estrazione testo — Flash basta |
| `parse-cv` | `google/gemini-2.5-flash` | Parsing PDF — Flash e' sufficiente |
| `ai-prescreen` | `google/gemini-2.5-pro` | Analisi gap — Pro e' piu' accurato |
| `ai-tailor` | `google/gemini-2.5-pro` | Riscrittura CV — Pro scrive meglio |
| Fallback (tutti) | `google/gemini-2.0-flash` | Rete di sicurezza — resta invariato |
