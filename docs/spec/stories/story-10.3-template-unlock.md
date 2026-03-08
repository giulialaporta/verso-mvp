# Story 10.3 — Template Unlock (Implementata)

**Epic:** 10 — Feature aggiuntive
**Status:** Completata

---

## Cosa è stato implementato

Rimozione della logica Pro/Free dai template CV: tutti e 4 i template sono ora accessibili gratuitamente.

### Modifiche

- `src/components/cv-templates/index.ts`: tutti i template impostati con `free: true`
- `src/components/wizard/StepExport.tsx`: rimossa icona Lock, label "Pro"/"Free", stato disabled
- `src/components/ExportDrawer.tsx`: rimossa icona Lock, badge "Pro"/"Free", logica isLocked

### Template disponibili

| ID | Nome | Note |
|----|------|------|
| classico | Classico | Componente React completo |
| minimal | Minimal | Componente React completo |
| executive | Executive | Selezionabile, usa fallback ClassicoTemplate |
| moderno | Moderno | Selezionabile, usa fallback ClassicoTemplate |

### Note

- Executive e Moderno non hanno ancora un componente React dedicato — il rendering usa il fallback `ClassicoTemplate`
- Nessun paywall, nessun check su ruoli utente, nessun limite di utilizzo
