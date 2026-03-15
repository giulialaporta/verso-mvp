# Epic 16 — Snellimento Consensi (Registrazione + Onboarding)

## Obiettivo

Ridurre i friction point legali da 4 a 1 nel journey signup → onboarding, mantenendo piena compliance GDPR. Oggi l'utente compie 5 azioni legali prima di vedere una feature. Dopo questa epic: 1 sola checkbox (art. 9 GDPR) posizionata nel contesto giusto.

---

## Cambio 1 — Signup: elimina le 2 checkbox

### Oggi

2 checkbox obbligatorie (T&C + Privacy) non pre-spuntate. CTA "Registrati" disabilitata finché entrambe non sono spuntate.

### Dopo

Nessuna checkbox. Testo informativo sotto il pulsante "Registrati":

> Creando un account accetti i [Termini e Condizioni](link) e confermi di aver letto l'[Informativa Privacy](link).

Il pulsante "Registrati" è abilitato appena il form è valido (nome + email + password). L'azione di registrarsi = accettazione contrattuale (Art. 6.1.b GDPR).

### Cosa cambia nel codice

- **`ConsentCheckboxes.tsx`**: il componente non viene più renderizzato nel form signup. Resta nel codebase per backward compatibility (usato altrove? no → eliminabile).
- **`Login.tsx`**: rimuovere gli state `acceptedTerms` e `acceptedPrivacy`. Rimuovere la condizione `consentsAccepted` dalla validazione `isFormValid`. Aggiungere il testo informativo sotto il bottone "Registrati".
- **`saveRegistrationConsents()`**: continua a essere chiamata dopo signup riuscito. I record `terms` e `privacy` vengono comunque inseriti in `consent_logs` — il metodo cambia da `"registration"` a `"registration_by_action"`.
- **Google OAuth**: rimuovere il blocco `if (isSignUp && !consentsAccepted)`. Il consenso viene salvato al ritorno OAuth come oggi (via `localStorage` pending flag).

### Comportamento

- Email signup: click "Registrati" → signup Supabase → `saveRegistrationConsents()` con `method: "registration_by_action"` → toast conferma email
- Google OAuth signup: click "Continua con Google" → redirect OAuth → al ritorno `saveRegistrationConsents()` con `method: "oauth_by_action"`
- Login (non signup): nessun cambiamento

---

## Cambio 2 — Cookie banner: da azione a notifica auto-dismiss

### Oggi

Banner sticky in basso con "Accetta necessari" + pulsante X.

### Dopo

Micro-banner informativo che si auto-chiude dopo 5 secondi o al primo scroll/click ovunque nella pagina:

> Questo sito usa solo cookie tecnici necessari al funzionamento. [Cookie Policy](link)

Nessun pulsante. Stile: compatto, opacità ridotta, scompare con fade-out.

### Cosa cambia nel codice

- **`CookieBanner.tsx`**: rimuovere il pulsante "Accetta necessari" e la X. Aggiungere auto-dismiss con `setTimeout(5000)` + listener `scroll`/`click` su `document`. Animazione fade-out (Framer Motion o CSS transition). Salvare in `localStorage` come oggi per non rimostrare.
- Se l'utente è autenticato: loggare `consent_type: "cookies"` con `method: "auto_dismiss"` in `consent_logs`.

### Comportamento

- Prima visita: banner appare in basso → dopo 5s o al primo scroll → fade-out → localStorage salvato
- Visite successive: nessun banner
- Impostazioni: `resetCookieConsent()` resta funzionante (rimostra il banner)

---

## Cambio 3 — Consenso art. 9: da modal a checkbox inline in Step 1

### Oggi

Modal `SensitiveDataConsent` (AlertDialog) appare tra Step 3 (preview) e il salvataggio in `master_cvs`. Contiene 3 paragrafi + checkbox + 2 pulsanti. Interrompe il flusso.

### Dopo

Checkbox inline nello **Step 1 (Upload)**, sotto l'area di drag & drop:

```
[Area drag & drop]

[ ] Il mio CV potrebbe contenere dati sensibili (salute,
    convinzioni, origine). Acconsento al trattamento per
    adattare il CV. Dettagli nell'Informativa Privacy.

[Analizza il mio CV] ← disabilitato senza checkbox
```

### Cosa cambia nel codice

