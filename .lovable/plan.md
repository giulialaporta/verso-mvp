

# Piano: Selettore lingua CV + Toggle skill mancanti

## Due modifiche in `src/pages/Nuova.tsx`

### 1. Selettore lingua CV (Step 2 — StepTailoring)

Aggiungere un selettore IT/EN prima del pulsante "Genera il CV adattato":

- Nuovo state nel wizard principale: `languageOverride: string | null` (default `null`)
- Inizializzato a `analyzeResult.detected_language` quando l'analisi completa
- UI: card compatta con due chip pill ("Italiano" / "English"), quello attivo evidenziato con sfondo accent
- Il valore scelto viene passato a:
  - `handleGenerateCv` → `analyze_context.detected_language`
  - `cv-review` → `detected_language`
  - `StepExport` → `cvLang` per il PDF

**Props da aggiungere a StepTailoring:** `selectedLanguage`, `onLanguageChange`

### 2. Toggle skill mancanti → "Ce l'ho" (Step 2 — StepTailoring)

Rendere i chip nella card "Ti mancano" cliccabili per spostarli nella card "Hai già":

- Nuovo state nel wizard principale: `overriddenSkills: Set<string>`
- Nella card rossa, ogni chip ha un'icona `+` — click sposta la skill in verde
- Nella card verde, le skill overridden hanno bordo tratteggiato e icona `×` per annullare
- Le skill overridden vengono passate a `handleGenerateCv` → `analyze_context.skills_overridden`
- Il `match_score` visualizzato viene ricalcolato localmente (+ punti per ogni skill overridden)

**Props da aggiungere a StepTailoring:** `overriddenSkills`, `onToggleSkill`

### 3. Propagazione ai passaggi successivi

- `handleGenerateCv`: usa `languageOverride ?? analyzeResult.detected_language` per `ai-tailor` e `cv-review`
- `StepExport`: riceve `cvLang` dal parent (non più da `analyzeResult.detected_language`)
- Le `skills_overridden` vengono passate in `analyze_context` così l'AI non le tratta come gap

### File coinvolti

| File | Modifica |
|------|----------|
| `src/pages/Nuova.tsx` | Selettore lingua, toggle skill, propagazione valori |

Nessuna modifica backend — le edge function già accettano `detected_language` e `skills_overridden` in `analyze_context`.

