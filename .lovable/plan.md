

# Landing Page — Home Pre-Login

## Visione

Oggi la route `/` fa un redirect secco a `/app/home` (che richiede login). Un visitatore che arriva su Verso non vede nulla: finisce dritto sulla pagina di login. Zero storytelling, zero value proposition, zero conversione.

Serve una **copertina**: una pagina pubblica che faccia capire in 5 secondi cosa fa Verso, perché è diverso, e convinca a registrarsi. Il progetto "Captivating Landing Page" ha già una struttura solida — la adattiamo al brand system Verso e la arricchiamo.

---

## Architettura

```text
Route /
├── LandingPage.tsx (nuova pagina pubblica)
│   ├── LandingNavbar.tsx      — wordmark + ghost links + CTA
│   ├── LandingHero.tsx        — headline + sub + CTA + mock card
│   ├── ProblemSection.tsx     — 3 stat cards "perché il tuo CV non funziona"
│   ├── HowItWorksSection.tsx  — 3 step cards con connettori
│   ├── FeaturesSection.tsx    — 3 alternating rows (tailoring, score, tracker)
│   ├── SocialProofSection.tsx — testimonial + stats
│   ├── PricingSection.tsx     — Free vs Pro cards
│   ├── FinalCTASection.tsx    — last push
│   └── LandingFooter.tsx      — links legali + made in italy
```

**Routing change in `App.tsx`:**
- `/` → `<LandingPage />` (pubblica, nessun `ProtectedRoute`)
- Se l'utente è già autenticato e arriva su `/`, redirect automatico a `/app/home`

---

## Sezioni nel dettaglio

### 1. Navbar
Fixed, `backdrop-blur-xl`, trasparente fino a scroll 60px poi border bottom appare. Wordmark "VERSO" con "O" in accent. Desktop: "Come funziona · Funzionalità · Prezzi · Accedi" + "Inizia gratis" CTA. Mobile: hamburger → drawer.

### 2. Hero (full viewport)
- Radial glow background `rgba(168,255,120,0.07)` + griglia CSS sottile
- Chip `✦ AI-POWERED JOB HUNTING` in JetBrains Mono
- Headline Syne 800: "Il tuo CV, alla sua versione **migliore**." con gradient text su "migliore"
- Sub: copy dal prompt spec
- CTA: "Inizia gratis" primary + "Guarda come funziona ↓" ghost
- Trust line: "Nessuna carta di credito · 3 tailoring gratuiti al mese"
- Mock card flottante con score 78%, progress bar animata, 3 skill tags
- Staggered entrance animations (Framer Motion)

### 3. Problem Section (nuovo, dal reference project)
"Il tuo CV è generico. I recruiter lo notano." + 3 stat card:
- 75% scartati dai filtri ATS
- 6 secondi di attenzione media
- 1 su 10 personalizza il CV

### 4. How It Works
3 step: Incolla annuncio → CV si adatta → Traccia tutto. Card con icone, step number mono, connettori dashed tra card su desktop.

### 5. Features (3 righe alternate)
- **CV Tailoring**: mock diff-view + copy + bullets
- **Score & Gap**: mock score card 68% + gap list con corsi
- **Application Tracker**: mini kanban mockup

### 6. Social Proof
Testimonial quote (Marco R.) + 3 stats (2.400+ candidature, 94% più colloqui, 3 minuti) + integration badges (LinkedIn, Gmail, PDF).

### 7. Pricing
Free (€0) vs Pro (€12.99/mese). Toggle mensile/annuale sul Pro. Card Pro con glow border e badge.

### 8. Final CTA
"Smetti di mandare CV generici." + button grande + trust line.

### 9. Footer
Wordmark + colonne Prodotto/Legale/Contatti + "© 2025 Verso. Fatto con precisione." + 🇮🇹

---

## Dettagli tecnici

- **Animazioni**: Framer Motion (già in progetto) per hero stagger, scroll reveal via `useInView`, score bar fill, card hover lift
- **CSS**: Aggiungo le utility `.text-gradient`, `.glow-accent`, `.animate-fade-up`, `.animate-score-fill`, `.animate-float` in `index.css` — ispirate dal reference project
- **Font**: Già caricati (Syne, DM Sans, JetBrains Mono)
- **Mobile-first**: Testato per 375px, 768px, 1280px. Stack verticale, hero headline 40px su mobile
- **Link "Accedi"**: naviga a `/login`. "Inizia gratis" naviga a `/login` con `?signup=true` (o direttamente alla registrazione)
- **Auth-aware redirect**: Se `user` è già autenticato, `/` fa redirect a `/app/home`
- **Nessun impatto sull'app autenticata**: Le rotte `/app/*` restano intatte

### File da creare
| File | Contenuto |
|------|-----------|
| `src/pages/Landing.tsx` | Pagina wrapper con tutte le sezioni |
| `src/components/landing/LandingNavbar.tsx` | Navbar fissa |
| `src/components/landing/LandingHero.tsx` | Hero section |
| `src/components/landing/ProblemSection.tsx` | Stat cards problema |
| `src/components/landing/HowItWorksSection.tsx` | 3 step |
| `src/components/landing/FeaturesSection.tsx` | 3 righe alternate |
| `src/components/landing/SocialProofSection.tsx` | Testimonial + stats |
| `src/components/landing/PricingSection.tsx` | Free vs Pro |
| `src/components/landing/FinalCTASection.tsx` | CTA finale |
| `src/components/landing/LandingFooter.tsx` | Footer |

### File da modificare
| File | Modifica |
|------|----------|
| `src/App.tsx` | Route `/` → `<Landing />` pubblica con redirect auth-aware |
| `src/index.css` | Aggiunta utility animations (fade-up, score-fill, float, glow, text-gradient) |

