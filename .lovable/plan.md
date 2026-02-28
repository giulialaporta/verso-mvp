

# Aggiunta campo "Azienda" separato nello Step 1 del Wizard

## Problema
Attualmente il nome dell'azienda viene estratto dall'AI durante lo scraping dell'annuncio. Se l'AI non riesce a identificarlo correttamente (o se l'utente incolla solo un estratto parziale), il campo `company_name` potrebbe risultare vuoto o impreciso.

## Soluzione
Aggiungere un campo di input dedicato **"Nome azienda"** nello Step 1, visibile sia nella tab URL che nella tab Testo, posizionato sopra il campo principale. Il valore inserito dall'utente avra priorita su quello estratto dall'AI.

## Modifiche previste

### `src/pages/Nuova.tsx` — Componente Step1

1. **Nuovo stato** `companyName` (stringa) nel componente Step1
2. **Nuovo campo Input** con label "Nome azienda" e placeholder "Es. Google, Accenture, Intesa Sanpaolo..." posizionato prima delle tab URL/Testo, sempre visibile
3. **Validazione**: il campo azienda e obbligatorio — se vuoto, mostra errore toast prima di procedere
4. **Logica di merge**: dopo la risposta dell'AI, sovrascrive `job_data.company_name` con il valore inserito dall'utente (se l'utente lo ha compilato), oppure usa quello estratto dall'AI come fallback
5. **Preview card**: il nome azienda mostrato nella card di conferma riflette sempre il valore dell'utente

### Nessuna modifica backend
L'edge function `scrape-job` continua a estrarre `company_name` dal testo come prima — serve solo come fallback. La logica di priorita e gestita interamente nel frontend.

## Flusso aggiornato

```text
+----------------------------------+
|  Nome azienda: [____________]    |  <-- Nuovo campo, sempre visibile
+----------------------------------+
|  [URL]  |  [Testo]               |  <-- Tab come prima
|  [____________________________]  |
|  [ Analizza ]                    |
+----------------------------------+
         |
         v
  AI estrae job_data
  company_name = input utente || AI
         |
         v
  Preview card con dati confermati
```

## Dettagli tecnici

- Il campo usa l'icona `Buildings` di Phosphor come adornamento
- Stile coerente con gli altri input (bg-card, border-border)
- Il campo viene passato alla callback `onConfirm` e utilizzato per tutto il resto del flusso (Step 2, Step 3, salvataggio in DB)

