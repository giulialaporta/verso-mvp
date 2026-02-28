
# Revisione completa Verso -- Bug, Ottimizzazioni, Mancanze

## BUG CRITICI

### 1. `Nuova.tsx` -- `useEffect` per `decisions` reinizializza lo stato quando non dovrebbe
**Linea 688-695**: `useEffect` che inizializza `decisions` dipende da `result`, ma `result` cambia anche quando l'utente modifica il CV inline in Step 3 (via `handleTailoredCvChange` che fa `setTailorResult({...tailorResult, tailored_cv: updatedCv})`). Ogni modifica inline resetta tutte le approvazioni.

**Fix**: Usare un ref per tracciare se le decisions sono gia' state inizializzate, oppure usare `useState` con inizializzatore lazy basato sull'ID del result.

### 2. `Nuova.tsx` -- Selective patching non gestisce correttamente le structural_changes
**Linea 731-735**: Le structural changes vengono correlate alle patch tramite `sc.section` (es. "experience"), ma le patch usano path come "experience" (array intero). Se una structural change e' "condensed" su `experience[0].bullets` e un'altra e' "removed" su `experience`, condividono lo stesso path "experience" ma dovrebbero essere gestite separatamente. La logica attuale le confonde.

**Fix**: Aggiungere un campo `patch_path` esplicito anche alle `structural_changes` nel tool schema, oppure usare indici di correlazione.

### 3. `Nuova.tsx` -- `applyPatchesFrontend` crasha su path con target null/undefined
**Linea 640-644**: Se un segmento intermedio del path e' null/undefined e si tenta `target[idx]`, restituisce undefined e la riga successiva fallisce con "Cannot set properties of undefined".

**Fix**: Aggiungere un guard `if (!target) return result;` nel loop.

### 4. `Nuova.tsx` -- `useAnimatedCounter` non si resetta tra navigazioni
**Linea 179-199**: `startedRef.current` non si resetta mai. Se l'utente torna allo Step 2 con un nuovo risultato, il counter non si rianima.

**Fix**: Aggiungere `target` come dipendenza per resettare `startedRef`.

### 5. `Home.tsx` -- `master_cvs` query non ordina per `created_at`
**Linea 389-392**: La query `select("*").eq("user_id", user.id).limit(1)` non specifica un ordine. Potrebbe restituire un CV vecchio invece dell'ultimo caricato.

**Fix**: Aggiungere `.order("created_at", { ascending: false })`.

### 6. `Candidature.tsx` -- `ats_score` acceduto con `(app as any).ats_score` in Home ma non selezionato nella query di Candidature
**Linea 103**: La query seleziona `match_score` ma non `ats_score`, pero' il tipo `AppRow` in Home lo include. Inconsistenza tra le due pagine.

**Fix**: Aggiungere `ats_score` al tipo `AppRow` in `Candidature.tsx` e alla query select.

### 7. `Onboarding.tsx` -- Nessuna gestione di CV multipli
**Linea 95**: `insert` aggiunge sempre un nuovo master_cv senza eliminare il precedente. L'utente puo' accumulare CV multipli, e le edge functions prendono sempre l'ultimo.

**Fix**: Prima di inserire, fare `delete` dei master_cvs esistenti per lo stesso user_id, oppure fare upsert.

### 8. `ExportDrawer.tsx` -- PDF template Classico manca certificazioni nel PDF
**ClassicoTemplate.tsx**: Il template non renderizza le `certifications` ne' i `projects` dal CV. Informazioni perse nell'export.

**Fix**: Aggiungere sezioni certifications e projects ai template PDF.

---

## BUG MINORI

### 9. `StepCVAdattato` -- doppia fetch del CV originale
**Linea 1509-1520**: Viene fatto un fetch separato del master CV per la tab "Originale", ma `result.original_cv` e' gia' disponibile nella risposta di `ai-tailor`. Il fetch e' ridondante e puo' fallire.

**Fix**: Usare `result.original_cv` se disponibile, con fallback al fetch.

### 10. `CVSections.tsx` -- experience con `role` vuoto mostra stringa vuota
**Linea 371**: Se `exp.role` e' vuoto (ad es. dopo "Aggiungi esperienza"), viene mostrata una stringa vuota. UX confusa.

**Fix**: Mostrare placeholder "Ruolo non specificato" quando role e' vuoto.

### 11. `Nuova.tsx` -- Step 3 bottom bar offset sbagliato su desktop
**Linea 1585**: `md:bottom-0 md:pl-64` presume una sidebar di 256px (16rem), ma la sidebar e' collassabile. Quando collassata, il padding e' eccessivo.

