# Story 10.1 — Editor Master CV (Implementata)

**Epic:** 10 — Feature aggiuntive
**Status:** Completata

---

## Cosa è stato implementato

Pagina `/app/cv-edit` per la modifica inline del CV master caricato dall'utente.

### Comportamento

- Carica il CV master attivo dell'utente (ultimo `is_active = true`)
- Mostra tutte le sezioni con `CVSections` in modalità `editable`
- L'utente può toccare qualsiasi campo per modificarlo inline
- Pulsante "Salva" → aggiorna `parsed_data` in `master_cvs` → toast conferma → redirect a home
- Loading: skeleton layout
- Empty state: "Nessun CV trovato" + pulsante "Torna alla dashboard"

### Note

- Le modifiche al master CV vengono usate per tutte le candidature successive
- Non previsto come epic separato nel piano MVP — aggiunto durante lo sviluppo

### Componente

`src/pages/CVEdit.tsx`
