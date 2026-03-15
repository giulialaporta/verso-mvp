import { Link } from "react-router-dom";

const LandingFooter = () => {
  return (
    <footer className="border-t border-border bg-card py-10 sm:py-14">
      <div className="container">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="font-display font-extrabold text-xl tracking-tight mb-2">
              VERS<span className="text-primary">O</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Il tuo CV, alla sua versione migliore.
            </p>
          </div>

          {/* Prodotto */}
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-3">Prodotto</div>
            <nav className="space-y-2 text-sm">
              <a href="#come-funziona" className="block text-muted-foreground hover:text-foreground transition-colors">Come funziona</a>
              <a href="#funzionalita" className="block text-muted-foreground hover:text-foreground transition-colors">Funzionalità</a>
              <a href="#prezzi" className="block text-muted-foreground hover:text-foreground transition-colors">Prezzi</a>
            </nav>
          </div>

          {/* Legale */}
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-3">Legale</div>
            <nav className="space-y-2 text-sm">
              <Link to="/termini" className="block text-muted-foreground hover:text-foreground transition-colors">Termini</Link>
              <Link to="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/cookie-policy" className="block text-muted-foreground hover:text-foreground transition-colors">Cookie</Link>
            </nav>
          </div>

          {/* Contatti */}
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-3">Contatti</div>
            <nav className="space-y-2 text-sm">
              <a href="mailto:ciao@verso-cv.app" className="block text-muted-foreground hover:text-foreground transition-colors">ciao@verso-cv.app</a>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-mono text-[11px] tracking-wide text-muted-foreground">
            © {new Date().getFullYear()} Verso. Fatto con precisione.
          </span>
          <span className="font-mono text-[11px] tracking-wide text-muted-foreground">
            Made in Italy <span className="not-italic">🇮🇹</span>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
