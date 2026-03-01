# VERSO — Brand System
> AI-powered recruiting funnel assistant. Smart CV tailoring, application tracking, career gap analysis.

---

## 1. Brand Identity

**Name:** Verso  
**Tagline:** *Il tuo CV, alla sua versione migliore.*  
**Voice:** Confident, sharp, a little warm. Like a brilliant career coach who respects your time. Never corporate, never generic. Speaks Italian and English fluently, switches based on user locale.

**Brand Personality Pillars:**
- **Precision** — Every word in your CV is intentional.
- **Intelligence** — The app thinks so you don't have to overthink.
- **Momentum** — Job hunting is a funnel; Verso keeps things moving.
- **Honesty** — No fabrications. Real strengths, optimally framed.

---

## 2. Color System

```css
:root {
  /* Base */
  --color-bg:         #0C0D10;   /* Deep graphite black */
  --color-surface:    #141518;   /* Card / panel surface */
  --color-surface-2:  #1E2025;   /* Elevated surface */
  --color-border:     #2A2D35;   /* Subtle borders */

  /* Primary Accent — Electric Sage */
  --color-accent:     #A8FF78;   /* Bright lime-green: energy, growth */
  --color-accent-dim: #6EBF47;   /* Muted accent for hover/secondary */

  /* Secondary Accent — Arctic Blue */
  --color-secondary:  #5DBBFF;   /* Links, info states, score bars */

  /* Semantic */
  --color-success:    #A8FF78;
  --color-warning:    #FFD166;
  --color-error:      #FF6B6B;
  --color-neutral:    #8B8FA8;

  /* Text */
  --color-text-primary:   #F2F3F7;
  --color-text-secondary: #8B8FA8;
  --color-text-muted:     #4E5263;

  /* Gradients */
  --gradient-hero:    linear-gradient(135deg, #A8FF78 0%, #5DBBFF 100%);
  --gradient-card:    linear-gradient(160deg, #1E2025 0%, #141518 100%);
  --gradient-score:   linear-gradient(90deg, #FF6B6B 0%, #FFD166 50%, #A8FF78 100%);
}
```

**Usage Rules:**
- Dark surfaces dominate. Light mode is NOT supported in v1.
- `--color-accent` is used sparingly — CTAs, active states, key scores, never as background fills.
- Avoid purple. Avoid pure white. Avoid gray gradients.

---

## 3. Typography

```css
/* Load via Google Fonts or Fontsource */

/* Display / Brand */
font-family: 'Syne', sans-serif;        /* Weights: 700, 800 */

/* Body / UI */
font-family: 'DM Sans', sans-serif;     /* Weights: 400, 500 */

/* Mono / Code / Labels */
font-family: 'JetBrains Mono', monospace; /* Weights: 400, 500 */
```

**Type Scale:**

| Token          | Size    | Font     | Weight | Usage                    |
|----------------|---------|----------|--------|--------------------------|
| `--text-display` | 48–72px | Syne   | 800    | Hero headlines           |
| `--text-h1`    | 32px    | Syne     | 700    | Page titles              |
| `--text-h2`    | 24px    | Syne     | 700    | Section headers          |
| `--text-h3`    | 18px    | DM Sans  | 500    | Card titles              |
| `--text-body`  | 15px    | DM Sans  | 400    | Body text                |
| `--text-small` | 13px    | DM Sans  | 400    | Meta, timestamps         |
| `--text-label` | 11px    | JetBrains Mono | 500 | Tags, status chips, scores |
| `--text-mono`  | 14px    | JetBrains Mono | 400 | Stats, percentages       |

**Rules:**
- Headlines set in Syne with tight tracking (`letter-spacing: -0.02em`).
- Never center-align body paragraphs.
- Score numbers always use JetBrains Mono.

---

## 4. Spacing & Layout

```css
:root {
  --radius-sm:   6px;
  --radius-md:   12px;
  --radius-lg:   20px;
  --radius-xl:   28px;
  --radius-pill: 9999px;

  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  24px;
  --space-6:  32px;
  --space-7:  48px;
  --space-8:  64px;
  --space-9:  96px;
}
```

**Grid:**
- Desktop: 12-column grid, 24px gutter, max-width 1280px.
- Tablet: 8-column, 16px gutter.
- Mobile: 4-column, 16px margin. Single-column card stack.

