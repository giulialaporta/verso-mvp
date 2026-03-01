# Verso — Landing Page Prompt for Lovable

---

Build the **marketing landing page** for Verso at route `/`.

The full brand system (colors, typography, components, motion, tone of voice) is defined in `brand-system.md`. The product vision, features, and messaging are defined in `verso-prd.md`. Both files are already uploaded — read them before writing a single line of code.

---

## Page sections — build in this order

### 1. Navbar
Fixed, `backdrop-filter: blur(16px)`, background `rgba(12,13,16,0.85)`, bottom border `1px solid var(--color-border)`. Transparent until user scrolls 60px, then border appears.

Left: VERSO wordmark — Syne 800, the letter "O" in `var(--color-accent)`.  
Right (desktop): ghost links "Come funziona · Funzionalità · Prezzi" + "Accedi" ghost button + "Inizia gratis" primary CTA (small).  
Mobile: hamburger → slide-down drawer with stacked links.

---

### 2. Hero
Full viewport height. Centered, max-width 760px.

Background: faint radial glow `radial-gradient(ellipse 60% 40% at 50% 40%, rgba(168,255,120,0.07) 0%, transparent 70%)` + very subtle 40px CSS grid overlay (`rgba(255,255,255,0.025)`).

Content stack (centered):
- Label chip: `✦ AI-POWERED JOB HUNTING` — JetBrains Mono 11px uppercase, pill, `border: 1px solid rgba(168,255,120,0.3)`, bg `rgba(168,255,120,0.06)`, color `var(--color-accent)`
- Headline Syne 800 64px / 40px mobile, `letter-spacing: -0.03em`:
  ```
  Il tuo CV,
  alla sua versione
  migliore.
  ```
  The word **"migliore"** uses `var(--gradient-hero)` as a CSS text gradient.
- Subheadline DM Sans 400 18px `var(--color-text-secondary)` max-width 540px: *"Verso analizza ogni offerta di lavoro, adatta il tuo CV in modo intelligente e tiene traccia di ogni candidatura. Senza bugie. Solo la versione migliore di te."*
- CTA row: primary button "Inizia gratis" + ghost link "Guarda come funziona ↓"
- Trust line DM Sans 400 13px `var(--color-text-muted)`: "Nessuna carta di credito · 3 tailoring gratuiti al mese"

Below CTAs — a floating UI mock card (dark surface, `box-shadow: 0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,255,120,0.1)`, border-radius 20px) showing:
- Label "COMPATIBILITÀ" JetBrains Mono uppercase muted
- Score "78%" JetBrains Mono 48px `var(--color-accent)`
- The `--gradient-score` progress bar animated from 0→78% on load, 800ms ease-out
- Three skill tags: "✓ Product Strategy" (green) · "✓ Stakeholder Mgmt" (green) · "⚠ SQL" (yellow `var(--color-warning)`)

---

### 3. Social proof bar
Full-width strip, `background: var(--color-surface)`, top + bottom border. Three stats centered with `1px solid var(--color-border)` dividers:

- **2.400+** candidature gestite
- **94%** degli utenti ottiene più colloqui  
- **3 minuti** per un CV tailorizzato

Number: Syne 700 20px `var(--color-text-primary)`. Label: DM Sans 400 13px `var(--color-text-secondary)`.

---

### 4. How it works
Title Syne 700 32px centered: "Come funziona"  
Subtitle: "Tre passi. Nessuna magia. Solo intelligenza applicata."

Three cards in a row (desktop) / stacked (mobile). Between them on desktop: dashed arrow connectors in `var(--color-border)`.

- **01 — Incolla l'annuncio:** URL o testo → Verso legge l'offerta, studia l'azienda, capisce le priorità del recruiter. Icon: FileText, `var(--color-accent)`.
- **02 — Il tuo CV si adatta:** L'AI riscrive i bullet point, riordina le sezioni, ottimizza le keyword. Senza inventare nulla. Icon: Zap, `var(--color-secondary)`.
- **03 — Traccia tutto:** Kanban automatico collegato alla tua email. Stato aggiornato in tempo reale. Icon: Kanban, `var(--color-warning)`.

Step number "01 / 02 / 03" top-right corner of each card, JetBrains Mono `var(--color-border)`.

---

### 5. Features (3 alternating rows)

Each row: UI mock on one side, text on the other. Alternate left/right. Stack on mobile.

**Row 1 — CV Tailoring** (mock left, text right)  
Mock: diff-view card — two columns "Originale" vs "Tailorizzato", one bullet with green left-border accent showing the rewritten version.  
Tag chip: "AI TAILORING" accent.  
Headline Syne 700 28px: "Il CV giusto per ogni candidatura."  
Body: "Verso non usa template generici. Riscrive i punti più rilevanti del tuo CV per ogni offerta specifica. Fatti, non finzioni."  
Bullets (accent checkmarks): "Rewriting intelligente dei bullet point" · "Keyword optimization per gli ATS" · "Nessuna bugia, mai"

