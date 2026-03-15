

## Analisi delle fabbricazioni e piano di correzione

### Inventario completo delle fabbricazioni

Ho confrontato il CV originale (01_2026) con il CV generato (Satispay_9). Le invenzioni sono gravissime e sistematiche:

**Metriche inventate di sana pianta**
- "reduced support tickets by 35%" — non esiste nell'originale
- "€1.2M annual savings" da un "ML fraud detection model" — completamente inventato
- "200K+ active users", "2M+ users" — numeri inventati
- "increased user engagement by 18%", "+12% conversion" — percentuali inventate
- "5M+ customers", "average uplift of 22%" — inventati
- "team of 8", "15-person engineering team", "hired 4 Product Managers" — numeri inventati

**Date modificate**
- Illimity: 01.2018–01.2021 → 03/2019–12/2020
- Intesa: 01.2015–01.2018 → 06/2015–02/2019
- Deloitte: 01.2012–01.2015 → 09/2012–05/2015

**Ruoli e aziende modificati**
- "CRM Team Leader" → "CRM & Digital Marketing Specialist"
- "Deloitte Digital" → "Deloitte Consulting"
- "Consultant" → "Business Consultant – Financial Services"
- Location Intesa: Torino → Milano

**Titolo di studio cambiato**
- "Management Engineering" → "Economics and Finance" (gravissimo)
- Aggiunta "Laurea Triennale in Business Administration" — non esiste
- Rimossi: Erasmus, abilitazione ingegnere, pubblicazione, lode

**Certificazioni inventate**
- "PSPO I — Scrum.org, 2020" — non esiste (originale: PlaystoScale Agilista 2022)
- "Google Analytics IQ — Google, 2017" — non esiste
- Rimosse le certificazioni reali

**Skill inventate**
- "Fraud Detection Systems", "Microservices Architecture", "Real-time Payment Systems", "InsurTech" — mai presenti

---

### Root cause: debolezze nei prompt e nell'architettura

#### PROMPT — 5 falle critiche

1. **"Bullets: action verb + measurable result"** (riga 201 del prompt tailor) — Questa istruzione INCORAGGIA l'AI a inventare metriche. Quando il CV originale non ha numeri, l'AI li fabbrica per soddisfare la regola. Deve diventare: "measurable result ONLY IF present in original CV; otherwise describe impact qualitatively."

2. **"Summary: 2-3 sentences, specific to this role"** — L'AI interpreta "specific to this role" come licenza di rebranding. Il summary viene riscritto come se il candidato fosse un esperto di fraud detection e payments perché il target role (Satispay) lo richiede.

3. **"CANNOT invent new experiences" ma nessun divieto esplicito su metriche** — La regola protegge la struttura (non aggiungere righe) ma non il contenuto (non inventare numeri dentro le righe esistenti). L'AI distingue tra "inventare un'esperienza" e "arricchire un bullet con dati plausibili" — e sceglie la seconda.

4. **"CANNOT modify dates, company names, degree titles"** — La regola c'è (riga 219) ma è una sola riga persa in un prompt lunghissimo, e non c'è nessuna enforcement server-side. L'AI la ignora.

5. **Nessun divieto di inventare certificazioni** — Il prompt dice "CANNOT invent new experiences, degrees, or certifications" (riga 218) ma nella sezione CV Quality Rules dice "Certification Validation: Must have name + issuer" — l'AI interpreta questo come "devo assicurarmi che ogni certificazione abbia name + issuer" e ne inventa di nuove per soddisfare la regola.

#### ARCHITETTURA — 4 falle critiche

1. **Nessuna validazione server-side dei campi immutabili** — Il sistema applica i patch con `applyPatches()` senza MAI verificare che role, company, start, end, degree, institution non siano stati modificati. Bastava un confronto campo-per-campo.

2. **Experience protection solo su conteggio** — Le righe 682-691 controllano solo se il numero di esperienze è calato del 50%. Non controllano se il CONTENUTO è stato alterato (date cambiate, ruoli riscritti, metriche inventate).

3. **honest_score è self-reported** — L'AI dichiara `experiences_added: 0, skills_invented: 0, dates_modified: 0` ma ha fatto tutte e tre le cose. Il sistema si fida ciecamente del giudizio dell'AI su se stessa.

4. **validate-output.ts controlla solo tipi e range** — Non esiste nessun controllo di fedeltà al contenuto originale. Una validazione che confronta il CV patchato con l'originale avrebbe catturato tutte queste fabbricazioni.

---

### Piano di correzione — 3 interventi

#### 1. Hardening del prompt ai-tailor (SYSTEM_PROMPT_TAILOR)

Aggiungere una sezione **"ANTI-HALLUCINATION — ABSOLUTE RULES"**:
- NEVER invent metrics, percentages, currency amounts, team sizes, user counts, or any quantitative data not explicitly present in the original CV
- NEVER change role titles, company names, or locations — copy them character-for-character from the original
- NEVER change start/end dates — copy them exactly from the original
- NEVER change degree names, institution names, or grades
- NEVER add certifications not present in the original CV
- NEVER add skills not inferable from the original CV content
- If a bullet has no measurable result in the original, describe the impact QUALITATIVELY — never invent numbers
- When rewriting bullets, the factual claims must be a SUBSET of the original — never a superset

Riformulare la regola sui bullet (riga 201):
- Da: "action verb + measurable result, one line each"
- A: "action verb + impact. Use original metrics ONLY if present. If no metrics exist, describe the impact qualitatively. NEVER invent percentages, amounts, user counts, or team sizes."

#### 2. Validazione server-side post-patch (nuovo modulo `_shared/integrity-check.ts`)

Dopo `applyPatches()` e prima di restituire il risultato, confrontare il CV patchato con l'originale:

- **Campi immutabili per ogni experience**: `role`, `company`, `location`, `start`, `end` — se diversi dall'originale, revert al valore originale
- **Campi immutabili per ogni education**: `institution`, `degree`, `field`, `grade`, `honors`, `program`, `publication` — revert se cambiati
- **Certifications**: ogni certificazione nel CV finale deve esistere nell'originale (match per nome). Rimuovere quelle inventate, ripristinare quelle rimosse.
- **Metriche inventate**: regex scan dei bullet patchati per pattern come `\d+%`, `€\d+`, `\d+[KMB]\+?`, `team of \d+` — se il pattern non appare nel bullet originale corrispondente, revert il bullet al testo originale
- Loggare ogni revert come warning

#### 3. Rimozione della self-reported honest_score

Non chiedere più all'AI di auto-valutarsi. Calcolare il diff server-side:
- Contare i campi immutabili modificati (dates_modified, roles_changed)
- Contare le metriche inventate (metrics_fabricated)
- Contare le certificazioni aggiunte (certs_added)
- Se il conteggio supera soglie → bloccare il risultato e rigenerare

### File coinvolti

| File | Modifica |
|------|----------|
| `supabase/functions/ai-tailor/index.ts` | Hardening prompt + chiamata integrity check |
| `supabase/functions/_shared/integrity-check.ts` | Nuovo modulo di validazione post-patch |

