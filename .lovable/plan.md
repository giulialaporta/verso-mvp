

## Obiettivo

Riprogettare il layout del template ATS DOCX per migliorare leggibilita, separazione visiva e compatibilita ATS. Problemi attuali: date appiccicate al ruolo, azienda poco visibile, testo schiacciato.

## Nuovo layout per ogni esperienza

```text
ESPERIENZE
─────────────────────────────────────────────

Senior Developer                    01/2020 - Attuale
Acme Corp | Milano

- Aumentato il fatturato del +30% annuo
- Gestito team di 15 persone
```

Rispetto a oggi cambia:
- **Ruolo su riga propria** con data allineata a destra via tab stop (gia presente, ma con piu spacing)
- **Azienda su riga separata**, bold e colore piu scuro (oggi e grigio chiaro `333333`, passera a `111827` come il testo principale)
- **Piu spazio verticale** tra un blocco esperienza e l'altro (before: 320 invece di 200)
- **Piu spazio dopo i bullet** (80 invece di 50)
- **Piu spazio dopo la riga azienda** (100 invece di 60) per separare visivamente dal contenuto

## Interventi specifici

### 1) Spacing generale aumentato
- Nome: after 120 (era 80)
- Contatti: after 300 (era 260)
- Summary: after 200 (era 160)
- Section titles: before 420, after 180 (era 360/140)

### 2) Blocco esperienza riprogettato
- Ruolo + data: before 320, after 60 (era 200/40) - piu respiro tra esperienze
- Azienda: colore `111827` (uguale al testo), italics per differenziare dal ruolo, after 100 (era 60)
- Description: after 80 (era 60)
- Bullets: after 70 (era 50), line spacing 1.15x

### 3) Blocco education allineato
- Stesso pattern: titolo bold + data a destra, istituto su riga separata con piu contrasto
- Spacing before 240 (era 160)

### 4) Skills con piu respiro
- Spacing after 80 per ogni categoria (era 60)

### 5) Margini pagina leggermente piu ampi
- Margini laterali da 20mm a 22mm per dare piu "aria" al testo senza perdere spazio utile

## File da modificare

- `src/components/cv-templates/docx-generator.ts` - unico file

## Conformita ATS mantenuta

- Colonna singola, zero tabelle, zero text box
- Font Calibri uniforme
- Contatti nel body
- Sezioni con titoli standard
- Bullet con numbering Word (trattino)
- Date MM/YYYY
- Nessun carattere speciale

