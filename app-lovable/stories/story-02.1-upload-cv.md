# Story 02.1 — Upload CV PDF (Implementata)

**Epic:** 02 — Onboarding
**Status:** Completata

---

## Cosa è stato implementato

Step 1 dell'onboarding: area di upload drag & drop per il CV in formato PDF.

### Comportamento

1. Area drag & drop con icona `FileArrowUp`
2. Oppure click per aprire file picker
3. Validazione: solo PDF, max 10 MB
4. Dopo selezione: mostra nome file + dimensione
5. Upload su Supabase Storage bucket `cv-uploads`
6. Procede automaticamente al parsing (step 2)

### Error states

- File non PDF → messaggio errore
- File > 10 MB → messaggio errore con limite
