
# Fix UI: Titolo CV troncato, Mobile layout, Navigazione consistente

## Problemi identificati

### 1. Titolo CV troncato
Il file name nella CV Card usa `truncate` con `max-w-[180px]`, tagliando nomi lunghi come "CV GIulia La Porta_01_2...". Il layout `flex-row` tra titolo e filename comprime lo spazio disponibile.

### 2. Mobile layout problematico
Dalla screenshot a 375px:
- **Nessun padding laterale**: il contenuto tocca i bordi dello schermo. L'`AppShell` mobile non applica padding, e `Home.tsx` usa solo `max-w-xl` senza padding orizzontale.
- **Stats bar troppo compressa**: le tre card in `grid-cols-3` a 375px sono strettissime.
- **CV Card header sovraffollato**: titolo e filename forzati sulla stessa riga.

### 3. Navigazione inconsistente: "Nuova" nel menu
Il tab "Nuova" nella sidebar/bottom bar e il bottone "Nuova candidatura" in Home fanno esattamente la stessa cosa (navigano a `/app/nuova`). Avere due entry point crea confusione e spreca spazio nella navigazione. La sidebar dovrebbe contenere solo destinazioni di contenuto stabile (Home, Candidature), non azioni.

---

## Soluzione

### `src/pages/Home.tsx`

**CV Card header**: spostare il filename sotto il titolo invece che affiancato. Rimuovere `truncate` e `max-w-[180px]`, usare `break-all` e testo piu piccolo ma visibile per intero.

**Mobile padding**: aggiungere `px-4` al container principale per dare margine laterale su mobile. Usare `sm:px-0` per non influenzare desktop.

**Stats bar**: mantenere `grid-cols-3` ma ridurre il padding interno delle card su mobile con classi responsive (`py-3 px-1 sm:py-4 sm:px-2`).

### `src/components/AppShell.tsx`

**Rimuovere "Nuova" dalla navigazione**: la tab/sidebar item "Nuova" viene eliminata. Restano solo "Home" e "Candidature". L'azione "nuova candidatura" e' gia' prominente nella Home (bottone CTA full-width) e potra' essere accessibile anche dalla pagina Candidature.

**Bottom tab bar**: con solo 2 tab + nessun FAB centrale, il layout diventa piu' pulito. Se si vuole mantenere un accesso rapido, il FAB puo' diventare un bottone floating sulla pagina Candidature, ma non serve nella nav globale.

**Desktop sidebar**: stessa logica, solo Home e Candidature. Il menu diventa piu' leggero e coerente.

### `src/components/CVSections.tsx`

Nessuna modifica necessaria.

---

## Riepilogo modifiche

| File | Cosa cambia |
|------|-------------|
| `src/pages/Home.tsx` | Fix header CV Card (filename su riga separata, no truncate). Aggiunta padding mobile `px-4`. Stats card responsive. |
| `src/components/AppShell.tsx` | Rimosso "Nuova" da `navItems`. Rimosso FAB centrale nella bottom bar. Solo Home + Candidature nella navigazione. |

Nessuna modifica backend, nessun nuovo file.
