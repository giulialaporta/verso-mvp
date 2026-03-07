# Epic 08 — Impostazioni

## Obiettivo

Pagina centralizzata per gestire account, integrazioni e notifiche.

> **Nota:** Verso e' gratuita per tutti — nessun piano, paywall o billing.

---

## Comportamento

**Route:** `/app/impostazioni`

### Sezioni

**Account:**
- Modifica nome, email, foto profilo
- Cambio password
- Elimina account (modal conferma con warning plain language)

**Account collegati:**
- Card OAuth con logo, status, email connessa, "Disconnetti"
- Google (collegato via signup o connesso dopo)

**Statistiche:**
- Candidature totali
- Candidature per stato
- Score medio di match

**Notifiche:**
- Toggle: Promemoria email per follow-up (default: on)
- Toggle: Riepilogo settimanale candidature (default: on)

---

## Flussi

1. **Cambio nome:** utente modifica nome → salva → `profiles` aggiornato
2. **Cambio password:** utente inserisce vecchia + nuova password → validazione → Supabase auth aggiornato
3. **Elimina account:** utente clicca "Elimina" → modal conferma con warning → conferma → account eliminato + logout
4. **Disconnetti Google:** utente clicca "Disconnetti" → OAuth revocato

---

## Stati

| Componente | Stato | Descrizione |
|------------|-------|-------------|
| Campo account | viewing | Dati mostrati read-only |
| Campo account | editing | Campo editabile |
| Campo account | saving | Indicatore salvataggio |
| Delete modal | hidden | Non visibile |
| Delete modal | visible | Warning + pulsante conferma |
| Delete modal | deleting | Loading durante eliminazione |

---

## Criteri di accettazione

- [ ] Modifica nome, email, avatar funzionante
- [ ] Cambio password con validazione
- [ ] Elimina account con modal conferma e warning chiaro
- [ ] Card Google OAuth con stato connessione
- [ ] Statistiche candidature corrette
- [ ] Toggle notifiche funzionanti

---

## Stories

| ID | Story | Priorita' |
|----|-------|----------|
| 08.1 | Sezione Account (nome, email, avatar, password) | Must |
| 08.2 | Elimina account con modal conferma | Must |
| 08.3 | Sezione Account collegati (Google OAuth) | Should |
| 08.4 | Sezione Statistiche | Should |
| 08.5 | Toggle notifiche | Should |
