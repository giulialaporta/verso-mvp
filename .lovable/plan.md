

# Home Page Redesign — Virgin State + Dashboard + Customer Journey

## Customer Journey Analysis

The flow is sequential and mandatory:

```text
1. Registrazione/Login
2. Carica CV (obbligatorio)
3. Nuova candidatura (richiede CV)
4. Gestisci candidature
```

Il CV e' un prerequisito: la funzione `ai-tailor` confronta il CV master con l'annuncio. Senza CV, non si puo' creare nessuna candidatura. Questo deve essere chiaro fin dal primo accesso.

## Tre stati della Home

### Stato 1: "Virgin" (nessun CV, nessuna candidatura)
Visibile solo al primo accesso o se l'utente elimina tutto. Scopo: orientare, spiegare il flusso, far caricare il CV.

```text
+------------------------------------------+
| VERSO                                    |
| Benvenuto! Ecco come funziona.           |
+------------------------------------------+
|  1. Carica il tuo CV                     |
|     [=====] in evidenza, accent          |
|                                          |
|  2. Incolla un annuncio       (locked)   |
|     Verso adatta il tuo CV              |
|                                          |
|  3. Monitora le candidature   (locked)   |
|     Tieni traccia di tutto              |
+------------------------------------------+
|  [ Carica il tuo CV -> ]  CTA grande    |
+------------------------------------------+
```

- I passaggi 2 e 3 sono visibili ma "locked" (opacita' ridotta, icona lucchetto) per far capire che servono il CV prima
- Un solo bottone CTA: "Carica il tuo CV"
- Copy diretto e breve, in stile Verso

### Stato 2: CV caricato, nessuna candidatura
L'utente ha il CV ma non ha ancora fatto niente. Enfasi sulla prossima azione.

```text
+------------------------------------------+
| Ciao, Marco                              |
| Il tuo CV e' pronto. Crea la tua prima  |
| candidatura.                             |
+------------------------------------------+
|  [3]  [0]  [check]                       |
|  ---   ---   CV OK                       |
| (stats vuote ma struttura gia' visibile) |
+------------------------------------------+
|  [  Nuova candidatura  ->  ]  grande     |
+------------------------------------------+
|  Il tuo CV               [v] collapsible |
|  > Dati personali                        |
|  > Esperienza                            |
|  [Elimina]  [Carica nuovo]               |
+------------------------------------------+
```

### Stato 3: CV + candidature esistenti (dashboard completa)
L'utente e' attivo. Mostra stats, ultime candidature, CV collassato.

```text
+------------------------------------------+
| Ciao, Marco                              |
| Hai 3 candidature attive.               |
+------------------------------------------+
|  [3]     [74%]    [check]                |
|  Attive   Score    CV                    |
+------------------------------------------+
|  [  Nuova candidatura  ->  ]             |
+------------------------------------------+
|  Ultime candidature                      |
|  Google - SWE - 82% - INVIATA           |
|  Accenture - PM - 61% - CONTATTATO      |
|  [Vedi tutte ->]                         |
+------------------------------------------+
|  Il tuo CV               [v] collapsible |
|  [Elimina]  [Carica nuovo]               |
+------------------------------------------+
```

## Blocco navigazione "Nuova" senza CV

Oltre alla Home, il bottone "Nuova" nella sidebar/tab bar portera' a `/app/nuova` ma il wizard stesso verifichera' se esiste un CV. Se non c'e', mostra un messaggio con redirect a onboarding. Questo e' un fallback — la Home dovrebbe gia' rendere chiaro il percorso.

## File coinvolti

### `src/pages/Home.tsx` — Riscrittura completa
- Fetch: `master_cvs` + `applications` (count, score medio, ultime 3)
- Tre rendering condizionali basati su `hasCV` e `hasApplications`
- **Virgin state**: stepper visuale con 3 passaggi, CTA unica
- **CV-only state**: stats skeleton + CTA nuova candidatura prominente
- **Full state**: stats reali + mini-lista candidature + CV collassabile
- Skeleton loading per tutti gli stati

### `src/components/CVSections.tsx` — Aggiunta modalita' collassabile
- Nuova prop `collapsible?: boolean`
- Quando true, ogni sezione e' wrappata in `Collapsible` di Radix con sommario inline (es. "Esperienza — 3 posizioni")
- Default: tutto chiuso, l'utente espande a piacere

### `src/pages/Nuova.tsx` — Guard CV
- All'inizio del componente, verificare se esiste un `master_cvs` per l'utente
- Se non esiste, mostrare un messaggio "Devi prima caricare il tuo CV" con bottone redirect a `/onboarding`
- Nessun accesso al wizard senza CV

### Nessuna modifica backend
Tutti i dati necessari sono gia' nel DB. Le query usano le tabelle `master_cvs`, `applications` e `profiles` esistenti.

## Dettagli tecnici

- Stats bar: `grid grid-cols-3`, numeri in JetBrains Mono, icone Phosphor
- Virgin stepper: 3 card verticali con numerazione, icone `FileArrowUp`, `MagicWand`, `Funnel`, stato locked con `Lock` icon e opacity-50
- Ultime candidature: query `applications` order by `created_at desc` limit 3, con status chip colorati come da brand system
- Collapsible: usa `@radix-ui/react-collapsible` gia' installato, con `CollapsibleTrigger` che mostra icona chevron e sommario
- Animazioni: Framer Motion stagger per entrata virgin steps, fade per transizioni stato
- Mobile: tutto single-column, stats piu' compatte, CTA full-width

