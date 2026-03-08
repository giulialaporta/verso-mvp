# P2 — Miglioramenti UX (7 stories)

> **Prerequisiti:** P0 completato, P1 stories 1-3 completate.
> **Ogni story e' un prompt autonomo per Lovable.**

---

## Story P2.1 — Pagina 404 in italiano

### Problema

La pagina 404 (`src/pages/NotFound.tsx`) e' in inglese, ma tutta l'app e' in italiano.

### Cosa fare

Modificare `src/pages/NotFound.tsx`:
- Titolo: "404" (resta)
- Messaggio: "Pagina non trovata"
- Link: "Torna alla Home" con href a `/app/home`
- Stile coerente con il brand system (dark mode, font DM Sans, accent `#A8FF78`)

### Criteri di accettazione

- [ ] Pagina 404 completamente in italiano
- [ ] Stile coerente con il resto dell'app (dark mode)
- [ ] Link riporta alla home

---

## Story P2.2 — Rimuovere pagina Index.tsx placeholder

### Problema

`src/pages/Index.tsx` contiene un placeholder "Welcome to Your Blank App" e non e' referenziato da nessuna route. E' codice morto.

### Cosa fare

- Eliminare `src/pages/Index.tsx`
- Verificare che nessun import o route lo referenzi
- Se la route `/` punta a Index, farla puntare a un redirect verso `/login` o `/app/home`

### Criteri di accettazione

- [ ] Il file `Index.tsx` non esiste piu'
- [ ] Nessun errore di import nell'app
- [ ] La route `/` funziona correttamente (redirect)

---

## Story P2.3 — Diff view originale vs adattato

### Problema

Dopo il tailoring, l'utente non vede cosa e' stato modificato rispetto al CV originale. Deve fidarsi ciecamente dell'AI.

### Cosa fare

Nello step 4 (Analisi e Score) del wizard `/app/nuova`, aggiungere una sezione "Modifiche apportate" che mostra:

**Per ogni patch applicata:**
- Il campo modificato (es. "Summary", "Esperienza #2 - bullet 3")
- Il valore originale (barrato o in rosso tenue)
- Il valore nuovo (in verde tenue)
- La motivazione della modifica (`reason` dalla patch)

**Per le structural changes:**
- Esperienze rimosse (con motivo)
- Riordini effettuati

**Layout:**
- Sezione collassabile, aperta di default
- Scrollabile se ci sono molte modifiche

I dati sono gia' disponibili nell'output di `ai-tailor`: `patches` (con `path`, `value`, `reason`) e `structural_changes`.

### Criteri di accettazione

- [ ] Le modifiche sono visibili nello step 4 del wizard
- [ ] Ogni modifica mostra: campo, valore originale, valore nuovo, motivo
- [ ] Le rimozioni strutturali sono elencate con motivo
- [ ] La sezione e' collassabile
- [ ] Funziona su mobile

---

## Story P2.4 — Edit CV master dalla dashboard (senza ri-upload)

### Problema

Per modificare il CV master, l'utente deve caricare un nuovo PDF. Non puo' correggere un errore di parsing o aggiungere un'esperienza senza rifare tutto.

### Cosa fare

Nella dashboard (`/app/home`), nella CV card, aggiungere un pulsante "Modifica CV".

Click → apre una pagina o modale con lo stesso componente `CVSections` + editing inline usato nello step 3 dell'onboarding:
- `InlineEdit` per campi testo
- `EditableSkillChips` per skill
- `EditItemDrawer` per editing dettagliato

Pulsante "Salva modifiche" → aggiorna `master_cvs.parsed_data` nel database.

### Criteri di accettazione

- [ ] Pulsante "Modifica CV" visibile nella CV card della dashboard
- [ ] Si apre l'editor con tutti i dati del CV corrente
- [ ] Tutti i campi sono modificabili (stesso comportamento dell'onboarding step 3)
- [ ] Le modifiche vengono salvate in `master_cvs.parsed_data`
- [ ] Dopo il salvataggio, la dashboard si aggiorna
- [ ] Funziona su mobile

---

## Story P2.5 — Pagina dettaglio candidatura

### Problema

Non esiste una pagina dedicata per vedere tutti i dettagli di una candidatura. L'utente vede solo la card nella lista + il drawer con stato e note.

### Cosa fare

Creare una pagina `/app/candidatura/:id` che mostra:

**Header:**
- Ruolo + Azienda
- Status chip (modificabile)
- Data creazione

**Sezione Score:**
- Match score con barra
- ATS score con i 7 check dettagliati
- Honest score con contatori

**Sezione CV adattato:**
- Preview dei dati del CV adattato (da `tailored_cvs.tailored_data`)
- Diff rispetto all'originale (se Story P2.3 e' implementata)

**Sezione Annuncio:**
- Dati dell'annuncio (azienda, ruolo, requisiti, skill richieste)

**Azioni:**
- Scarica PDF
- Cambia status
- Note (campo testo)
- Elimina candidatura

**Navigazione:**
- Click su una card nella pagina Candidature → apre questa pagina (invece del drawer)
- Back button → torna alla lista

### Criteri di accettazione

- [ ] La pagina `/app/candidatura/:id` esiste e mostra tutti i dati
- [ ] Score, ATS checks e honest score sono visibili
- [ ] Il CV adattato e' leggibile
- [ ] I dati dell'annuncio sono visibili
- [ ] Tutte le azioni funzionano (download, status, note, elimina)
- [ ] Responsive su mobile
- [ ] Click dalla lista candidature porta a questa pagina

---

## Story P2.6 — Skeleton loading states uniformi

### Problema

I loading states non sono uniformi nell'app. Alcune pagine mostrano skeleton, altre spinner, altre niente.

### Cosa fare

Creare un componente `PageSkeleton` riutilizzabile e applicarlo a:
- Dashboard home (durante il fetch dei dati)
- Pagina candidature (durante il fetch della lista)
- Pagina dettaglio candidatura (se implementata)

Il skeleton deve seguire il brand system: background `#141518`, pulse animation sugli elementi placeholder.

### Criteri di accettazione

- [ ] Dashboard mostra skeleton durante il caricamento
- [ ] Pagina candidature mostra skeleton durante il caricamento
- [ ] Lo skeleton ha stile coerente con il brand system
- [ ] Nessuna pagina mostra un blank/bianco durante il caricamento

---

## Story P2.7 — Toast/notifiche uniformi

### Problema

Il feedback sulle azioni (salvataggio, errori, successo) non e' sempre presente o coerente.

### Cosa fare

Verificare che tutte le azioni principali mostrino un toast di feedback:
- Salvataggio CV master → "CV salvato"
- Cambio status candidatura → "Status aggiornato"
- Eliminazione candidatura → "Candidatura eliminata"
- Eliminazione CV → "CV eliminato"
- Errori di rete → "Errore di connessione, riprova"
- Salvataggio note → "Nota salvata"

Usare il sistema toast gia' presente (`sonner` / `use-toast`). Tutti i messaggi in italiano.

### Criteri di accettazione

- [ ] Ogni azione di salvataggio mostra un toast di conferma
- [ ] Ogni errore mostra un toast di errore
- [ ] Tutti i messaggi sono in italiano
- [ ] I toast hanno stile coerente (dark mode)
