

# Fix spaziature DOCX e bug en dash education

## Problema

Le spaziature nel DOCX generator sono troppo strette rispetto al design originale documentato nella memoria del progetto. I titoli di sezione hanno `before: 180` invece di `420`, e i blocchi esperienza non hanno separazione sufficiente. C'è anche un en dash residuo nelle date education.

## Modifiche

### File: `src/components/cv-templates/docx-generator.ts`

**1. Section title spacing** (riga 109)
- `before: 180, after: 40` → `before: 420, after: 180`

**2. Role with date spacing** (riga 132)
- `before: 120` → `before: 320` (separazione tra blocchi esperienza)

**3. Degree with date spacing** (riga 153)
- `before: 40` → `before: 200` (separazione tra blocchi education)

**4. Fix en dash in education date range** (riga 338)
- `${startDate} – ${endDate}` → `${startDate} - ${endDate}`

Nessun altro file modificato. Solo spaziature e un bugfix puntuale.

