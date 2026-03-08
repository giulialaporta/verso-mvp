# Epic 09 — Legal, Privacy e Trasparenza AI

> **Priorita': P0 — bloccante per produzione.**
> Verso attualmente non ha nessuna implementazione legale: niente T&C, Privacy Policy, consensi, cookie banner, trasparenza AI o diritto all'oblio.
>
> **Normative di riferimento:** GDPR (Reg. UE 2016/679), EU AI Act (Reg. UE 2024/1689), D.Lgs. 196/2003, Codice del Consumo, Linee Guida Garante Privacy italiano.
>
> **Eseguire le stories in ordine.** La story 1 (database) e' prerequisito per tutte le altre.

---

## Contesto — Verso oggi

| Aspetto | Stato attuale |
|---------|--------------|
| Modello | Gratuito per tutti — nessun piano, billing o Stripe |
| Provider AI | Lovable API Gateway → Google Gemini (2.5 Flash + 2.5 Pro) |
| Auth | Email/password + Google OAuth (Supabase Auth) |
| Features | CV parsing, job scraping, pre-screening, CV tailoring, application tracking, PDF export |
| Sub-processori | Supabase (DB, auth, storage, edge functions), Lovable/Google (AI) |
| Pagine legali | Nessuna |
| Consensi | Nessuno raccolto |
| Cookie banner | Assente |
| Trasparenza AI | Una riga nell'onboarding |
| Cancellazione account | Non implementata |
| Export dati | Non implementato |

---

## Story 1 — Database: tabella consent_logs e migration

### Cosa fare

Creare una migration SQL per la tabella `consent_logs` che registra ogni consenso prestato o revocato dall'utente.

```sql
CREATE TABLE public.consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  consent_type text NOT NULL,
  consent_version text NOT NULL,
  granted boolean NOT NULL,
  granted_at timestamptz DEFAULT now(),
  revoked_at timestamptz,
  ip_address text,
  user_agent text,
  method text,
  metadata jsonb
);

-- RLS: ogni utente vede solo i propri consensi
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents"
  ON public.consent_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents"
  ON public.consent_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indici per query frequenti
CREATE INDEX idx_consent_logs_user ON public.consent_logs(user_id, consent_type);
CREATE INDEX idx_consent_logs_date ON public.consent_logs(granted_at);
```

**Tipi di consenso previsti:**

| consent_type | consent_version | Quando | Obbligatorio |
|-------------|----------------|--------|-------------|
| `terms` | `1.0` | Registrazione | Si |
| `privacy` | `1.0` | Registrazione | Si |
| `sensitive_data` | `1.0` | Prima dell'upload CV | Si (per caricare CV) |
| `analytics_cookies` | `1.0` | Cookie banner | No |

**Metodi di raccolta (`method`):** `registration`, `pre_upload_modal`, `cookie_banner`, `settings`

### Criteri di accettazione

- [ ] Tabella `consent_logs` creata con tutti i campi
- [ ] RLS attiva: ogni utente vede/inserisce solo i propri record
- [ ] Indici creati per performance
- [ ] Nessun breaking change sui flussi esistenti

---

## Story 2 — Pagine legali: T&C, Privacy Policy, Cookie Policy

### Cosa fare

Creare 3 pagine statiche accessibili senza autenticazione.

**Route:**

| Pagina | Route | Contenuto |
|--------|-------|-----------|
| Termini e Condizioni | `/termini` | T&C adattati a Verso |
| Informativa Privacy | `/privacy` | Privacy Policy GDPR |
| Cookie Policy | `/cookie-policy` | Cookie Policy |

**Layout:**
- Dark mode, sfondo `#0D0E12`, font DM Sans
- Header con logo Verso + link "Torna al login" (se non autenticato) o "Torna all'app" (se autenticato)
- Contenuto in una card centrata (max-width 720px), testo `--color-text-secondary`, titoli `--color-text-primary`
- Sidebar con indice navigabile (anchor link) su desktop, nascosta su mobile
- Footer con: "Versione 1.0 — Ultimo aggiornamento: [data]"

