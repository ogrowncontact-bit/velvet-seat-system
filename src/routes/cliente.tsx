import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth, routeForRole } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { CalendarCheck, Compass, LogOut, Loader2 } from "lucide-react";

export const Route = createFileRoute("/cliente")({
  component: ClienteLayout,
});

function ClienteLayout() {
  const { user, loading, role, roleLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading || roleLoading) return;
    if (!user) navigate({ to: "/cliente/login", replace: true });
    else if (role && role !== "customer") navigate({ to: routeForRole(role), replace: true });
  }, [user, loading, role, roleLoading, navigate]);

  if (loading || !user || roleLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-canvas">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const name = ((user.user_metadata ?? {}) as { full_name?: string }).full_name ?? user.email;
  const initials = (name ?? "?").slice(0, 2).toUpperCase();

  const tabs = [
    { to: "/cliente", label: "Minhas reservas", icon: CalendarCheck, exact: true },
    { to: "/restaurants", label: "Descobrir restaurantes", icon: Compass, exact: false },
  ];

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 h-16 glass border-b border-border">
        <div className="max-w-5xl mx-auto h-full flex items-center justify-between px-6">
          <Link to="/cliente" className="font-serif text-2xl">SeatFlow</Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card">
              <div className="size-6 rounded-md bg-foreground text-background grid place-items-center text-[10px] font-bold">{initials}</div>
              <span className="text-sm font-medium max-w-[16ch] truncate">{name}</span>
            </div>
            <button
              onClick={async () => { await signOut(); navigate({ to: "/cliente/login" }); }}
              className="size-9 grid place-items-center rounded-lg border border-border bg-card hover:bg-muted"
              title="Sair"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <nav className="flex items-center gap-1 mb-8 border-b border-border">
          {tabs.map((t) => {
            const active = t.exact ? path === t.to : path.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="size-4" />
                {t.label}
              </Link>
            );
          })}
        </nav>
        <Outlet />
      </main>
    </div>
  );
}
