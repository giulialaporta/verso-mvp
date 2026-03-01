import type { ParsedCV } from "@/types/cv";

export const TEST_CV: ParsedCV = {
  personal: {
    name: "Giulia La Porta",
    email: "giulialaporta@libero.it",
    phone: "+39 3293925008",
    location: "Milano",
    date_of_birth: "03/12/1987",
    linkedin: "https://www.linkedin.com/in/giulialaporta",
  },

  summary:
    "Senior Product Manager con 10+ anni di esperienza in fintech, banking e insurance. Specializzata in AI/ML product strategy, automazione di processo e CRM. Track record di delivery su prodotti digitali ad alto impatto in contesti enterprise e startup.",

  experience: [
    {
      role: "Head of Automation and AI / PM Competence Lead",
      company: "HYPE S.p.A.",
      location: "Milano",
      start: "01/2021",
      current: true,
      description:
        "Lead della roadmap strategica per prodotti AI e automazione. Gestione di un team cross-funzionale di 8 persone. Lancio di chatbot AI per customer service (riduzione ticket -35%). Implementazione di modelli predittivi per fraud detection. Mentoring di 4 Product Manager junior.",
      bullets: [
        "Definizione e delivery della roadmap AI/ML con impatto su 2M+ utenti",
        "Lancio chatbot conversazionale con NLU custom — riduzione ticket -35%",
        "Implementazione fraud detection ML model — saving €1.2M/anno",
        "Coordinamento con C-level per strategia prodotto e budget allocation",
        "Creazione PM competence framework e hiring di 4 PM",
      ],
    },
    {
      role: "Product Owner — Digital Banking",
      company: "Illimity Bank S.p.A.",
      location: "Milano",
      start: "03/2019",
      end: "12/2020",
      description:
        "Product Owner per la piattaforma di digital banking B2C. Gestione backlog, sprint planning, stakeholder management. Lancio di nuove feature di investimento e risparmio.",
      bullets: [
        "Ownership del backlog prodotto per app mobile (200K+ utenti)",
        "Lancio feature 'Progetti di Risparmio' — +18% engagement",
        "Coordinamento con team engineering (15 dev) in metodologia Agile/Scrum",
        "User research e A/B testing per ottimizzazione onboarding (+12% conversion)",
      ],
    },
    {
      role: "CRM & Digital Marketing Specialist",
      company: "Intesa Sanpaolo S.p.A.",
      location: "Milano",
      start: "06/2015",
      end: "02/2019",
      description:
        "Gestione CRM e campagne di marketing digitale per il segmento retail. Analisi dati cliente, segmentazione, personalizzazione comunicazioni.",
      bullets: [
        "Gestione CRM Dynamics 365 per segmento retail (5M+ clienti)",
        "Progettazione campagne data-driven con uplift medio +22%",
        "Implementazione customer journey automatizzati",
        "Reporting e analytics su KPI di engagement e conversion",
      ],
    },
    {
      role: "Business Consultant — Financial Services",
      company: "Deloitte Consulting",
      location: "Milano",
      start: "09/2012",
      end: "05/2015",
      description:
        "Consulenza strategica e operativa per clienti banking e insurance. Progetti di digital transformation, process reengineering, regulatory compliance.",
      bullets: [
        "Progetti di digital transformation per 3 top-tier bank italiane",
        "Business analysis e requirements gathering per piattaforme core banking",
        "Supporto a programmi di compliance regolamentare (MiFID II, PSD2)",
        "Facilitazione workshop strategici con C-level stakeholder",
      ],
    },
  ],

  education: [
    {
      institution: "ABI — Associazione Bancaria Italiana",
      degree: "Executive Master",
      field: "Banking and Finance Innovation",
      start: "2018",
      end: "2019",
    },
    {
      institution: "Università degli Studi di Palermo",
      degree: "Laurea Magistrale",
      field: "Economia e Finanza",
      end: "2012",
      grade: "110/110",
      honors: "con Lode",
    },
    {
      institution: "Università degli Studi di Palermo",
      degree: "Laurea Triennale",
      field: "Economia Aziendale",
      end: "2009",
    },
  ],

  skills: {
    technical: [
      "Product Management",
      "Product Strategy",
      "AI/ML Product Development",
      "Agile/Scrum",
      "Data Analysis",
      "CRM",
      "Digital Banking",
      "Fintech",
      "InsurTech",
      "Process Automation",
      "A/B Testing",
      "User Research",
    ],
    soft: [
      "Leadership",
      "Stakeholder Management",
      "Cross-functional Collaboration",
      "Mentoring",
      "Strategic Thinking",
      "Problem Solving",
    ],
    tools: [
      "Jira",
      "Confluence",
      "Figma",
      "Miro",
      "Notion",
      "Dynamics 365",
      "Salesforce",
      "Azure DevOps",
      "Google Analytics",
      "Mixpanel",
      "SQL",
      "Python (base)",
    ],
    languages: [
      { language: "Italiano", level: "Madrelingua" },
      { language: "Inglese", level: "B2", descriptor: "Upper Intermediate" },
    ],
  },

  certifications: [
    { name: "Professional Scrum Product Owner (PSPO I)", issuer: "Scrum.org", year: "2020" },
    { name: "Google Analytics Individual Qualification", issuer: "Google", year: "2017" },
  ],
};