**Registrazione route in App.tsx:**
```tsx
<Route path="/termini" element={<Termini />} />
<Route path="/privacy" element={<Privacy />} />
<Route path="/cookie-policy" element={<CookiePolicy />} />
```

### Contenuto T&C (adattato a Verso)

Il documento deve contenere questi articoli (in italiano, linguaggio chiaro):

**Art. 1 — Oggetto e Accettazione**
- Verso e' una piattaforma web gratuita per l'adattamento del CV tramite intelligenza artificiale
- Rivolto a persone fisiche maggiorenni (18+)
- L'accettazione avviene tramite checkbox alla registrazione

**Art. 2 — Descrizione del Servizio**
Verso offre:
- a) Analisi e parsing del CV tramite AI (upload PDF → estrazione dati strutturati)
- b) Scraping di annunci di lavoro da URL o testo incollato
- c) Pre-screening: analisi di compatibilita' tra CV e annuncio, con identificazione gap e dealbreaker
- d) Adattamento automatizzato del CV (tailoring) per specifici annunci, valorizzando esperienze realmente possedute senza aggiungere informazioni non veritiere
- e) Calcolo di punteggi di compatibilita' (match score) e ottimizzazione ATS (ats score), indicativi e non vincolanti
- f) Tracciamento delle candidature con gestione stati e note
- g) Export del CV adattato in formato PDF

Verso NON e': un'agenzia per il lavoro, non intermedia rapporti di lavoro, non garantisce l'esito di candidature.

**Art. 3 — Natura e Limiti dell'Intelligenza Artificiale**
- Le funzionalita' AI usano modelli di terze parti (Google Gemini) tramite infrastruttura Supabase
- L'AI puo' produrre output imprecisi o incompleti ("allucinazioni")
- Il punteggio di compatibilita' e' un indicatore orientativo, non una valutazione professionale
- L'utente e' responsabile della revisione integrale di tutti i documenti generati prima del loro utilizzo
- Verso e' progettato per non aggiungere informazioni false, ma l'utente e' il solo responsabile dell'accuratezza del proprio CV
- Scaricando i documenti, l'utente ne assume piena responsabilita'

**Art. 4 — Registrazione e Account**
- Account personale, non cedibile
- L'utente deve fornire informazioni veritiere
- Responsabilita' sulla sicurezza delle credenziali
- Divieto di account multipli

**Art. 5 — Obblighi e Condotte Vietate**
- Non caricare dati di terzi senza consenso
- Non creare CV con informazioni false (rif. art. 640 e 482 c.p.)
- Non tentare di compromettere la sicurezza
- Non fare scraping, reverse engineering
- Non caricare malware
- Violazione = sospensione account

**Art. 6 — Contenuti dell'Utente e Licenza**
- L'utente resta titolare di tutti i dati caricati
- Licenza non esclusiva, revocabile, limitata all'erogazione del Servizio
- Verso non usa i dati per addestrare modelli AI propri
- Verso non vende i dati a terzi
- I documenti generati sono di proprieta' dell'utente

**Art. 7 — Proprieta' Intellettuale di Verso**
- Codice, design, interfaccia, loghi, marchi sono proprieta' di Verso
- Vietata riproduzione/reverse engineering

**Art. 8 — Disponibilita' del Servizio**
- Servizio "as is", senza garanzia di disponibilita' continua
- Diritto di modificare o sospendere funzionalita' con preavviso
- Modifiche T&C comunicate via email 30 giorni prima

**Art. 9 — Limitazione di Responsabilita'**
- Verso non risponde dell'esito delle candidature
- Non risponde di imprecisioni dell'AI
- Non risponde di danni da documenti non revisionati dall'utente

**Art. 10 — Legge Applicabile e Foro**
- Legge italiana
- Foro del consumatore per residenti in Italia
- Link alla piattaforma ODR della Commissione Europea

### Contenuto Privacy Policy (adattato a Verso)

**Titolare:** [Ragione Sociale], [Indirizzo], [P.IVA], [email privacy]

