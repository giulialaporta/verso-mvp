# Epic 15 — Verso Score + Honest Badge

## Obiettivo

Creare un punteggio composito unico ("Verso Score") che comunichi all'utente la forza della candidatura in modo immediato. Valorizzare l'honest_score come elemento differenziante: "il tuo CV e' stato adattato in modo onesto".

## Comportamento

### Verso Score

Formula: `verso_score = match_score * 0.4 + ats_score * 0.35 + honest_score * 0.25`

Arrotondato a intero (0-100). Mostrato come numero grande con anello circolare animato.

| Range | Label | Colore |
|-------|-------|--------|
| 0-40 | Da migliorare | Rosso |
| 41-65 | Buono | Giallo |
| 66-85 | Forte | Verde |
| 86-100 | Eccellente | Accent |

### Dove appare

1. **StepCompleta (step 5 wizard)** — Verso Score grande al centro, con breakdown (match, ATS, honest) sotto
2. **Card candidatura** — Verso Score compatto al posto dei 2 score separati (match + ATS). Hover/tap mostra breakdown
3. **Dashboard Home** — Media Verso Score nelle stats bar (al posto di "match score medio")

### Honest Badge

Accanto al Verso Score, se `honest_score >= 85`: badge "CV Onesto" con icona shield/checkmark. Colore accent.

Tooltip: "Il tuo CV e' stato adattato senza informazioni inventate o esagerate."

Se `honest_score < 85`: nessun badge (non penalizzare visivamente).

### Calcolo

Il Verso Score viene calcolato nel frontend (i 3 score sono gia' disponibili in `tailored_cvs`). Non serve salvataggio aggiuntivo.

## Flussi

1. **Wizard completo** — Step 5 mostra Verso Score grande + breakdown + badge se honest >= 85
2. **Lista candidature** — Ogni card mostra Verso Score compatto
3. **Dashboard** — Stats bar mostra media Verso Score

## Criteri di accettazione

- [ ] Verso Score calcolato con formula `match*0.4 + ats*0.35 + honest*0.25`
- [ ] Anello circolare animato in StepCompleta
- [ ] Breakdown visibile (match, ATS, honest) sotto lo score
- [ ] Badge "CV Onesto" se honest_score >= 85
- [ ] Card candidatura mostra Verso Score compatto
- [ ] Stats bar in dashboard mostra media Verso Score
- [ ] Colori e label per range (rosso/giallo/verde/accent)

## Stories

| ID | Story | Priorita' |
|----|-------|----------|
| 15.1 | Componente `VersoScore` con anello circolare animato e breakdown | Must |
| 15.2 | Integrare Verso Score in StepCompleta e card candidatura | Must |
| 15.3 | Badge "CV Onesto" con tooltip | Must |
| 15.4 | Media Verso Score nella stats bar della dashboard | Should |
