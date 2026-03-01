# Epics — Istruzioni per Claude Code

## Struttura di un Epic

Ogni epic è un file `.md` nella cartella `epics/`. Nome file: `epic-XX-nome-feature.md`.

### Template Epic

```markdown
# Epic XX — Nome Feature

## Obiettivo
Cosa deve fare questa feature e perché esiste (2-3 righe max).

## Comportamento
Descrizione dettagliata del behavior: cosa succede quando l'utente interagisce.

## Flussi
1. **Happy path** — Il percorso principale.
2. **Varianti** — Percorsi alternativi.
3. **Edge case** — Situazioni limite e come gestirle.

## Stati
| Stato | Descrizione |
|-------|-------------|
| Default | ... |
| Loading | ... |
| Success | ... |
| Error | ... |
| Empty | ... |

## Criteri di accettazione
- [ ] Criterio 1
- [ ] Criterio 2
- [ ] ...

## Stories
| ID | Story | Priorità |
|----|-------|----------|
| XX.1 | ... | Must |
| XX.2 | ... | Must |
| XX.3 | ... | Should |
```

---

## Struttura di una Story

Ogni story è un'**azione atomica** che Lovable può implementare in un singolo prompt.

### Regole per le stories

- Una story = un prompt per Lovable
- Deve essere autocontenuta: chi la legge capisce cosa fare senza cercare altrove
- Includere sempre: cosa costruire, dove, behavior atteso
- Se serve UI → riferirsi al `brand-system.md`
- Non specificare *come* implementare — solo *cosa* deve succedere

### Template Story

```markdown
# Story XX.Y — Nome Story

**Epic:** XX — Nome Feature
**Priorità:** Must / Should / Could

## Cosa
Descrizione chiara di cosa costruire (2-3 righe).

## Behavior
- Quando l'utente fa X → succede Y
- Stato di loading: ...
- Stato di errore: ...

## Criteri di accettazione
- [ ] ...
```

---

## Regole

- Parlare sempre in **italiano**
- Il numero dell'epic (`XX`) corrisponde all'ordine nel PRD
- Le stories si numerano come `XX.Y` (epic.story)
- Consultare sempre `brand-system.md` per decisioni UI/UX
- Non entrare nel dettaglio implementativo — Lovable decide il *come*
