

## Problem

The mobile tab bar has 4 items: Home, FAB+, Candidature, Impostazioni. The desktop sidebar has additional items: **Guida (FAQ)** and **Dev Test** (dev only). The FAQ/Guida link is missing from mobile navigation entirely.

The layout is also asymmetric: 3 flex-1 tabs + 1 fixed-width FAB creates visual imbalance.

## Solution

Restructure the mobile tab bar as a **5-slot symmetric grid** with the FAB elevated in the center:

```text
┌────────┬────────┬────────┬────────┬────────┐
│  Home  │ Cand.  │  [+]   │ Guida  │Impost. │
└────────┴────────┴────────┴────────┴────────┘
```

## Changes — `src/components/AppShell.tsx` (`MobileTabBar`)

1. Replace `flex justify-around` with `grid grid-cols-5` for equal-width columns
2. Reorder tabs: Home | Candidature | FAB (center) | Guida | Impostazioni
3. Add **Guida** tab with `Question` icon linking to `/app/faq`
4. Give FAB its own grid cell with `relative` positioning (`-top-3`) instead of the `-mt-5` hack
5. Wrap each tab button in a `relative` container so active dot indicators position correctly
6. Remove `items-end` from the container — use `items-center` for vertical alignment

