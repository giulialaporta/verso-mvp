

# EditItemDrawer -- Dove serve in Verso

## Il componente

Un drawer (bottom sheet su mobile, overlay su desktop) che mostra tutti i campi di un elemento composto in un form verticale scrollabile con input/textarea a larghezza piena. Un unico componente riutilizzabile ovunque.

## Dove serve

### 1. Onboarding (preview CV dopo parsing) -- `CVSections.tsx` in modalita' `editable`

Questo e' il caso primario gia' identificato. Quando l'utente clicca la matitina su:
- **Esperienza** (role, company, location, start, end, description)
- **Formazione** (degree, field, institution, start, end, grade, honors, program, publication)
- **Certificazioni** (name, issuer, year)
- **Progetti** (name, description, link)

Oggi `onEdit={() => {}}` non fa nulla. Col drawer, ogni campo si vede intero e si modifica comodamente.

### 2. Candidature -- dettaglio card (`Candidature.tsx`)

Oggi ogni candidatura e' una card statica senza possibilita' di modifica. Il drawer permetterebbe:
- **Modificare status** (Inviata -> Contattato -> Follow-up -> KO) con selettore
- **Aggiungere note** libere
- **Vedere il dettaglio completo**: company, role, score, ATS score, data

Si aprirebbe toccando la card della candidatura.

### 3. Nuova Candidatura -- Step 1: Job Data confermata (`Nuova.tsx`)

Quando l'utente conferma i dati dell'annuncio e vede la card riassuntiva (company, role, requirements, skills), oggi puo' solo "Modifica" per ricominciare. Col drawer potrebbe **editare singoli campi** del job data (company name, role title, requirements) senza ricominciare lo scraping.

### 4. Home -- CV Card (`Home.tsx`)

Il CV nella Home e' in sola lettura (`CVSections` senza `editable`). Si potrebbe aggiungere un pulsante "Modifica CV" che apre il drawer per editare i campi del master CV direttamente dalla Home, salvando su DB.

---

## Piano implementativo

### File nuovi

| File | Descrizione |
|------|-------------|
| `src/components/EditItemDrawer.tsx` | Componente drawer generico con form verticale |

### File modificati

| File | Modifica |
|------|----------|
| `src/components/CVSections.tsx` | Stato `editingItem`, collegamento `onEdit` al drawer, mappa campi per tipo (experience, education, certifications, projects) |
| `src/pages/Candidature.tsx` | Click su card apre drawer con dettaglio candidatura + modifica status/note |
| `src/pages/Nuova.tsx` | Pulsante edit su job data card per modificare campi senza restart |
| `src/pages/Home.tsx` | Pulsante "Modifica CV" sulla CVCard che abilita editing via drawer |

### Dettaglio tecnico

**`EditItemDrawer.tsx`** -- Props:

```text
interface EditItemDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: {
    key: string;
    label: string;
    value: string;
    multiline?: boolean;
    placeholder?: string;
  }[];
  onSave: (values: Record<string, string>) => void;
}
```

Internamente:
- Usa il componente `Drawer` (vaul) gia' installato
- Form verticale con `Input` per campi brevi, `Textarea` per multiline
- Label in `font-mono text-[11px] uppercase` (brand system)
- Pulsante "Salva" verde (CTA primario) in fondo
- Su mobile: bottom sheet nativo con handle draggable
- Su desktop: stesso drawer, max-height 85vh con scroll interno

**`CVSections.tsx`** -- Integrazione:

```text
// Nuovo stato
const [editingItem, setEditingItem] = useState<{
  type: "experience" | "education" | "certification" | "project";
  index: number;
} | null>(null);

// onEdit collegato
<ItemActions
  onEdit={() => setEditingItem({ type: "experience", index: i })}
  onRemove={...}
/>

// Mappa campi
const fieldMaps = {
  experience: (exp) => [
    { key: "role", label: "Ruolo", value: exp.role },
    { key: "company", label: "Azienda", value: exp.company },
    { key: "location", label: "Luogo", value: exp.location },
    { key: "start", label: "Data inizio", value: exp.start },
    { key: "end", label: "Data fine", value: exp.end },
    { key: "description", label: "Descrizione", value: exp.description, multiline: true },
  ],
  // ... education, certifications, projects
};
```

**`Candidature.tsx`** -- Drawer dettaglio:

```text
// Click su AppCard apre drawer
<div onClick={() => setSelectedApp(app)}>
  <AppCard app={app} />
</div>

// Drawer mostra:
// - Company, role, date, scores
// - Status selector (chip cliccabili)
// - Campo note (textarea)
// - Pulsante salva
```

**`Nuova.tsx`** -- Edit job data:

```text
// Nella card confermata, aggiungere pulsante edit
// che apre drawer con campi: company_name, role_title, location
// Al salvataggio aggiorna jobData senza ri-scraping
```

**`Home.tsx`** -- Edit master CV:

```text
// Aggiungere prop editable + onUpdate a CVCard
// Pulsante "Modifica" nella CVCard header
// Al salvataggio: UPDATE su master_cvs.parsed_data
```

### Priorita'

1. `EditItemDrawer.tsx` (componente base)
2. `CVSections.tsx` (caso principale: onboarding)
3. `Candidature.tsx` (dettaglio + status change)
4. `Nuova.tsx` e `Home.tsx` (miglioramenti secondari)

