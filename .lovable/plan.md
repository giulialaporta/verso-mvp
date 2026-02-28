

# Analisi barriere portali di lavoro + Guida utente in-app

## Il problema

Lo scraper attuale (`scrape-job/index.ts`) usa un semplice `fetch()` con User-Agent generico. Questo funziona solo con siti che servono HTML statico senza protezioni. La maggior parte dei portali di lavoro moderni blocca questo approccio.

## Analisi dei principali portali

| Portale | URL scraping | Copia-incolla testo | Note |
|---------|-------------|---------------------|------|
| **LinkedIn** | NO | SI (con limitazioni) | Richiede login, JS rendering, anti-bot aggressivo. Il testo dell'annuncio e' copiabile dalla pagina una volta loggati. |
| **Indeed** | NO | SI | Anti-bot (Cloudflare), JS-rendered. Testo copiabile dalla pagina. |
| **InfoJobs** | PARZIALE | SI | Meno protezioni, ma spesso JS-rendered. Testo facilmente copiabile. |
| **Monster** | NO | SI | Anti-bot, JS rendering. Testo copiabile. |
| **Glassdoor** | NO | SI | Login richiesto, anti-bot forte. Testo copiabile. |
| **Subito Lavoro** | PARZIALE | SI | Protezioni minori, potrebbe funzionare. |
| **Talent.com** | PARZIALE | SI | Spesso accessibile, ma variabile. |
| **Siti aziendali** (Workday, Greenhouse, Lever) | VARIABILE | SI | Alcuni accessibili, altri no. Greenhouse e Lever spesso OK. |

**Conclusione**: Lo scraping via URL e' inaffidabile per la maggior parte dei portali. Il copia-incolla del testo e' sempre possibile ed e' il metodo piu' affidabile.

## Soluzione proposta

### 1. Invertire il default: Tab "Testo" come principale

Attualmente il tab URL e' il default. Questo induce l'utente a provare prima l'URL, che fallira' nella maggior parte dei casi. Invertire: **"Testo" diventa il tab di default**, "URL" resta come opzione secondaria.

### 2. Aggiungere una guida contestuale "Come copiare l'annuncio"

Un componente espandibile (Collapsible) sotto la textarea con istruzioni rapide per i portali piu' comuni. Mostra icone dei portali e istruzioni specifiche per ciascuno.

```text
+------------------------------------------+
| L'annuncio                               |
| Incolla il testo dell'offerta di lavoro. |
+------------------------------------------+
| [Nome azienda]                           |
+------------------------------------------+
| [Testo] [URL]    <- Testo e' il default  |
+------------------------------------------+
| [                                    ]   |
| [ Incolla qui il testo completo...   ]   |
| [                                    ]   |
+------------------------------------------+
| v Come copiare da LinkedIn, Indeed...    |
|   +---------------------------------+    |
|   | LinkedIn:                       |    |
|   | 1. Apri l'annuncio              |    |
|   | 2. Seleziona tutto (Ctrl+A)     |    |
|   | 3. Copia (Ctrl+C)              |    |
|   | 4. Incolla qui                  |    |
|   |                                 |    |
|   | Indeed, InfoJobs, Monster:       |    |
|   | Stesso metodo.                  |    |
|   |                                 |    |
|   | Tip: L'URL funziona solo con    |    |
|   | alcuni siti (Greenhouse, Lever). |    |
|   +---------------------------------+    |
+------------------------------------------+
| [Analizza]                               |
+------------------------------------------+
```

### 3. Migliorare il fallback URL -> Testo

Quando lo scraping via URL fallisce, il messaggio di errore attuale e' generico. Migliorarlo con un suggerimento specifico basato sul dominio dell'URL inserito.

## File coinvolti

### `src/pages/Nuova.tsx` — Modifiche a Step1

1. **Invertire tab default**: `useState<string>("text")` invece di `"url"`
2. **Aggiungere componente guida**: Un `Collapsible` sotto la textarea con:
   - Titolo: "Come copiare da LinkedIn, Indeed..."
   - Istruzioni per portale con icone (LinkedIn, Indeed, InfoJobs, siti aziendali)
   - Nota su quali URL funzionano (Greenhouse, Lever, siti semplici)
3. **Migliorare errore URL**: Quando il fetch fallisce, mostrare un messaggio specifico basato sul dominio (es. "LinkedIn blocca lo scraping. Copia il testo dall'annuncio e incollalo qui.")
4. **Label tab URL aggiornata**: Aggiungere sottotitolo "(solo alcuni siti)" al tab URL

### Nessun altro file coinvolto

La logica backend resta invariata — il fallback text funziona gia'. Le modifiche sono puramente UI/UX nel componente Step1 di `Nuova.tsx`.

## Dettagli tecnici

- Collapsible: usa `@radix-ui/react-collapsible` gia' installato
- Icone: `LinkedinLogo`, `Globe`, `Info` da Phosphor
- Mappa domini bloccati: un semplice oggetto `Record<string, string>` con dominio -> messaggio specifico (es. `"linkedin.com": "LinkedIn blocca lo scraping automatico..."`)
- Copy istruzioni: stile Verso — diretto, no fluff, con steps numerati
- Animazione: fade-in del collapsible content con Framer Motion

