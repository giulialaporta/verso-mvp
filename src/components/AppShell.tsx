import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { House, Briefcase, SignOut, List, Plus, Flask, Gear, Question } from "@phosphor-icons/react";
import { useSubscription } from "@/hooks/useSubscription";
import { useProGate } from "@/hooks/useProGate";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { title: "Home", url: "/app/home", icon: House },
  { title: "Candidature", url: "/app/candidature", icon: Briefcase },
];

const sidebarItems = [
  ...navItems,
  { title: "Nuova candidatura", url: "/app/nuova", icon: Plus },
  { title: "Guida", url: "/app/faq", icon: Question },
  { title: "Impostazioni", url: "/app/impostazioni", icon: Gear },
  ...(import.meta.env.DEV ? [{ title: "Dev Test", url: "/app/dev-test", icon: Flask }] : []),
];

function DesktopSidebar() {
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarContent className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex h-14 items-center px-4">
          {!collapsed ? (
            <span className="font-display text-xl font-extrabold tracking-tight">
              VERS<span className="text-primary">O</span>
            </span>
          ) : (
            <span className="font-display text-xl font-extrabold text-primary">V</span>
          )}
        </div>

        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon size={20} weight={location.pathname === item.url ? "fill" : "regular"} className="mr-2" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom: legal links + sign out */}
        <div className="border-t border-border">
          {!collapsed && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 px-3 pt-2 pb-1">
              <Link to="/termini" target="_blank" className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground py-1.5">T&C</Link>
              <Link to="/privacy" target="_blank" className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground py-1.5">Privacy</Link>
              <Link to="/cookie-policy" target="_blank" className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground py-1.5">Cookie</Link>
            </div>
          )}
          <div className="p-2">
            <Button
              variant="ghost"
              size={collapsed ? "icon" : "default"}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => { signOut(); navigate("/login"); }}
            >
              <SignOut size={20} className={collapsed ? "" : "mr-2"} />
              {!collapsed && "Esci"}
            </Button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isPro } = useSubscription();
  const checkCanCreate = useProGate();

  const isActive = (path: string) => location.pathname === path;

  const handleNewApp = async () => {
    const canCreate = await checkCanCreate(isPro);
    if (canCreate) navigate("/app/nuova");
  };

  const TabButton = ({ path, icon: Icon, label }: { path: string; icon: typeof House; label: string }) => {
    const active = isActive(path);
    const handleClick = () => {
      if (active) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        navigate(path);
      }
    };
    return (
      <button
        onClick={handleClick}
        className="relative flex flex-col items-center justify-center gap-0.5 py-2 min-h-[44px]"
      >
        <Icon
          size={22}
          weight={active ? "fill" : "regular"}
          className={active ? "text-primary" : "text-muted-foreground"}
        />
        <span className={`text-[11px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
          {label}
        </span>
        {active && (
          <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary" />
        )}
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="grid h-14 grid-cols-5 items-center px-2">
        <TabButton path="/app/home" icon={House} label="Home" />
        <TabButton path="/app/candidature" icon={Briefcase} label="Candidature" />

        {/* FAB center */}
        <div className="flex items-center justify-center">
          <button
            onClick={handleNewApp}
            className="relative -top-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95"
            aria-label="Nuova candidatura"
          >
            <Plus size={22} weight="bold" />
          </button>
        </div>

        <TabButton path="/app/faq" icon={Question} label="Guida" />
        <TabButton path="/app/impostazioni" icon={Gear} label="Impostazioni" />
      </div>
    </nav>
  );
}

export default function AppShell() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-[calc(3.5rem+env(safe-area-inset-bottom)+0.5rem)] pt-4">
        <Outlet />
        <MobileTabBar />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DesktopSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b border-border px-4">
            <SidebarTrigger>
              <List size={20} />
            </SidebarTrigger>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
