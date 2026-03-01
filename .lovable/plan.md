

# Storico CV — Soft delete + archivio versioni

## Cosa manca

Il piano approvato prevedeva soft delete e storico CV, ma non e' stato implementato. Attualmente:
- La tabella `master_cvs` non ha colonna `is_active`
- L'eliminazione in `Home.tsx` fa `DELETE` fisico + rimuove il file dallo storage
- L'onboarding fa `DELETE` dei CV precedenti prima di inserire il nuovo
- Non esiste nessuna UI per visualizzare i CV passati

## Modifiche

### 1. Migrazione database

Aggiungere colonna `is_active` (boolean, default true) alla tabella `master_cvs`.

```sql
ALTER TABLE master_cvs ADD COLUMN is_active boolean NOT NULL DEFAULT true;
```

### 2. `src/pages/Home.tsx`

**Soft delete:** La funzione `handleDelete` passa da `DELETE` a `UPDATE ... SET is_active = false`. Il file nello storage viene mantenuto.

**Fetch CV attivo:** Aggiungere `.eq("is_active", true)` alla query del CV.

**Sezione "CV precedenti":** Sotto la card del CV attivo, aggiungere una sezione collassabile che mostra i CV inattivi:
- Query: `master_cvs` con `is_active = false`, ordinati per `created_at DESC`
- Ogni riga: nome file, data di caricamento (formattata), pulsante "Riattiva"
- "Riattiva" = disattiva il CV corrente + attiva quello selezionato
- I CV senza candidature associate possono essere eliminati definitivamente

### 3. `src/pages/Onboarding.tsx`

Sostituire il `DELETE` dei CV esistenti (linea 88) con `UPDATE ... SET is_active = false` su tutti i CV dell'utente, poi `INSERT` del nuovo con `is_active = true`.

### 4. `src/pages/Nuova.tsx`

Aggiungere `.eq("is_active", true)` al check del CV nel wizard, per prendere solo il CV attivo.

## UI storico CV (nella Home)

Sezione collassabile "CV precedenti" sotto la card del CV attivo:

```text
CV precedenti (2)
-----------------------------------------------------
| curriculum_v2.pdf  | 12 gen 2025 | [Riattiva] [x] |
| curriculum_v1.pdf  | 5 dic 2024  | [Riattiva]     |
-----------------------------------------------------
```

- Card con bordo `border-border/40`, font `DM Sans`, date in formato italiano
- Pulsante "Riattiva" con icona, scambia il CV attivo
- Icona eliminazione definitiva solo per CV senza candidature (`tailored_cvs` associate)
- Stile coerente con il brand system Verso (dark mode, colori accent)

## Riepilogo file modificati

| File | Modifica |
|------|----------|
| Migrazione DB | `ALTER TABLE master_cvs ADD COLUMN is_active boolean DEFAULT true` |
| `src/pages/Home.tsx` | Soft delete, fetch con `is_active = true`, sezione storico CV precedenti |
| `src/pages/Onboarding.tsx` | Disattivare CV precedenti invece di cancellarli |
| `src/pages/Nuova.tsx` | Filtrare per `is_active = true` nel CV guard |

