# Story 04.1 — Migrazione Database: nuove colonne per ATS e Honest Score

> Prompt per Lovable — Epic 04, Story 1 di 7

---

## Cosa fare

Aggiungere colonne alle tabelle `applications` e `tailored_cvs` create nell'epic 01. Queste colonne servono per salvare i risultati delle edge function AI che verranno costruite nelle prossime stories.

---

## SQL da eseguire

Apri l'SQL editor di Supabase e lancia questa migrazione:

```sql
-- Nuove colonne su applications
alter table applications add column ats_score int;
alter table applications add column template_id text default 'classico';

-- Nuove colonne su tailored_cvs
alter table tailored_cvs add column ats_score int;
alter table tailored_cvs add column ats_checks jsonb;
alter table tailored_cvs add column seniority_match jsonb;
alter table tailored_cvs add column honest_score jsonb;
alter table tailored_cvs add column template_id text default 'classico';
```

---

## Perché ogni colonna

| Colonna | Tabella | Tipo | Descrizione |
|---------|---------|------|-------------|
| `ats_score` | applications, tailored_cvs | int | Score 0-100 di ottimizzazione per filtri ATS |
| `template_id` | applications, tailored_cvs | text | ID del template PDF scelto (default: `classico`) |
| `ats_checks` | tailored_cvs | jsonb | Array di 7 check ATS con stato pass/warning/fail |
| `seniority_match` | tailored_cvs | jsonb | Confronto livello candidato vs livello ruolo |
| `honest_score` | tailored_cvs | jsonb | Report di verifica onestà del tailoring |

---

## Vincoli

- Tutte le colonne sono **nullable** con **default** dove indicato
- Nessun impatto sui dati esistenti — le candidature già salvate avranno `null` in queste colonne
- **Non** modificare le colonne già esistenti
- **Non** modificare le RLS policy — le policy esistenti coprono già queste colonne (sono sulla riga, non sulla colonna)

---

## Verifica

Dopo la migrazione, verifica in Supabase:

1. Apri Table Editor → `applications` → le colonne `ats_score` e `template_id` sono visibili
2. Apri Table Editor → `tailored_cvs` → le colonne `ats_score`, `ats_checks`, `seniority_match`, `honest_score`, `template_id` sono visibili
3. Le candidature esistenti (se ce ne sono) non sono state alterate

---

## Criteri di accettazione

- [ ] Colonne `ats_score`, `template_id` aggiunte a `applications`
- [ ] Colonne `ats_score`, `ats_checks`, `seniority_match`, `honest_score`, `template_id` aggiunte a `tailored_cvs`
- [ ] Nessun dato esistente alterato
- [ ] RLS funzionanti come prima
