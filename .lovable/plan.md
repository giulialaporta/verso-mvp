

# Singola icona matita per editare tutta l'esperienza

## Problema attuale

Ogni esperienza ha DUE meccanismi di modifica in conflitto:
1. **Inline editing** (`<E>` / `InlineEdit`) su ogni singolo campo (ruolo, azienda, luogo, date, descrizione) -- funziona solo per testo breve
2. **Drawer** via icona matita -- apre il form completo ma l'utente non capisce che esiste perche' i campi sono gia' editabili inline

I bullets sono editabili come chip (`EditableSkillChips`) ma sono troncati e non si leggono per intero.

## Soluzione

Rimuovere l'inline editing dai blocchi strutturati (experience, education, certifications, projects). In modalita' `editable`, ogni blocco mostra i dati come **testo normale** (read-only) con una **singola icona matita** che apre il drawer per editare tutto il gruppo di campi insieme.

### Modifiche a `src/components/CVSections.tsx`

**Experience (righe 357-407):** Sostituire tutte le `<E>` con testo statico. Mantenere solo `ItemActions` con `onEdit` (matita) e `onRemove` (cestino). I bullets si mostrano come lista puntata (non come chip editabili).

Prima:
```text
<p><E value={exp.role} path={...} /></p>
<p><E value={exp.company} path={...} /></p>
<EditableSkillChips items={exp.bullets} ... />
```

Dopo:
```text
<p>{exp.role}</p>
<p>{exp.company} · {exp.location}</p>
<ul>{exp.bullets.map(b => <li>{b}</li>)}</ul>
// Solo la matita apre il drawer con TUTTI i campi
```

**Education (righe 430+):** Stesso approccio -- rimuovere inline editing, solo matita per il drawer.

**Certifications e Projects:** Stesso approccio.

**Dati personali e Summary:** Restano con inline editing (`<E>`) perche' sono campi singoli non raggruppati, dove l'editing diretto ha senso.

### Riepilogo cambiamenti

| File | Modifica |
|------|----------|
| `src/components/CVSections.tsx` | Rimuovere `<E>` e `EditableSkillChips` dai blocchi experience, education, certifications, projects in modalita' editable. Mostrare testo statico + singola matita per il drawer. |

Nessun file nuovo. Il drawer (`EditItemDrawer`) e i suoi campi (`drawerFields`) restano invariati -- sono gia' completi di tutti i campi necessari.