**Dati trattati:**
- Dati di registrazione: nome, email, password (hash), foto profilo (opzionale)
- Dati professionali (CV): anagrafica, esperienze, formazione, competenze, certificazioni, progetti
- Dati retributivi (opzionale): RAL attuale e desiderata (`profiles.salary_expectations`)
- Dati delle candidature: aziende, ruoli, date, note, punteggi, CV adattati
- Dati tecnici: IP, browser, user agent, sessioni
- Nota art. 9 GDPR: il CV puo' contenere categorie particolari (salute, origine etnica, appartenenza sindacale) — trattate solo con consenso esplicito

**Finalita' e basi giuridiche:**

| Finalita' | Base giuridica | Conservazione |
|-----------|---------------|---------------|
| Gestione account | Esecuzione contratto (art. 6(1)(b)) | Durata account + 12 mesi |
| Erogazione servizio (parsing, tailoring, tracking) | Esecuzione contratto | Durata account + 6 mesi |
| Invio dati all'AI per elaborazione | Esecuzione contratto + consenso art. 9(2)(a) | Solo tempo elaborazione |
| Scraping annunci di lavoro | Esecuzione contratto | Cache 7 giorni |
| Sicurezza e prevenzione frodi | Legittimo interesse (art. 6(1)(f)) | 12 mesi |

**Sub-processori:**

| Fornitore | Paese | Ruolo | Dati trasmessi |
|-----------|-------|-------|---------------|
| Supabase Inc. | USA (region EU disponibile) | Database, auth, storage, edge functions | Tutti i dati account e CV |
| Lovable / Google (Gemini) | USA/UE | Elaborazione AI | Testo CV + job description |
| Google LLC | USA | OAuth login | Email, nome (token OAuth) |

**Diritti dell'utente (artt. 15-22 GDPR):**
- Accesso, rettifica, cancellazione, limitazione, portabilita', opposizione, revoca consenso
- Reclamo al Garante Privacy (www.garanteprivacy.it)
- Richieste a: [email privacy], risposta entro 30 giorni

**Sicurezza:**
- Crittografia TLS in transito, dati a riposo cifrati
- Row Level Security (RLS) su Supabase per isolamento utenti
- URL firmati per accesso ai file in Storage
- Nessun file pubblicamente accessibile senza autenticazione

### Contenuto Cookie Policy

**Cookie tecnici (nessun consenso richiesto):**
- Cookie di sessione (Supabase Auth)
- Cookie CSRF
- Preferenze UI

**Cookie analitici (consenso richiesto):**
- Nessuno attualmente — se in futuro si aggiunge analytics (es. Plausible), richiedere consenso opt-in

**Cookie di profilazione:** Nessuno.

### Criteri di accettazione

- [ ] Pagina `/termini` accessibile e leggibile con tutti gli articoli
- [ ] Pagina `/privacy` accessibile con informativa completa GDPR
- [ ] Pagina `/cookie-policy` accessibile
- [ ] Le 3 pagine funzionano senza autenticazione
- [ ] Layout dark mode, responsive, con indice navigabile su desktop
- [ ] Footer con versione e data aggiornamento
- [ ] Link "Torna al login" / "Torna all'app" nel header

---

## Story 3 — Consensi in registrazione

### Cosa fare

Modificare il form di registrazione in `src/pages/Login.tsx` per raccogliere i consensi obbligatori prima di creare l'account.

**Aggiungere sotto i campi email/password, prima del pulsante "Crea account":**

```
[ ] Ho letto e accetto i [Termini e Condizioni d'Uso] ← link a /termini
[ ] Ho letto l'[Informativa Privacy] e acconsento al trattamento dei miei dati personali ← link a /privacy
```

**Regole:**
- Le due checkbox sono **separate** (non un unico "accetto tutto")
- Le checkbox sono **non pre-spuntate** (dark pattern vietato dal GDPR e dal DSA)
- Entrambe devono essere spuntate per abilitare il pulsante "Crea account"
- Se non spuntate: il pulsante resta disabilitato (opacity 50%, non cliccabile)
- I link si aprono in un nuovo tab (`target="_blank"`)

**Al click su "Crea account" (dopo `supabase.auth.signUp`):**
Inserire 2 record nella tabella `consent_logs`:

