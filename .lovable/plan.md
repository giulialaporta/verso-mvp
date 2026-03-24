

## Obiettivo

Gestire annunci pubblicati da agenzie di recruiting dove l'azienda finale è sconosciuta. Oggi il campo "Nome azienda" è obbligatorio e blocca il flusso se non compilato.

## Intervento

### 1) Rendere il campo azienda opzionale con fallback intelligente

In `src/components/wizard/StepAnnuncio.tsx`:
- Rimuovere la validazione obbligatoria su `companyName` (riga 43: `if (!companyName.trim())`)
- Se il campo è vuoto, usare come fallback il `company_name` estratto dall'AI
- Se anche l'AI non trova un'azienda, usare il placeholder `"Azienda riservata"`
- Aggiungere un hint sotto il campo: "Se l'annuncio è di un'agenzia e non conosci l'azienda, lascia vuoto"

### 2) Aggiornare il prompt di `scrape-job` per riconoscere agenzie

In `supabase/functions/scrape-job/index.ts`, aggiungere una regola nel system prompt:
- Se l'annuncio è pubblicato da un'agenzia di recruiting (es. Randstad, Adecco, ManpowerGroup, Gi Group), estrarre il nome dell'agenzia in `company_name` e aggiungere un campo `is_staffing_agency: true`
- Se l'annuncio menziona il cliente finale, estrarlo in un nuovo campo `end_client`

Aggiungere `is_staffing_agency` (boolean) e `end_client` (string, opzionale) allo schema del tool `extract_job_data`.

### 3) Mostrare l'informazione agenzia nella preview card

In `StepAnnuncio.tsx`, nella card di preview (riga 152+):
- Se `is_staffing_agency` è true, mostrare sotto il nome azienda un badge "Tramite agenzia"
- Se `end_client` è presente, mostrare "Per conto di: {end_client}"

### 4) Aggiornare il tipo `JobData`

In `src/components/wizard/wizard-types.ts`, aggiungere:
- `is_staffing_agency?: boolean`
- `end_client?: string`

## File da modificare

- `src/components/wizard/StepAnnuncio.tsx` — campo opzionale + hint + badge agenzia
- `src/components/wizard/wizard-types.ts` — nuovi campi tipo
- `supabase/functions/scrape-job/index.ts` — prompt + schema tool aggiornati

