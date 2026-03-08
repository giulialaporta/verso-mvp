# P0 — Fix Sicurezza (4 stories)

> **Priorita':** bloccanti per andare in produzione. Eseguire tutte prima di qualsiasi altra modifica.
> **Effort totale:** basso. Ogni story e' un prompt autonomo per Lovable.

---

## Story P0.1 — Restringere CORS sulle Edge Functions

### Problema

Tutte e 4 le Edge Functions hanno `Access-Control-Allow-Origin: *`. Questo permette a qualsiasi sito di invocare le funzioni AI, consumando crediti e potenzialmente accedendo a dati utente.

### Cosa fare

In ogni Edge Function (`parse-cv`, `scrape-job`, `ai-prescreen`, `ai-tailor`), sostituire l'header CORS hardcoded con una whitelist dinamica.

**File da modificare:**
- `supabase/functions/parse-cv/index.ts`
- `supabase/functions/scrape-job/index.ts`
- `supabase/functions/ai-prescreen/index.ts`
- `supabase/functions/ai-tailor/index.ts`

**Logica:**

```typescript
const ALLOWED_ORIGINS = [
  "https://verso-mvp.lovable.app",  // produzione
  "http://localhost:5173",           // sviluppo locale
  "http://localhost:8080",           // sviluppo locale alternativo
];

const origin = req.headers.get("Origin") ?? "";
const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

const corsHeaders = {
  "Access-Control-Allow-Origin": corsOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
```

Applicare `corsHeaders` a tutte le risposte (incluse le risposte OPTIONS preflight e le risposte di errore).

### Criteri di accettazione

- [ ] Nessuna Edge Function ha `Access-Control-Allow-Origin: *`
- [ ] Le chiamate dall'app funzionano normalmente
- [ ] Una richiesta da un origin non autorizzato riceve un header CORS che impedisce al browser di leggere la risposta

---

## Story P0.2 — Validare URL in scrape-job (protezione SSRF)

### Problema

La funzione `scrape-job` accetta qualsiasi URL dall'utente e lo fetcha server-side. Un attaccante potrebbe passare URL interni (`http://localhost:5432`, `http://169.254.169.254/metadata`) per sondare l'infrastruttura.

### Cosa fare

**File da modificare:** `supabase/functions/scrape-job/index.ts`

Aggiungere validazione dell'URL prima del fetch (prima della riga dove avviene `fetch(url, ...)`):

```typescript
function validateUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("URL non valido");
  }

  // Solo HTTPS
  if (parsed.protocol !== "https:") {
    throw new Error("Solo URL HTTPS sono accettati");
  }

  // Blocca IP privati e localhost
  const hostname = parsed.hostname.toLowerCase();
  const blocked = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "169.254.169.254",   // cloud metadata
    "metadata.google.internal",
    "[::1]",
  ];
  if (blocked.includes(hostname)) {
    throw new Error("URL non consentito");
  }

  // Blocca range IP privati
  const ipPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipPattern);
  if (match) {
    const first = parseInt(match[1]);
    const second = parseInt(match[2]);
    if (
      first === 10 ||
      first === 127 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168)
    ) {
      throw new Error("URL non consentito");
    }
  }
}
```

Chiamare `validateUrl(url)` prima di effettuare il fetch. Se la validazione fallisce, restituire errore 400 con il messaggio.

### Criteri di accettazione

- [ ] URL HTTP (non HTTPS) rifiutato con errore 400
- [ ] URL con `localhost`, `127.0.0.1`, IP privati rifiutato con errore 400
- [ ] URL `169.254.169.254` (cloud metadata) rifiutato
- [ ] URL HTTPS pubblici funzionano normalmente
- [ ] Il messaggio di errore e' user-friendly

---

## Story P0.3 — Rendere bucket cv-exports privato

### Problema

Il bucket `cv-exports` e' pubblico. I CV esportati contengono dati personali sensibili (nome, email, telefono, esperienza lavorativa) e sono accessibili a chiunque conosca l'URL.

### Cosa fare

**1. Modificare il bucket da pubblico a privato.**

In Supabase Dashboard > Storage > cv-exports > Settings: disattivare "Public bucket".

Oppure creare una nuova migrazione SQL:

```sql
UPDATE storage.buckets SET public = false WHERE id = 'cv-exports';
```

**2. Aggiornare le RLS policies di storage per cv-exports.**

Rimuovere la policy pubblica e creare policies che permettano solo al proprietario di accedere:

```sql
-- Rimuovi la policy pubblica
DROP POLICY IF EXISTS "CV exports are publicly accessible" ON storage.objects;

-- Solo il proprietario puo' leggere i propri export
CREATE POLICY "Users can read own cv-exports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'cv-exports'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Solo il proprietario puo' caricare
CREATE POLICY "Users can upload own cv-exports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cv-exports'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**3. Aggiornare il codice che legge il PDF URL.**

Dove il frontend usa `pdf_url` per il download (pagina Candidature, drawer), sostituire l'URL pubblico con una signed URL generata al momento:

```typescript
const { data } = await supabase.storage
  .from("cv-exports")
  .createSignedUrl(filePath, 60 * 5); // 5 minuti
```

### Criteri di accettazione

- [ ] Il bucket `cv-exports` e' privato
- [ ] Un utente non autenticato non puo' accedere ai PDF
- [ ] Un utente autenticato puo' scaricare solo i propri PDF
- [ ] Il download CV dalla pagina Candidature funziona ancora
- [ ] Il download CV dallo step Export del wizard funziona ancora

---

## Story P0.4 — Validare filePath in parse-cv

### Problema

La funzione `parse-cv` accetta un `filePath` dall'utente senza verificare che appartenga all'utente autenticato. Anche se le RLS policies mitigano il rischio, serve defense-in-depth.

### Cosa fare

**File da modificare:** `supabase/functions/parse-cv/index.ts`

Dopo aver ottenuto l'utente autenticato e prima di scaricare il file dallo storage, aggiungere questa validazione:

```typescript
// Dopo: const { data: { user } } = await supabase.auth.getUser();
// Prima di: supabase.storage.from("cv-uploads").download(filePath);

if (!filePath.startsWith(`${user.id}/`)) {
  return new Response(
    JSON.stringify({ error: "Accesso non autorizzato al file" }),
    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

### Criteri di accettazione

- [ ] Un filePath che non inizia con lo user ID dell'utente autenticato restituisce errore 403
- [ ] Il flusso normale di upload + parsing funziona senza problemi
- [ ] L'errore ha un messaggio chiaro
