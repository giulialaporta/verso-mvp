

# Epic 10 — Migrazione AI: da Lovable Gateway a Claude + Google AI diretto

## Obiettivo
Sostituire il Lovable API Gateway con chiamate dirette ad Anthropic (Claude) e Google AI, per migliore qualità e controllo costi (~$0.15/candidatura).

## Cosa cambia

```text
PRIMA:  Edge Function → ai-fetch.ts → Lovable Gateway → Gemini
DOPO:   Edge Function → ai-provider.ts → Anthropic API (Claude) / Google AI (Gemini diretto)
```

## Step di implementazione

### 1. Setup secrets (prerequisito manuale)
- L'utente deve ottenere `ANTHROPIC_API_KEY` da console.anthropic.com
- L'utente deve ottenere `GOOGLE_AI_API_KEY` da aistudio.google.com
- Entrambi vanno configurati come secrets del progetto

### 2. Nuovo modulo `supabase/functions/_shared/ai-provider.ts`
Sostituisce `ai-fetch.ts`. Contiene:
- **Routing per task**: mappa ogni funzione al modello corretto (Sonnet 4, Haiku 4.5, o Gemini Flash)
- **Chiamata Anthropic**: via SDK `@anthropic-ai/sdk` da esm.sh, con supporto PDF multimodale per `parse-cv`
- **Chiamata Google AI**: via REST diretto a `generativelanguage.googleapis.com`
- **Retry + fallback**: timeout 30s, 1 retry dopo 2s, fallback a Gemini Flash
- **Parsing risposta**: `parseAIResponse()` adattato per gestire sia formato Anthropic (tool_use blocks) sia formato Google AI
- **Logging**: restituisce `{ provider, model, tokens_in, tokens_out }` per ogni chiamata

### 3. Tabella `ai_usage_logs` (migrazione DB)
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
-- RLS: nessun accesso utente, solo service role
```

### 4. Aggiornamento 5 Edge Functions
Cambio minimo in ogni file — solo la chiamata AI cambia:
- **`parse-cv`**: `callAi({ task: 'parse-cv', ... })` — Claude Sonnet 4 con input PDF multimodale (content block `type: 'document'`)
- **`scrape-job`**: `callAi({ task: 'scrape-job', ... })` — Google AI diretto (Gemini Flash)
- **`ai-prescreen`**: `callAi({ task: 'ai-prescreen', ... })` — Claude Sonnet 4
- **`ai-tailor`**: `callAi({ task: 'ai-tailor', ... })` — Claude Sonnet 4
- **`cv-review`**: `callAi({ task: 'cv-review', ... })` — Claude Haiku 4.5

Prompts e tool schemas restano identici. Solo il layer di trasporto cambia.

### 5. Logging costi in ogni chiamata
`ai-provider.ts` scrive in `ai_usage_logs` dopo ogni chiamata (via service role client), con calcolo costo basato su tariffe per modello.

### 6. Cleanup
- Rimuovere `_shared/ai-fetch.ts`
- Mantenere `compact-cv.ts`, `validate-output.ts`, `cors.ts`

## Rischi e note
- **Prompt compatibility**: i tool schemas usano formato OpenAI. Claude usa un formato leggermente diverso per i tools — `ai-provider.ts` deve tradurre lo schema automaticamente
- **PDF multimodale**: Claude accetta PDF come content block `type: 'document'`, mentre oggi `parse-cv` usa il formato `type: 'file'` di Gemini — serve adattamento nel provider
- **Graceful degradation**: se nessuna API key è configurata, fallback al Lovable Gateway esistente (transizione graduale)

## Sequenza consigliata
1. Configurare i secrets → 2. Creare `ai-provider.ts` → 3. Creare tabella logs → 4. Migrare una funzione alla volta (partire da `scrape-job` che è la più semplice) → 5. Testare end-to-end → 6. Rimuovere `ai-fetch.ts`