**Fix**: Usare un approccio responsive che considera lo stato della sidebar, o rimuovere il padding fisso.

### 12. Brand system -- Colori non allineati al design doc
**index.css**: `--primary: 145 62% 55%` (#3DDC84) non corrisponde al brand system che specifica `--color-accent: #A8FF78`. Il verde usato e' diverso da quello specificato. Anche `--secondary` e' mappato a surface-2 invece di Arctic Blue (#5DBBFF).

---

## OTTIMIZZAZIONI

### 13. `Nuova.tsx` -- File monolitico di 1898 righe
Il file contiene 5 componenti complessi (StepAnnuncio, StepVerifica, StepAnalisi, StepCVAdattato, Nuova) tutti nello stesso file. Difficile da mantenere e debuggare.

**Fix**: Estrarre ogni Step in un file separato sotto `src/components/nuova/`.

### 14. `as any` diffuso ovunque
Contati 15+ occorrenze di `as any` per aggirare i tipi Supabase. Questo nasconde errori a compile-time.

**Fix**: Usare i tipi generati da Supabase (`Tables`, `TablesInsert`, `TablesUpdate`) dove possibile. Per campi JSONB, fare cast espliciti.

### 15. Duplicazione StatusChip e STATUS_STYLES
`StatusChip` e `STATUS_STYLES` sono definiti identici in `Home.tsx` e `Candidature.tsx`.

**Fix**: Estrarre in `src/components/StatusChip.tsx`.

### 16. `compactCV` duplicata in 2 edge functions
La funzione `compactCV` e' identica in `ai-prescreen` e `ai-tailor`.

**Fix**: Creare un modulo condiviso `supabase/functions/_shared/utils.ts` e importarlo in entrambe.

### 17. No error boundary
Nessun error boundary React nell'app. Un crash in un componente figlio fa cadere l'intera app.

**Fix**: Aggiungere un `ErrorBoundary` wrapper in `App.tsx`.

### 18. `renderCV` e `renderEditableCV` in StepCVAdattato sono quasi identici
**Linea 1183-1453**: Due funzioni di ~270 righe ciascuna con l'80% di codice duplicato.

**Fix**: Unificare in un singolo componente `CVRenderer` con prop `editable`.

---

## MANCANZE FUNZIONALI

### 19. Nessun profilo utente editabile
La pagina profilo non esiste. L'utente non puo' cambiare nome, email, o impostazioni.

### 20. Nessun feedback di errore per rate limiting AI
Quando l'AI restituisce 429, il toast mostra un messaggio generico ma non indica quanto aspettare.

### 21. PDF non include LinkedIn/website/data di nascita
I template PDF mostrano solo email, telefono, location. Mancano LinkedIn, website, data di nascita se presenti nel CV.

### 22. Nessuna validazione lato client sull'annuncio
L'utente puo' inviare testo non pertinente (es. una ricetta) come annuncio di lavoro. Nessun check minimo.

### 23. Certifications e Projects mancanti nei PDF template
Come menzionato nel bug 8, i template PDF ignorano completamente queste sezioni.

---

## PIANO DI IMPLEMENTAZIONE

Ordine per priorita' (bug critici prima, poi ottimizzazioni):

| # | Modifica | File |
|---|----------|------|
| 1 | Fix reinizializzazione decisions | `src/pages/Nuova.tsx` |
| 2 | Fix useAnimatedCounter reset | `src/pages/Nuova.tsx` |
| 3 | Fix applyPatchesFrontend null guard | `src/pages/Nuova.tsx` |
| 4 | Fix master_cvs ordering in Home | `src/pages/Home.tsx` |
| 5 | Fix CV multipli in Onboarding | `src/pages/Onboarding.tsx` |
| 6 | Usare original_cv dal result invece di fetch | `src/pages/Nuova.tsx` |
| 7 | Aggiungere certifications/projects ai PDF | `src/components/cv-templates/*.tsx` |
| 8 | Estrarre StatusChip condiviso | `src/components/StatusChip.tsx`, Home, Candidature |
| 9 | Fix bottom bar padding desktop | `src/pages/Nuova.tsx` |
| 10 | Aggiungere LinkedIn/website ai PDF | `src/components/cv-templates/*.tsx` |
| 11 | Aggiungere ats_score alla query Candidature | `src/pages/Candidature.tsx` |
| 12 | Aggiungere ErrorBoundary | `src/components/ErrorBoundary.tsx`, `src/App.tsx` |

Le ottimizzazioni strutturali (split Nuova.tsx, rimozione `as any`, shared utils) possono essere fatte in un secondo momento per non introdurre regressioni.
