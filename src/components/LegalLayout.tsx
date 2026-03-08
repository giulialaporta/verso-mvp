import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import { type ReactNode } from "react";

interface TocItem {
  id: string;
  label: string;
}

interface LegalLayoutProps {
  title: string;
  version: string;
  lastUpdated: string;
  toc: TocItem[];
  children: ReactNode;
}

export default function LegalLayout({ title, version, lastUpdated, toc, children }: LegalLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to={user ? "/app/home" : "/login"} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft size={16} />
            {user ? "Torna all'app" : "Torna al login"}
          </Link>
          <Link to="/login" className="font-display text-lg font-extrabold tracking-tight">
            VERS<span className="text-primary">O</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 lg:flex lg:gap-12">
        {/* Sidebar TOC — desktop only */}
        <aside className="hidden lg:block lg:w-56 shrink-0">
          <nav className="sticky top-20 space-y-1">
            <p className="mb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Indice</p>
            {toc.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-primary hover:bg-surface transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-10">
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
            <div className="prose-legal mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:text-lg [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_strong]:text-foreground [&_table]:w-full [&_table]:text-left [&_th]:text-foreground [&_th]:font-medium [&_th]:pb-2 [&_th]:pr-4 [&_td]:pb-2 [&_td]:pr-4 [&_td]:align-top">
              {children}
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Versione {version} — Ultimo aggiornamento: {lastUpdated}
          </p>
        </main>
      </div>
    </div>
  );
}
