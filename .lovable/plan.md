

# Modifica Inline Completa: Edit, Add e Remove nel CV Onboarding

## Cosa cambia

L'utente nello step "preview" dell'onboarding potra':
- **Modificare** qualsiasi campo cliccandoci sopra (inline edit)
- **Aggiungere** nuovi elementi (competenze, strumenti, bullet, certificazioni, ecc.)
- **Rimuovere** singoli elementi (una competenza, un bullet, una certificazione, una lingua, un item di extra_section) -- ma MAI cancellare un'intera sezione
- **Ricevere suggerimenti** da Verso su sezioni mancanti da popolare

## Comportamento UX

- **Edit**: click su un campo testuale, diventa input. Enter/blur conferma, Escape annulla. Icona matita al hover.
- **Add**: mini-input con placeholder "Aggiungi..." in fondo alle liste (skills, bullets, certificazioni, ecc.). Enter per aggiungere. Bottone "+ Esperienza", "+ Certificazione" per aggiungere elementi complessi.
- **Remove**: icona "X" su ogni elemento rimovibile (chip, bullet, certificazione, progetto, item di extra_section). Click per rimuovere con fade-out. Le sezioni stesse NON si possono cancellare.
- **Suggerimenti**: pannello sotto la preview che mostra sezioni mancanti (es. "Aggiungi strumenti", "Aggiungi lingue"). Click per creare la sezione con input pronto.

## File coinvolti

| File | Azione |
|------|--------|
| `src/components/InlineEdit.tsx` | Nuovo -- componente click-to-edit riutilizzabile |
| `src/components/EditableSkillChips.tsx` | Nuovo -- chips con add/remove |
| `src/components/CVSuggestions.tsx` | Nuovo -- pannello suggerimenti sezioni mancanti |
| `src/components/CVSections.tsx` | Aggiornare -- props `editable`/`onUpdate`, wrappare campi con InlineEdit, aggiungere bottoni add/remove |
| `src/pages/Onboarding.tsx` | Aggiornare -- passare editable mode + integrare suggerimenti |

Nessuna modifica a DB, edge functions, tipi o routing.

---

## Dettaglio tecnico

### 1. `InlineEdit.tsx`

Componente con props: `value`, `onChange`, `multiline?`, `placeholder?`, `className?`
- Stato interno `editing` + `draft`
- Non editing: mostra testo + icona `PencilSimple` (Phosphor, 12px) visibile solo al hover (`opacity-0 group-hover:opacity-100`)
- Editing: input o textarea, focus automatico, bordo `border-primary/50`, background `bg-surface-2`
- Enter conferma (solo input, non textarea), Escape annulla, blur conferma

### 2. `EditableSkillChips.tsx`

Props: `items: string[]`, `onChange: (items: string[]) => void`, `variant?: "primary" | "outline"`
- Ogni chip mostra una "X" al hover per rimuoverla (fade 150ms)
- In fondo: mini-input con placeholder "Aggiungi..." (font-mono, 11px). Enter per aggiungere alla lista
- La rimozione NON rimuove la sezione: se tutte le chip vengono rimosse, resta solo l'input "Aggiungi..."

### 3. `CVSuggestions.tsx`

Props: `data: ParsedCV`, `onUpdate: (data: ParsedCV) => void`
- Analizza `data` e mostra chip per ogni sezione mancante:

| Condizione | Suggerimento |
|------------|--------------|
| `summary` vuoto | "Aggiungi un profilo professionale" |
| `skills.tools` vuoto/assente | "Aggiungi gli strumenti che usi" |
| `skills.soft` vuoto/assente | "Aggiungi competenze trasversali" |
| `skills.languages` vuoto/assente | "Aggiungi le lingue" |
| `certifications` vuoto/assente | "Hai certificazioni?" |
| `projects` vuoto/assente | "Hai progetti personali?" |
| no `extra_sections` | "Aggiungi sezione personalizzata" |
| `personal.linkedin` assente | "Aggiungi LinkedIn" |

- Ogni chip ha icona `Plus`, bordo dashed, colore `text-primary/60`
- Click: aggiunge il campo/sezione vuota in `data` e chiama `onUpdate` (la sezione apparira' in CVSections in edit mode)
- Per "sezione personalizzata": mostra un mini-input per il titolo, poi aggiunge un `extra_section` vuota

### 4. `CVSections.tsx` -- aggiornamento

Nuove props opzionali:
```text
editable?: boolean
onUpdate?: (data: ParsedCV) => void
```

Quando `editable=true`:

**Campi testo** (personal.name, email, phone, location, date_of_birth, linkedin, website, summary, exp.role, exp.company, exp.location, exp.start, exp.end, exp.description, edu.degree, edu.field, edu.institution, edu.grade, cert.name, cert.issuer, cert.year, proj.name, proj.description):
- Wrappati in `InlineEdit`

**Liste di stringhe** (skills.technical, skills.soft, skills.tools, exp.bullets, extra_sections.items):
- Usano `EditableSkillChips` (o una variante lista per bullets/items)
- Ogni elemento ha una "X" per rimuoverlo
- Input "Aggiungi..." in fondo

**Lingue** (skills.languages):
- Ogni lingua mostra language + level come chip con "X" per rimuoverla
- Input in fondo per aggiungere (formato: "Lingua -- Livello")

**Certificazioni, Progetti, Experience, Education**:
- Ogni elemento ha un'icona trash al hover per rimuoverlo
- Bottone "+ Aggiungi" in fondo alla sezione per aggiungere un elemento vuoto

**Regola fondamentale**: si possono rimuovere ELEMENTI dalle sezioni, ma le sezioni stesse restano sempre visibili (anche se vuote, con solo l'input "Aggiungi...").

### 5. `Onboarding.tsx` -- aggiornamento

- Nello step preview, passare `editable={true}` e `onUpdate={setParsedData}` a `CVSections`
- Aggiungere `CVSuggestions` sotto la card di preview
- Cambiare sottotesto: "Clicca su qualsiasi campo per modificarlo"
- Cambiare bottone: "Salva e continua"

