# Epic 12 — Event Tracking

## Obiettivo

Tracciare gli eventi chiave del funnel per poter misurare conversione, drop-off e engagement. Senza dati non si puo' ottimizzare nulla.

Approccio leggero: una tabella `user_events` in Supabase con insert fire-and-forget. Nessun servizio esterno.

## Comportamento

### Tabella `user_events`

```sql
CREATE TABLE user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  event_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

RLS: nessun accesso utente. Solo service_role puo' leggere (admin).

### Eventi da tracciare

| Evento | Quando | `event_data` |
|--------|--------|-------------|
| `signup_completed` | Dopo registrazione | `{ method: "email" \| "google" }` |
| `cv_uploaded` | CV master parsato con successo | `{ file_type: "pdf" }` |
| `wizard_started` | Step 0 del wizard | `{ is_draft_resume: bool }` |
| `wizard_step_completed` | Ogni step completato | `{ step: 0-5, step_name: "..." }` |
| `wizard_abandoned` | Utente esce dal wizard senza completare | `{ last_step: N }` |
| `upgrade_page_viewed` | Pagina /upgrade caricata | `{}` |
| `upgrade_completed` | `is_pro` diventa true | `{ source: "checkout" }` |
| `pdf_downloaded` | PDF scaricato in StepExport | `{ template: "classico" \| "minimal" \| ... }` |
| `application_status_changed` | Status candidatura cambiato | `{ from: "...", to: "..." }` |

### Hook `useTrackEvent`

```typescript
function useTrackEvent() {
  return (eventName: string, eventData?: Record<string, unknown>) => {
    supabase.from('user_events').insert({ event_name: eventName, event_data: eventData })
    // fire-and-forget, no await
  }
}
```

### Wizard abandonment

Rilevato con `beforeunload` o navigazione fuori dal wizard. Se l'utente e' su step N e non ha completato step 5, inserisci `wizard_abandoned`.

## Flussi

1. **Happy path** — Utente completa wizard → 7 eventi tracciati (started + 6 step_completed)
2. **Abbandono** — Utente esce a step 2 → `wizard_started` + 2 `step_completed` + `wizard_abandoned`
3. **Upgrade funnel** — `upgrade_page_viewed` → `upgrade_completed` (o nessun evento = drop-off)

## Criteri di accettazione

- [ ] Tabella `user_events` creata con migrazione
- [ ] RLS: nessun accesso utente (solo service_role)
- [ ] Hook `useTrackEvent` disponibile
- [ ] Almeno 9 eventi tracciati (lista sopra)
- [ ] Insert fire-and-forget (non blocca UI)
- [ ] `wizard_abandoned` rilevato su navigazione fuori dal wizard

## Stories

| ID | Story | Priorita' |
|----|-------|----------|
| 12.1 | Creare tabella `user_events` con migrazione e RLS | Must |
| 12.2 | Creare hook `useTrackEvent` e integrare signup + cv_uploaded | Must |
| 12.3 | Tracciare eventi wizard (started, step_completed, abandoned) | Must |
| 12.4 | Tracciare upgrade funnel (page_viewed, completed) e pdf_downloaded | Must |
| 12.5 | Tracciare application_status_changed | Should |
