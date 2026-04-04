

# Prompt Narrativo per il Tailor — Piano di Implementazione

## Obiettivo
Sostituire il prompt tailor con una versione che trasforma il modello da "generatore di patch indipendenti" a "recruiter che legge la persona intera prima di scrivere". Aggiungere il campo `narrative_thread` allo schema tool.

## Cosa cambia

### 1. `SYSTEM_PROMPT_TAILOR` (righe 141-270)
Sostituzione completa del prompt. Le differenze chiave rispetto all'attuale:

- **STEP 0 — Lettura olistica**: nuova sezione che obbliga il modello a leggere l'intero CV come documento su una persona prima di generare patch. Produce un `narrative_thread` con 3 punti: chi è, differenziatore reale, tesi narrativa.
- **Cross-section synthesis**: sostituisce la regola restrittiva "ONLY information already present in that experience" con "information present ANYWHERE in this CV". Collegare sezioni diverse non è inventare — è far emergere ciò che già esiste.
- **Summary come spina dorsale**: il summary viene generato per primo e diventa il riferimento per tutti gli altri patch. Istruzioni più dettagliate su come scriverlo (4 paragrafi specifici, no buzzword).
- **Skill protection**: aggiunta regola "MUST NOT remove skills present in the original CV that are relevant to the role".
- **Language rules aggiornate**: `narrative_thread` aggiunto alla lista dei campi che devono essere in italiano.

Il resto (INVIOLABLE RULES, EXAMPLES, DATA INTEGRITY, FOLLOW-UP, OUTPUT FORMAT) rimane sostanzialmente identico con piccoli perfezionamenti.

### 2. `TOOL_SCHEMA_TAILOR` (righe 370-435)
- Aggiungere proprietà `narrative_thread` (type string) nelle `properties`
- Aggiungerlo all'array `required`: `["narrative_thread", "structural_changes", "tailored_patches", "honest_score", "diff"]`

### Nessun'altra modifica
Non si toccano: `SYSTEM_PROMPT_ANALYZE`, `TOOL_SCHEMA_ANALYZE`, `applyPatches`, il codice TypeScript del handler, né altri file.

## Dettagli tecnici

Il prompt nuovo è ~3.5KB (simile all'attuale). Il `narrative_thread` viene generato dal modello come parte del tool call, quindi arriva nel `result` e viene passato al frontend senza logica aggiuntiva. Non richiede modifiche al database né al frontend — il campo è informativo e verrà già incluso nel JSON di risposta.

