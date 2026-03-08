

# Fix Lingua Mista nel CV — Analisi del Bug Reale

## Il vero problema

Il prompt attuale dice (riga 203):
> "Return ONLY the fields you actually changed. Do NOT return the entire CV."

Questo crea il bug: se il CV originale è in **inglese** e l'annuncio è in **italiano**, l'AI modifica solo i campi che ritiene necessario adattare per il tailoring. I bullet, le descrizioni e le skill **non toccate** restano in inglese → CV mezzo italiano e mezzo inglese.

La regola "LANGUAGE CONSISTENCY" (righe 145-159) dice che tutto deve essere nella stessa lingua, ma contraddice la regola "return ONLY changed fields". L'AI segue la seconda.

## Piano di fix

### 1. Prompt `ai-tailor` — Risolvere la contraddizione

Modificare la sezione `TAILORED PATCHES` (righe 197-203) per aggiungere una regola esplicita:

> **Se la lingua del CV originale è diversa dalla lingua dell'annuncio (detected_language), DEVI generare patch per OGNI campo testuale** — summary, tutti i bullets di ogni esperienza, tutte le skill labels, tutte le descrizioni education, tutti i progetti. In questo caso il tailoring include la traduzione completa.

E cambiare la riga 203 da:
```
Do NOT return the entire CV. Return ONLY the fields you actually changed.
```
a:
```
Return ONLY the fields you actually changed.
EXCEPTION: if the CV language differs from detected_language, you MUST patch ALL text fields to translate them. In this case, generate patches for summary, every experience's bullets and description, skills.technical, skills.soft, skills.tools, education descriptions, certifications, and projects.
```

### 2. Prompt `ai-tailor` — Skill labels specifici

Aggiungere nella sezione LANGUAGE CONSISTENCY:
```
- Skill labels: translate generic skills ("Project Management" → "Gestione progetti", "Team Leadership" → "Leadership del team"). Keep proper nouns and technology names as-is (React, SQL, Figma, AWS).
- NEVER wrap skill names in quotes ("React" → React)
```

### 3. Post-processing backend — Strip quotes + normalizza

Dopo riga 581 (skills arrays normalization), aggiungere strip delle virgolette:
```typescript
// Strip quotes from skill names
if (cvSkills && typeof cvSkills === "object") {
  for (const key of ["technical", "soft", "tools"]) {
    if (Array.isArray(cvSkills[key])) {
      cvSkills[key] = cvSkills[key].map((s: string) => 
        typeof s === "string" ? s.replace(/^["']+|["']+$/g, "").trim() : s
      );
    }
  }
}
```

### 4. Template PDF — Limite skill + headers multilingua

**`ClassicoTemplate.tsx` + `MinimalTemplate.tsx`:**
- Max 20 skill nella sidebar (evita overflow pagina 2)
- Prop `lang` per headers multilingua (Profilo/Profile, Esperienza/Experience, etc.)
- Strip virgolette difensivo anche nel render

**`Nuova.tsx`:**
- Passare `detected_language` ai template

### File coinvolti

| File | Modifiche |
|------|-----------|
| `supabase/functions/ai-tailor/index.ts` | Prompt: eccezione traduzione completa + regola skill labels + strip quotes post-processing |
| `src/components/cv-templates/ClassicoTemplate.tsx` | Max 20 skill, headers multilingua, strip quotes |
| `src/components/cv-templates/MinimalTemplate.tsx` | Stesse modifiche |
| `src/pages/Nuova.tsx` | Passare `lang` ai template |

