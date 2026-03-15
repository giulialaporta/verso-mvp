# Epic 10 — Migrazione AI Engine (Claude + multi-provider)

> **Stato:** ✅ implementato

---

## Obiettivo

Sostituire il Lovable API Gateway (Google Gemini) con chiamate dirette alle API Anthropic (Claude) per le 4 funzioni AI critiche, mantenendo Gemini Flash per lo scraping. Budget massimo: **≤ $0.18 per candidatura**.

---

## Contesto attuale

Oggi tutte le Edge Functions AI passano dal **Lovable API Gateway → Google Gemini**:

| Funzione | Modello attuale | Ruolo |
|----------|----------------|-------|
| `parse-cv` | Gemini 2.5 Flash | PDF → JSON strutturato |
| `scrape-job` | Gemini 2.5 Flash | HTML/testo → dati annuncio |
| `ai-prescreen` | Gemini 2.5 Pro | Analisi gap CV vs offerta |
| `ai-tailor` | Gemini 2.5 Pro | Generazione patch CV |
| `cv-review` | Gemini 2.5 Flash | Revisione qualità HR |

**Moduli condivisi esistenti:**
- `_shared/ai-fetch.ts` — wrapper chiamate AI (da sostituire)
- `_shared/compact-cv.ts` — compattazione CV per ridurre token (da mantenere)
- `_shared/validate-output.ts` — validazione output AI (da mantenere)
- `_shared/cors.ts` — CORS dinamico (invariato)

---

## Nuova configurazione

| Funzione | Nuovo modello | Provider | Perché |
|----------|--------------|----------|--------|
| `parse-cv` | Claude Sonnet 4 | Anthropic | Estrazione strutturata superiore, PDF nativo |
| `scrape-job` | Gemini 2.5 Flash | Google AI (diretto) | Task semplice, costo quasi zero, non serve cambiare |
| `ai-prescreen` | Claude Sonnet 4 | Anthropic | Reasoning forte per analisi comparativa |
| `ai-tailor` | Claude Sonnet 4 | Anthropic | Task critico — riscrittura testo, vincoli di onestà, patch precise |
| `cv-review` | Claude Haiku 4.5 | Anthropic | Task a regole, non serve un modello pesante |

**Fallback globale:** se Anthropic non risponde (timeout 30s o errore 5xx) → retry con Gemini 2.5 Flash via Google AI.

---

## Stima costi per candidatura

Una candidatura completa chiama: parse-cv → scrape-job → ai-prescreen → ai-tailor → cv-review.

Il modulo `compact-cv.ts` già esistente riduce i token in input del 30-40%.

| Funzione | Modello | Token (in + out) | Costo |
|----------|---------|-----------------|-------|
| parse-cv | Sonnet 4 ($3/$15 per M) | ~8K + 2K | ~$0.054 |
| scrape-job | Gemini Flash | ~5K + 1K | ~$0.001 |
| ai-prescreen | Sonnet 4 | ~4K + 1.5K | ~$0.035 |
| ai-tailor | Sonnet 4 | ~5K + 2.5K | ~$0.053 |
| cv-review | Haiku 4.5 ($1/$5 per M) | ~3K + 1.5K | ~$0.011 |
| **Totale** | | | **~$0.154** |

> Margine di sicurezza: ~$0.03 sotto il budget di $0.18.

---

## Setup API (prerequisiti manuali)

### 1. Anthropic API (Claude)

