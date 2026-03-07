

# Fix Honest Score 0% e 689 bullet aggiunti

## Problema identificato

La funzione `computeConfidence` (Nuova.tsx, riga 270-275) conta i "bullet aggiunti" confrontando `.length` tra `exp.bullets` originali e tailored. 

**Il bug**: se l'AI restituisce `bullets` come **stringa** invece che array (es. `"Managed team of 10..."` con `.length` = 200+ caratteri), il confronto `.length` confronta la lunghezza della stringa (centinaia di caratteri) con la lunghezza dell'array originale (3-5 elementi). Risultato: `bulletsAdded` esplode a centinaia, e `confidence = 100 - 689*5 = 0%`.

Problema secondario: dopo il reorder delle esperienze, `tailExp[i]` non corrisponde più a `origExp[i]`, quindi il confronto per indice è comunque scorretto.

## Fix

### 1. `computeConfidence` in `src/pages/Nuova.tsx` (righe 270-275)

Aggiungere `Array.isArray()` check prima di usare `.length` per i bullets:

```typescript
tailExp.forEach((exp: any, i: number) => {
  const origBulletsArr = Array.isArray(origExp[i]?.bullets) ? origExp[i].bullets : [];
  const tailBulletsArr = Array.isArray(exp?.bullets) ? exp.bullets : [];
  const origBullets = origBulletsArr.length;
  const tailBullets = tailBulletsArr.length;
  if (tailBullets > origBullets) bulletsAdded += tailBullets - origBullets;
});
```

### 2. Normalizzazione bullets nel backend `ai-tailor/index.ts` (dopo riga 580)

Aggiungere normalizzazione bullets nelle esperienze del CV tailored, simile alla normalizzazione skills già presente (righe 574-581):

```typescript
// Ensure experience bullets are arrays
const cvExperience = (tailoredCV as any)?.experience;
if (Array.isArray(cvExperience)) {
  for (const exp of cvExperience) {
    if (exp.bullets && typeof exp.bullets === "string") {
      exp.bullets = exp.bullets.split("\n").map((s: string) => s.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
    }
  }
}
```

Due file modificati, nessuna modifica al database.