**Mobile-first:** All components must function perfectly at 375px width. Cards stack vertically. Bottom nav bar replaces sidebar on mobile.

---

## 5. Component Patterns

### Cards
```
Background: --color-surface
Border: 1px solid --color-border
Border-radius: --radius-lg
Padding: 20px 24px (desktop) / 16px (mobile)
Hover: border-color shifts to --color-accent with 0.2s ease
Shadow: 0 0 0 1px rgba(168,255,120,0.08), 0 8px 32px rgba(0,0,0,0.4)
```

### Buttons

**Primary CTA:**
```
Background: --color-accent
Color: #0C0D10 (black text on green)
Font: DM Sans 500, 14px
Border-radius: --radius-pill
Padding: 10px 24px
Hover: brightness(1.1) + subtle scale(1.02)
```

**Secondary:**
```
Background: transparent
Border: 1px solid --color-border
Color: --color-text-primary
Hover: border-color --color-accent, color --color-accent
```

**Ghost / Destructive:**
```
Color: --color-error
Hover: background rgba(255,107,107,0.1)
```

### Status Chips (Application Pipeline)

Use `JetBrains Mono`, uppercase, 11px, pill shape, tight padding (4px 10px):

| Status       | Background              | Text color        |
|--------------|-------------------------|-------------------|
| `INVIATA`    | rgba(93,187,255,0.15)   | #5DBBFF           |
| `VISUALIZZATA` | rgba(255,209,102,0.15) | #FFD166           |
| `CONTATTATO` | rgba(168,255,120,0.15)  | #A8FF78           |
| `FOLLOW-UP`  | rgba(255,209,102,0.2)   | #FFD166           |
| `KO`         | rgba(255,107,107,0.15)  | #FF6B6B           |

### Score Meter

A horizontal progress bar using `--gradient-score` (red → yellow → green), capped with a white dot indicator. Score number displayed in JetBrains Mono, large. Below the bar: key gap tags in muted chips.

### CV Template Selector

Horizontal scroll carousel on mobile. 3-column grid on desktop. Each template card shows a miniature CV preview with name, a compatibility badge (%), and active state shown by accent-colored border glow.

---

## 6. Motion & Animation

```css
/* Transitions */
--ease-out:  cubic-bezier(0.22, 1, 0.36, 1);
--ease-in:   cubic-bezier(0.64, 0, 0.78, 0);
--ease-snap: cubic-bezier(0.34, 1.56, 0.64, 1); /* Springy, for modals/sheets */

--duration-fast:   150ms;
--duration-normal: 250ms;
--duration-slow:   400ms;
```

**Interaction patterns:**
- Cards: `translateY(-2px)` on hover with shadow expansion — subtle lift.
- Score loading: Animate bar from 0 to value over 800ms with `--ease-out`.
- Page transitions: Fade + slide up (24px → 0) on route change.
- New application added to kanban: Card slides in from right.
- Mobile bottom sheet: Slides up from bottom with spring easing.
- Status chip changes: Crossfade with 200ms delay.

**No:** Spinners everywhere. Loading skeletons only. No bounce on every click.

---

## 7. Iconography

Use **Phosphor Icons** (phosphoricons.com), weight: `Regular` for UI, `Bold` for CTAs.  
Icon size: 16px inline, 20px standalone, 24px in navigation.

Key icons in Verso context:
- CV / Document → `FileText`
- Company research → `Buildings`
- Score → `ChartLineUp`
- Application funnel → `Funnel`
- Email / Outreach → `EnvelopeSimple`
- LinkedIn → `LinkedinLogo`
- Match → `MagicWand`
- Gap / Missing skill → `Warning`
- Course suggestion → `GraduationCap`
- Follow-up → `ArrowClockwise`

---

## 8. Mobile UX Patterns

**Navigation:**  
Bottom tab bar (5 tabs max), frosted glass (`backdrop-filter: blur(16px)`), accent dot on active tab.

```
Tabs: Home | Candidature | Nuovo CV | Profilo | Impostazioni
```

**Sheets & Drawers:**  
All detail views on mobile open as bottom sheets (50%–95% height, draggable handle, spring animation). No full-page navigation pushes for secondary content.

