import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { House, PlusCircle, Briefcase, SignOut, List } from "@phosphor-icons/react";
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
  { title: "Nuova", url: "/app/nuova", icon: PlusCircle },
  { title: "Candidature", url: "/app/candidature", icon: Briefcase },
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
              {navItems.map((item) => (
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

        {/* Bottom: sign out */}
        <div className="p-2 border-t border-border">
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
      </SidebarContent>
    </Sidebar>
  );
}

function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background/80 backdrop-blur-xl">
      {navItems.map((item) => {
        const isActive = location.pathname === item.url;
        const isNew = item.url === "/app/nuova";

        if (isNew) {
          return (
            <button
              key={item.title}
              onClick={() => navigate(item.url)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25"
            >
              <PlusCircle size={24} weight="bold" />
            </button>
          );
        }

        return (
          <button
            key={item.title}
            onClick={() => navigate(item.url)}
            className="relative flex flex-col items-center gap-0.5 text-xs"
          >
            <item.icon
              size={22}
              weight={isActive ? "fill" : "regular"}
              className={isActive ? "text-primary" : "text-muted-foreground"}
            />
            <span className={isActive ? "text-primary" : "text-muted-foreground"}>
              {item.title}
            </span>
            {isActive && (
              <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

export default function AppShell() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
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
