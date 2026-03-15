import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LandingNavbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-all duration-300 ${
        scrolled
          ? "border-b border-border bg-background/85"
          : "border-b border-transparent bg-background/60"
      }`}
    >
      <div className="container flex items-center justify-between h-16">
        <a href="#" className="font-display font-extrabold text-xl tracking-tight">
          VERS<span className="text-primary">O</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#come-funziona" className="hover:text-foreground transition-colors">Come funziona</a>
          <a href="#funzionalita" className="hover:text-foreground transition-colors">Funzionalità</a>
          <a href="#prezzi" className="hover:text-foreground transition-colors">Prezzi</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="font-semibold"
            onClick={() => navigate("/login")}
          >
            Accedi
          </Button>
          <Button
            size="sm"
            className="font-bold rounded-full"
            onClick={() => navigate("/login?plan=free")}
          >
            Inizia gratis
          </Button>
        </div>

        {/* Mobile CTA + toggle */}
        <div className="md:hidden flex items-center gap-2">
          <Button
            size="sm"
            className="font-bold rounded-full text-sm px-5"
            onClick={() => navigate("/login?plan=free")}
          >
            Inizia gratis
          </Button>
          <button
            className="text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-6 py-6 space-y-4">
          <a href="#come-funziona" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>Come funziona</a>
          <a href="#funzionalita" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>Funzionalità</a>
          <a href="#prezzi" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>Prezzi</a>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" size="sm" className="font-semibold" onClick={() => navigate("/login")}>Accedi</Button>
            <Button size="sm" className="font-bold rounded-full" onClick={() => navigate("/login")}>Inizia gratis</Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingNavbar;
