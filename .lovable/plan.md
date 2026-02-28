

# Stato "Draft" per le candidature + Verifica flusso di salvataggio

## Situazione attuale

Il salvataggio avviene **solo** nello Step 3, con `status: "inviata"`. Se l'utente chiude il browser o torna indietro durante l'analisi AI, perde tutto. Non esiste uno stato draft.

Il flusso attuale:
1. Step 1: inserisci annuncio --> nessun salvataggio
2. Step 2: analisi AI --> nessun salvataggio
3. Step 3: visualizza CV adattato --> unico punto di salvataggio (status: "inviata")

## Soluzione

### 1. Salvataggio draft automatico dopo Step 1

Quando l'utente conferma l'annuncio (Step 1 -> Step 2), creiamo subito una `application` con `status: "draft"`. Questo garantisce che i dati dell'annuncio non vadano persi.

Flusso nuovo:
1. Step 1: conferma annuncio --> **salva application come draft** (company, role, job_description, job_url)
2. Step 2: analisi AI completata --> **aggiorna application** con match_score
3. Step 3: "Salva candidatura" --> **aggiorna status a "inviata"** + salva tailored_cv

### 2. Aggiornare Step3 per usare update invece di insert

Invece di creare una nuova application in Step3, aggiorniamo quella draft esistente. Il `tailored_cv` viene creato come prima, ma linkato all'application gia' esistente.

### 3. Dashboard Home: escludere i draft dal conteggio "attive"

I draft non vanno contati nelle candidature attive. Il filtro attuale esclude solo "ko" -- aggiungiamo anche "draft".

### 4. Pagina Candidature: mostrare i draft separatamente

La pagina Candidature (attualmente vuota/placeholder) deve:
- Caricare le application dal database
- Mostrare i draft in una sezione separata "Bozze" con possibilita' di riprendere o eliminare
- Mostrare le candidature attive nella lista principale

---

## File coinvolti

### `src/pages/Nuova.tsx`

**handleStep1Confirm** (riga ~695):
- Dopo aver chiamato `scrape-job`, prima di invocare `ai-tailor`, inserisce una riga in `applications` con status `"draft"`
- Salva l'`applicationId` nello state del wizard
- Quando l'AI completa (Step 2), aggiorna la riga con `match_score`

**Step3 handleSave** (riga ~535):
- Cambia da `insert` a `update` sulla application esistente (draft -> inviata)
- Inserisce il `tailored_cv` come prima, ma con l'`application_id` gia' noto

Nuovo state nel wizard:
```
const [applicationId, setApplicationId] = useState<string | null>(null);
```

### `src/pages/Home.tsx`

**activeApps filter** (riga ~284 circa):
- Aggiungere `"draft"` alla lista degli stati esclusi dal conteggio attive
- Da: `a.status.toLowerCase() !== "ko"`
- A: `!["ko", "draft"].includes(a.status.toLowerCase())`

### `src/pages/Candidature.tsx`

Riscrittura completa della pagina placeholder:
- Fetch delle application dal database (tutte)
- Sezione "Bozze" in alto se ci sono draft, con bottoni "Riprendi" e "Elimina"
- Lista principale con le candidature non-draft
- Ogni card mostra: company, role, score, status chip, data
- "Riprendi" su un draft naviga a `/app/nuova` (per ora senza pre-fill, feature futura)
- "Elimina" cancella la riga con conferma AlertDialog

---

## Riepilogo

| File | Modifica |
|------|----------|
| `src/pages/Nuova.tsx` | Salvataggio draft in Step 1, update in Step 3 invece di insert |
| `src/pages/Home.tsx` | Escludere draft dal conteggio attive |
| `src/pages/Candidature.tsx` | Riscrittura: lista candidature + sezione bozze |

Nessuna modifica al database (lo status e' gia' un campo text, "draft" e' gia' il default nella tabella `applications`).

