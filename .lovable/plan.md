

## Fix: Job title troncato nella Home Hero

### Problema

La headline usa `line-clamp-2` ma il testo è troppo lungo (es. "HEAD OF AUTOMATION AND ARTIFICIAL INTELLIGENCE and...") perché viene preso raw dal CV. Con avatar + badge PRO su 390px, lo spazio è ~220px e il titolo viene comunque tagliato.

### Soluzione

Creare una funzione `compactHeadline(role, company)` che:

1. **Abbrevia il ruolo** lato client con regole deterministiche (no AI, no inventare):
   - Tronca "and" / "e" finali se il titolo supera 40 chars (es. "Head of Automation and Artificial Intelligence and Machine Learning" → "Head of Automation and AI")
   - Sostituisce pattern noti: "Artificial Intelligence" → "AI", "Machine Learning" → "ML", "Information Technology" → "IT", "Research and Development" → "R&D", "Human Resources" → "HR", "Business Development" → "BD", "Customer Experience" → "CX"
   - Se ancora > 45 chars, tronca a 42 + "…"
2. **Formatta**: `{compactRole} @{company}` (con `@` più compatto del `·`)
3. **Font adattivo**: se la headline supera 35 chars → `text-xs`, altrimenti `text-sm`

### Esempio

- Input: `"Head of Automation and Artificial Intelligence and Machine Learning"` + `"HYPE"`
- Output: `"Head of Automation and AI @HYPE"` in `text-sm`

### File da modificare

| File | Modifica |
|------|----------|
| `src/pages/Home.tsx` | Aggiungere `compactHeadline()`, usarla nel `useMemo` della headline, applicare font size dinamico nel JSX |

La funzione è pura, deterministica, non richiede chiamate AI. Lavora solo su abbreviazioni standard e troncamento.

