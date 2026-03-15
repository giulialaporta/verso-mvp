

# Allineamento contenuti landing al vero Verso

## Discrepanze trovate

| Sezione | Landing attuale | Verso reale |
|---------|----------------|-------------|
| **Prezzo Pro** | €12.99/mese, €99/anno | **€9,90/mese**, nessun piano annuale |
| **Toggle annuale** | Presente con "Risparmia €57" | **Da rimuovere** — esiste solo il mensile |
| **Free: limite candidature** | "Tracker fino a 10 candidature" | **1 candidatura completata** |
| **Free: tailoring** | "3 tailoring / mese" | Nessun limite tailoring esplicito — il gate è sulla candidatura |
| **Free: template** | "2 template CV" | **2 template** (Classico + Minimal) — corretto |
| **Pro: feature list** | Include "Sync email", "Corsi consigliati", "Link condivisibile" | Queste feature **non esistono** nel prodotto |
| **Features §2** | "Corsi su Coursera, Udemy, LinkedIn Learning" | Non implementato — rimuovere riferimenti specifici |
| **Features §3** | "Sync Gmail e Outlook" | Non implementato — riformulare |
| **Social proof stats** | "2.400+ candidature gestite", "94% più colloqui" | Numeri inventati per un prodotto appena lanciato — da rendere più onesti o rimuovere |

## Modifiche per file

### 1. `PricingSection.tsx`
- Rimuovere toggle mensile/annuale e stato `annual`
- Prezzo Pro: **€9,90/mese**
- Free features: "1 candidatura completa", "2 template CV (Classico, Minimal)", "Score di compatibilità"
- Free locked: "Template premium (Executive, Moderno)", "Candidature illimitate", "Analisi stipendio"
- Pro features: "Candidature illimitate", "Tutti i template premium", "Pre-screening di fattibilità", "Analisi stipendio", "Priorità nuove funzionalità"
- Rimuovere feature inesistenti (sync email, corsi, link condivisibile)

### 2. `FeaturesSection.tsx`
- Row 2 (Score & Gap): rimuovere riferimenti a corsi specifici (Coursera, Udemy, LinkedIn Learning) e badge "Vai al corso →". Riformulare come "Analisi competenze mancanti" senza promesse di corsi
- Row 3 (Tracker): rimuovere "Sync Gmail e Outlook". Riformulare bullets come "Gestione stati candidatura", "Vista dettaglio per ogni application", "Tutto in un posto"

### 3. `SocialProofSection.tsx`
- Sostituire stats gonfiati con dati più credibili/generici: tempo risparmiato, numero di step del wizard, ecc.

### 4. `LandingHero.tsx`
- Nessuna modifica sostanziale necessaria — il copy è corretto

### 5. `HowItWorksSection.tsx`, `ProblemSection.tsx`, `FinalCTASection.tsx`, `LandingFooter.tsx`
- Nessuna modifica necessaria — copy già allineato

