import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { Bell, Search, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-canvas">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between gap-4 px-6 md:px-10 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="md:hidden">
            <Link to="/" className="font-serif text-xl font-medium">SeatFlow</Link>
          </div>
          <div className="hidden md:flex items-center gap-2 max-w-md flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                placeholder="Search reservations, guests, tables…"
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="size-9 grid place-items-center rounded-lg border border-border bg-card hover:bg-muted">
              <Bell className="size-4" />
            </button>
            <button className="flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-lg border border-border bg-card hover:bg-muted">
              <div className="size-6 rounded-md bg-accent text-accent-foreground grid place-items-center text-[10px] font-bold">
                CA
              </div>
              <span className="text-sm font-medium hidden sm:inline">Camille</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
