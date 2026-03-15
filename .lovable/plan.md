

## Problema

Ci sono due bug correlati nel flusso social login:

1. **Consensi non salvati per OAuth**: il flag `verso_pending_oauth_consents` viene impostato solo quando `isSignUp === true`, ma l'utente potrebbe cliccare "Continua con Google" in modalita login (default). Un nuovo utente OAuth non ottiene mai i record `terms`/`privacy` in `consent_logs`.

2. **Nessun gate post-login**: anche se il flag venisse impostato correttamente, se il salvataggio fallisce (es. race condition, errore rete), l'utente entra in app senza aver accettato nulla.

3. **Bug secondario in Impostazioni**: la pagina cerca `consent_type = "terms_and_privacy"` ma i consensi vengono salvati come due record separati (`terms` e `privacy`), quindi lo stato risulta sempre "non concesso".

## Piano

### 1. Checkbox pre-redirect nella pagina Login

Quando `isSignUp === true`:
- Mostrare checkbox obbligatoria "Accetto i Termini e l'Informativa Privacy" sopra i pulsanti OAuth
- Disabilitare i pulsanti "Continua con Google/Apple" finche non e spuntata
- Mantenere il flag `localStorage` prima del redirect

### 2. Consent wall post-login (componente nuovo)

Creare un componente `ConsentGate` che wrappa le route protette:
- Dopo il login (email o OAuth), prima di mostrare l'app, controlla se l'utente ha record `terms` + `privacy` in `consent_logs`
- Se mancano: mostra una schermata fullscreen con testo + checkbox + pulsante "Accetta e continua"
- Al click: salva i consensi in `consent_logs` con method `"post_login_gate"`
- Solo dopo l'accettazione l'utente accede alla route protetta

**Posizionamento**: dentro `ProtectedRoute`, dopo il check auth ma prima di renderizzare `children`.

### 3. Fix Impostazioni

Cambiare `getConsentStatus("terms_and_privacy")` in `getConsentStatus("terms")` per allinearsi ai consent_type effettivamente salvati.

### File coinvolti

| File | Modifica |
|------|----------|
| `src/pages/Login.tsx` | Aggiungere checkbox T&C visibile in signup mode, disabilitare OAuth senza checkbox |
| `src/components/ConsentGate.tsx` | **Nuovo** - Consent wall post-login che verifica e richiede consensi mancanti |
| `src/components/ProtectedRoute.tsx` | Integrare `ConsentGate` come wrapper |
| `src/pages/Impostazioni.tsx` | Fix `terms_and_privacy` → `terms` |

### Flusso risultante

```text
Nuovo utente (signup mode):
  1. Spunta checkbox T&C → abilita OAuth
  2. Click "Continua con Google" → localStorage flag → redirect
  3. Ritorno su /login → salva consensi da flag
  4. ConsentGate: verifica DB → consensi presenti → entra in app

Nuovo utente (login mode, primo accesso OAuth):
  1. Click "Continua con Google" → redirect (no flag)
  2. Ritorno → nessun flag → consensi NON salvati
  3. ConsentGate: verifica DB → consensi MANCANTI → consent wall
  4. Utente accetta → consensi salvati → entra in app

Utente esistente:
  1. Login → ConsentGate: consensi presenti → entra subito
```

