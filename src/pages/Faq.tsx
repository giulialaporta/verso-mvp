import { Funnel, Compass, Rocket, ShieldCheck } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqSection {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  items: { q: string; a: string }[];
}

const sections: FaqSection[] = [
  {
    icon: <Funnel size={22} weight="bold" className="text-info" />,
    title: "Come funzionano davvero le selezioni",
    subtitle: "La maggior parte dei CV non viene mai letta da un essere umano.",
    items: [
      {
        q: "Cos'è un ATS?",
        a: "ATS sta per Applicant Tracking System. È il software che le aziende usano per gestire le candidature. Quando invii un CV, non arriva sulla scrivania di qualcuno: arriva in un database. L'ATS lo analizza, lo confronta con i requisiti dell'annuncio e assegna un punteggio. Se il punteggio è basso, il tuo CV non verrà mai visto da un recruiter. Oltre il 98% delle aziende Fortune 500 usa un ATS. E sempre più PMI stanno adottandolo.",
      },
      {
        q: "Perché il mio CV viene scartato?",
        a: "Tre motivi principali. Primo: il formato. Tabelle, colonne, grafici, icone — tutto ciò che rende un CV \"bello\" lo rende illeggibile per un ATS. Secondo: le keyword. Se l'annuncio dice \"project management\" e tu scrivi \"gestione progetti\", l'ATS potrebbe non fare il collegamento. Terzo: la struttura. Sezioni mancanti, titoli creativi, layout non standard. L'ATS cerca pattern precisi: esperienza, formazione, competenze. Se non li trova dove se li aspetta, il tuo CV perde punti.",
      },
      {
        q: "Cosa significa \"ATS-friendly\"?",
        a: "Un CV ATS-friendly è un CV progettato per essere letto correttamente dai software di selezione. Significa: layout a colonna singola, font standard, sezioni con titoli riconoscibili, niente immagini o grafici, keyword allineate all'annuncio. Non significa brutto — significa strategico.",
      },
      {
        q: "Ma i recruiter non leggono i CV uno per uno?",
        a: "Per le posizioni che ricevono 50-200+ candidature, no. Il primo filtro è quasi sempre automatico. Il recruiter vede solo i CV che hanno superato lo screening dell'ATS. Questo vale per LinkedIn Easy Apply, per i portali aziendali, per le agenzie interinali. Anche quando un recruiter legge il CV, lo fa in 6-8 secondi. Ogni parola deve contare.",
      },
    ],
  },
  {
    icon: <Compass size={22} weight="bold" className="text-primary" />,
    title: "La filosofia di Verso",
    subtitle: "Nessuna bugia. Solo la versione migliore di te.",
    items: [
      {
        q: "Verso scrive il CV al posto mio?",
        a: "No. Non invento nulla. Parto dal tuo CV reale — le tue esperienze, le tue competenze, i tuoi risultati — e li riorganizzo, riformulo e ottimizzo per una specifica posizione. È la differenza tra mentire e comunicare bene. Un avvocato non cambia i fatti: li presenta nel modo più efficace. Faccio lo stesso con il tuo profilo professionale.",
      },
      {
        q: "Cos'è il \"tailoring\" e perché è importante?",
        a: "Tailoring significa adattare il CV a ogni singola candidatura. Lo stesso profilo può essere presentato in modi diversi a seconda del ruolo, del settore, della seniority richiesta. Un CV generico è un CV debole. Ogni annuncio ha keyword specifiche, competenze prioritarie, un linguaggio settoriale. Il tailoring allinea il tuo CV a queste variabili senza alterare la sostanza. È quello che fanno i career coach più bravi — Verso lo automatizza.",
      },
      {
        q: "Verso è onesto: cos'è l'Honest Score?",
        a: "L'Honest Score è il mio controllo anti-esagerazione. Dopo ogni tailoring, verifico che il CV adattato sia coerente con il CV originale. Se l'AI ha aggiunto competenze che non hai, gonfiato risultati, o inserito esperienze inventate, l'Honest Score lo segnala. Ogni modifica è tracciabile. Il tuo CV adattato è sempre una versione del tuo CV reale, mai una fiction.",
      },
      {
        q: "Perché Verso fa un pre-screening prima di adattare il CV?",
        a: "Perché non tutte le candidature hanno senso. Prima di investire tempo (tuo e dell'AI), analizzo il match tra il tuo profilo e l'annuncio. Identifico dealbreaker, gap di competenze, disallineamenti di seniority. Se il ruolo richiede 10 anni di esperienza in cloud architecture e tu ne hai 2 nel frontend, te lo dico. Non per scoraggiarti — per aiutarti a concentrare le energie dove puoi davvero fare la differenza.",
      },
    ],
  },
  {
    icon: <Rocket size={22} weight="bold" className="text-warning" />,
    title: "Come usare Verso al meglio",
    subtitle: "Piccoli accorgimenti, grandi risultati.",
    items: [
      {
        q: "Come ottenere il massimo dal CV Master?",
        a: "Il CV Master è la base di tutto. Più è completo, migliori saranno i risultati del tailoring. Includi tutte le esperienze, anche quelle brevi. Dettaglia le competenze tecniche con i nomi esatti degli strumenti. Aggiungi risultati misurabili dove possibile: \"incremento vendite del 30%\", \"riduzione tempi di consegna del 20%\". Verso selezionerà e adatterà le parti più rilevanti per ogni candidatura.",
      },
      {
        q: "Come leggere il Match Score?",
        a: "Il Match Score indica quanto il tuo profilo si allinea ai requisiti dell'annuncio. Sopra il 70% sei in una posizione forte. Tra 40% e 70%, hai buone possibilità ma ci sono gap da colmare. Sotto il 40%, valuta se la posizione è realistica. Il Match Score non è un voto: è una bussola. Ti dice dove stai puntando e se la direzione ha senso.",
      },
      {
        q: "Come migliorare il Punteggio ATS?",
        a: "Il Punteggio ATS misura quanto il tuo CV è ottimizzato per i sistemi di screening automatico. Ti mostro 7 check specifici: keyword presenti, formato corretto, sezioni standard, lunghezza adeguata, verbi d'azione, risultati misurabili, assenza di elementi problematici. Per ogni check fallito, hai un'indicazione precisa su cosa migliorare. In molti casi, lo correggo automaticamente durante il tailoring.",
      },
      {
        q: "Quando usare i suggerimenti AI?",
        a: "Ti segnalo le competenze che ti mancano rispetto all'annuncio e suggerisco risorse per colmare i gap: corsi su Coursera, LinkedIn Learning, certificazioni. Non devi necessariamente completarli prima di candidarti — ma sapere cosa ti manca ti aiuta a prepararti per il colloquio e a pianificare la crescita professionale. Se una skill è marcata come \"essenziale\" e non ce l'hai, valuta seriamente se è il caso di candidarti.",
      },
      {
        q: "Posso spostare una skill da \"mancante\" a \"presente\"?",
        a: "Sì. Se Verso non ha riconosciuto una competenza che in realtà hai, puoi spostarla manualmente. Questo aggiorna il match score e il CV adattato. Ma sii onesto: se la sposti, assicurati di poterla sostenere in un colloquio.",
      },
    ],
  },
  {
    icon: <ShieldCheck size={22} weight="bold" className="text-primary" />,
    title: "I tuoi dati, il tuo controllo",
    subtitle: "Trasparenza totale su cosa conserviamo e perché.",
    items: [
      {
        q: "Cosa succede ai miei dati?",
        a: "Il tuo CV, le candidature e i dati personali sono conservati in server sicuri in Europa (EU). Solo tu puoi accedere ai tuoi dati. Non vendiamo, non condividiamo, non monetizziamo i tuoi dati. Mai. Puoi esportare tutto in qualsiasi momento (formato JSON) e puoi eliminare il tuo account con tutti i dati associati.",
      },
      {
        q: "Come viene usata l'AI?",
        a: "L'AI analizza il tuo CV e gli annunci per generare il tailoring, gli score e i suggerimenti. I dati vengono inviati al modello AI (Google Gemini) per l'elaborazione e non vengono usati per addestrare il modello. L'AI non ha memoria tra una sessione e l'altra: ogni analisi parte da zero.",
      },
      {
        q: "Come funziona l'abbonamento Pro?",
        a: "Con il piano Free puoi creare 1 candidatura completa per provare Verso. Con Verso Pro (€9,90/mese) hai candidature illimitate. L'abbonamento si rinnova automaticamente ogni mese. Puoi annullarlo in qualsiasi momento dalle Impostazioni — mantieni l'accesso fino alla fine del periodo pagato. Nessun vincolo, nessuna penale.",
      },
      {
        q: "Cosa succede quando cancello l'abbonamento?",
        a: "Mantieni l'accesso a Verso Pro fino alla fine del periodo già pagato. Dopo, torni al piano Free. Le candidature e i CV che hai già creato restano accessibili — non perdi nulla. Se vuoi tornare a Pro, puoi riattivare in qualsiasi momento.",
      },
      {
        q: "Posso eliminare il mio account e i miei dati?",
        a: "Sì. Da Impostazioni > Zona pericolosa puoi eliminare definitivamente il tuo account. Verranno cancellati: profilo, CV caricati, CV adattati, candidature, dati personali. I log dei consensi vengono anonimizzati e conservati per obblighi legali (GDPR). L'eliminazione è irreversibile.",
      },
    ],
  },
];

export default function Faq() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 pb-12">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Guida & FAQ
        </h1>
        <p className="text-sm text-muted-foreground">
          Tutto quello che devi sapere su ATS, CV tailoring e come Verso ti aiuta a candidarti meglio.
        </p>
      </div>

      {/* Sections */}
      {sections.map((section, idx) => (
        <Card key={idx} className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2.5 text-lg">
              {section.icon}
              {section.title}
            </CardTitle>
            <CardDescription className="text-xs italic">
              {section.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="multiple" className="w-full">
              {section.items.map((item, i) => (
                <AccordionItem key={i} value={`${idx}-${i}`}>
                  <AccordionTrigger className="text-left text-sm hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
