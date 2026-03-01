

# Fix: schermata bianca allo step "Verifica" quando si apre un draft da DevTest

## Problema

Quando DevTest crea una bozza e naviga a `/app/nuova?draft=ID`, il wizard:
1. Carica i dati della bozza dal database
2. Trova `job_description` popolata, quindi imposta `updateStep(1)` (Verifica)
3. Ma **non lancia** la chiamata `ai-prescreen`
4. Lo step Verifica riceve `prescreenResult=null` e `loading=false`
5. La riga 493 (`if (!prescreenResult) return null`) restituisce **nulla** = schermata bianca

## Soluzione

Modificare la logica di caricamento del draft in `Nuova.tsx` (intorno alla riga 1751-1753): quando il wizard si posiziona sullo step 1 perche' c'e' un `job_description` ma nessun `tailored_cvs`, deve **lanciare automaticamente il pre-screening** con i dati dell'annuncio gia' disponibili.

### Modifiche in `src/pages/Nuova.tsx`

Nel blocco `useEffect` che carica il draft (righe ~1700-1755):

**Attualmente (riga 1751-1753):**
```typescript
} else if (app.job_description) {
  updateStep(1);
}
```

**Diventa:**
```typescript
} else if (app.job_description) {
  // Lancia automaticamente il pre-screening
  updateStep(1);
  setPrescreening(true);
  
  const jobDataForPrescreen = {
    company_name: app.company_name,
    role_title: app.role_title,
    description: app.job_description,
    location: "",
    key_requirements: [],
    required_skills: [],
  };

  supabase.functions.invoke("ai-prescreen", {
    body: { job_data: jobDataForPrescreen },
  }).then(({ data: result, error }) => {
    if (error || result?.error) {
      toast.error("Errore durante il pre-screening");
      updateStep(0);
    } else {
      setPrescreenResult(result);
    }
  }).finally(() => {
    setPrescreening(false);
  });
}
```

Questo fa si' che quando un draft viene caricato con `job_description` presente ma senza tailored CV:
- Il wizard va allo step 1 (Verifica)
- Il pre-screening viene lanciato automaticamente
- L'utente vede le skeleton card di caricamento ("Classificazione requisiti...", "Analisi gap...", "Generazione domande...")
- Quando il risultato arriva, la UI si popola normalmente

Nessuna modifica ad altri file.

