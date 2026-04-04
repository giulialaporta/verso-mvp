

# Ordinamento cronologico esperienze + flag "attuale" all'aggiunta

## Problema

Quando si aggiunge una nuova esperienza nel CV (onboarding o cv-edit), viene appesa in fondo all'array senza ordinamento. LinkedIn ordina le esperienze in ordine cronologico inverso (più recente in alto). Inoltre, quando si aggiunge una nuova esperienza, non viene chiesto se l'esperienza precedente è terminata.

## Modifiche

### File: `src/components/CVSections.tsx`

**1. Ordinamento cronologico inverso dopo ogni modifica**

Creare una funzione `sortExperiencesByDate` che ordina l'array `experience` in ordine cronologico inverso (più recente prima), usando il campo `start` (parsing best-effort di mese/anno). Le esperienze con `current: true` o `end` vuoto vanno sempre in cima.

Invocare questa funzione in due punti:
- Nel click di "Aggiungi Esperienza" (riga 443-449), dopo aver aggiunto il nuovo elemento vuoto e dopo che l'utente salva il drawer
- In `handleDrawerSave` (riga 276-291), quando il tipo è `experience`, riordinare l'array dopo il salvataggio

**2. Apertura automatica del drawer per la nuova esperienza**

Quando si clicca "+ Esperienza", invece di aggiungere un elemento vuoto e basta, aggiungere l'elemento e aprire immediatamente il drawer di editing sull'ultimo elemento (quello appena creato). Così l'utente compila subito le date e il sorting funziona correttamente.

**3. Prompt "esperienza precedente terminata?"**

Dopo il salvataggio di una nuova esperienza nel drawer, se esiste un'altra esperienza con `current: true` (o senza `end`), mostrare un dialog di conferma:
- Testo: "L'esperienza presso [azienda precedente] è terminata?"
- Opzioni: "Sì, è terminata" → imposta `current: false` e chiede la data di fine / "No, è ancora in corso" → lascia invariata

Implementare come `AlertDialog` (già disponibile in `src/components/ui/alert-dialog.tsx`).

**4. Riordinamento automatico**

La funzione di sorting parsa le date nel formato tipico dei CV ("Gen 2020", "2020", "January 2020", "01/2020") e ordina in modo decrescente. Le esperienze "current" o senza data di fine vanno in cima. Quelle senza data di inizio vanno in fondo.

### Dettaglio tecnico

```text
sortExperiencesByDate(experiences):
  1. current=true o end vuoto → priority 0 (in cima)
  2. Parse start date → ordine decrescente
  3. Nessuna data → in fondo

Trigger sorting:
  - handleDrawerSave (quando type === "experience")
  - Nessun sorting sull'aggiunta (l'elemento è vuoto, verrà ordinato al salvataggio del drawer)

Dialog "terminata?":
  - Trigger: salvataggio drawer di una NUOVA esperienza (non modifica di una esistente)
  - Condizione: esiste almeno un'altra exp con current===true o end vuoto/assente
  - Azione "Sì": imposta current=false, apre un prompt per la data di fine
  - Azione "No": chiude il dialog
```

Nessun altro file modificato. Nessuna modifica al backend.

