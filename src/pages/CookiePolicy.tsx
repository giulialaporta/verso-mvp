import LegalLayout from "@/components/LegalLayout";

const toc = [
  { id: "cosa", label: "Cosa sono i cookie" },
  { id: "tecnici", label: "Cookie tecnici" },
  { id: "analitici", label: "Cookie analitici" },
  { id: "profilazione", label: "Cookie di profilazione" },
  { id: "gestione", label: "Come gestirli" },
];

export default function CookiePolicy() {
  return (
    <LegalLayout title="Cookie Policy" version="1.0" lastUpdated="8 marzo 2026" toc={toc}>
      <section id="cosa">
        <h2>Cosa sono i cookie</h2>
        <p>
          I cookie sono piccoli file di testo che i siti web salvano sul tuo dispositivo per ricordare
          le tue preferenze e migliorare la tua esperienza di navigazione.
        </p>
      </section>

      <section id="tecnici">
        <h2>Cookie tecnici (nessun consenso richiesto)</h2>
        <p>Questi cookie sono necessari per il funzionamento del sito e non possono essere disattivati:</p>
        <ul>
          <li><strong>Cookie di sessione</strong> — gestiscono l'autenticazione e mantengono la sessione attiva</li>
          <li><strong>Cookie CSRF</strong> — proteggono dai tentativi di falsificazione delle richieste</li>
          <li><strong>Preferenze UI</strong> — memorizzano le tue scelte di interfaccia (es. consenso cookie)</li>
        </ul>
      </section>

      <section id="analitici">
        <h2>Cookie analitici</h2>
        <p>
          Attualmente Verso <strong>non utilizza cookie analitici</strong>. Se in futuro verranno introdotti
          strumenti di analisi del traffico, verrà richiesto il tuo consenso esplicito prima della loro attivazione.
        </p>
      </section>

      <section id="profilazione">
        <h2>Cookie di profilazione</h2>
        <p>
          Verso <strong>non utilizza cookie di profilazione</strong>. Non vendiamo né condividiamo i tuoi
          dati di navigazione con inserzionisti o terze parti per finalità pubblicitarie.
        </p>
      </section>

      <section id="gestione">
        <h2>Come gestire i cookie</h2>
        <p>
          Puoi gestire le preferenze sui cookie in qualsiasi momento dalle <strong>Impostazioni</strong> dell'app
          (sezione "Privacy e Dati") oppure tramite le impostazioni del tuo browser.
        </p>
        <p>La disattivazione dei cookie tecnici potrebbe compromettere il funzionamento del servizio.</p>
      </section>
    </LegalLayout>
  );
}