1. Vai su [console.anthropic.com](https://console.anthropic.com) → crea account
2. Aggiungi un metodo di pagamento (prepagato o carta)
3. Genera una API key in Settings → API Keys
4. Imposta un **spending limit** mensile (es. $50 per iniziare)
5. Su Supabase → Impostazioni → Edge Functions → Secrets:
   - `ANTHROPIC_API_KEY` = `sk-ant-...`

### 2. Google AI (per scrape-job, sganciato da Lovable Gateway)

1. Vai su [aistudio.google.com](https://aistudio.google.com) → "Get API key"
2. Crea una API key (gratis fino a 1500 req/giorno)
3. Su Supabase → Secrets:
   - `GOOGLE_AI_API_KEY` = `AIza...`

### 3. Quando vai in produzione

- Imposta spending alert su Anthropic (email a soglie: $25, $50, $100)
- Monitora il costo per candidatura nei log (vedi sezione logging)

---

## Cosa costruire

### 1. Nuovo modulo `_shared/ai-provider.ts`

Sostituisce `ai-fetch.ts`. Gestisce routing, retry e fallback.

**Interfaccia:**

```typescript
type AiTask = 'parse-cv' | 'scrape-job' | 'ai-prescreen' | 'ai-tailor' | 'cv-review';

interface AiRequest {
  task: AiTask;
  systemPrompt: string;
  userMessage: string | object;  // testo o multimodale (PDF)
  maxTokens?: number;
}

interface AiResponse {
  content: object;           // JSON parsato
  provider: string;          // 'anthropic' | 'google'
  model: string;             // modello effettivamente usato
  tokens: { input: number; output: number };
}

function callAi(request: AiRequest): Promise<AiResponse>
```

**Routing interno:**

```
task → modello primario → fallback

parse-cv     → claude-sonnet-4-20250514     → gemini-2.5-flash
scrape-job   → gemini-2.5-flash             → gemini-2.0-flash
ai-prescreen → claude-sonnet-4-20250514     → gemini-2.5-flash
ai-tailor    → claude-sonnet-4-20250514     → gemini-2.5-flash
cv-review    → claude-haiku-4-5-20251001    → gemini-2.5-flash
```

**Behavior:**
1. Chiama il modello primario
2. Se timeout (30s) o errore 5xx → retry 1 volta dopo 2s
3. Se ancora fallisce → chiama il fallback
4. Se anche il fallback fallisce → restituisce errore al frontend
5. Logga sempre: task, provider usato, modello, token in/out, durata ms, se è fallback

**Chiamata Anthropic (Deno):**

```typescript
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.30';

const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
const response = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: maxTokens,
  system: systemPrompt,
  messages: [{ role: 'user', content: userMessage }]
});
```

**Chiamata Google AI (Deno):**

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
  { method: 'POST', body: JSON.stringify({ contents: [...] }) }
);
```

**Input multimodale (PDF per parse-cv):**

Claude accetta PDF come content block:
```typescript
messages: [{
  role: 'user',
  content: [
    { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
    { type: 'text', text: 'Estrai i dati strutturati dal CV...' }
  ]
}]
```

---

### 2. Aggiornamento Edge Functions

Ogni Edge Function deve:
1. Importare `callAi` da `_shared/ai-provider.ts` invece di `ai-fetch.ts`
2. Passare il campo `task` corretto
3. Tutto il resto (prompt, parsing output, validazione) resta uguale

**Le modifiche sono minime** — cambia solo la chiamata AI, non la logica di business.

Esempio per `ai-tailor`:

```typescript
// PRIMA (Lovable Gateway)
const result = await aiFetch({ prompt: systemPrompt, input: userMessage });

// DOPO (ai-provider)
const result = await callAi({
  task: 'ai-tailor',
  systemPrompt: systemPrompt,
  userMessage: userMessage,
  maxTokens: 4096
});
```

---

### 3. Logging costi

Aggiungere una tabella per monitorare il consumo AI:

```sql
CREATE TABLE ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  task text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  tokens_in int NOT NULL,
  tokens_out int NOT NULL,
  cost_usd numeric(6,4),
  duration_ms int,
  is_fallback boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Solo service role" ON ai_usage_logs FOR ALL USING (false);
```

> RLS: nessun accesso utente — solo le Edge Functions (service role) scrivono. Tabella di monitoraggio interno.

**Calcolo costo nel provider:**

```typescript
const COST_PER_M = {
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5 },
  'gemini-2.5-flash': { input: 0.075, output: 0.3 },
};

const cost = (tokens.input * rates.input + tokens.output * rates.output) / 1_000_000;
```

---

### 4. Rimozione dipendenza Lovable Gateway

Dopo la migrazione:
1. Le Edge Functions non usano più il Lovable API Gateway
2. Rimuovere `ai-fetch.ts` (sostituito da `ai-provider.ts`)
3. Mantenere `compact-cv.ts` e `validate-output.ts` (invariati)

> **Nota:** `scrape-job` usava il gateway per Gemini. Dopo la migrazione, chiama Google AI direttamente con `GOOGLE_AI_API_KEY`. Se l'API key Google non è configurata, `scrape-job` può continuare a usare il Lovable Gateway come fallback temporaneo.

---

## Flussi

### Happy path — candidatura con Claude

1. Utente carica CV → `parse-cv` chiama Claude Sonnet 4 → JSON strutturato
2. Utente inserisce annuncio → `scrape-job` chiama Gemini Flash → dati offerta
3. Pre-screening → `ai-prescreen` chiama Claude Sonnet 4 → analisi gap
4. Tailoring → `ai-tailor` chiama Claude Sonnet 4 → patch CV
5. Review → `cv-review` chiama Claude Haiku 4.5 → CV finale
6. Log: 5 righe in `ai_usage_logs`, costo totale ~$0.15

### Fallback — Anthropic non disponibile

1. `ai-tailor` chiama Claude Sonnet 4 → timeout 30s
2. Retry dopo 2s → ancora timeout
3. Fallback a Gemini 2.5 Flash → successo
4. Log con `is_fallback = true`
5. Utente non si accorge di nulla (qualità leggermente inferiore, ma funziona)

---

## Edge case

| Caso | Comportamento |
|------|---------------|
| `ANTHROPIC_API_KEY` non configurata | Tutte le funzioni usano il fallback Gemini. Warning nei log. L'app funziona |
| `GOOGLE_AI_API_KEY` non configurata | `scrape-job` tenta Lovable Gateway. Le altre funzioni non hanno fallback. Errore se anche Anthropic è giù |
| Spending limit Anthropic raggiunto | API risponde 429. Fallback a Gemini. Warning nei log |
| Risposta AI non è JSON valido | `validate-output.ts` già gestisce questo caso → retry |
| Token in input troppi (CV molto lungo) | `compact-cv.ts` già compatta. Se ancora troppo → Claude gestisce fino a 200K token, non è un problema realistico |

---

## Criteri di accettazione

- [ ] `ai-provider.ts` gestisce routing per task, retry e fallback
- [ ] `parse-cv` usa Claude Sonnet 4 con input PDF multimodale
- [ ] `scrape-job` usa Google AI direttamente (non Lovable Gateway)
- [ ] `ai-prescreen` usa Claude Sonnet 4
- [ ] `ai-tailor` usa Claude Sonnet 4
- [ ] `cv-review` usa Claude Haiku 4.5
- [ ] Fallback a Gemini Flash funziona se Anthropic è giù
- [ ] `ai_usage_logs` logga ogni chiamata AI con token e costo
- [ ] Costo per candidatura completa ≤ $0.18
- [ ] Output identico nella struttura (nessuna modifica ai JSON di risposta)
- [ ] I prompt esistenti funzionano senza modifiche su Claude
- [ ] `ai-fetch.ts` rimosso, sostituito da `ai-provider.ts`
