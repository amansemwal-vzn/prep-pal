import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ListChecks, Map, Briefcase, NotebookPen, Flame, Menu, X } from "lucide-react";
import { useState } from "react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/tasks", label: "Daily Tasks", icon: ListChecks },
  { to: "/roadmaps", label: "Roadmaps", icon: Map },
  { to: "/jobs", label: "Job Tracker", icon: Briefcase },
  { to: "/notes", label: "Notes", icon: NotebookPen },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="md:hidden glass-strong sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Flame className="h-5 w-5 text-primary" />
          <span className="ember-text">Forge</span>
        </Link>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="p-2 rounded-lg hover:bg-white/5 transition"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`${mobileOpen ? "block" : "hidden"} md:block md:sticky md:top-0 md:h-screen md:w-64 shrink-0 z-30`}
      >
        <div className="glass-strong md:h-full md:rounded-none rounded-none border-r p-4 flex flex-col gap-2">
          <div className="hidden md:flex items-center gap-2 px-2 py-3 mb-2">
            <div className="h-9 w-9 rounded-xl ember-bg flex items-center justify-center shadow-[var(--shadow-glow)]">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-bold tracking-tight text-lg leading-none ember-text">Forge</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">interview prep</div>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to, item.exact);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    active
                      ? "bg-gradient-to-r from-primary/20 to-accent/10 text-foreground border border-primary/30 shadow-[var(--shadow-glow)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                  <span>{item.label}</span>
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto hidden md:block text-[11px] text-muted-foreground px-3 py-2">
            Stay sharp. Ship daily.
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-10 max-w-[1400px] mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
