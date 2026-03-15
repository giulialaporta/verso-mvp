

## Semplificazione Score — Piano

### Stato attuale: 5 metriche, troppa confusione

| Metrica | Dove appare | Valore per l'utente |
|---------|------------|-------------------|
| Match Score | Tailoring, Revisione, card, dettaglio | Alto — "quanto sei adatto" |
| ATS Score | Tailoring, Revisione, card, dettaglio | Medio — tecnico, pochi lo capiscono |
| Confidence | Revisione | Basso — "quanto ci fidiamo di noi stessi?" Controproducente |
| Verso Score | StepCompleta, card, Home stats | Basso — media di cose diverse, numero opaco |
| Honest Score | Badge "CV Onesto", breakdown Verso | Basso come numero, alto come concetto |

### Nuova struttura: 2 numeri + 1 badge

1. **Match Score** — unico numero primario. "Quanto sei adatto a questo ruolo." Mostrato grande ovunque.
2. **ATS Score** — dettaglio secondario. Visibile in Revisione e nel tooltip/dettaglio, non in primo piano nelle card.
3. **Badge "CV Onesto"** — sì/no, basato sull'integrity-check server-side (0 revert = badge). Nessun numero percentuale.

**Eliminati**: Verso Score (composito opaco), Confidence come percentuale, Honest Score come numero.

### Modifiche

#### 1. Eliminare `VersoScore.tsx`
Rimuovere il componente e tutte le sue importazioni. Sostituire con il Match Score diretto + badge.

#### 2. `StepCompleta.tsx` — Match Score grande + badge
- Anello circolare animato con **Match Score** (non Verso Score)
- Sotto: ATS Score come dettaglio secondario (testo piccolo)
- Badge "CV Onesto" se integrity check ha 0 revert (basato su `honestScore >= 85` per ora, già funzionante)
- Rimuovere il breakdown a 3 colonne (Match/ATS/Onestà)

#### 3. `StepRevisione.tsx` — 2 card invece di 3
- Tenere Match e ATS come card con barre
- Rimuovere la card "Confidence" — l'informazione sulla fedeltà è già comunicata dal badge e dai contatori "Cosa ho cambiato"

#### 4. Card candidatura (`Home.tsx`, `Candidature.tsx`)
- Sostituire `VersoScoreCompact` con Match Score diretto (numero + colore) + badge icona se onesto
- Componente inline semplice, no import pesante

#### 5. Stats bar `Home.tsx`
- "Verso Score medio" → "Match Score medio"
- Calcolo: media dei `match_score` invece di `calcVersoScore`

#### 6. `useApplications.ts` / `AppRowWithAts`
- Tenere `ats_score` e `honest_score` nel tipo (servono per badge e dettaglio) — nessuna modifica al fetch

#### 7. `CandidaturaDetail.tsx`
- Match Score primario, ATS secondario, badge CV Onesto — stessa logica di StepCompleta

### File coinvolti

| File | Modifica |
|------|----------|
| `src/components/VersoScore.tsx` | Eliminare o riscrivere come `MatchScoreRing` + `MatchScoreCompact` |
| `src/components/wizard/StepCompleta.tsx` | Match Score grande + badge, no Verso |
| `src/components/wizard/StepRevisione.tsx` | Rimuovere card Confidence |
| `src/pages/Home.tsx` | Match Score medio in stats, MatchScoreCompact nelle card |
| `src/pages/Candidature.tsx` | MatchScoreCompact nelle card |
| `src/pages/CandidaturaDetail.tsx` | Match primario + ATS secondario |

