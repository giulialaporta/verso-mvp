

## Check di coerenza — Architettura, navigazione, flussi

Ho analizzato l'intera app. Ecco il quadro di coerenza tra i due piani approvati (Home redesign + Foto/Candidature/CV) e l'architettura esistente.

### Cosa funziona senza problemi

| Area | Stato |
|------|-------|
| **Routing** | Tutte le route restano invariate. Nessun conflitto. |
| **AppShell sidebar/tab bar** | I 5 link (Home, Candidature, Nuova, Guida, Impostazioni) restano coerenti. Nessuna pagina aggiunta o rimossa. |
| **ProtectedRoute + ConsentGate** | Non toccati. |
| **useProfile / useMasterCV / useApplications** | Tutti i dati necessari per l'Hero (nome, avatar, CV, apps) sono già fetchati in Home.tsx. |
| **`profiles.avatar_url`** | Esiste nel DB, tipizzato in types.ts, mai usato nel frontend. Pronto per l'upload. |
| **CVEdit** | Resta a `/app/cv-edit`, il link "Modifica →" nel nuovo CV snapshot punta lì. Nessun conflitto. |
| **Onboarding** | Resta a `/onboarding`, il link "Carica nuovo" punta lì. Nessun conflitto. |
| **CandidaturaDetail** | Resta a `/app/candidatura/:id`. Le card nella Home e nella pagina Candidature navigano lì. OK. |

### 3 incoerenze da risolvere durante l'implementazione

#### 1. `useProfile` non fetcha `avatar_url`

```typescript
// Attuale — manca avatar_url
.select("full_name, salary_expectations")
```

L'Hero ha bisogno di `avatar_url` per la foto profilo. Va aggiunto al select:
```typescript
.select("full_name, salary_expectations, avatar_url")
```

#### 2. Salary display: duplicazione Home vs Impostazioni

Il piano dice di spostare il salary da Home a Impostazioni. Ma `SalaryDisplay` è attualmente SOLO in Home.tsx (non esiste in Impostazioni). Serve:
- Rimuovere `SalaryDisplay` dalla Home
- Aggiungere una sezione "Aspettative RAL" in Impostazioni.tsx (sotto il profilo)
- `useProfile` già fetcha `salary_expectations`, quindi Impostazioni può usarlo direttamente

#### 3. Candidature raggruppate: il `StatusChip` copre tutti gli stati necessari

Gli stati definiti in `STATUS_STYLES` sono: `draft`, `inviata`, `visualizzata`, `contattato`, `follow-up`, `ko`. Il raggruppamento per stato nel piano li usa tutti — coerente. Nessun problema.

### Dipendenze tra i due piani

L'ordine di implementazione corretto è:

1. **Prima**: Avatar upload hook + migrazione bucket `avatars` + update `useProfile`
2. **Poi**: Home redesign (Hero che usa avatar + CV snapshot + candidature recenti + plan badge)
3. **Infine**: Candidature raggruppate per stato (indipendente dalla Home)

Il salary va spostato in Impostazioni come parte del punto 2 (quando si rimuove dalla Home).

### Conclusione

L'architettura regge. Nessun conflitto strutturale. Le 3 micro-correzioni (useProfile select, salary spostamento, avatar fetch) sono parte naturale dell'implementazione. Posso procedere con l'implementazione nell'ordine indicato.

