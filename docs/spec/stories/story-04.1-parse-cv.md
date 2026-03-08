# Story 04.1 — Edge Function parse-cv (Implementata)

**Epic:** 04 — AI Engine
**Status:** Completata

---

## Cosa è stato implementato

Edge Function Deno che riceve un PDF in base64 e restituisce un CV strutturato in JSON tramite input multimodale a Gemini 2.5 Flash.

### Comportamento

- Input: PDF come base64 nel body
- Il PDF viene passato direttamente a Gemini come input multimodale (non estratto come testo)
- Scansione binaria per marker JPG/PNG → estrazione foto → upload su Storage → URL firmato
- Output: oggetto `parsed_data` con sezioni: personal, summary, experience, education, skills, certifications, projects, extra
- Preserva la lingua originale del CV
- Se il summary manca, ne sintetizza uno dai dati disponibili
- Lingue con livello CEFR quando specificato
- Non inventa nulla: campi mancanti restano vuoti

### Endpoint

`POST /functions/v1/parse-cv`

### Modello AI

Gemini 2.5 Flash (fallback: Gemini 2.0 Flash)

### Differenze dal piano MVP

- Piano: estrazione testo + prompt Claude
- Implementato: input multimodale diretto (PDF → Gemini)
