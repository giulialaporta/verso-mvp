

# Pitch deck — Contenuto differenziante + target

## Problema attuale

Le 4 slide sono generiche: elencano feature tecniche senza spiegare **perche' Verso e' diverso** dai tool AI concorrenti (Teal, Kickresume, Rezi, etc.) e **per chi** e' fatto. Manca il posizionamento.

## Nuova struttura — 5 slide

### Slide 1 — Il problema (riscritta)
**Titolo**: "Ogni candidatura merita un CV su misura."
**Sottotitolo**: "Ma adattarlo a mano richiede ore — e spesso non basta comunque."

Le 3 card restano, ma aggiungiamo una sezione **Target** sotto:

**"Per chi e' Verso"** — 3 mini-profili in riga:
- **Marco, 31, Product Manager** — "10-20 candidature al mese. CV solido ma generico."
- **Giulia, 27, Designer** — "Career switcher. Vuole capire i gap e come colmare."
- **Roberto, 48, Responsabile commerciale** — "CV in Word non aggiornato da anni."

Sotto: *"Verso e' per qualsiasi professionista. Zero jargon tecnico."*

### Slide 2 — La soluzione + differenziazione (riscritta)
**Titolo**: "Verso adatta il tuo CV in secondi."
**Sottotitolo**: "Fedele alla tua storia. Ottimizzato per il ruolo."

I 3 step restano. Sotto, aggiungere una sezione **"Cosa ci rende diversi"** con 3 punti chiave in card orizzontali:

- **Zero invenzioni** — "Mai aggiunge metriche, competenze o esperienze che non esistono. Integrity check su ogni modifica."
- **Doppio output** — "CV Recruiter (PDF design) + CV ATS (DOCX plain) — due formati, una sola candidatura."
- **Pre-screening onesto** — "Ti dice se ci sono dealbreaker PRIMA di adattare il CV. Non ti fa perdere tempo."

Rimuovere la citazione in corsivo per fare spazio.

### Slide 3 — Il prodotto (riscritta)
**Titolo**: "Verso in azione"

Feature list aggiornata per enfatizzare i differenziatori:
- Parsing CV da PDF (con estrazione foto)
- Pre-screening AI: dealbreaker, skill gap, domande follow-up
- CV tailorato con integrity check (zero invenzioni)
- Doppio export: PDF brand Verso + DOCX ATS-compliant
- Revisione formale automatica (grammatica, consistenza)
- Match score + ATS score + honest score

CTA demo resta invariata.

### Slide 4 — Stack tecnico (invariata nella struttura)
Aggiornare solo il footer: "Built in 4 weeks · 13 edge functions · pipeline AI multi-step"

### Slide 5 — NUOVA: Numeri e prossimi passi
**Titolo**: "Dove siamo"

Layout a 3 stat card grandi:
- **4 settimane** — "Da zero a prodotto live"
- **13** — "Edge functions in produzione"
- **2 provider AI** — "Claude + Gemini con fallback automatico"

Sotto, sezione "Roadmap":
- Template Pro aggiuntivi
- LinkedIn import
- Cover letter generation
- Multi-lingua nativa

Footer: Logo Verso grande + "Candidature piu' intelligenti. Sempre oneste." + link verso-cv.lovable.app

## File da modificare

| File | Modifica |
|------|----------|
| `src/pages/Pitch.tsx` | Riscrivere le 5 slide con contenuti differenzianti, target personas, unique selling points |

## Dettagli tecnici

- `TOTAL` diventa 5, si aggiunge `Slide5`
- Layout slide 1: le 3 card problema restano, sotto si aggiunge una riga di 3 mini-card persona (piu' piccole, bordo grigio)
- Layout slide 2: i 3 step restano sopra, sotto 3 card orizzontali per i differenziatori (bordo verde)
- Slide 5: stat card con numeri grandi (font-size 48px+) e label sotto

