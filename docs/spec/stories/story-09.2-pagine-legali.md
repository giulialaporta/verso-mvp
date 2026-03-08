# Story 09.2 — Pagine Legali (Implementata)

**Epic:** 09 — Legal, Privacy, Trasparenza AI
**Status:** Completata

---

## Cosa è stato implementato

Tre pagine legali statiche con layout condiviso (`LegalLayout`): Termini di Servizio, Privacy Policy, Cookie Policy.

### Pagine

| Route | Componente | Contenuto |
|-------|-----------|-----------|
| `/termini` | `Termini.tsx` | 10 articoli: oggetto, servizio, limiti AI, account, obblighi, contenuti, IP, disponibilità, responsabilità, legge |
| `/privacy` | `Privacy.tsx` | Informativa completa art. 13-14 GDPR: titolare, dati trattati, finalità, basi giuridiche, diritti, retention |
| `/cookie-policy` | `CookiePolicy.tsx` | Tipologie cookie, durata, gestione preferenze |

### Layout condiviso

`LegalLayout` (`src/components/LegalLayout.tsx`):
- Header sticky con logo e link "Torna all'app" / "Torna al login" (condizionale su auth)
- Sidebar TOC navigabile (desktop only)
- Contenuto in card con prose styling
- Footer con versione e data ultimo aggiornamento

### Comportamento

- Accessibili sia da utenti autenticati che non autenticati
- Link presenti in: footer registrazione, pagina impostazioni, cookie banner
