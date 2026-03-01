

# Test automatici con CV e annunci di lavoro reali

## Obiettivo

Creare una pagina di test interna (`/app/dev-test`) accessibile solo in ambiente di sviluppo, che permette di:
1. Lanciare test end-to-end del flusso principale (onboarding + nuova candidatura)
2. Usare il CV di Giulia La Porta come fixture
3. Usare 3 annunci di lavoro realistici come fixture

## Cosa viene creato

### 1. File fixture con dati di test

**`src/test/fixtures/test-cv.ts`** -- Il CV di Giulia La Porta gia' parsato nel formato `ParsedCV`, pronto per essere inserito direttamente in `master_cvs.parsed_data`. Include:
- Dati anagrafici (nome, email, telefono, citta')
- Esperienze: HYPE (Head of AI), Illimity (PO), Intesa Sanpaolo (CRM), Deloitte (Consultant)
- Istruzione: Executive Master ABI, Laurea Magistrale Palermo 110/110L
- Skill: Fintech, Product Management, AI, CRM, Analytics, etc.
- Tools: Figma, Dynamics 365, Azure, Notion, etc.

**`src/test/fixtures/test-jobs.ts`** -- 3 annunci di lavoro realistici costruiti a partire da annunci reali trovati online:

| # | Ruolo | Azienda | Match atteso |
|---|-------|---------|-------------|
| 1 | Senior Product Manager Claims AI | Prima Assicurazioni, Milano | Alto (~80-85%) -- fintech + AI + PM |
| 2 | Product Manager Fintech | Satispay, Milano | Alto (~75-80%) -- fintech + PM ma diverso dominio |
| 3 | Data Analyst | Startup generica, Roma | Basso (~40-50%) -- ruolo diverso, mismatch seniority |

Ogni annuncio include: `company_name`, `role_title`, `description` (testo completo dei requisiti), `location`, `key_requirements`, `required_skills`.

### 2. Pagina di test `/app/dev-test`

**`src/pages/DevTest.tsx`** -- Pagina con 4 azioni rapide:

| Azione | Cosa fa |
|--------|---------|
| **Carica CV di test** | Inserisce il CV fixture in `master_cvs` (salta upload PDF + parsing) |
| **Test annuncio 1** | Crea una bozza in `applications` con l'annuncio 1, poi naviga a `/app/nuova?draft=ID` |
| **Test annuncio 2** | Idem con annuncio 2 |
| **Test annuncio 3** | Idem con annuncio 3 |
| **Pulisci dati di test** | Elimina tutte le applications e master_cvs dell'utente corrente |

Ogni azione mostra un toast di conferma e lo stato (in corso / completato / errore).

### 3. Route e navigazione

- Aggiunta route `/app/dev-test` in `App.tsx` dentro l'AppShell
- Visibile solo se `import.meta.env.DEV` e' true (non appare in produzione)
- Link nella sidebar/bottom nav solo in dev mode

## Riepilogo file

| File | Azione |
|------|--------|
| `src/test/fixtures/test-cv.ts` | Nuovo -- CV fixture ParsedCV |
| `src/test/fixtures/test-jobs.ts` | Nuovo -- 3 annunci fixture |
| `src/pages/DevTest.tsx` | Nuovo -- Pagina di test con azioni rapide |
| `src/App.tsx` | Modifica -- Aggiunta route `/app/dev-test` |
| `src/components/AppShell.tsx` | Modifica -- Link dev-test in nav (solo DEV) |

## Dettagli tecnici

### Fixture CV (struttura)

```typescript
export const TEST_CV: ParsedCV = {
  full_name: "Giulia La Porta",
  email: "giulialaporta@libero.it",
  phone: "+39 3293925008",
  location: "Milano",
  date_of_birth: "03/12/1987",
  linkedin: "https://www.linkedin.com/in/giulialaporta",
  summary: "",
  experiences: [
    {
      role: "Head of Automation and AI / PM Competence Lead",
      company: "HYPE S.p.A.",
      location: "Milano",
      start_date: "01/2021",
      end_date: "Presente",
      description: "Lead strategic roadmap for AI products..."
    },
    // ... Illimity, Intesa, Deloitte
  ],
  education: [...],
  skills: ["Fintech", "Product Management", "AI", ...],
  languages: [{ language: "English", level: "B2" }, ...],
  tools: ["Figma", "Dynamics 365", ...],
  certifications: [...]
};
```

### Azione "Carica CV di test"

```typescript
// 1. Disattiva CV esistenti
await supabase.from("master_cvs")
  .update({ is_active: false })
  .eq("user_id", user.id);

// 2. Inserisci fixture
await supabase.from("master_cvs").insert({
  user_id: user.id,
  parsed_data: TEST_CV,
  file_name: "CV_Test_Giulia.pdf",
  source: "test",
  is_active: true,
});
```

### Azione "Test annuncio N"

```typescript
// 1. Crea bozza application
const { data } = await supabase.from("applications").insert({
  user_id: user.id,
  company_name: job.company_name,
  role_title: job.role_title,
  job_description: job.description,
  status: "draft",
}).select("id").single();

// 2. Naviga al wizard
navigate(`/app/nuova?draft=${data.id}`);
```

### Protezione produzione

```typescript
// In App.tsx, la route viene aggiunta solo in dev
{import.meta.env.DEV && (
  <Route path="dev-test" element={<DevTest />} />
)}
```

