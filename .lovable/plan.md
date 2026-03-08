

# Piano: Agente Revisore HR Expert (`cv-review`)

## Problemi reali nel PDF analizzato

Dal CV di Giulia La Porta generato per Satispay:

1. **Lingua mista**: bullet in inglese ("Conversational AI initiatives...", "Smart Automation, RPAs...") mentre profilo e competenze sono in italiano
2. **Testo orfano**: "co-lead of the Product Management Competence — HYPE S.p.A. October 2025 · Milan" appare come testo libero fuori struttura, dentro la sezione esperienza precedente
3. **Certificazioni corrotte**: "driving the definition of global standards..." è una frase descrittiva finita nella sezione certificazioni
4. **Bullet senza verbo d'azione**: "Conversational AI initiatives, including..." — non inizia con un verbo
5. **Bullet non capitalizzati o con prefissi spuri** in alcune sezioni
6. **Competenze generiche**: "Comunicazione Efficace" — cliché HR che non aggiunge valore

## Cosa fa l'Agente Revisore (HR Expert)

Una Edge Function leggera (`cv-review`) che riceve il CV tailored finale + lingua target e restituisce il CV **corretto e perfezionato**. Usa **Gemini 2.5 Flash** (veloce, 2-3s).

### Controlli dell'agente (10 regole HR):

| # | Regola | Esempio fix |
|---|--------|-------------|
| 1 | **Lingua uniforme** — Ogni testo nella lingua target, zero eccezioni | "Conversational AI initiatives" → "Iniziative di AI Conversazionale" |
| 2 | **Bullet = Verbo d'azione + risultato** — Ogni bullet inizia con verbo forte al passato/presente | "CRM project management" → "Gestito il progetto CRM real-time con SAS Enterprise Guide" |
| 3 | **Capitalizzazione** — Prima lettera maiuscola su ogni bullet | "smart Automation" → "Smart Automation" |
| 4 | **Rimozione artefatti** — Prefissi spuri ("I:", "- ", numeri), virgolette su skill | `"React"` → `React` |
| 5 | **Testi orfani** — Frasi fuori contesto eliminate o integrate | "co-lead of..." → integrato come bullet nell'esperienza HYPE |
| 6 | **Certificazioni validate** — Solo certificazioni reali con nome + ente. Frasi descrittive rimosse | "driving the definition of..." → rimosso |
| 7 | **Skill deduplication + pulizia** — Rimuovi duplicati, cliché ("Comunicazione Efficace"), skill troppo generiche | Rimosso "Comunicazione Efficace" |
| 8 | **Max 4-5 bullet per esperienza** — Condensare se troppi | 7 bullet → 5 più incisivi |
| 9 | **Date coerenti** — Formato uniforme (MM/YYYY o mese YYYY) | "01.2021" + "January 2021" → formato unico |
| 10 | **Summary mirato** — 2-3 frasi, specifico per il ruolo, no filler | Riscrittura se generico |

### Cosa NON fa:
- Non inventa esperienze, skill, certificazioni
- Non modifica date, nomi aziende, titoli di ruolo
- Non rimuove esperienze (quello lo fa `ai-tailor`)

## Implementazione

### 1. Nuova Edge Function `supabase/functions/cv-review/index.ts`

- Input: `{ cv: ParsedCV, detected_language: string, role_title: string }`
- Modello: `google/gemini-2.5-flash` (veloce, economico)
- Output: CV completo corretto (non patch — sovrascrive)
- Usa tool calling per output strutturato
- Tempo: ~2-3 secondi

### 2. Integrazione nel flusso (`src/pages/Nuova.tsx`)

Dopo che `ai-tailor` restituisce il CV:
1. Chiamata automatica a `cv-review` con il CV tailored
2. Il risultato sovrascrive `tailorResult.tailored_cv`
3. L'utente vede il CV già pulito nello step Revisione
4. Nessun rallentamento percepito: la review parte subito dopo il tailor, l'utente è ancora nello step di loading

### 3. Config (`supabase/config.toml`)

```toml
[functions.cv-review]
verify_jwt = false
```

## File coinvolti

| File | Modifica |
|------|----------|
| `supabase/functions/cv-review/index.ts` | **NUOVO** — Agente revisore HR expert |
| `supabase/config.toml` | Aggiungere config `cv-review` |
| `src/pages/Nuova.tsx` | Chiamare `cv-review` dopo `ai-tailor`, passare risultato al CV |

Nessuna modifica al database.

