import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bell, ChevronDown, Loader2, Menu, Search, LogOut, Building2, Shield, Clock, TriangleAlert } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCurrentRestaurant, useMyRestaurants, useIsPlatformAdmin, setSelectedRestaurant } from "@/hooks/use-current-restaurant";
import { OnboardingScreen } from "@/components/onboarding-screen";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AppSidebar as DesktopSidebar } from "@/components/app-sidebar";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading, signOut, role, roleLoading } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: memberships, isLoading: loadingMemberships } = useMyRestaurants();
  const { restaurant, restaurantId } = useCurrentRestaurant();
  const { data: isAdmin, isLoading: loadingAdmin } = useIsPlatformAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/staff/login", replace: true });
    else if (user && !roleLoading && role === "customer" && user.user_metadata?.["role"] !== "staff") {
      navigate({ to: "/cliente", replace: true });
    }
  }, [user, loading, role, roleLoading, navigate]);

  if (loading || !user || loadingMemberships || loadingAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-canvas">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No restaurant yet → onboarding (or admin console for platform admins)
  if (!memberships || memberships.length === 0) {
    if (isAdmin) {
      // Admin with no restaurants — go straight to admin console
      if (!path.startsWith("/app/admin")) {
        return <RedirectTo to="/app/admin" />;
      }
    } else {
      return <OnboardingScreen />;
    }
  }

  const initials = (user.email ?? "?").slice(0, 2).toUpperCase();


  return (
    <div className="flex min-h-screen bg-canvas">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between gap-4 px-4 md:px-10 border-b border-border glass">
          <div className="flex items-center gap-3 md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="size-9 grid place-items-center rounded-lg border border-border bg-card">
                  <Menu className="size-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div onClick={() => setMobileOpen(false)}>
                  <DesktopSidebar />
                </div>
              </SheetContent>
            </Sheet>
            <Link to="/" className="font-serif text-xl">SeatFlow</Link>
          </div>

          <div className="hidden md:flex items-center gap-2 max-w-md flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                placeholder="Search reservations, guests, tables…"
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card/60 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden md:inline-block px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && memberships && memberships.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium">
                    <Building2 className="size-3.5" />
                    <span className="max-w-[14ch] truncate">{restaurant?.name ?? "Selecionar"}</span>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Restaurantes
                  </DropdownMenuLabel>
                  {memberships.map((m) => (
                    <DropdownMenuItem
                      key={m.restaurant_id}
                      onClick={() => {
                        setSelectedRestaurant(m.restaurant_id);
                        navigate({ to: "/app" });
                      }}
                      className={m.restaurant_id === restaurantId ? "bg-muted" : ""}
                    >
                      {m.restaurants?.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/app/admin"><Shield className="size-4 mr-2" /> Admin console</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <ThemeToggle />
            <button className="size-9 grid place-items-center rounded-lg border border-border bg-card hover:bg-muted">
              <Bell className="size-4" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-lg border border-border bg-card hover:bg-muted">
                  <div className="size-6 rounded-md bg-foreground text-background grid place-items-center text-[10px] font-bold">
                    {initials}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline max-w-[10ch] truncate">{user.email}</span>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="text-sm font-medium truncate">{user.email}</div>
                  <div className="text-xs text-muted-foreground">Signed in</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/app/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/staff/login" });
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="size-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-5 md:p-10">
          {restaurant && (restaurant as any).status === "pending" && (
            <div className="mb-6 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4 flex items-start gap-3 text-sm">
              <Clock className="size-4 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Cadastro em análise</p>
                <p className="text-muted-foreground mt-0.5">
                  Sua equipe já pode configurar tudo por aqui, mas o {restaurant.name} só aparece na vitrine pública e recebe reservas online depois que a equipe SeatFlow aprovar o cadastro.
                </p>
              </div>
            </div>
          )}
          {restaurant && (restaurant as any).status === "rejected" && (
            <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 flex items-start gap-3 text-sm">
              <TriangleAlert className="size-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Cadastro não aprovado</p>
                <p className="text-muted-foreground mt-0.5">
                  O cadastro do {restaurant.name} não foi aprovado e não aparece na vitrine pública. Fale com o suporte SeatFlow para entender os próximos passos.
                </p>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function RedirectTo({ to }: { to: string }) {
  const navigate = useNavigate();
  useEffect(() => { navigate({ to, replace: true }); }, [navigate, to]);
  return (
    <div className="min-h-screen grid place-items-center bg-canvas">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  );
}