**Row 2 — Score & Gap** (text left, mock right)  
Mock: score card 68% + gap list — "SQL — Critico" con Coursera badge, "Stakeholder Management — Importante" con LinkedIn Learning badge. Ogni riga ha "Vai al corso →" in `var(--color-secondary)`.  
Tag chip: "SCORE & GAPS" in `var(--color-secondary)`.  
Headline: "Sai esattamente dove migliorare."  
Body: "Per ogni candidatura, Verso calcola il tuo score di compatibilità e ti mostra quali competenze ti mancano — con corsi specifici per colmarle."  
Bullets: "Score 0–100 per ogni application" · "Gap analysis per skill critiche" · "Corsi su Coursera, Udemy, LinkedIn Learning"

**Row 3 — Application Tracker** (mock left, text right)  
Mock: mini kanban board a 5 colonne, 3-4 card applicazioni con company name, score badge, status chip colorati come da brand system. Una card in "Contattato" con glow accent.  
Tag chip: "PIPELINE" in `var(--color-warning)`.  
Headline: "Il tuo funnel del recruiting, sotto controllo."  
Body: "Dalla prima candidatura alla risposta finale. Verso sincronizza la tua email e ti ricorda quando fare follow-up."  
Bullets: "Kanban drag & drop" · "Sync Gmail e Outlook" · "Reminder follow-up intelligenti"

---

### 6. Pricing
Title: "Semplice. Senza sorprese."

Two cards side by side (desktop) / stacked (mobile).

**Free:** border `var(--color-border)`. Price €0. Features: 3 tailoring/mese · Tracker fino a 10 candidature · 2 template CV · Score base. Locked (✗ muted): Sync email · Corsi · Link condivisibile. CTA: "Inizia gratis" secondary button.

**Pro:** border `rgba(168,255,120,0.4)` + faint glow `box-shadow: 0 0 40px rgba(168,255,120,0.08)`. Badge "PRO" top-right, accent pill. Monthly/annual toggle — monthly €12.99 / annual €99 con "Risparmia €57" badge giallo. Tutte le feature abilitate. CTA: "Inizia con Pro" primary button. Sotto: "Annulla quando vuoi." DM Sans 400 12px muted centrato.

---

### 7. Testimonials
Title: "Chi lo usa, non torna indietro."

Three cards, horizontal scroll on mobile. Each: 5 stars `var(--color-accent)`, quote DM Sans italic `var(--color-text-secondary)`, author name + role.

- *"Ho mandato 40 candidature in 2 mesi. Con Verso ne mando 15, ma con risposta nel 60% dei casi."* — Marco R., Product Manager
- *"Non immaginavo che il mio CV fosse così poco ottimizzato. Il gap analysis mi ha aperto gli occhi."* — Giulia T., UX Designer  
- *"Il tracker mi ha salvato da almeno 3 follow-up mancati. Vale solo per quello."* — Andrea M., Data Analyst

---

### 8. Final CTA
Centered. Same faint radial glow as hero.

Headline Syne 800 48px / 32px mobile:
```
Smetti di mandare
CV generici.
```
Subheadline: "Il tuo prossimo colloquio parte da un CV che parla davvero di te."  
Button: "Inizia gratis — è subito" primary large.  
Trust line muted: "Nessuna carta di credito · Setup in 3 minuti · 3 tailoring gratuiti"

---

### 9. Footer
Background `var(--color-surface)`, `border-top: 1px solid var(--color-border)`.

Left: VERSO wordmark + tagline muted.  
Right columns: Prodotto | Legale | Contatti.  
Bottom bar: "© 2025 Verso. Fatto con precisione." + "Made in Italy 🇮🇹"

---

## Animations

- **Hero entrance:** staggered — chip (0ms) → headline (100ms) → sub (200ms) → CTAs (300ms) → mock (400ms). All: `opacity 0→1, translateY 24px→0`.
- **Scroll reveals:** every section fades up on Intersection Observer entry. Children stagger 80ms apart.
- **Score bar:** animates 0→78% on load, 800ms `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Card hover:** `translateY(-2px)` + border glow `rgba(168,255,120,0.3)`, 200ms.
- **Pricing toggle:** crossfade 200ms between monthly/annual prices.

---

## Technical constraints

- React + TypeScript + Tailwind
- Framer Motion for all animations
- Lucide React for icons
- Mobile-first: flawless at 375px, 768px, 1280px
- Dark mode locked — `<html>` always dark, no toggle ever
- Map all Tailwind colors from the CSS variables in `brand-system.md`
- No Lorem ipsum — use the Italian copy in this file exactly as written
