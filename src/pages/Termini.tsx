import LegalLayout from "@/components/LegalLayout";

const toc = [
  { id: "oggetto", label: "1. Oggetto" },
  { id: "servizio", label: "2. Servizio" },
  { id: "ai", label: "3. Limiti AI" },
  { id: "account", label: "4. Account" },
  { id: "obblighi", label: "5. Obblighi" },
  { id: "contenuti", label: "6. Contenuti" },
  { id: "ip", label: "7. Proprietà intellettuale" },
  { id: "disponibilita", label: "8. Disponibilità" },
  { id: "responsabilita", label: "9. Responsabilità" },
  { id: "legge", label: "10. Legge applicabile" },
  { id: "recesso", label: "11. Recesso" },
];

export default function Termini() {
  return (
    <LegalLayout title="Termini e Condizioni d'Uso" version="1.1" lastUpdated="15 marzo 2026" toc={toc}>
      <section id="oggetto">
        <h2>Art. 1 — Oggetto e Accettazione</h2>
        <p>
          Verso è una piattaforma web per l'adattamento del curriculum vitae tramite intelligenza artificiale,
          disponibile in versione gratuita (Free) e in abbonamento (Pro, €9,90/mese).
          Il servizio è rivolto a persone fisiche maggiorenni (18+). L'accettazione dei presenti Termini e
          dell'Informativa Privacy avviene proseguendo con la registrazione dell'account.
        </p>
      </section>

      <section id="servizio">
        <h2>Art. 2 — Descrizione del Servizio</h2>
        <p>Verso offre le seguenti funzionalità:</p>
        <ul>
          <li>Analisi e parsing del CV tramite AI (upload PDF → estrazione dati strutturati)</li>
          <li>Scraping di annunci di lavoro da URL o testo incollato</li>
          <li>Pre-screening: analisi di compatibilità tra CV e annuncio, con identificazione gap e dealbreaker</li>
          <li>Adattamento automatizzato del CV (tailoring) per specifici annunci, valorizzando esperienze realmente possedute senza aggiungere informazioni non veritiere</li>
          <li>Calcolo di punteggi di compatibilità (match score) e ottimizzazione ATS (ATS score), indicativi e non vincolanti</li>
          <li>Analisi retributiva indicativa basata su dati di mercato</li>
          <li>Tracciamento delle candidature con gestione stati e note</li>
          <li>Export del CV adattato in formato PDF e DOCX (Pro)</li>
        </ul>

        <h3>Piani disponibili</h3>
        <p>
          Il piano <strong>Free</strong> consente di completare 1 candidatura e di utilizzare 2 template CV (Classico, Minimal).
        </p>
        <p>
          Il piano <strong>Pro</strong> (€9,90/mese, annullabile in qualsiasi momento) include candidature illimitate,
          accesso a tutti i template CV (inclusi Executive e Moderno), export in formato DOCX,
          pre-screening di fattibilità e analisi stipendio.
        </p>
        <p>
          Verso <strong>non è</strong> un'agenzia per il lavoro, non intermedia rapporti di lavoro e non garantisce l'esito di alcuna candidatura.
        </p>
      </section>

      <section id="ai">
        <h2>Art. 3 — Natura e Limiti dell'Intelligenza Artificiale</h2>
        <ul>
          <li>Le funzionalità AI utilizzano modelli di terze parti (Anthropic Claude come provider primario, Google Gemini come fallback) tramite infrastruttura cloud</li>
          <li>L'AI può produrre output imprecisi o incompleti ("allucinazioni")</li>
          <li>Il punteggio di compatibilità è un indicatore orientativo, non una valutazione professionale</li>
          <li>L'utente è responsabile della revisione integrale di tutti i documenti generati prima del loro utilizzo</li>
          <li>Verso è progettato per non aggiungere informazioni false, ma l'utente è il solo responsabile dell'accuratezza del proprio CV</li>
          <li>Scaricando i documenti, l'utente ne assume piena responsabilità</li>
        </ul>
      </section>

      <section id="account">
        <h2>Art. 4 — Registrazione e Account</h2>
        <ul>
          <li>L'account è personale e non cedibile</li>
          <li>L'utente deve fornire informazioni veritiere</li>
          <li>L'utente è responsabile della sicurezza delle proprie credenziali</li>
          <li>È vietato creare account multipli</li>
        </ul>
      </section>

      <section id="obblighi">
        <h2>Art. 5 — Obblighi e Condotte Vietate</h2>
        <ul>
          <li>Non caricare dati di terzi senza il loro consenso</li>
          <li>Non creare CV con informazioni false (rif. art. 640 e 482 c.p.)</li>
          <li>Non tentare di compromettere la sicurezza della piattaforma</li>
          <li>Non effettuare scraping o reverse engineering</li>
          <li>Non caricare malware o contenuti dannosi</li>
        </ul>
        <p>La violazione di queste regole può comportare la sospensione immediata dell'account.</p>
      </section>

      <section id="contenuti">
        <h2>Art. 6 — Contenuti dell'Utente e Licenza</h2>
        <ul>
          <li>L'utente resta titolare di tutti i dati caricati</li>
          <li>Concede a Verso una licenza non esclusiva, revocabile, limitata all'erogazione del Servizio</li>
          <li>Verso non utilizza i dati per addestrare modelli AI propri</li>
          <li>Verso non vende i dati a terzi</li>
          <li>I documenti generati sono di proprietà dell'utente</li>
        </ul>
      </section>

      <section id="ip">
        <h2>Art. 7 — Proprietà Intellettuale di Verso</h2>
        <p>
          Codice, design, interfaccia, loghi e marchi sono proprietà di Verso.
          È vietata la riproduzione o il reverse engineering di qualsiasi componente della piattaforma.
        </p>
      </section>

      <section id="disponibilita">
        <h2>Art. 8 — Disponibilità del Servizio</h2>
        <ul>
          <li>Il servizio è fornito "as is", senza garanzia di disponibilità continua</li>
          <li>Verso si riserva il diritto di modificare o sospendere funzionalità con preavviso</li>
          <li>Eventuali modifiche ai T&C saranno comunicate via email con 30 giorni di preavviso</li>
        </ul>
      </section>

      <section id="responsabilita">
        <h2>Art. 9 — Limitazione di Responsabilità</h2>
        <ul>
          <li>Verso non risponde dell'esito delle candidature</li>
          <li>Non risponde di eventuali imprecisioni dell'AI</li>
          <li>Non risponde di danni derivanti da documenti non revisionati dall'utente</li>
        </ul>
      </section>

      <section id="legge">
        <h2>Art. 10 — Legge Applicabile e Foro</h2>
        <p>
          I presenti Termini sono regolati dalla legge italiana. Per i consumatori residenti in Italia,
          il foro competente è quello del luogo di residenza del consumatore.
        </p>
        <p>
          Per la risoluzione alternativa delle controversie è possibile utilizzare la{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
            piattaforma ODR della Commissione Europea
          </a>.
        </p>
      </section>

      <section id="recesso">
        <h2>Art. 11 — Recesso e Risoluzione</h2>
        <p>
          L'utente può recedere dal contratto e cessare l'utilizzo del Servizio in qualsiasi momento,
          eliminando il proprio account dalla sezione <strong>Impostazioni → Zona pericolosa</strong>.
        </p>
        <p>
          La disdetta dell'abbonamento Pro può essere effettuata dalla sezione{" "}
          <strong>Impostazioni → Account → Piano</strong>. La cancellazione dell'abbonamento ha effetto
          al termine del periodo di fatturazione in corso.
        </p>
        <p>
          La cancellazione dell'account comporta l'eliminazione permanente e irreversibile di tutti i
          dati associati (CV, candidature, profilo). I log dei consensi prestati verranno anonimizzati e
          conservati per il periodo previsto dalla normativa vigente.
        </p>
        <p>
          Il Titolare si riserva il diritto di sospendere o risolvere l'accesso al Servizio in caso di
          violazione dei presenti Termini, con preavviso ragionevole via email ove possibile.
        </p>
      </section>
    </LegalLayout>
  );
}
