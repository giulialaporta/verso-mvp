# Story 02.2 — Parsing CV con AI Multimodale (Implementata)

**Epic:** 02 — Onboarding
**Status:** Completata

---

## Cosa è stato implementato

Step 2 dell'onboarding: il PDF viene inviato alla Edge Function `parse-cv` per estrazione multimodale con Gemini 2.5 Flash.

### Comportamento

1. PDF inviato come base64 alla edge function
2. Gemini 2.5 Flash riceve il PDF come input multimodale (non testo estratto)
3. Estrazione di tutte le sezioni del CV in JSON strutturato
4. Scansione binaria per marker JPG/PNG → estrazione foto profilo
5. Se foto trovata → upload su storage → URL firmato
6. UI: skeleton loading durante il parsing

### Schema estratto

- Personal (nome, email, telefono, località, LinkedIn, website)
- Summary (sintetizzato se assente)
- Experience (con bullets e descrizione)
- Education (con voti, honors, programmi, pubblicazioni)
- Skills (tecniche, soft, tools, lingue con livello CEFR)
- Certifications, Projects, Extra

### Differenza dal piano MVP

Il piano prevedeva estrazione testo con `pdf-parse` + prompt a Claude. Implementato input multimodale diretto a Gemini.
