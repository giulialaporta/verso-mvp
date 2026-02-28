

# Verifica complessiva del codice — Bug trovati

## Bug identificati

### 1. CRITICO: `handleSave` in Step3 crea duplicati di `tailored_cvs` alla ripresa bozza
Quando l'utente riprende una bozza che ha gia' un `tailored_cvs` (step 2/3), e poi clicca "Salva candidatura", il codice fa sempre un `INSERT` in `tailored_cvs` (riga 726). Se il record esiste gia' (caricato dalla ripresa bozza), viene creato un duplicato, oppure l'insert fallisce silenziosamente.

**Fix:** Prima di inserire, controllare se esiste gia' un `tailored_cvs` per quell'`application_id`. Se si', fare un `UPDATE` invece che un `INSERT`.

### 2. CRITICO: Step 2 "Indietro" resetta tutto senza recupero
Cliccando "Indietro" da Step 2 (`onBack={() => updateStep(0)}`), l'utente torna allo Step 1 ma `Step1` e' un componente separato con stato interno vuoto. Tutti i dati dell'analisi AI vengono persi. L'utente deve reinserire l'annuncio e rieseguire l'analisi AI.

**Fix:** Passare `jobData` iniziale a `Step1` come prop opzionale, cosi' da pre-compilare i campi quando l'utente torna indietro.

### 3. MEDIO: Drawer candidature non carica le `notes` dal DB
In `Candidature.tsx`, `handleOpenDetail` imposta `setDrawerNotes("")` (riga 129). Il campo `notes` della tabella `applications` non viene mai letto ne' scritto. L'utente scrive note ma non vengono salvate.

**Fix:** 
- Aggiungere `notes` alla query SELECT e al tipo `AppRow`
- Caricare `drawerNotes` dal record esistente in `handleOpenDetail`
- Salvare `notes` nell'`update` di `handleStatusSave`

### 4. MEDIO: `cv-uploads` bucket non e' pubblico ma `getPublicUrl` viene usato
In `parse-cv/index.ts` (riga 116), `supabase.storage.from("cv-uploads").getPublicUrl(photoPath)` genera un URL pubblico, ma il bucket `cv-uploads` e' privato (`Is Public: No`). La foto del profilo non sara' mai accessibile tramite quell'URL.

**Fix:** O rendere il bucket `cv-uploads` pubblico, oppure usare `createSignedUrl` per generare URL temporanei, oppure spostare le foto in un bucket pubblico separato.

### 5. BASSO: `draftLoaded` ref non si resetta quando cambia il draft ID
Se l'utente naviga a `/app/nuova?draft=abc`, poi torna a `/app/candidature`, e poi clicca "Riprendi" su un'altra bozza (`/app/nuova?draft=xyz`), il `useRef` `draftLoaded` resta `true` dal primo caricamento e il secondo draft non viene mai caricato.

**Fix:** Resettare `draftLoaded.current = false` quando il `draft` param cambia. Usare l'ID del draft come dipendenza e tracciare quale draft e' stato caricato.

### 6. BASSO: `handleSave` in Step3 non aggiorna `job_description` nel draft
Quando l'utente crea una nuova candidatura, il `job_description` viene salvato nel draft iniziale. Ma se l'utente riprende una bozza senza `job_description` e l'AI viene rieseguita, il `job_description` non viene mai aggiornato.

### 7. BASSO: Bottom bar in Step3 si sovrappone alla mobile tab bar
La barra fissa in basso di Step3 (`fixed bottom-0`, riga 832) si sovrappone alla `MobileTabBar` di `AppShell.tsx`. Su mobile, i bottoni "Scarica PDF" e "Salva candidatura" sono parzialmente coperti.

**Fix:** Aggiungere `bottom-[calc(3.5rem+env(safe-area-inset-bottom))]` su mobile per la barra di Step3, o usare la classe `md:bottom-0` con un offset su mobile.

### 8. BASSO: Tipo `as any` eccessivo
Molti cast `as any` nelle query Supabase (`update({ ... } as any)`, `insert({ ... } as any)`). Questo nasconde errori di tipo e potrebbe causare problemi runtime se i nomi delle colonne non corrispondono.

## Ordine di implementazione

1. Fix duplicati `tailored_cvs` (bug 1) — critico per integrita' dati
2. Fix `draftLoaded` ref (bug 5) — blocca la ripresa di bozze diverse
3. Fix note non salvate (bug 3) — funzionalita' visibile rotta
4. Fix bottom bar overlap su mobile (bug 7) — UX
5. Fix Step1 back navigation (bug 2) — UX
6. Fix foto profilo URL privato (bug 4) — richiede migrazione

## File coinvolti

| File | Bug | Modifica |
|------|-----|----------|
| `src/pages/Nuova.tsx` | 1, 2, 5, 7 | Upsert tailored_cvs, passare jobData a Step1, fix ref, fix bottom bar |
| `src/pages/Candidature.tsx` | 3 | Leggere/salvare notes, aggiungere al tipo AppRow |

