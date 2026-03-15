# Epic 17 — Mobile UX Polish

## Obiettivo

Migliorare la resa mobile dell'app su tutta la navigazione, il wizard, le card e gli elementi interattivi. L'app funziona su mobile ma ha problemi di padding inconsistenti, touch target troppo piccoli, testi illeggibili e pattern UX mobile mancanti.

Target: iPhone SE (375px) come minimo, iPhone 15 Pro (393px) come riferimento.

---

## Problemi identificati

### 1. Padding orizzontale inconsistente

| Pagina | Padding | Standard |
|--------|---------|----------|
| Home | `px-4` | OK |
| Candidature | `px-4` | OK |
| **Nuova (wizard)** | **`px-2`** | **Troppo stretto** |
| Onboarding | `px-3` | Quasi OK |
| Impostazioni | `px-4` | OK |

Il wizard è la pagina più importante e ha il padding più stretto (8px per lato).

### 2. Touch target sotto il minimo

Apple Human Interface Guidelines: **44x44pt minimo** per elementi interattivi.

| Elemento | Dimensione attuale | Problema |
|----------|-------------------|----------|
| Checkbox (consent, follow-up) | `h-4 w-4` (16px) | **Troppo piccolo** |
| Link footer legale | `text-[11px]` inline | **Troppo piccolo** |
| Pulsante "Revoca" consenso | `text-[12px]` | **Troppo piccolo** |
| Tag mono (skill chip piccoli) | `text-[10px]` | Difficile da tappare |
| Icone StatsBar | 20px in card `px-1` | Area tappabile minima |

### 3. Testi illeggibili su mobile

| Elemento | Dimensione | Problema |
|----------|-----------|----------|
| Label mono uppercase | `text-[10px]` | Illeggibile su schermi piccoli |
| Help text / disclaimer | `text-[11px]` | Al limite |
| Input RAL onboarding | `h-7 text-xs font-mono` | Troppo compresso |
| Badge score nel wizard | `font-mono text-[10px]` | Difficile da leggere |

### 4. StatsBar troppo compressa

`grid-cols-3` con `py-3 px-1` su iPhone SE: le 3 card hanno ~117px ciascuna. Il testo ("Candidature attive", "Score medio", "Stato CV") rischia di andare su 2 righe e rompere l'allineamento.

### 5. Tab bar: nessun scroll-to-top

Pattern mobile standard (Instagram, Twitter, Safari): tappare il tab corrente scrolla il contenuto in cima. Non implementato.

### 6. Wizard: step indicator senza overflow control

Lo step indicator nel wizard (6 step) su schermi stretti potrebbe traboccare orizzontalmente.

### 7. Nessun feedback tattile

I button non hanno `active:scale-[0.98]` o simile. Su mobile, senza hover, l'utente non ha feedback visivo quando tocca un elemento.

### 8. Grid score in StepRevisione

`grid-cols-2 sm:grid-cols-3` — ma `sm` è 640px, quindi su mobile (375-639px) le label italiane lunghe ("Competenze trovate", "Controlli ATS") traboccano in 2 colonne strette.

---

## Cosa fare

### A. Standardizzare padding e spacing

- Tutte le pagine: `px-4` come minimo su mobile
- Wizard (`Nuova.tsx`): da `px-2` a `px-4`
- Onboarding: da `px-3` a `px-4`
- Gap tra sezioni: minimo `space-y-4` su mobile

### B. Aumentare touch target

- Checkbox: area tappabile minima `min-h-[44px] min-w-[44px]` (wrapper, non la checkbox stessa)
- Link footer legale: wrappare in `py-2` per aumentare l'area
- Pulsante "Revoca": minimo `h-9 px-3`
- Skill chip piccoli: minimo `h-8 px-2`

### C. Migliorare leggibilità testi

- Eliminare `text-[10px]` ovunque — minimo `text-[11px]`, meglio `text-xs` (12px)
- Input RAL: da `h-7 text-xs` a `h-9 text-sm`
- Badge e label mono: da `text-[10px]` a `text-[11px]`
- Disclaimer/help text: da `text-[11px]` a `text-xs` (12px)

### D. Ripensare StatsBar per mobile

Da `grid-cols-3` a layout verticale su mobile:
- Mobile (`< sm`): `grid-cols-1` con card orizzontali (icona a sinistra, testo a destra, numero grande a destra)
- Tablet/desktop (`sm+`): `grid-cols-3` come oggi

Oppure: mantenere 3 colonne ma usare solo il numero grande + icona, senza label testuale (tooltip on tap).

### E. Scroll-to-top su tab corrente

Quando l'utente tappa il tab già attivo nella bottom tab bar, scrollare il contenuto in cima con `window.scrollTo({ top: 0, behavior: 'smooth' })`.

### F. Step indicator responsive

Il wizard step indicator deve gestire 6 step su schermi stretti:
- Usare solo pallini numerati (senza label) su mobile
- O: scroll orizzontale con pallino attivo centrato
- Assicurare che non trabocchi mai

### G. Feedback tattile sui pulsanti

Aggiungere `active:scale-[0.98] transition-transform` ai pulsanti principali. Questo dà feedback immediato al tocco senza hover.

### H. Fix grid score wizard

`StepRevisione`: da `grid-cols-2 sm:grid-cols-3` a `grid-cols-2 md:grid-cols-3`. Il breakpoint `md` (768px) è più sicuro per il passaggio a 3 colonne con label italiane lunghe.

---

## Criteri di accettazione

- [ ] Tutte le pagine hanno `px-4` minimo su mobile
- [ ] Nessun `text-[10px]` nel codebase — minimo `text-[11px]`
- [ ] Checkbox hanno area tappabile >= 44px (wrapper)
- [ ] StatsBar leggibile su iPhone SE (375px) senza text overflow
- [ ] Tab corrente tappato → scroll to top
- [ ] Step indicator wizard non trabocca su 375px
- [ ] Pulsanti hanno feedback `active:scale-[0.98]`
- [ ] Grid score in StepRevisione usa breakpoint `md` per 3 colonne
- [ ] Input RAL nell'onboarding leggibile (`h-9 text-sm`)
- [ ] Testato su viewport 375px (Chrome DevTools, iPhone SE)

---

## Stories

| ID | Story | Priorita' |
|----|-------|----------|
| 17.1 | Standardizzare padding (`px-4`) su tutte le pagine, fix wizard `px-2` → `px-4` | Must |
| 17.2 | Aumentare touch target: checkbox wrapper 44px, link footer, pulsanti piccoli | Must |
| 17.3 | Fix testi illeggibili: eliminare `text-[10px]`, aumentare input RAL, badge mono | Must |
| 17.4 | StatsBar responsive: layout verticale su mobile o solo numeri + icona | Must |
| 17.5 | Scroll-to-top su tap del tab attivo nella bottom tab bar | Should |
| 17.6 | Step indicator wizard: pallini compatti o scroll orizzontale su mobile | Should |
| 17.7 | Feedback tattile `active:scale-[0.98]` sui pulsanti principali | Should |
| 17.8 | Fix breakpoint grid score StepRevisione (`sm` → `md`) | Must |