```typescript
const now = new Date().toISOString();
const commonFields = {
  user_id: newUser.id,
  granted: true,
  granted_at: now,
  ip_address: null, // non disponibile client-side
  user_agent: navigator.userAgent,
  method: 'registration',
  metadata: { screen: 'login_signup' }
};

await supabase.from('consent_logs').insert([
  { ...commonFields, consent_type: 'terms', consent_version: '1.0' },
  { ...commonFields, consent_type: 'privacy', consent_version: '1.0' },
]);
```

**Stile checkbox:**
- Label: DM Sans 400 13px `--color-text-secondary`
- Link: underline, colore `--color-primary` (`#A8FF78`)
- Checkbox: sfondo `--color-surface`, bordo `--color-border`, check `--color-primary`
- Spazio tra le due checkbox: 8px
- Margine sopra le checkbox (dal campo password): 16px

**Per Google OAuth:**
L'utente che si registra con Google deve vedere le stesse checkbox. Poiche' il flusso OAuth e' un redirect, gestire cosi':
- Se l'utente clicca "Continua con Google" senza aver spuntato le checkbox → mostrare un toast: "Accetta i Termini e l'Informativa Privacy per continuare"
- Le checkbox devono essere spuntate PRIMA di avviare il flusso OAuth
- Dopo il ritorno da OAuth (primo accesso, `profiles` appena creato), inserire i `consent_logs`

### Criteri di accettazione

- [ ] Due checkbox separate, non pre-spuntate, nel form di registrazione
- [ ] Link a /termini e /privacy funzionanti (target blank)
- [ ] Pulsante "Crea account" disabilitato se le checkbox non sono spuntate
- [ ] Consensi salvati in `consent_logs` dopo la registrazione
- [ ] Google OAuth bloccato se le checkbox non sono spuntate
- [ ] Nessun dark pattern (checkbox non pre-spuntate, nessuna forzatura)

---

## Story 4 — Consenso dati sensibili (art. 9 GDPR) pre-upload CV

### Cosa fare

