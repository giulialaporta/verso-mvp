

# Aggiornamento contenuti Termini e Privacy

## Discrepanze trovate

### Termini (`/termini`)
1. **Art. 1** — Dice "piattaforma web gratuita" → è freemium (Free + Pro €9,90/mese)
2. **Art. 1** — Dice "tramite la spunta dell'apposita checkbox" → il flusso attuale usa testo informativo, non checkbox
3. **Art. 2** — Manca menzione export DOCX (Pro), manca modello freemium, manca analisi stipendio
4. **Art. 3** — Dice solo "Google Gemini" → l'app usa Anthropic Claude (primario) + Google Gemini (fallback)
5. **Art. 11** — Manca riferimento alla gestione abbonamento/disdetta Pro

### Privacy (`/privacy`)
1. **Sub-processori** — Manca **Stripe** (pagamenti), manca **Anthropic** (Claude, provider AI primario)
2. **Sub-processori** — "Google (Gemini)" è descritto come unico AI ma è solo fallback
3. **Dati trattati** — Manca sezione dati di pagamento (Stripe customer ID, subscription ID)
4. **Finalità** — Manca riga per gestione pagamenti/abbonamento
5. **Titolare** — Nessun aggiornamento necessario (già placeholder pre-lancio)

## Modifiche

### `src/pages/Termini.tsx`
- **Art. 1**: "piattaforma web per l'adattamento del CV tramite AI, disponibile in versione gratuita (Free) e in abbonamento (Pro, €9,90/mese)." Consenso: "proseguendo con la registrazione"
- **Art. 2**: Aggiungere "Analisi retributiva indicativa basata su dati di mercato", "Export CV in PDF e DOCX (Pro)". Aggiungere paragrafo piano Free (1 candidatura, 2 template) vs Pro (illimitate, tutti i template, DOCX)
- **Art. 3**: "modelli AI di terze parti (Anthropic Claude, Google Gemini)" 
- **Art. 11**: Aggiungere "La disdetta dell'abbonamento Pro può essere effettuata dalla sezione Impostazioni → Account → Piano."

### `src/pages/Privacy.tsx`
- **Dati trattati**: Aggiungere sottosezione "Dati di pagamento" — "Gestiti interamente da Stripe. Verso non memorizza numeri di carta. Conserviamo solo identificativi tecnici (customer ID, subscription ID)."
- **Sub-processori**: Aggiungere riga Stripe Inc. (USA, pagamenti, ID cliente e abbonamento) e Anthropic PBC (USA, elaborazione AI, testo CV + job description). Rinominare Google Gemini come "fallback AI"
- **Finalità**: Aggiungere riga "Gestione pagamenti e abbonamento / Esecuzione contratto / Durata abbonamento + 12 mesi"

**File da modificare:** `src/pages/Termini.tsx`, `src/pages/Privacy.tsx`

