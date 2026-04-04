

# Risorse di apprendimento — Solo link verificati

## Problema
Il modello AI genera `learning_suggestions` con URL inventati (hallucination). Link come `coursera.com/learn/kubernetes-basics` sembrano reali ma spesso non esistono. L'utente vede risorse inutili.

## Approccio scelto

Rimuovere la generazione di URL dal prompt AI e costruire link deterministici verso ricerche su piattaforme note. I link a ricerche funzionano sempre, a differenza di link a corsi specifici che il modello inventa.

**Perché non validare i link con HEAD request?** Aggiunge latenza (N richieste HTTP), le piattaforme bloccano bot, e un 200 non garantisce che il contenuto sia pertinente. Meglio generare link affidabili al 100%.

## Cosa cambia

### 1. Prompt ANALYZE in `ai-tailor/index.ts`

Modificare lo schema `learning_suggestions` per rimuovere il campo `url`. L'AI genera solo `skill`, `resource_name`, `type`, `duration` — niente link.

Aggiungere nel prompt: "Do NOT generate URLs for learning_suggestions. Only provide the skill name, a descriptive resource name, type, and duration."

### 2. Frontend `StepTailoring.tsx`

Costruire l'URL deterministicamente nel componente in base al `type`:
- `course` → `https://www.coursera.org/search?query={skill}`
- `certification` → `https://www.linkedin.com/learning/search?keywords={skill}`
- `tutorial` → `https://www.udemy.com/courses/search/?q={skill}`

Il link porta sempre a una pagina di ricerca reale sulla piattaforma, mai a un corso specifico inesistente. Il testo mostrato resta il `resource_name` generato dall'AI (es. "Corso base di Kubernetes") ma il link va alla ricerca.

Aggiungere un piccolo badge con il nome della piattaforma (Coursera, LinkedIn Learning, Udemy) accanto al link per chiarezza.

### 3. Schema tool `TOOL_SCHEMA_ANALYZE`

Rimuovere `url` da `required` e dalle `properties` di `learning_suggestions`.

## Nessuna modifica al database. Nessuna modifica ad altri file.

