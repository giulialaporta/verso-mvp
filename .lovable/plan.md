

# Valutazione raccomandazioni ATS del consulente

## Premessa

Il consulente propone regole pensate per ATS americani (Taleo, Workday, iCIMS). Alcune sono universalmente valide, altre sono incompatibili con il mercato europeo target di Verso o con la nostra architettura multi-template. Ecco il verdetto punto per punto.

---

## 1. LAYOUT E STRUTTURA

| Raccomandazione | Verdetto | Motivazione |
|---|---|---|
| Colonna singola | **Parzialmente sì** | Il DOCX (formato ATS) è già a colonna singola. I PDF (Classico, Minimal) hanno sidebar ma sono per uso umano, non ATS. Non serve toccare i PDF. |
| Contatti nel body, non in header/footer | **Già fatto** | Il DOCX mette i contatti come paragrafi nel body. I template HTML li mettono nel body. Nessuna modifica. |
| Rimuovere icone/emoji/barre progresso | **Già fatto** | Il DOCX non ha nessun elemento grafico. I PDF usano solo testo e CSS. |
| Nessuna text box | **Già fatto** | Il DOCX usa solo `Paragraph` nativi di Word. |
| Font Calibri/Arial 10-12pt | **Già fatto** | Il DOCX usa Calibri 10pt body, 10.5pt headings. |
| Margini 2cm | **NO** — attualmente 18mm laterali, 14mm top/bottom. Differenza minima (2mm), margini più stretti = più contenuto per pagina. Non cambierei. |

**Azione: nessuna modifica necessaria.** Il DOCX è già ATS-compliant su tutti questi punti.

---

## 2. SEZIONI E INTESTAZIONI STANDARD

| Raccomandazione | Verdetto | Motivazione |
|---|---|---|
| Forzare nomi inglesi ("Professional Summary", "Work Experience") | **NO** | Verso serve il mercato europeo (IT, DE, FR, ES). Forzare intestazioni inglesi su un CV in italiano è controproducente. Gli ATS europei (Lever, Greenhouse, SmartRecruiters) parsano anche "Esperienza Lavorativa". Il nostro sistema i18n (`HEADERS` in template-utils.ts) è la soluzione corretta. |
| Ordine fisso delle sezioni | **Parzialmente sì** | L'ordine attuale (Summary → Experience → Education → Skills → Languages → Certifications → Projects → ...) è già sostanzialmente quello raccomandato. Unica differenza: Skills viene dopo Education. Spostare Skills prima di Education nel DOCX è un miglioramento ragionevole. |

**Azione possibile:** invertire l'ordine Skills/Education nel DOCX generator (skill prima di education). Piccola modifica, buon impatto ATS.

---

## 3. PROFESSIONAL SUMMARY

| Raccomandazione | Verdetto | Motivazione |
|---|---|---|
| 3-4 frasi, mai troncato | **Già fatto** | Il DOCX non tronca più il summary (fix precedente). |
| Deve contenere job title, anni, keyword, metriche | **NO come regola rigida** | Il nostro prompt `SYSTEM_PROMPT_TAILOR` ha già regole precise sulla summary (narrative, first person, 3-4 paragrafi). Il template proposto dal consulente ("X with Y+ years in Z...") è esattamente il pattern che il nostro prompt vieta ("generic buzzword lists"). La nostra summary è migliore per il mercato europeo. |

**Azione: nessuna modifica.** Il summary è già ben gestito dal prompt.

---

## 4. CORE SKILLS — FORMAT

| Raccomandazione | Verdetto | Motivazione |
|---|---|---|
| Skills separate da " \| " su 2-3 righe | **Ragionevole** | Attualmente usiamo " · " come separatore. Il pipe è effettivamente più parsabile dagli ATS. Cambiamento minimo nel DOCX generator. |
| Acronimo tra parentesi ("CRM", "AI", "KPI") | **Sì, nel prompt AI** | Questo è un miglioramento da aggiungere al prompt di tailoring: quando una skill ha un acronimo noto, includere entrambe le forme. Da aggiungere come regola in `SYSTEM_PROMPT_TAILOR`. |
| Divisione domain/tools/soft | **Già fatto** | Il CV ha già `skills.technical`, `skills.soft`, `skills.tools` separati. Il DOCX li unisce in una riga ma mantiene l'ordine. |

**Azione:** cambiare separatore skills da " · " a " | " nel DOCX. Aggiungere regola acronimi nel prompt tailor.

---

## 5. WORK EXPERIENCE — La raccomandazione è stata tagliata, ma i principi sono coperti

Il nostro DOCX ha già: ruolo + data sulla stessa riga, azienda sotto, bullet nativi Word. Il prompt impone action verbs e vieta metriche inventate. Nessuna modifica strutturale necessaria.

---

## Riepilogo azioni

| Cosa | Dove | Effort |
|---|---|---|
| Spostare Skills prima di Education nel DOCX | `docx-generator.ts` — invertire i due blocchi | 2 min |
| Separatore skills: " · " → " \| " nel DOCX | `docx-generator.ts` riga 355 | 1 min |
| Regola acronimi skill nel prompt AI | `ai-tailor/index.ts` → `SYSTEM_PROMPT_TAILOR` sezione Skill label rules | 5 min |

### Cosa NON fare

- **Non forzare intestazioni inglesi** — distruggerebbe l'i18n multilingua
- **Non rimuovere sidebar dai template PDF** — i PDF non sono per ATS, sono per uso umano
- **Non adottare il template summary rigido** — il nostro prompt narrativo è superiore per il mercato EU
- **Non cambiare margini** — differenza trascurabile, margini attuali sono ottimali
- **Non forzare ordine rigido con regola in-code** — l'ordine è già corretto, basta lo swap Skills/Education