**Swipe actions on Kanban cards:**  
- Swipe left → Mark as KO (red)  
- Swipe right → Move to next stage (green)

**Haptics:**  
Use `navigator.vibrate()` on status changes and successful CV exports.

---

## 9. Key Screens Reference

### 1. Dashboard / Home
- Header: "Ciao [Nome], hai X application attive."
- Score medio delle tue candidature (radial gauge, accent colored).
- Kanban mini-view (horizontal scroll, 5 columns).
- "Nuova candidatura" FAB (floating action button, accent green, bottom right).

### 2. Nuova Candidatura Flow (Wizard — 4 steps)
1. **Incolla l'annuncio** — Textarea + URL scraper.
2. **Analisi automatica** — Skeleton loading → Company card (logo, sector, size, culture signals) + Skill match breakdown.
3. **Scegli il template** — CV template carousel + preview.
4. **CV generato** — Side-by-side diff view (original vs tailored), score badge, export button.

### 3. Application Detail
- Status timeline at top (horizontal stepper).
- CV preview + download.
- Company insights panel.
- Skills gap list with course suggestions (Coursera, LinkedIn Learning, Udemy links).
- Notes / log field.
- Email thread preview (if connected).

### 4. Kanban Board (Candidature)
- 5 columns: Inviata / Visualizzata / Contattato / Follow-up / KO.
- Drag & drop on desktop. Swipe on mobile.
- Card shows: Company logo, role title, date, score badge, status chip.

### 5. Profilo / Il mio CV
- Master CV editor (rich text, sectioned).
- Skills cloud (interactive, tag-based).
- Connections panel: Gmail, LinkedIn, altri (OAuth badges).

---

## 10. Logo & Brand Mark

**Wordmark:** "VERSO" in Syne 800, tracked at `0.08em`, accent-colored "O" replaced by a rotated arrow/chevron glyph pointing right-up (suggesting direction, next step, growth).

**Icon Mark:** A stylized "V" made of two chevrons — one in `--color-accent`, one in `--color-secondary` — overlapping slightly. Works as app icon on mobile.

**Usage:**
- On dark bg: full wordmark in `--color-text-primary` with accent O.
- Never place on light backgrounds in v1.
- Minimum size: 80px wide for wordmark, 32px for icon mark.

---

## 11. Tone of Voice

| Situation          | Tone Example                                                        |
|--------------------|----------------------------------------------------------------------|
| Onboarding         | "Carica il tuo CV e iniziamo a lavorare."                           |
| Analisi completata | "Match al 74%. Mancano 3 competenze chiave — ecco come colmarle."  |
| CV generato        | "Il tuo CV è pronto. Nessuna bugia, solo la versione migliore di te." |
| KO ricevuto        | "Un no in più nel funnel. Capita. Vuoi fare un follow-up o archiviare?" |
| Follow-up reminder | "Sono passati 7 giorni. Vale la pena scrivere di nuovo?"            |
| Errore             | "Qualcosa è andato storto. Riprova o contattaci."                   |

**Never:** "Congratulations on your amazing journey!" / "We're excited to announce..." / Corpo testo con emoji casuali.  
**Always:** Direct, informative, a touch dry. Like a smart colleague, not a chatbot.

---

## 12. Lovable Build Instructions

When building with this brand system in Lovable:

1. **Install fonts** via `@import` from Google Fonts: Syne, DM Sans, JetBrains Mono.
2. **Apply CSS variables** from Section 2 & 3 globally in `index.css` or `globals.css`.
3. **Use Tailwind** with a custom config that maps these tokens to Tailwind classes (`accent`, `surface`, `border-subtle`, etc.).
4. **Component library:** Build on shadcn/ui, override with Verso tokens. Do NOT use shadcn default colors.
5. **Phosphor Icons React:** `npm install @phosphor-icons/react`.
6. **Mobile-first:** All layouts start at 375px, use `md:` and `lg:` breakpoints to expand.
7. **Dark mode only:** Set `<html class="dark">` permanently. Remove light mode toggling.
8. **Framer Motion:** Use for page transitions, card enters, score animations, and bottom sheet springs.
9. **Kanban:** Use `@dnd-kit/core` for drag and drop.
10. **State management:** Zustand for application pipeline state.

---

*Verso Brand System v1.0 — Designed for Lovable LLM consumption*
