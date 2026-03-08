# Story 09.6 — Cookie Banner (Implementata)

**Epic:** 09 — Legal, Privacy, Trasparenza AI
**Status:** Completata

---

## Cosa è stato implementato

Banner cookie conforme GDPR con persistenza localStorage e logging in `consent_logs`.

### Comportamento

- Appare al primo accesso se nessuna preferenza salvata in `localStorage` (key: `verso_cookie_consent`)
- Posizione: fixed bottom center, max-width 560px, backdrop blur, z-50
- Testo: "Questo sito usa cookie tecnici necessari al funzionamento" + link a Cookie Policy
- Un solo pulsante: "Accetta necessari" (no analytics in v1)
- Pulsante X per chiudere (equivale ad accettare solo necessari)
- Al click: salva preferenze in localStorage + chiude banner
- Se utente autenticato: logga anche in `consent_logs` (type: analytics_cookies, method: cookie_banner)

### Funzioni esportate

- `resetCookieConsent()` — rimuove preferenze localStorage (usata in Impostazioni)
- `getCookieConsent()` — legge preferenze correnti

### Componente

`src/components/CookieBanner.tsx`
