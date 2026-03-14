

# Edge case freemium — Piano di correzione

## Problemi identificati

### 1. Eliminazione candidatura = slot libero (bug)
Oggi il gate conta `applications WHERE status != 'ko'`. Se l'utente elimina la candidatura (hard delete), il conteggio torna a 0 e può crearne un'altra gratis all'infinito.

### 2. Utenti pre-esistenti bloccati al lancio
Chi ha già 1+ candidature (anche bozze) prima del lancio freemium viene bloccato immediatamente senza aver mai visto la value proposition Pro.

### 3. Bug server-side: soglia errata
In `ai-tailor`, il check è `count > 1` ma dovrebbe essere `>= 1` — perché quando l'utente sta creando la seconda candidatura, quella in corso è già stata inserita come draft nello Step 1.

### 4. Bozze contano nel limite
Una draft creata automaticamente allo Step 1 conta come candidatura usata, anche se l'utente abbandona il wizard. Questo consuma la candidatura gratuita senza che l'utente abbia ottenuto valore.

---

## Soluzione proposta

### A. Contatore lifetime su `profiles`

Aggiungere `free_apps_used integer DEFAULT 0` a `profiles`. Incrementato da un **trigger DB** su INSERT in `applications` (solo se `is_pro = false`). Non viene mai decrementato da DELETE.

```sql
ALTER TABLE profiles ADD COLUMN free_apps_used integer DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_free_apps_used()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles
  SET free_apps_used = free_apps_used + 1
  WHERE user_id = NEW.user_id
    AND is_pro = false;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_free_apps
AFTER INSERT ON applications
FOR EACH ROW EXECUTE FUNCTION increment_free_apps_used();
```

**Gate logic aggiornata:** `free_apps_used >= 1 AND is_pro = false` → blocco. Indipendente da delete o status.

Eccezione `ko`: se l'utente ha 1 candidatura e la segna come `ko`, reset `free_apps_used = 0` via trigger su UPDATE di `applications.status`.

### B. Bozze non contano: trigger solo su status non-draft

Il trigger incrementa solo quando la candidatura esce dallo stato draft (cioè quando il wizard viene completato, non quando viene creata). Questo evita di consumare la candidatura gratuita per bozze abbandonate.

```sql
-- Trigger su UPDATE invece che INSERT
CREATE TRIGGER trg_increment_free_apps
AFTER UPDATE ON applications
FOR EACH ROW
WHEN (OLD.status = 'draft' AND NEW.status != 'draft' AND NEW.status != 'ko')
EXECUTE FUNCTION increment_free_apps_used();
```

### C. Grandfathering utenti pre-esistenti

Migrazione one-shot: per tutti gli utenti esistenti con candidature, impostare `free_apps_used` in base allo stato attuale.

```sql
UPDATE profiles p
SET free_apps_used = sub.cnt
FROM (
  SELECT user_id, COUNT(*) as cnt
  FROM applications
  WHERE status NOT IN ('ko', 'draft')
  GROUP BY user_id
) sub
WHERE p.user_id = sub.user_id AND p.is_pro = false;
```

Questo riflette la situazione reale: chi ha già usato candidature le ha effettivamente usate.

### D. Fix soglia server-side

In `ai-tailor/index.ts`: cambiare `count > 1` → `count >= 1` (allineato al gate client).

### E. Reset su `ko`

Trigger su UPDATE di `applications.status` a `ko`:

```sql
CREATE OR REPLACE FUNCTION decrement_free_apps_on_ko()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'ko' AND OLD.status != 'ko' THEN
    UPDATE profiles
    SET free_apps_used = GREATEST(free_apps_used - 1, 0)
    WHERE user_id = NEW.user_id AND is_pro = false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_decrement_on_ko
AFTER UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION decrement_free_apps_on_ko();
```

---

## Riepilogo modifiche

| Area | File/Risorsa |
|------|-------------|
| DB | Migrazione: colonna `free_apps_used`, 2 trigger, 2 funzioni, migrazione dati |
| Server gate | `supabase/functions/ai-tailor/index.ts` — fix soglia + usa `free_apps_used` |
| Client gate | `src/hooks/useProGate.ts` — query `profiles.free_apps_used` invece di contare `applications` |
| StepCompleta | `src/components/wizard/StepCompleta.tsx` — allineare logica banner |

---

## Matrice edge case finale

| Caso | Comportamento |
|------|---------------|
| Free crea 1 candidatura completa | `free_apps_used = 1` → bloccato |
| Free elimina candidatura | `free_apps_used` resta 1 → bloccato |
| Free ha candidatura in `ko` | `free_apps_used` decrementato → può crearne 1 |
| Free ha bozza abbandonata | `free_apps_used` resta 0 → non conta |
| Utente pre-esistente con 2 app | Migrazione imposta `free_apps_used = 2` → bloccato |
| Pro crea candidature, poi cancella abbonamento | `free_apps_used` non incrementato (trigger ignora Pro) → conteggio = 0, ma gate usa anche count attuale apps |
| Pro → Free con 5 candidature | Gate blocca: ha >0 candidature attive non-ko |

