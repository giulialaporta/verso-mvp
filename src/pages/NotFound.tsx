import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { House } from "@phosphor-icons/react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="font-display text-6xl font-extrabold text-primary">404</h1>
        <p className="text-xl text-muted-foreground">Pagina non trovata</p>
        <p className="text-sm text-muted-foreground">La pagina che stai cercando non esiste o è stata spostata.</p>
        <Link
          to="/app/home"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:brightness-110 transition-all"
        >
          <House size={16} weight="bold" />
          Torna alla home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
