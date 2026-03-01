# Story 06.1 — Lista Candidature con Tracker (Implementata)

**Epic:** 06 — Candidature
**Status:** Completata

---

## Cosa è stato implementato

Pagina `/app/candidature` con lista completa delle candidature, gestione stati, note, e supporto bozze.

> **Non prevista nel piano MVP.** Aggiunta durante lo sviluppo.

### Sezioni

**Bozze:** sezione separata in alto con warning color, pulsante "Riprendi" per completare il wizard.

**Candidature attive:** ordinate per data (più recenti in alto), card con ruolo/azienda/match/ATS/status/data.

### Gestione stati

Stati disponibili: draft → inviata → visualizzata → contattato → follow-up → ko

Chip colorati (`StatusChip`) per ogni stato.

### Edit Drawer

Click su candidatura → `EditItemDrawer`:
- Cambio status (dropdown)
- Note (campo testo libero)
- Download CV adattato (link a pdf_url)
- Elimina con conferma

### Azioni

- Cambia status → aggiorna DB
- Aggiungi/modifica nota → aggiorna DB
- Download CV → apre URL del PDF
- Elimina → conferma → cancella application + tailored_cv
- Riprendi bozza → redirect a `/app/nuova` con dati
