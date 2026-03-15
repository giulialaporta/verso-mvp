import LegalLayout from "@/components/LegalLayout";

const toc = [
  { id: "titolare", label: "Titolare" },
  { id: "dati", label: "Dati trattati" },
  { id: "finalita", label: "Finalità" },
  { id: "subprocessori", label: "Sub-processori" },
  { id: "diritti", label: "Diritti utente" },
  { id: "sicurezza", label: "Sicurezza" },
  { id: "conservazione", label: "Conservazione" },
];

export default function Privacy() {
  return (
    <LegalLayout title="Informativa Privacy" version="1.1" lastUpdated="15 marzo 2026" toc={toc}>
      <section id="titolare">
        <h2>Titolare del Trattamento</h2>
        <p>
          Verso — Il titolare del trattamento sarà formalmente indicato prima del lancio ufficiale del servizio. Nel frattempo, per qualsiasi richiesta relativa ai dati personali, scrivere a privacy@verso-cv.app.<br />
          Email: privacy@verso-cv.app
        </p>
      </section>

      <section id="dati">
        <h2>Dati Trattati</h2>
        <h3>Dati di registrazione</h3>
        <p>Nome, email, password (hash), foto profilo (opzionale).</p>

        <h3>Dati professionali (CV)</h3>
        <p>Anagrafica, esperienze lavorative, formazione, competenze, certificazioni, progetti.</p>

        <h3>Dati retributivi (opzionale)</h3>
        <p>RAL attuale e desiderata, inseriti volontariamente dall'utente.</p>

        <h3>Dati delle candidature</h3>
        <p>Aziende, ruoli, date, note personali, punteggi di compatibilità, CV adattati.</p>

        <h3>Dati di pagamento</h3>
        <p>
          I pagamenti sono gestiti interamente da Stripe Inc. Verso non memorizza né ha accesso ai numeri
          di carta di credito o ad altri dati di pagamento sensibili. Conserviamo esclusivamente identificativi
          tecnici (customer ID e subscription ID) necessari alla gestione dell'abbonamento.
        </p>

        <h3>Dati tecnici</h3>
        <p>Indirizzo IP, browser, user agent, dati di sessione.</p>

        <h3>Nota art. 9 GDPR</h3>
        <p>
          Il CV può contenere categorie particolari di dati personali (stato di salute, origine etnica,
          convinzioni religiose o politiche, appartenenza sindacale). Questi dati vengono trattati esclusivamente
          con il consenso esplicito dell'utente, raccolto prima del caricamento del CV.
        </p>
      </section>

      <section id="finalita">
        <h2>Finalità e Basi Giuridiche</h2>
        <table>
          <thead>
            <tr>
              <th>Finalità</th>
              <th>Base giuridica</th>
              <th>Conservazione</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Gestione account</td>
              <td>Esecuzione contratto (art. 6(1)(b))</td>
              <td>Durata account + 12 mesi</td>
            </tr>
            <tr>
              <td>Erogazione servizio (parsing, tailoring, tracking)</td>
              <td>Esecuzione contratto</td>
              <td>Durata account + 6 mesi</td>
            </tr>
            <tr>
              <td>Gestione pagamenti e abbonamento Pro</td>
              <td>Esecuzione contratto (art. 6(1)(b))</td>
              <td>Durata abbonamento + 12 mesi</td>
            </tr>
            <tr>
              <td>Invio dati all'AI per elaborazione</td>
              <td>Esecuzione contratto + consenso art. 9(2)(a)</td>
              <td>Solo tempo elaborazione</td>
            </tr>
            <tr>
              <td>Scraping annunci di lavoro</td>
              <td>Esecuzione contratto</td>
              <td>Cache 7 giorni</td>
            </tr>
            <tr>
              <td>Sicurezza e prevenzione frodi</td>
              <td>Legittimo interesse (art. 6(1)(f))</td>
              <td>12 mesi</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section id="subprocessori">
        <h2>Sub-processori</h2>
        <table>
          <thead>
            <tr>
              <th>Fornitore</th>
              <th>Paese</th>
              <th>Ruolo</th>
              <th>Dati trasmessi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Supabase Inc.</td>
              <td>USA (region EU disponibile)</td>
              <td>Database, auth, storage, edge functions</td>
              <td>Tutti i dati account e CV</td>
            </tr>
            <tr>
              <td>Anthropic PBC</td>
              <td>USA</td>
              <td>Elaborazione AI (provider primario)</td>
              <td>Testo CV + job description</td>
            </tr>
            <tr>
              <td>Google (Gemini)</td>
              <td>USA/UE</td>
              <td>Elaborazione AI (fallback)</td>
              <td>Testo CV + job description</td>
            </tr>
            <tr>
              <td>Stripe Inc.</td>
              <td>USA</td>
              <td>Gestione pagamenti e abbonamenti</td>
              <td>Email, ID cliente, dati di pagamento</td>
            </tr>
            <tr>
              <td>Google LLC</td>
              <td>USA</td>
              <td>OAuth login</td>
              <td>Email, nome (token OAuth)</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section id="diritti">
        <h2>Diritti dell'Utente (artt. 15-22 GDPR)</h2>
        <p>Hai il diritto di:</p>
        <ul>
          <li><strong>Accesso</strong> — ottenere conferma e copia dei tuoi dati</li>
          <li><strong>Rettifica</strong> — correggere dati inesatti</li>
          <li><strong>Cancellazione</strong> — richiedere l'eliminazione dei tuoi dati</li>
          <li><strong>Limitazione</strong> — limitare il trattamento in casi specifici</li>
          <li><strong>Portabilità</strong> — ricevere i tuoi dati in formato strutturato</li>
          <li><strong>Opposizione</strong> — opporti al trattamento basato su legittimo interesse</li>
          <li><strong>Revoca consenso</strong> — revocare il consenso in qualsiasi momento</li>
        </ul>
        <p>
          Puoi esercitare i tuoi diritti scrivendo a <strong>privacy@verso-cv.app</strong>.
          Risponderemo entro 30 giorni. Puoi anche presentare reclamo al{" "}
          <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">
            Garante per la protezione dei dati personali
          </a>.
        </p>
      </section>

      <section id="sicurezza">
        <h2>Sicurezza</h2>
        <ul>
          <li>Crittografia TLS in transito, dati a riposo cifrati</li>
          <li>Row Level Security (RLS) per isolamento dati tra utenti</li>
          <li>URL firmati con scadenza per l'accesso ai file</li>
          <li>Nessun file pubblicamente accessibile senza autenticazione</li>
        </ul>
      </section>

      <section id="conservazione">
        <h2>Conservazione dei Dati</h2>
        <p>
          I dati vengono conservati per la durata dell'account. Alla cancellazione, tutti i dati personali
          vengono eliminati entro 30 giorni, inclusi file caricati e CV generati. I log di consenso vengono
          anonimizzati e conservati per obblighi di legge.
        </p>
      </section>
    </LegalLayout>
  );
}
