
# Fix: "Riprendi candidatura" non funziona

## Diagnosi

Ho trovato **due problemi distinti**:

### Problema 1 — Il CV master e' stato cancellato
L'utente ha eliminato il proprio CV master (visibile nei log di rete: `DELETE /rest/v1/master_cvs`). Quando si clicca "Riprendi", il wizard controlla se esiste un CV caricato (`cvCheck`). Siccome non c'e' piu', mostra un blocco "Carica il tuo CV prima" invece di far riprendere la candidatura.

### Problema 2 — I dati intermedi non vengono salvati
Le 3 bozze in database hanno:
- `job_description`: presente
- `match_score`, `ats_score`: presenti (85/90, 40/85, 85/85)
- `tailored_cvs`: **nessun record** (la generazione non e' mai stata completata)
- `user_answers`: **null** (le risposte al pre-screening non vengono persistite)
- `prescreenResult`: **non salvato** da nessuna parte

Quindi quando si riprende una bozza senza `tailored_data`, il wizard ricomincia dallo step 1 (pre-screening), ma senza il pre-screening originale. Questo e' il comportamento corretto: la bozza e' stata interrotta prima di completare l'analisi, quindi deve rifare il pre-screening.

Il vero blocco e' che **senza un CV master caricato, il wizard non parte affatto**.

## Soluzione

### 1. Gestire il caso "CV mancante" quando si riprende una bozza

Quando l'utente clicca "Riprendi" e il CV master non esiste, invece di bloccare tutto, mostrare un messaggio specifico:
- "Per completare questa candidatura, devi prima ricaricare il tuo CV."
- Pulsante "Carica CV" che porta all'onboarding
- Dopo il caricamento, l'utente puo' tornare a riprendere la bozza

**Modifica:** `src/pages/Nuova.tsx` — nella sezione `cvCheck === "missing"`, se c'e' un `?draft=` nell'URL, mostrare un messaggio contestualizzato con il nome dell'azienda/ruolo della bozza, e un pulsante che porta a `/onboarding` (dove si carica il CV).

### 2. Salvare `user_answers` nella bozza

Attualmente le risposte al pre-screening vengono salvate solo allo step 2 (`handleVerificaProceed`). Questo e' gia' implementato (linea 1817-1821). Il problema e' che se l'utente abbandona prima dello step 2, le risposte si perdono. Ma questo e' un caso limite accettabile per ora.

### 3. Migliorare il messaggio di errore per bozze senza dati

Se la bozza non ha `job_description`, mostrare un messaggio chiaro invece di un form vuoto.

## Riepilogo modifiche

| File | Modifica |
|------|----------|
| `src/pages/Nuova.tsx` | Quando `cvCheck === "missing"` e c'e' un draft nell'URL, mostrare messaggio contestualizzato con nome azienda/ruolo e CTA per ricaricare il CV |
| `src/pages/Nuova.tsx` | Caricare i dati della bozza anche quando il CV e' mancante, per poter mostrare il contesto (azienda, ruolo) nel messaggio di errore |

## Dettagli tecnici

### Modifica al blocco `cvCheck === "missing"`

```typescript
if (cvCheck === "missing") {
  // Se c'e' un draft, mostrare contesto
  const draftId = searchParams.get("draft");
  return (
    <div className="mx-auto max-w-md py-16 text-center space-y-6">
      <FileArrowUp size={48} className="mx-auto text-muted-foreground" />
      <h2 className="font-display text-xl font-bold">
        {draftId && jobData
          ? `Per riprendere "${jobData.role_title}" serve il tuo CV`
          : "Prima di iniziare, carica il tuo CV"}
      </h2>
      <p className="text-muted-foreground">
        {draftId
          ? "Il CV master e' stato rimosso. Ricaricalo per continuare."
          : "Verso ha bisogno del tuo CV per analizzare la compatibilita'."}
      </p>
      <Button onClick={() => navigate("/onboarding")} className="gap-2">
        <FileArrowUp size={16} /> Carica CV
      </Button>
    </div>
  );
}
```

### Caricare dati draft PRIMA del CV guard

Spostare la logica di caricamento dei dati della bozza (solo `company_name` e `role_title`) prima del check `cvCheck === "missing"`, in modo da poter mostrare il contesto nel messaggio di errore. Basta che il `useEffect` di draft resumption venga eseguito indipendentemente da `cvCheck`.
