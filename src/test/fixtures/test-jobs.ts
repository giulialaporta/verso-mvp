export interface TestJob {
  id: string;
  company_name: string;
  role_title: string;
  location: string;
  description: string;
  expected_match: "alto" | "medio" | "basso";
  expected_score_range: [number, number];
}

export const TEST_JOBS: TestJob[] = [
  {
    id: "job-1-prima",
    company_name: "Prima Assicurazioni",
    role_title: "Senior Product Manager — Claims AI",
    location: "Milano",
    expected_match: "alto",
    expected_score_range: [75, 90],
    description: `Chi siamo
Prima Assicurazioni è un'insurtech italiana in forte crescita, con sede a Milano. Stiamo rivoluzionando il settore assicurativo attraverso tecnologia, dati e intelligenza artificiale.

Il ruolo
Cerchiamo un/una Senior Product Manager per guidare lo sviluppo dei nostri prodotti AI applicati al processo di gestione sinistri (claims). Lavorerai a stretto contatto con i team di Data Science, Engineering e Operations per definire e lanciare soluzioni innovative che migliorino l'esperienza cliente e l'efficienza operativa.

Responsabilità
• Definire la product vision e la roadmap per i prodotti AI nel vertical Claims
• Gestire il ciclo di vita del prodotto end-to-end: discovery, delivery, go-to-market
• Collaborare con Data Science per integrare modelli ML nei flussi operativi
• Condurre user research, analisi competitiva e validazione di ipotesi
• Gestire stakeholder interni (C-level, Operations, Legal, Compliance)
• Definire e monitorare KPI di prodotto (adoption, accuracy, efficiency gains)
• Coordinare un team cross-funzionale di 5-8 persone

Requisiti
• 7+ anni di esperienza in Product Management, preferibilmente in fintech/insurtech
• Esperienza diretta con prodotti AI/ML in produzione
• Solida comprensione di metodologie Agile/Scrum
• Capacità di tradurre requisiti di business in specifiche tecniche
• Esperienza di gestione stakeholder a livello C-level
• Ottime capacità analitiche e data-driven decision making
• Esperienza con A/B testing e metriche di prodotto
• Laurea in discipline STEM, Economia o equivalente

Nice to have
• Esperienza nel settore assicurativo o bancario
• Conoscenza di NLP/NLU e computer vision
• Certificazioni Product Management (PSPO, CPM)
• Esperienza con tool di product analytics (Mixpanel, Amplitude)

Cosa offriamo
• RAL competitiva + stock options
• Smart working ibrido (3 giorni in ufficio)
• Budget formazione €2.000/anno
• Ambiente dinamico e innovativo`,
  },
  {
    id: "job-2-satispay",
    company_name: "Satispay",
    role_title: "Product Manager — Payments Platform",
    location: "Milano",
    expected_match: "alto",
    expected_score_range: [70, 85],
    description: `About Satispay
Satispay è la piattaforma di mobile payment leader in Italia, con oltre 4 milioni di utenti e 300.000 esercenti. La nostra missione è semplificare i pagamenti e i servizi finanziari per tutti.

The Role
Stiamo cercando un/una Product Manager per la nostra Payments Platform. Sarai responsabile dell'evoluzione dell'infrastruttura di pagamento core, lavorando su scalabilità, nuovi metodi di pagamento e compliance regolamentare.

Key Responsibilities
• Ownership della roadmap prodotto per la piattaforma pagamenti
• Collaborazione con Engineering per design e delivery di nuove feature
• Analisi dei requisiti regolamentari (PSD2, PSD3, Open Banking) e traduzione in specifiche prodotto
• Gestione delle integrazioni con partner bancari e circuiti di pagamento
• Definizione di metriche di successo e monitoring delle performance
• User research e analisi competitiva nel panorama fintech europeo
• Partecipazione attiva a sprint planning, refinement e retrospective

Requirements
• 5+ anni di esperienza come Product Manager in ambito fintech o payments
• Conoscenza approfondita del mondo dei pagamenti digitali e della regolamentazione europea
• Esperienza con metodologie Agile e tool di project management (Jira, Notion)
• Forte orientamento ai dati e capacità analitiche
• Eccellenti capacità di comunicazione e stakeholder management
• Esperienza di lavoro in contesti ad alta crescita
• Inglese fluente (B2+)

Nice to Have
• Esperienza con sistemi di pagamento real-time (SEPA Instant, API banking)
• Background tecnico o comprensione di architetture a microservizi
• Esperienza con product analytics e A/B testing
• Conoscenza di ML/AI applicata a fraud detection o risk management

Benefits
• Competitive salary + equity
• Hybrid work policy
• Learning & development budget
• International team environment`,
  },
  {
    id: "job-3-startup",
    company_name: "DataFlow Analytics",
    role_title: "Data Analyst — Business Intelligence",
    location: "Roma",
    expected_match: "basso",
    expected_score_range: [35, 55],
    description: `Chi siamo
DataFlow Analytics è una startup romana specializzata in soluzioni di Business Intelligence per il settore retail. Aiutiamo i brand a prendere decisioni data-driven attraverso dashboard personalizzate e analisi predittive.

Il ruolo
Cerchiamo un/una Data Analyst per il nostro team BI. Ti occuperai di analisi dati, creazione di report e dashboard, e supporto ai clienti nell'interpretazione dei dati.

Responsabilità
• Analisi dati di vendita, marketing e customer behavior per clienti retail
• Creazione e manutenzione di dashboard interattive (Tableau, Power BI)
• Scrittura di query SQL complesse per estrazione e trasformazione dati
• Sviluppo di modelli statistici per forecasting e segmentazione
• Preparazione di report periodici per il management dei clienti
• Collaborazione con il team engineering per ottimizzazione data pipeline
• Documentazione di processi e metodologie di analisi

Requisiti
• 2-4 anni di esperienza come Data Analyst o ruolo simile
• Ottima conoscenza di SQL (PostgreSQL, BigQuery)
• Esperienza con tool di visualizzazione (Tableau, Power BI, Looker)
• Conoscenza di Python o R per analisi statistica
• Familiarità con concetti di data warehousing e ETL
• Capacità di comunicare insight complessi in modo chiaro
• Laurea in Statistica, Matematica, Informatica o discipline quantitative

Nice to have
• Esperienza nel settore retail o e-commerce
• Conoscenza di Google Analytics 4 e attribution modeling
• Esperienza con dbt o tool di data transformation
• Certificazioni Google Cloud o AWS

Cosa offriamo
• RAL €30.000 - €40.000
• Full remote con 2 giorni/mese in ufficio a Roma
• Startup environment dinamico
• Percorso di crescita verso Senior Analyst`,
  },
];
