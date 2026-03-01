# Story 01.4 — App Shell Responsive (Implementata)

**Epic:** 01 — Auth + Setup
**Status:** Completata

---

## Cosa è stato implementato

Componente `AppShell` che wrappa tutte le pagine autenticate con navigazione responsive.

### Desktop (≥1024px)

- Sidebar sinistra con background `--color-surface`
- Logo "VERSO" in alto
- Link: Home (House), Candidature, Nuova (Plus accent)
- Nome utente in fondo
- Collassata a sole icone tra 1024-1279px

### Mobile (<1024px)

- Bottom tab bar con backdrop blur
- 3 tab: Home | + (FAB accent più grande) | Candidature
- Tab attiva indicata con dot accent
