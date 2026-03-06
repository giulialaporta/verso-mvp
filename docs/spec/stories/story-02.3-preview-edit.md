# Story 02.3 — Preview e Edit Inline CV (Implementata)

**Epic:** 02 — Onboarding
**Status:** Completata

---

## Cosa è stato implementato

Step 3 dell'onboarding: l'utente rivede i dati estratti dal CV e può modificarli inline prima di salvare.

### Comportamento

1. Dati estratti mostrati in sezioni collassabili (`CVSections`)
2. Ogni campo è modificabile inline (`InlineEdit`)
3. Skill gestibili con chip editabili (`EditableSkillChips`)
4. Drawer per editing dettagliato (`EditItemDrawer`)
5. Suggerimenti AI per migliorare il CV (`CVSuggestions`)
6. Messaggio di onestà: "Verso usa solo ciò che c'è nel tuo CV"
7. Click "Continua" → salvataggio in `master_cvs` → redirect a `/app/home`

### Dati salvati

- `parsed_data`: JSON strutturato (con modifiche utente)
- `file_name`, `file_url`, `raw_text`, `source`, `photo_url`

### Note

- Un solo CV per utente (nuovo upload sovrascrive)
- Dalla home è possibile eliminare o ricaricare il CV
- Questa feature (edit inline) non era nel piano MVP
