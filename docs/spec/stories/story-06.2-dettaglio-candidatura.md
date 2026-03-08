# Story 06.2 — Dettaglio Candidatura (Implementata)

**Epic:** 06 — Candidature
**Status:** Completata

---

## Cosa è stato implementato

Pagina dettaglio per una singola candidatura (`/app/candidatura/:id`), con tutti i dati di analisi, gestione stato e azioni.

### Sezioni

1. **Header:** ruolo, azienda, data, status chip
2. **Score:** Match % e ATS % con barre gradiente (condizionali)
3. **Score Note:** nota AI contestuale (se presente)
4. **ATS Check:** lista dei 7 check con indicatore pass/warning/fail
5. **Seniority Match:** livello candidato → livello ruolo, con indicazione match/gap
6. **Risorse consigliate:** link a corsi (Coursera, LinkedIn Learning, Udemy) per skill mancanti
7. **Modifiche AI:** diff collapsabile (originale barrato → suggerito in primary)
8. **CV adattato:** preview completa con `CVSections`
9. **Stato:** selettore orizzontale con 5 status (inviata, visualizzata, contattato, follow-up, ko)
10. **Note:** campo testo libero
11. **Annuncio originale:** collapsabile
12. **Azioni sticky su mobile:** Salva, Scarica PDF (con ExportDrawer), Elimina con conferma

### Comportamento

- Loading: skeleton layout con header + card placeholder
- Not found: messaggio + pulsante "Torna alle candidature"
- Eliminazione: conferma AlertDialog → cancella tailored_cv + application + file Storage → redirect
- ExportDrawer per scelta template e download PDF
- Azioni sticky bottom su mobile con backdrop blur

### Componente

`src/pages/CandidaturaDetail.tsx`
