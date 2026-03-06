# Epic 07 — Freemium e Piano

## Obiettivo

Implementare il modello freemium: limiti per utenti free, gate per feature Pro, modal upgrade, pricing page e integrazione Stripe per i pagamenti.

---

## Comportamento

### Limiti Free

| Risorsa | Limite |
|---------|--------|
| Adattamenti CV + cover letter | 3 al mese (reset cron primo del mese) |
| Candidature nel tracker | Max 10 |
| Template CV | 2 (Verso Classico + Verso Essenziale) |
| Link condivisibile | No |
| Sync email | No |
| Suggerimenti corsi | No |

### Pro sblocca

- Adattamenti illimitati
- Candidature illimitate
- Tutti i template (8+)
- Link CV condivisibile con slug personalizzato
- Sync Gmail e Outlook
- Suggerimenti corsi personalizzati
- Import LinkedIn
- Priorità elaborazione AI

### Prompt upgrade

**Limite tailoring raggiunto:**
- Modal con counter: "Hai usato 3 adattamenti su 3 questo mese"
- Non è un blocco hard — CTA upgrade prominente
- Mostra cosa sblocca Pro

**Feature Pro tentata da utente free:**
- Lock icon inline + tooltip "Disponibile con Verso Pro"
- Tap → upgrade modal con dettagli piano

### Pricing page

- Route: `/pricing` (marketing, fuori dall'app shell)
- Layout: 2 colonne — Gratis vs Pro
- Prezzo annuale mostrato di default con toggle per mensile
- €12.99/mese o €99/anno

### Pagamenti

- Stripe via Supabase extension
- Webhook per eventi subscription → aggiorna `profiles.plan`
- Link a Stripe Customer Portal per gestione abbonamento

---

## Flussi

1. **Upgrade da modal:** utente free raggiunge limite → modal → "Passa a Pro" → Stripe Checkout → pagamento → plan aggiornato → feature sbloccate
2. **Upgrade da pricing:** utente visita `/pricing` → sceglie Pro → Stripe Checkout → redirect app
3. **Gestione abbonamento:** utente Pro va in Settings → "Gestisci abbonamento" → Stripe Portal → cancella/modifica
4. **Reset mensile:** cron job primo del mese → azzera `tailoring_count_this_month` per tutti gli utenti

---

## Stati

| Componente | Stato | Descrizione |
|------------|-------|-------------|
| Piano | free | Limiti attivi, badge "Gratis" |
| Piano | pro | Tutto sbloccato, badge "Pro" |
| Modal upgrade | visible | Counter + CTA + dettagli Pro |
| Checkout | processing | Redirect a Stripe |
| Checkout | success | Plan aggiornato, redirect app |
| Checkout | failed | Messaggio errore + retry |
| Feature locked | locked | Lock icon + tooltip |
| Feature locked | unlocked | Feature accessibile |

---

## Criteri di accettazione

- [ ] Counter tailoring tracciato in `profiles.tailoring_count_this_month`
- [ ] Modal upgrade appare al 4° tentativo di tailoring (free)
- [ ] Lock icon su feature Pro per utenti free
- [ ] Pricing page con toggle mensile/annuale
- [ ] Stripe Checkout funzionante
- [ ] Webhook aggiorna `profiles.plan` su subscription change
- [ ] Stripe Portal accessibile per utenti Pro
- [ ] Cron reset counter a inizio mese
- [ ] Max 10 candidature per utenti free

---

## Stories

| ID | Story | Priorità |
|----|-------|----------|
| 07.1 | Tracking tailoring count + reset cron mensile | Must |
| 07.2 | Modal upgrade con counter e CTA | Must |
| 07.3 | Lock icon + tooltip su feature Pro | Must |
| 07.4 | Pricing page (2 colonne, toggle mensile/annuale) | Must |
| 07.5 | Integrazione Stripe Checkout | Must |
| 07.6 | Webhook Stripe → aggiornamento profiles.plan | Must |
| 07.7 | Link a Stripe Customer Portal | Should |
| 07.8 | Limite max 10 candidature per free | Must |
