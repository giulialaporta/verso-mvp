# Epic 08 — Impostazioni

## Obiettivo

Pagina centralizzata per gestire account, integrazioni, provider AI, piano e notifiche.

---

## Comportamento

**Route:** `/app/impostazioni`

### Sezioni

**Account:**
- Modifica nome, email, foto profilo
- Cambio password
- Elimina account (modal conferma con warning plain language)

**Account collegati:**
- Stessa connection panel del profilo (Gmail, Outlook, LinkedIn)
- Card OAuth con logo, status, email connessa, "Disconnetti"

**Elaborazione documenti:**
- Toggle tra Claude (default) e OpenAI — visibile a tutti gli utenti
- Tooltip: "Scegli quale sistema di intelligenza artificiale usa Verso per creare i tuoi documenti"

**Il tuo piano:**
- Badge piano attuale (Gratis / Pro)
- Usage stats: adattamenti usati questo mese, candidature totali
- Se Free: upgrade CTA
- Se Pro: link "Gestisci abbonamento" → Stripe Portal

**Notifiche:**
- Toggle: Promemoria email per follow-up (default: on)
- Toggle: Riepilogo settimanale candidature (default: on)

---

## Flussi

1. **Cambio nome:** utente modifica nome → salva → `profiles` aggiornato
2. **Cambio provider AI:** utente seleziona OpenAI → `profiles.ai_provider` aggiornato → prossime generazioni usano OpenAI
3. **Elimina account:** utente clicca "Elimina" → modal conferma con warning → conferma → account eliminato + logout
4. **Disconnetti integrazione:** utente clicca "Disconnetti" su Gmail → OAuth revocato → `profiles.gmail_connected = false`

---

## Stati

| Componente | Stato | Descrizione |
|------------|-------|-------------|
| Campo account | viewing | Dati mostrati read-only |
| Campo account | editing | Campo editabile |
| Campo account | saving | Indicatore salvataggio |
| AI provider | claude | Toggle su Claude |
| AI provider | openai | Toggle su OpenAI |
| Delete modal | hidden | Non visibile |
| Delete modal | visible | Warning + pulsante conferma |
| Delete modal | deleting | Loading durante eliminazione |

---

## Criteri di accettazione

- [ ] Modifica nome, email, avatar funzionante
- [ ] Cambio password con validazione
- [ ] Elimina account con modal conferma e warning chiaro
- [ ] Card OAuth coerenti con panel profilo
- [ ] Toggle AI provider salva in `profiles.ai_provider`
- [ ] Badge piano + usage stats corretti
- [ ] CTA upgrade per free, link Stripe Portal per Pro
- [ ] Toggle notifiche funzionanti

---

## Stories

| ID | Story | Priorità |
|----|-------|----------|
| 08.1 | Sezione Account (nome, email, avatar, password) | Must |
| 08.2 | Elimina account con modal conferma | Must |
| 08.3 | Sezione Account collegati (OAuth cards) | Should |
| 08.4 | Toggle AI provider (Claude / OpenAI) | Should |
| 08.5 | Sezione Piano (badge, stats, CTA/portal link) | Must |
| 08.6 | Toggle notifiche | Should |
