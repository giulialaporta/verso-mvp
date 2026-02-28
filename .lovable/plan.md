

# Supporto Bullets e Progetti nel Drawer di Editing

## Problema

Quando l'utente clicca la matitina su un'esperienza, il drawer mostra solo i campi base (ruolo, azienda, date, descrizione). I **bullets** -- cioe' le attivita' principali svolte nel ruolo (es. "New Customer Journey Strategy...") -- restano come chip piccole troncate, non visibili per intero. Lo stesso vale per i progetti che hanno descrizioni lunghe.

## Soluzione

### 1. Estendere `EditItemDrawer` per supportare campi lista (array di stringhe)

Aggiungere un nuovo tipo di campo `list` al drawer. Oltre a `string` (Input) e `multiline` (Textarea), il drawer supportera' un campo di tipo lista dove ogni elemento e' una Textarea a larghezza piena, con possibilita' di aggiungere/rimuovere elementi.

**Modifica a `DrawerField`:**

```text
export type DrawerField = {
  key: string;
  label: string;
  value: string;       // per campi singoli
  values?: string[];   // per campi lista (bullets)
  multiline?: boolean;
  list?: boolean;      // attiva la modalita' lista
  placeholder?: string;
};
```

**Rendering nel drawer per campi `list: true`:**
- Ogni elemento come Textarea (2-3 righe) con pulsante X per rimuoverlo
- Pulsante "+ Aggiungi" in fondo alla lista
- Label mono uppercase come gli altri campi

### 2. Aggiungere bullets ai campi experience nel drawer

Nel `drawerFields` per le esperienze in `CVSections.tsx`, aggiungere in fondo:

```text
{ key: "bullets", label: "Attivita' principali", values: exp.bullets || [], list: true, placeholder: "Descrivi un'attivita'..." }
```

### 3. Aggiornare `handleDrawerSave` in CVSections

Il salvataggio deve gestire sia valori stringa (`Record<string, string>`) sia valori lista (`Record<string, string | string[]>`). Quando il campo e' di tipo lista, il valore salvato sara' un array.

**Modifica del tipo di ritorno di `onSave`:**

```text
onSave: (values: Record<string, string | string[]>) => void;
```

### 4. Aggiungere description ai campi project nel drawer

I progetti gia' hanno il campo `description` come multiline, ma se hanno bullets o sotto-attivita' in futuro, la struttura e' pronta.

---

## File modificati

| File | Modifica |
|------|----------|
| `src/components/EditItemDrawer.tsx` | Aggiungere supporto per campi `list` (array di textarea con add/remove). Aggiornare tipo `DrawerField` con `values?: string[]` e `list?: boolean`. Aggiornare stato interno e `onSave` per gestire array. |
| `src/components/CVSections.tsx` | Aggiungere campo `bullets` (list) nel `drawerFields` per experience. Aggiornare `handleDrawerSave` per gestire valori array. |

## UX del campo lista nel drawer

```text
ATTIVITA' PRINCIPALI
+--------------------------------------------------+
| New Customer Journey Strategy definition and      |
| implementation across all digital touchpoints     |
+--------------------------------------------------+  [X]
+--------------------------------------------------+
| Led cross-functional team of 12 engineers on      |
| platform migration project                        |
+--------------------------------------------------+  [X]
+--------------------------------------------------+
| Budget management for EUR 2.5M annual portfolio   |
+--------------------------------------------------+  [X]

[+ Aggiungi attivita']
```

Ogni textarea si espande automaticamente col contenuto. Il pulsante X rimuove l'elemento. Il pulsante + aggiunge un nuovo campo vuoto in fondo.
