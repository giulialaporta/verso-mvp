

# Piano: Sbloccare tutti i template e rimuovere logica Pro/Free

## Analisi

L'unico punto di gating e' nella definizione dei template in `src/components/cv-templates/index.ts`:

```
{ id: "executive", name: "Executive", free: false },
{ id: "moderno", name: "Moderno", free: false },
```

I componenti `StepExport.tsx` e `ExportDrawer.tsx` usano `!t.free` per:
- Disabilitare il click (`disabled={isLocked}`)
- Mostrare icona lucchetto
- Mostrare label "Pro" vs "Free"

**Non ci sono altre logiche bloccate per profilo/piano** nell'app. Nessun paywall, nessun check su ruoli utente, nessun limite di utilizzo.

## Modifiche

### 1. `src/components/cv-templates/index.ts`
Impostare `free: true` per tutti e 4 i template.

### 2. `src/components/wizard/StepExport.tsx` e `src/components/ExportDrawer.tsx`
Rimuovere la label "Free"/"Pro" sotto il nome del template (non serve piu' distinguere). Rimuovere l'import di `Lock`.

> Nota: Executive e Moderno non hanno ancora un componente React (`ExecutiveTemplate`, `ModernoTemplate`), quindi saranno selezionabili ma il download usera' il fallback `ClassicoTemplate`. Se vuoi posso creare i template mancanti come story successiva.

