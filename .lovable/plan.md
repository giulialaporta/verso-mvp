

# Aggiornamento Epic 07 — Verso Pro

## Modifiche al documento `docs/backlog/epic-07-verso-pro.md`

Aggiornare l'epic con la strategia rivista:

1. **Prezzo**: €9.99 → **€12.99/mese**
2. **Limite Free**: 1 candidatura → **3 candidature al mese** (conteggio mensile, reset il 1° del mese)
3. **Modello esteso**: aggiungere gate template (Free = Classico + Minimal, Pro = tutti) e gate export (Free = PDF, Pro = PDF + DOCX futuro)
4. **Sezione abbonamento**: spostare da "tra Account e Privacy" a **dentro la card Account** come sottosezione "Piano"
5. **Logica conteggio**: da `status != 'ko'` globale a `created_at >= inizio mese corrente AND status != 'ko'`

### Punti specifici da modificare nel documento

| Sezione | Prima | Dopo |
|---------|-------|------|
| Obiettivo | €9.99, 1 candidatura | €12.99, 3 candidature/mese |
| Tabella Modello | Free: 1 candidatura | Free: 3/mese, 2 template, PDF only. Pro: illimitate, tutti template, PDF+DOCX |
| Query limite | `count(*) WHERE status != 'ko'` | `count(*) WHERE status != 'ko' AND created_at >= date_trunc('month', now())` |
| Soglia | `count >= 1` | `count >= 3` |
| Banner copy | "1 candidatura" | "3 candidature questo mese" |
| Pagina /pro prezzo | €9.99 | €12.99 |
| Impostazioni | Sezione separata tra Account e Privacy | Sottosezione "Piano" dentro la card Account |
| Impostazioni Free | "Puoi creare 1 candidatura" | "Piano Free — 3 candidature/mese" + contatore uso |
| Impostazioni Pro | Sezione separata | Dentro Account: badge, rinnovo, "Gestisci abbonamento" |
| Criteri accettazione | "1 sola candidatura" | "3 candidature al mese" |

### File coinvolto

| File | Azione |
|------|--------|
| `docs/backlog/epic-07-verso-pro.md` | Riscrittura con nuova strategia |