- **Step 1 (Upload) nell'onboarding**: aggiungere checkbox sotto l'area upload. La CTA "Analizza il mio CV" è disabilitata finché la checkbox non è spuntata. Al click della CTA, salvare il consenso in `consent_logs` con `consent_type: "sensitive_data"`, `method: "inline_upload"`.
- **`SensitiveDataConsent.tsx`**: il modal non viene più usato nell'onboarding. Resta nel codebase solo se usato altrove (upload CV da dashboard?). Se non usato → eliminare.
- **`hasSensitiveDataConsent()`**: continua a funzionare. Se l'utente ha già dato il consenso (es. re-upload CV), la checkbox è pre-spuntata e la CTA è abilitata.
- **Step 3 (Preview)**: rimuovere il trigger del modal `SensitiveDataConsent`. Il "Continua" salva direttamente in `master_cvs` senza interruzioni.

### Comportamento

- Primo upload: checkbox visibile, non spuntata → utente spunta → click "Analizza" → consenso salvato → parsing parte
- Upload successivi: `hasSensitiveDataConsent()` ritorna true → checkbox pre-spuntata → CTA abilitata subito
- Revoca in Impostazioni: se revocato, al prossimo upload la checkbox torna non spuntata

---

## Flussi

### Happy path (nuovo utente)

1. Visita il sito → micro-banner cookie (auto-dismiss 5s)
2. Click "Registrati" → compila form → click "Registrati" → consensi T&C/Privacy loggati automaticamente
3. Conferma email → login
4. Redirect a onboarding → Step 1: upload CV + spunta art. 9 → click "Analizza"
5. Step 2: parsing → Step 3: preview/edit → Step 4: RAL → Dashboard

**Azioni legali esplicite: 1** (checkbox art. 9 nello step upload)

### Google OAuth (nuovo utente)

1. Micro-banner cookie (auto-dismiss)
2. Click "Continua con Google" → OAuth → ritorno → consensi T&C/Privacy loggati
3. Redirect a onboarding → Step 1: checkbox art. 9 + upload → resto del flusso

### Utente che torna (re-upload CV)

1. Dashboard → upload nuovo CV
2. `hasSensitiveDataConsent()` = true → checkbox pre-spuntata → upload immediato

---

## Criteri di accettazione

- [ ] Signup: nessuna checkbox T&C/Privacy, testo informativo sotto il bottone
- [ ] Signup: "Registrati" abilitato appena form valido (nome + email + password)
- [ ] Signup: consensi `terms` e `privacy` loggati in `consent_logs` con `method: "registration_by_action"`
- [ ] OAuth: "Continua con Google/Apple" non bloccato da checkbox
- [ ] OAuth: consensi loggati al ritorno con `method: "oauth_by_action"`
- [ ] Cookie banner: nessun pulsante, auto-dismiss dopo 5s o primo scroll
- [ ] Cookie banner: fade-out animato
- [ ] Cookie banner: consenso loggato se utente autenticato
- [ ] Onboarding Step 1: checkbox art. 9 GDPR inline sotto area upload
- [ ] Onboarding Step 1: CTA disabilitata senza checkbox
- [ ] Onboarding Step 1: consenso `sensitive_data` salvato in `consent_logs` al click CTA
- [ ] Onboarding Step 1: checkbox pre-spuntata se consenso già dato
- [ ] Onboarding Step 3: modal `SensitiveDataConsent` rimosso
- [ ] Nessuna regressione: `consent_logs` registra tutti i consensi come prima
- [ ] Tutti i link a /termini, /privacy, /cookie-policy funzionanti

---

## Stato implementazione (parziale)

Lovable ha implementato un approccio diverso dal proposto:
- **Signup:** 2 checkbox ridotte a 1 (T&C + Privacy combinate), non eliminate del tutto
- **OAuth:** `ConsentGate` post-login intercetta utenti senza consensi (safety net)
- **Cookie banner:** invariato (ancora con pulsante)
- **Art. 9 modal:** invariato (ancora modal separato in Step 3)

## Stories

| ID | Story | Priorita' | Stato |
|----|-------|----------|-------|
| 16.1 | Rimuovere checkbox T&C/Privacy dal signup, aggiungere testo informativo, aggiornare `saveRegistrationConsents` | Must | **Parziale** — 2→1 checkbox, non eliminate |
| 16.2 | Sbloccare OAuth senza checkbox, salvare consensi al ritorno | Must | **Fatto** — ConsentGate post-login |
| 16.3 | Cookie banner → notifica auto-dismiss (5s / scroll), rimuovere pulsanti | Must | Da fare |
| 16.4 | Checkbox art. 9 inline in Step 1 onboarding, rimuovere modal da Step 3 | Must | Da fare |
| 16.5 | Verificare che `hasSensitiveDataConsent` pre-spunti la checkbox per utenti esistenti | Should | Da fare |
