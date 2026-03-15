

## Gestione stati candidatura — Analisi e piano

### Il problema

Oggi lo stato resta `draft` per sempre a meno che l'utente non clicchi esplicitamente "Ho inviato la candidatura" nell'ultimo step del wizard. La maggior parte degli utenti completa il wizard, scarica il PDF, e poi naviga via senza cliccare nulla → la candidatura resta bozza per sempre.

### Flusso attuale (rotto)

```text
Annuncio → Verifica → Tailoring → Revisione → Export → Completa
                                                         │
                                              "Ho inviato" → inviata
                                              "La invierò dopo" → draft (!)
                                              Naviga via → draft (!)
```

Dopo `Completa`, l'utente può solo cambiare stato manualmente dal dettaglio candidatura. Nessuna transizione automatica.

### Nuovo flusso proposto

**Principio**: quando il wizard è completato (step 5 raggiunto), la candidatura NON è più una bozza. È un CV pronto. Lo stato deve riflettere questo.

```text
draft ──[wizard completato]──→ pronta
pronta ──[utente conferma]──→ inviata
pronta/inviata ──→ visualizzata ──→ contattato ──→ follow-up
                                                        │
qualsiasi ──→ ko                                        │
                                                   (fine positiva)
```

#### Transizioni automatiche

| Evento | Da | A |
|--------|----|----|
| Wizard raggiunge step 5 (Completa) | `draft` | `pronta` |
| Click "Ho inviato la candidatura" | `pronta` | `inviata` |
| Click "La invierò dopo" | `pronta` | `pronta` (naviga via, resta pronta) |

#### Transizioni manuali (dal dettaglio)

L'utente può cambiare stato liberamente tra: `pronta`, `inviata`, `visualizzata`, `contattato`, `follow-up`, `ko`.

### Modifiche

#### 1. Nuovo stato `pronta`

Aggiungere a `StatusChip`:
- `pronta`: colore accent/success — "CV pronto, da inviare"

#### 2. `Nuova.tsx` — Auto-transizione a `pronta`

Quando il wizard arriva a step 5, aggiornare automaticamente lo status:
```typescript
// Quando si passa a step 5
await supabase.from("applications")
  .update({ status: "pronta" })
  .eq("id", applicationId);
```

#### 3. `StepCompleta.tsx` — Nuova copy

- "Ho inviato la candidatura" → cambia da `pronta` a `inviata`, naviga a candidature
- "La invierò dopo" → resta `pronta`, naviga a home (non più "bozza salvata" ma "trovi il CV nelle candidature")

#### 4. Selettori stato nel dettaglio

Aggiungere `pronta` alla lista degli stati selezionabili in `CandidaturaDetail.tsx` e `DetailContent.tsx`.

#### 5. Raggruppamento candidature

In `Candidature.tsx`, aggiungere il gruppo `pronta` tra `draft` e `inviata`:
```text
Bozze → Pronte → Inviate → Visualizzate → Contattato → Follow-up → KO
```

#### 6. Home — Sezione bozze vs pronte

Le card nella Home mostrano sia bozze (con "Riprendi") che pronte (con "Vedi" / "Invia").

### File coinvolti

| File | Modifica |
|------|----------|
| `src/components/StatusChip.tsx` | Aggiungere stile `pronta` |
| `src/pages/Nuova.tsx` | Auto-update a `pronta` quando step → 5 |
| `src/components/wizard/StepCompleta.tsx` | Nuova copy per i bottoni |
| `src/pages/Candidature.tsx` | Aggiungere gruppo `pronta` |
| `src/pages/CandidaturaDetail.tsx` | Aggiungere `pronta` ai selettori |
| `src/components/candidature/DetailContent.tsx` | Aggiungere `pronta` ai selettori |
| `src/pages/Home.tsx` | Distinguere bozze da pronte nelle card recenti |

