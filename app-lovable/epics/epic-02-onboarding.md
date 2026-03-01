# Epic 02 — Onboarding (3 Step) (Implementato)

---

## Cosa è stato costruito

Pagina `/onboarding` — wizard a 3 step dove l'utente carica il CV in PDF, Verso lo analizza con AI multimodale, e l'utente può rivedere e modificare i dati estratti inline.

> **Differenza dal piano MVP:** il piano prevedeva 1 step (upload + anteprima). Implementati 3 step con editing inline completo e suggerimenti AI.

---

## Trigger

Dopo il primo login, se l'utente non ha un record in `master_cvs`, la dashboard lo reindirizza a `/onboarding`.

---

## Step 1: Upload

- **Titolo:** indicazione di caricare il CV
- **Area upload:** drag & drop o click per selezionare file
  - Accetta solo `.pdf`
  - Max 10 MB
  - Icona `FileArrowUp` (Phosphor, 32px)
- **Dopo selezione:** mostra nome file + dimensione + icona `FileText`
- **Storage:** PDF caricato nel bucket `cv-uploads` di Supabase Storage
- **CTA:** pulsante per procedere al parsing

---

## Step 2: Parsing AI

Il PDF viene inviato alla Edge Function `parse-cv`.

**Cosa fa la funzione:**
- Riceve il PDF come base64
- Input multimodale a Gemini 2.5 Flash (non estrazione testo + prompt, ma il PDF diretto)
- Estrae foto dal PDF (scan binario per marker JPG/PNG)
- Restituisce JSON strutturato + photo_url + raw_text

**UI durante il parsing:**
- Skeleton con messaggio di caricamento
- Progress indeterminato

**Dati estratti (schema completo):**
- **Personal:** nome, email, telefono, località, LinkedIn, website
- **Summary:** sintetizzato se non presente nel CV
- **Experience:** ruolo, azienda, date, descrizione, bullet points
- **Education:** titolo, istituto, campo, voti, honors, programmi, pubblicazioni
- **Skills:** tecniche, soft, tools, lingue con livello CEFR
- **Certifications:** nome, ente, anno
- **Projects:** nome, descrizione
- **Extra:** hobbies, volunteering, awards, altre sezioni

---

## Step 3: Preview + Edit inline

**Visualizzazione:** componente `CVSections` con sezioni collassabili per ogni area del CV.

**Editing inline:** ogni campo è modificabile direttamente:
- `InlineEdit` per campi testo (nome, ruolo, azienda, ecc.)
- `EditableSkillChips` per gestione skill (aggiunta/rimozione)
- `EditItemDrawer` per editing dettagliato di singoli elementi (slide-up mobile, slide-right desktop)

**Suggerimenti AI:** componente `CVSuggestions` mostra consigli per migliorare il CV.

**Honesty note:** messaggio che Verso usa solo ciò che è scritto nel CV, non aggiunge nulla.

**Al click "Continua":**
- Salva in `master_cvs`:
  - `parsed_data` = JSON strutturato (con eventuali modifiche dell'utente)
  - `file_name` = nome del file PDF
  - `file_url` = URL nel bucket storage
  - `raw_text` = testo estratto
  - `source` = 'upload'
  - `photo_url` = URL firmato della foto (se estratta)
- Redirect a `/app/home`

---

## Gestione CV Master

- **Un solo CV per utente** — il nuovo upload sostituisce il precedente
- Dalla home è possibile eliminare il CV o caricarne uno nuovo

---

## Error states

| Scenario | Comportamento |
|----------|--------------|
| File non PDF | Messaggio di errore, richiesta altro file |
| File > 10 MB | Messaggio di errore con limite |
| Parsing fallisce | Messaggio + pulsante "Riprova" |
| Edge function timeout | Messaggio timeout + "Riprova" |

---

## Differenze dal piano MVP

| Area | Piano | Implementato |
|------|-------|-------------|
| Step | 1 (upload + anteprima) | 3 (upload → parse → preview + edit) |
| Parsing | Estrazione testo + Claude API | Multimodale diretto Gemini 2.5 Flash |
| Foto CV | Non prevista | Estratta dal binario PDF |
| Schema CV | 7 sezioni base | 12+ sezioni (LinkedIn, CEFR, honors, extra...) |
| Edit inline | Non previsto | Completo su tutti i campi |
| Suggerimenti AI | Non previsti | Componente CVSuggestions |
| Summary | Solo se presente | Sintetizzato automaticamente se mancante |
