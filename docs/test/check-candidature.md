# Check — Candidature: Acceptance Criteria

Checklist per verificare la pagina candidature: lista, stati, note, bozze, download CV.

---

## A. Lista candidature

- [ ] **A1** — La pagina `/app/candidature` e' accessibile dalla sidebar (desktop) e tab bar (mobile)
- [ ] **A2** — Le candidature sono ordinate per data di creazione (piu' recenti in alto)
- [ ] **A3** — Ogni card mostra: ruolo, azienda, match score, ATS score, status, data
- [ ] **A4** — Il match score e l'ATS score hanno badge colorati
- [ ] **A5** — Lo status ha un chip colorato (`StatusChip`)

---

## B. Gestione stati

- [ ] **B1** — Status `draft`: chip warning, visibile nella sezione bozze
- [ ] **B2** — Status `inviata`: chip default
- [ ] **B3** — Status `visualizzata`: chip info
- [ ] **B4** — Status `contattato`: chip accent
- [ ] **B5** — Status `follow-up`: chip secondary
- [ ] **B6** — Status `ko`: chip destructive
- [ ] **B7** — Il cambio status funziona dal drawer e aggiorna `applications.status` + `updated_at`

---

## C. Bozze

- [ ] **C1** — Le bozze sono in una sezione separata in alto, visivamente distinta
- [ ] **C2** — Ogni bozza ha un pulsante "Riprendi"
- [ ] **C3** — Click "Riprendi": redirect a `/app/nuova` con dati pre-caricati dello step raggiunto
- [ ] **C4** — Le bozze possono essere eliminate
- [ ] **C5** — Dopo aver completato una bozza, scompare dalla sezione bozze e appare tra le candidature attive

---

## D. Detail Panel (responsive)

- [ ] **D1** — Click su una candidatura: apre il pannello di dettaglio
- [ ] **D2** — Mobile: Drawer slide-up (max 85vh). Desktop: Sheet slide-right (400px)
- [ ] **D3** — Chip selezionabili per cambiare status (inviata, visualizzata, contattato, follow-up, ko)
- [ ] **D4** — Campo note: testo libero, salvato in `applications.notes`
- [ ] **D5** — Le note vengono salvate e persistono al ricaricamento
- [ ] **D6** — Pulsante "Scarica PDF": apre ExportDrawer con il CV adattato
- [ ] **D7** — Pulsante "Elimina candidatura" con AlertDialog di conferma
- [ ] **D8** — Pulsante "Salva": salva status + note in un'unica operazione
- [ ] **D9** — Info visibili nel pannello: ruolo, azienda, data, match score

---

## E. Eliminazione

- [ ] **E1** — Eliminare una candidatura richiede conferma
- [ ] **E2** — Dopo l'eliminazione, la candidatura scompare dalla lista
- [ ] **E3** — Viene eliminato anche il `tailored_cv` associato
- [ ] **E4** — La lista si aggiorna senza refresh della pagina

---

## F. Empty state e edge case

- [ ] **F1** — Nessuna candidatura: messaggio "Nessuna candidatura ancora" + CTA per crearne una
- [ ] **F2** — Molte candidature (10+): la lista funziona senza problemi di performance
- [ ] **F3** — La pagina e' responsive (funziona su mobile)
- [ ] **F4** — Refresh della pagina: i dati si ricaricano correttamente
