import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bell, ChevronDown, Loader2, Menu, Search, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCurrentRestaurant } from "@/hooks/use-current-restaurant";
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
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: memberships, isLoading: loadingMemberships } = useCurrentRestaurant();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [user, loading, navigate]);

  if (loading || !user || loadingMemberships) {
    return (
      <div className="min-h-screen grid place-items-center bg-canvas">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No restaurant yet → onboarding
  if (!memberships || memberships.length === 0) {
    return <OnboardingScreen />;
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
                    navigate({ to: "/login" });
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
          <Outlet />
        </main>
      </div>
    </div>
  );
}
