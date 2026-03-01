# Epic 02 — Onboarding (Upload CV)

---

## Cosa costruire

Pagina `/onboarding` — l'utente carica il suo CV in PDF, Verso lo legge e lo struttura. Un solo step, nessuna complicazione.

---

## Comportamento

**Trigger:** dopo il primo login, se l'utente non ha un record in `master_cvs`, la dashboard lo manda a `/onboarding`.

**Layout:** card centrata, max-width 560px, sfondo `--color-surface`.

### UI

1. **Titolo:** "Carica il tuo CV" (Syne 700 24px)
2. **Sottotitolo:** "Verso lo legge e lo struttura per te. Accettiamo PDF." (DM Sans 400 15px, `--color-text-secondary`)
3. **Area upload:**
   - Zona drag & drop (bordo tratteggiato `--color-border`, 160px altezza)
   - Icona `FileArrowUp` (Phosphor, 32px, `--color-text-muted`)
   - Testo: "Trascina il tuo CV qui o clicca per selezionarlo"
   - Accetta solo `.pdf`
   - Max 10 MB
4. **Dopo selezione file:** mostra nome file + dimensione + icona `FileText`

### Parsing

Dopo upload, il file viene inviato a una **Supabase Edge Function** (`POST /functions/v1/parse-cv`):

**Cosa fa la edge function:**
- Riceve il PDF
- Estrae il testo (usa `pdf-parse` o libreria equivalente)
- Invia il testo estratto a Claude API con questo prompt:

```
Sei un parser di CV esperto. Dato questo testo estratto da un PDF, strutturalo nel seguente JSON schema. Se un campo non è presente, lascialo vuoto. Non inventare nulla.

Schema:
{
  "personal": { "name": "", "email": "", "phone": "", "location": "" },
  "summary": "",
  "experience": [{ "company": "", "role": "", "start": "", "end": "", "current": false, "bullets": [] }],
  "education": [{ "institution": "", "degree": "", "field": "", "start": "", "end": "" }],
  "skills": { "technical": [], "soft": [], "languages": [] },
  "certifications": [{ "name": "", "issuer": "", "date": "" }],
  "projects": [{ "name": "", "description": "" }]
}

Rispondi SOLO con il JSON, nessun altro testo.
```

- Restituisce il JSON strutturato al frontend

**UI durante parsing:**
- Skeleton card con messaggio: "Verso sta leggendo il tuo CV..." (DM Sans 400, `--color-text-secondary`)
- Progress indeterminato (barra accent che pulsa)

**UI dopo parsing — Anteprima:**
- Card con i dati estratti, organizzati per sezione:
  - Nome, email, telefono, località
  - Numero esperienze lavorative trovate
  - Numero competenze rilevate
  - Tag cloud delle skill principali (chip con sfondo `rgba(168,255,120,0.1)`, testo `--color-accent`)
- Messaggio: "Verso conosce solo quello che hai scritto nel tuo CV. Non aggiunge nulla che non ci sia." (DM Sans 400 13px, `--color-text-muted`)
- Pulsante "Tutto corretto, continua →" (primario, accent)

**Al click "Continua":**
- Salva in `master_cvs` (content = JSON strutturato, raw_text = testo PDF)
- Redirect a `/app/home`

### Error states

| Scenario | Messaggio |
|----------|-----------|
| File non PDF | "Verso accetta solo file PDF. Seleziona un altro file." |
| File > 10 MB | "Il file è troppo grande. Il limite è 10 MB." |
| Parsing fallisce | "Non riesco a leggere questo PDF. Prova con un altro file." + pulsante "Riprova" |
| Edge function timeout | "L'elaborazione sta richiedendo più del solito. Riprova." + pulsante "Riprova" |

---

## Aggiorna la Dashboard

Dopo che l'utente ha un CV in `master_cvs`, la pagina `/app/home` deve cambiare:

- **Se ha CV:** "Ciao [Nome], sei pronto per la tua prima candidatura." + CTA "Nuova candidatura →" che porta a `/app/nuova`
- **Se non ha CV:** "Ciao [Nome], inizia caricando il tuo CV." + CTA "Carica il tuo CV →" che porta a `/onboarding`

---

## Criteri di accettazione

- [ ] Pagina `/onboarding` con area upload drag & drop
- [ ] Accetta solo PDF, max 10 MB
- [ ] Edge function `parse-cv` che estrae testo + struttura via Claude API
- [ ] Skeleton loading durante il parsing
- [ ] Anteprima dati estratti con skill tag cloud
- [ ] Honesty note visibile
- [ ] Salvataggio in `master_cvs` al click "Continua"
- [ ] Redirect a `/app/home` dopo salvataggio
- [ ] Dashboard cambia messaggio in base a presenza CV
- [ ] Error states gestiti per tutti i casi
