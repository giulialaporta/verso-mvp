

# Fix: Troppe Matitine e Coerenza Lingua

## Problema

Ogni campo dentro un elemento composto (es. formazione: titolo, campo, istituto, date, voto) mostra la propria matitina tramite `InlineEdit`. Risultato: 5-6 matitine per ogni titolo di studio. L'utente ne vuole UNA per elemento.

## Soluzione

### 1. `InlineEdit.tsx` -- aggiungere prop `showIcon`

Aggiungere `showIcon?: boolean` (default `true`). Quando `false`, il campo resta cliccabile (hover bg change + cursor pointer) ma non mostra la matitina. Usato per i sotto-campi di elementi composti.

### 2. `CVSections.tsx` -- rimuovere matitine duplicate

**Regola**: ogni elemento cancellabile ha UNA matitina + UNA X, entrambe in `ItemActions`. I sotto-campi usano `InlineEdit` con `showIcon={false}`.

Modifiche specifiche:
- Helper `E`: aggiungere prop `showIcon` (default `false` quando dentro un elemento composto)
- **Experience**: `ItemActions` mostra matitina + trash. Campi role, company, location, date usano `E` senza icona
- **Education**: idem -- UNA matitina in `ItemActions`, i campi degree, field, institution, date, grade senza icona
- **Certifications**: idem
- **Projects**: idem
- **Lingue**: ogni chip ha UNA matitina + UNA X (gia' ok, ma verificare)
- **Campi standalone** (summary, personal fields): mantengono `showIcon={true}` perche' non hanno `ItemActions`

### 3. Coerenza lingua

Verificare e uniformare tutti i placeholder e label in italiano:
- "Clicca per modificare..." gia' ok
- Controllare che nessun placeholder sia in inglese
- Uniformare "Aggiungi..." ovunque

## File coinvolti

| File | Modifica |
|------|----------|
| `src/components/InlineEdit.tsx` | Aggiungere prop `showIcon` (default `true`) |
| `src/components/CVSections.tsx` | Passare `showIcon={false}` ai campi dentro elementi composti; aggiungere `onEdit` a `ItemActions` per experience/education/certifications/projects |

## Dettaglio tecnico

### `InlineEdit.tsx`

```text
interface InlineEditProps {
  ...existing...
  showIcon?: boolean;  // default true
}
```

Quando `showIcon={false}`, il `<PencilSimple>` non viene renderizzato. Il campo resta cliccabile con hover `bg-muted/30`.

### `CVSections.tsx`

Il helper `E` cambia signature:

```text
const E = ({ value, path, multiline, placeholder, className, showIcon = false }: ...)
```

Default `showIcon=false` cosi' tutti i campi dentro elementi composti non mostrano matitina.

Per i campi standalone (summary, personal name/email/phone/etc.) si passa esplicitamente `showIcon={true}` oppure si usa `InlineEdit` direttamente.

`ItemActions` per experience, education, certifications e projects include sempre `onEdit` (la matitina appare accanto alla X). Il click su onEdit non fa nulla di speciale -- i campi sono gia' cliccabili individualmente -- serve solo come indicatore visivo.

Nessuna modifica al backend, ai tipi, o ad altri componenti.