Prima del primo caricamento del CV (nell'onboarding, step 1 - upload), mostrare un modal informativo che richiede il consenso per il trattamento di eventuali categorie particolari di dati.

**Quando mostrare:** Solo la prima volta che l'utente carica un CV. Verificare se esiste gia' un record `consent_logs` con `consent_type = 'sensitive_data'` per quell'utente.

**Layout del modal:**

```
┌─────────────────────────────────────────────────────┐
│  Informativa sul trattamento del CV                 │
│                                                     │
│  Il curriculum vitae che stai per caricare potrebbe │
│  contenere informazioni personali sensibili come    │
│  stato di salute, convinzioni religiose o politiche,│
│  appartenenza sindacale o origine etnica.            │
│                                                     │
│  Questi dati saranno trattati esclusivamente per    │
│  adattare il tuo CV agli annunci selezionati e non  │
│  saranno utilizzati per altri scopi.                │
│                                                     │
│  Se non desideri che queste informazioni vengano    │
│  elaborate, ti consigliamo di rimuoverle dal CV     │
│  prima di caricarlo.                                │
│                                                     │
│  [ ] Acconsento al trattamento delle eventuali      │
│      categorie particolari di dati contenute nel    │
│      mio CV (art. 9 GDPR)                          │
│                                                     │
│  [Continua]                          [Annulla]      │
└─────────────────────────────────────────────────────┘
```

**Regole:**
- Checkbox non pre-spuntata
- "Continua" disabilitato finche' la checkbox non e' spuntata
- "Annulla" chiude il modal e torna allo step upload senza caricare
- Al click su "Continua": salva in `consent_logs` con `consent_type: 'sensitive_data'`, `consent_version: '1.0'`, `method: 'pre_upload_modal'`
- Poi procede con l'upload del CV

**Stile:**
- Modal centrato, sfondo `--color-surface`, bordo `--color-border`, border-radius 16px
- Titolo: DM Sans 600 18px `--color-text-primary`
- Testo: DM Sans 400 14px `--color-text-secondary`
- Checkbox e pulsanti come nel resto dell'app

### Criteri di accettazione

- [ ] Modal appare prima del primo upload CV
- [ ] Checkbox non pre-spuntata
- [ ] Upload bloccato finche' il consenso non e' dato
- [ ] Consenso salvato in `consent_logs`
- [ ] Se l'utente ha gia' dato il consenso (record esistente): il modal non riappare
- [ ] "Annulla" non blocca l'utente — puo' tornare e riprovare

---

## Story 5 — Trasparenza AI: disclaimer e label

### Cosa fare

Aggiungere disclaimer e label di trasparenza AI nei punti chiave dell'app, come richiesto dall'EU AI Act (art. 13, 50) e dal GDPR.

**5.1 — Banner onboarding (step 1, prima dell'upload)**

Sotto il titolo dello step, aggiungere un box informativo:

```
┌─────────────────────────────────────────────────────┐
│  🤖  Verso usa l'intelligenza artificiale           │
│                                                     │
│  L'AI analizza il tuo CV partendo da quello che     │
│  hai scritto — non inventa nulla. Ogni documento    │
│  generato viene mostrato a te prima di poterlo      │
│  scaricare: sei sempre tu a decidere cosa usare.    │
└─────────────────────────────────────────────────────┘
```

Stile: sfondo `--color-surface`, bordo sinistro 3px `--color-primary`, padding 16px, font DM Sans 400 13px `--color-text-secondary`. Icona Phosphor `Robot` (duotone) nel titolo.

**5.2 — Label "Generato con AI" sugli output**

In tutti i punti dove l'app mostra risultati generati dall'AI, aggiungere una label discreta:

| Dove | Label |
|------|-------|
| Step 2 del wizard (pre-screening) | "Analisi generata con AI — verifica i risultati" |
| Step 3 del wizard (tailoring) | "CV adattato con AI — rivedi prima di scaricare" |
| Step 4 del wizard (score) | "Punteggi calcolati con AI — valore indicativo" |
| ExportDrawer (prima del download) | "Documento generato con AI — l'utente e' responsabile della revisione" |

Stile label: DM Sans 400 11px `--color-text-muted`, icona Phosphor `Robot` 12px, allineata in basso a sinistra della sezione.

**5.3 — Disclaimer pre-download**

Nel ExportDrawer, prima del pulsante "Scarica PDF", aggiungere:

```
Scaricando questo documento confermi di averlo revisionato
e ne assumi la responsabilita'. Verso non garantisce
l'accuratezza dei contenuti generati dall'AI.
```

Stile: DM Sans 400 11px `--color-text-muted`, padding 12px, sfondo `--color-surface`, border-radius 8px.

### Criteri di accettazione

- [ ] Banner AI visibile nell'onboarding (step 1)
- [ ] Label "Generato con AI" negli step 2, 3, 4 del wizard
- [ ] Disclaimer pre-download nel ExportDrawer
- [ ] Tutti i testi in italiano
- [ ] Stile coerente con il brand system (dark mode)
- [ ] Le label non sono invasive (non bloccano il flusso, solo informative)

---

## Story 6 — Cookie banner conforme

### Cosa fare

Implementare un cookie banner conforme alle linee guida del Garante Privacy italiano (Provvedimento luglio 2021).

**Dato che Verso attualmente NON usa cookie analitici ne' di profilazione**, il banner serve come infrastruttura pronta e per i cookie tecnici.

**Layout del banner (bottom della pagina, overlay):**

```
┌─────────────────────────────────────────────────────────────┐
│  Questo sito usa cookie tecnici necessari al funzionamento. │
│  Per saperne di piu', consulta la nostra [Cookie Policy].   │
│                                                             │
│  [Accetta necessari]                                        │
└─────────────────────────────────────────────────────────────┘
```

**Se in futuro si aggiungono analytics:**
```
┌──────────────────────────────────────────────────────────────┐
│  Questo sito usa cookie tecnici e, con il tuo consenso,     │
│  cookie analitici per migliorare il servizio.                │
│  Per saperne di piu': [Cookie Policy]                        │
│                                                              │
│  [Accetta tutti]    [Solo necessari]    [Gestisci preferenze]│
└──────────────────────────────────────────────────────────────┘
```

**Regole (Garante italiano + EDPB):**
- "Accetta tutti" e "Solo necessari" con **uguale evidenza** (stesso stile, stessa dimensione — NO dark pattern)
- Nessun cookie non tecnico prima del consenso
- La "X" di chiusura equivale a "Solo necessari" (non ad "Accetta")
- Il banner non riappare se l'utente ha gia' scelto (salvare preferenza in localStorage + `consent_logs`)
- Link a `/cookie-policy` si apre in nuovo tab

**Gestione preferenze:**
- Accessibile anche dopo la scelta iniziale, dal footer dell'app o dalle impostazioni
- Mostra toggle per ogni categoria di cookie
- "Cookie tecnici" sempre attivo (non disattivabile, con spiegazione)

**Salvataggio:**
- In `localStorage`: `verso_cookie_consent = { technical: true, analytics: false, timestamp: "..." }`
- In `consent_logs` (se utente autenticato): `consent_type: 'analytics_cookies'`

**Stile:**
- Banner fisso in basso, sfondo `--color-surface`, bordo superiore `--color-border`
- Padding 16px 24px, max-width 600px centrato, border-radius 12px (top)
- Testo: DM Sans 400 13px `--color-text-secondary`
- Pulsanti: stile `Button` standard dell'app

### Criteri di accettazione

- [ ] Banner visibile alla prima visita
- [ ] "Accetta necessari" chiude il banner e salva la scelta
- [ ] Il banner non riappare dopo la scelta
- [ ] Link a /cookie-policy funzionante
- [ ] Nessun dark pattern (pulsanti con uguale evidenza)
- [ ] Preferenza salvata in localStorage
- [ ] Se utente autenticato: consenso salvato anche in `consent_logs`
- [ ] La "X" equivale a "Solo necessari"

---

## Story 7 — Cancellazione account e diritto all'oblio (art. 17 GDPR)

### Cosa fare

Implementare la funzionalita' di cancellazione account completa, con eliminazione di tutti i dati personali.

**Dove:** Nella pagina Impostazioni (se gia' implementata) oppure come pulsante nella dashboard (sezione profilo / CV card).

**Se le impostazioni non esistono ancora**, aggiungere temporaneamente un link "Elimina account" nel menu laterale (sidebar) o nel dropdown del profilo, in fondo, con stile `text-destructive`.

**Flusso di cancellazione:**

1. L'utente clicca "Elimina account"
2. Si apre un AlertDialog:

```
┌─────────────────────────────────────────────────────┐
│  Eliminare il tuo account?                          │
│                                                     │
│  Questa azione e' irreversibile.                    │
│  Verranno eliminati permanentemente:                │
│  • Il tuo profilo e le credenziali                  │
│  • Il CV master e tutti i CV adattati               │
│  • Tutte le candidature, note e punteggi            │
│  • I file PDF generati                              │
│  • Le aspettative retributive                       │
│                                                     │
│  Per confermare, scrivi "ELIMINA" nel campo qui     │
│  sotto.                                             │
│                                                     │
│  [_______________]                                  │
│                                                     │
│  [Annulla]                    [Elimina account]     │
└─────────────────────────────────────────────────────┘
```

3. Il pulsante "Elimina account" si attiva solo quando l'utente scrive "ELIMINA"
4. Al click, esegue in ordine:

```typescript
// 1. Elimina file da Storage
const { data: cvFiles } = await supabase.storage.from('cv-uploads').list(user.id);
if (cvFiles?.length) {
  await supabase.storage.from('cv-uploads').remove(cvFiles.map(f => `${user.id}/${f.name}`));
}
const { data: exportFiles } = await supabase.storage.from('cv-exports').list(user.id);
if (exportFiles?.length) {
  await supabase.storage.from('cv-exports').remove(exportFiles.map(f => `${user.id}/${f.name}`));
}

// 2. Elimina tailored_cvs (dipende da applications)
const { data: apps } = await supabase.from('applications').select('id').eq('user_id', user.id);
if (apps?.length) {
  const appIds = apps.map(a => a.id);
  await supabase.from('tailored_cvs').delete().in('application_id', appIds);
}

// 3. Elimina applications
await supabase.from('applications').delete().eq('user_id', user.id);

// 4. Elimina master_cvs
await supabase.from('master_cvs').delete().eq('user_id', user.id);

// 5. Registra la cancellazione nei consent_logs
await supabase.from('consent_logs').insert({
  user_id: user.id,
  consent_type: 'account_deletion',
  consent_version: '1.0',
  granted: true,
  method: 'settings',
  metadata: { deletion_requested_at: new Date().toISOString() }
});

// 6. Elimina il profilo
await supabase.from('profiles').delete().eq('id', user.id);

// 7. Logout
await supabase.auth.signOut();
```

5. Redirect a `/login` con toast: "Account eliminato. I tuoi dati sono stati cancellati."

**Nota:** La cancellazione dell'utente da `auth.users` potrebbe richiedere una edge function con service role. Se non possibile client-side, creare una edge function `delete-account` che riceve il token dell'utente, verifica l'identita', e chiama `supabase.auth.admin.deleteUser(userId)`.

### Criteri di accettazione

- [ ] Pulsante "Elimina account" accessibile (impostazioni o sidebar)
- [ ] AlertDialog con conferma "ELIMINA" prima della cancellazione
- [ ] Tutti i dati eliminati: profilo, CV, candidature, tailored_cvs, file Storage
- [ ] Consensi di cancellazione registrati in `consent_logs`
- [ ] L'utente viene disconnesso e reindirizzato a `/login`
- [ ] Toast di conferma dopo l'eliminazione
- [ ] L'azione e' irreversibile e chiaramente comunicata

---

## Story 8 — Export dati personali (art. 20 GDPR — Portabilita')

### Cosa fare

Implementare una funzione "Esporta i miei dati" che genera un file ZIP con tutti i dati dell'utente in formato leggibile.

**Dove:** Nella pagina Impostazioni (se esiste) oppure nella dashboard, nella CV card, con un pulsante secondario "Esporta i miei dati".

**Contenuto del file ZIP:**

```
verso-export-[data]/
├── profilo.json          ← dati da profiles (nome, email, salary_expectations)
├── cv-master.json        ← parsed_data da master_cvs
├── candidature.json      ← tutte le applications (company, role, status, notes, scores, date)
├── cv-adattati/
│   ├── [azienda]-[ruolo].json  ← tailored_data da tailored_cvs
│   └── ...
├── consensi.json         ← tutti i record da consent_logs
└── README.txt            ← spiegazione del contenuto
```

**README.txt:**
```
Export dei dati personali di Verso
Data export: [data e ora]
Utente: [nome] ([email])

Questo archivio contiene tutti i dati personali associati al tuo account Verso,
ai sensi dell'art. 20 del Regolamento (UE) 2016/679 (GDPR).

File inclusi:
- profilo.json: i tuoi dati anagrafici e preferenze
- cv-master.json: il tuo CV master (dati strutturati)
- candidature.json: tutte le tue candidature con stati, note e punteggi
- cv-adattati/: i CV adattati per ogni candidatura
- consensi.json: lo storico dei consensi prestati

Per domande: [email privacy]
```

**Implementazione:**
- Usare JSZip (gia' nel bundle o da aggiungere) per creare il file ZIP client-side
- Fetch tutti i dati in parallelo, poi componi il ZIP
- Download automatico del file

### Criteri di accettazione

- [ ] Pulsante "Esporta i miei dati" accessibile
- [ ] Genera un file ZIP con tutti i dati personali
- [ ] Il file contiene: profilo, CV master, candidature, CV adattati, consensi
- [ ] I file JSON sono leggibili (formattati con indentazione)
- [ ] Il README spiega il contenuto
- [ ] Il download parte automaticamente dopo la generazione
- [ ] Funziona anche con molte candidature (nessun timeout)

---

## Story 9 — Sezione Privacy nelle Impostazioni

### Prerequisiti

Questa story richiede che la pagina Impostazioni (`/app/impostazioni`) esista (Epic 08). Se non ancora implementata, creare una pagina minimale con solo la sezione Privacy.

### Cosa fare

Nella pagina Impostazioni, aggiungere una sezione "Privacy e Dati" che mostra:

**9.1 — Consensi prestati**

Lista di tutti i consensi con stato e data:

```
┌─────────────────────────────────────────────────────┐
│  Privacy e Dati                                     │
│                                                     │
│  Consensi                                           │
│  ─────────────────────────────────────────────────  │
│  ✓ Termini e Condizioni v1.0    12 mar 2026         │
│  ✓ Informativa Privacy v1.0     12 mar 2026         │
│  ✓ Dati sensibili nel CV v1.0   12 mar 2026         │
│                                                     │
│  Documenti legali                                   │
│  ─────────────────────────────────────────────────  │
│  [Termini e Condizioni]                             │
│  [Informativa Privacy]                              │
│  [Cookie Policy]                                    │
│                                                     │
│  I tuoi dati                                        │
│  ─────────────────────────────────────────────────  │
│  [Esporta tutti i miei dati]     ← ZIP download     │
│  [Gestisci cookie]               ← riapre banner    │
│                                                     │
│  Zona pericolosa                                    │
│  ─────────────────────────────────────────────────  │
│  [Elimina account]               ← rosso            │
└─────────────────────────────────────────────────────┘
```

**Stile:**
- Sezione con card, sfondo `--color-card`, bordo `--color-border`
- Titolo sezione: DM Sans 600 16px
- Elementi: DM Sans 400 14px
- Check verde per consensi attivi
- "Zona pericolosa" con bordo `--color-destructive/30`

### Criteri di accettazione

- [ ] Sezione "Privacy e Dati" visibile nelle impostazioni
- [ ] Lista consensi con data e stato
- [ ] Link ai documenti legali funzionanti
- [ ] Pulsante "Esporta i miei dati" funzionante (richiama Story 8)
- [ ] Pulsante "Gestisci cookie" riapre il banner cookie
- [ ] Pulsante "Elimina account" funzionante (richiama Story 7)

---

## Story 10 — Footer legale e link accessibili

### Cosa fare

Aggiungere un footer minimale con i link legali in tutte le pagine dell'app.

**Nelle pagine pubbliche (login, termini, privacy, cookie-policy):**

```
Verso · [Termini] · [Privacy] · [Cookie] · © 2026
```

Posizionato in fondo alla pagina, centrato, DM Sans 400 11px `--color-text-muted`.

**Nelle pagine dell'app (dentro il layout autenticato):**

Aggiungere nella sidebar (desktop) in fondo, sotto tutti i menu items:

```
[Termini] · [Privacy] · [Cookie]
```

DM Sans 400 10px `--color-text-muted`, padding bottom 16px.

Su mobile (tab bar), i link legali sono accessibili dalla sezione Privacy nelle Impostazioni (Story 9).

### Criteri di accettazione

- [ ] Footer legale visibile nelle pagine pubbliche
- [ ] Link legali nella sidebar desktop
- [ ] Tutti i link portano alle pagine corrette
- [ ] Lo stile e' discreto e non invasivo
- [ ] I link funzionano sia autenticati che non

---

## Riepilogo stories

| # | Story | Tipo | Priorita' |
|---|-------|------|-----------|
| 1 | Tabella consent_logs | Database | P0 — prerequisito |
| 2 | Pagine legali (T&C, Privacy, Cookie Policy) | Frontend | P0 |
| 3 | Consensi in registrazione | Frontend + DB | P0 |
| 4 | Consenso dati sensibili pre-upload CV | Frontend + DB | P0 |
| 5 | Trasparenza AI: disclaimer e label | Frontend | P0 |
| 6 | Cookie banner | Frontend + DB | P0 |
| 7 | Cancellazione account (diritto all'oblio) | Frontend + Backend | P0 |
| 8 | Export dati (portabilita' GDPR) | Frontend | P1 |
| 9 | Sezione Privacy nelle Impostazioni | Frontend | P1 |
| 10 | Footer legale | Frontend | P2 |

---

## Nota per lo sviluppo

> Tutti i testi legali sono in **italiano**. I placeholder `[Ragione Sociale]`, `[Indirizzo]`, `[P.IVA]`, `[email privacy]`, `[email support]` vanno sostituiti con i dati reali prima della pubblicazione.
>
> I documenti legali (T&C, Privacy, Cookie Policy) devono essere revisionati da un avvocato abilitato prima della pubblicazione in produzione.
>
> La classificazione EU AI Act (alto rischio, Allegato III punto 4) richiede documentazione tecnica aggiuntiva da preparare entro agosto 2026.
