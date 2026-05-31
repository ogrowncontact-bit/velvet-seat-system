import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarClock,
  LayoutGrid,
  Users,
  Clock,
  LineChart,
  CreditCard,
  Settings,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentRestaurant, useIsPlatformAdmin } from "@/hooks/use-current-restaurant";

const nav = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/app/floor-plan", label: "Floor plan", icon: LayoutGrid },
  { to: "/app/bookings", label: "Bookings", icon: CalendarClock },
  { to: "/app/waitlist", label: "Waitlist", icon: Clock },
  { to: "/app/customers", label: "Guests", icon: Users },
  { to: "/app/analytics", label: "Analytics", icon: LineChart },
  { to: "/app/billing", label: "Billing", icon: CreditCard },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { restaurant } = useCurrentRestaurant();
  const { data: isAdmin } = useIsPlatformAdmin();



  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <Link to="/" className="font-serif text-2xl tracking-tight">
          SeatFlow
        </Link>
      </div>

      <div className="px-3 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <div className="size-8 rounded-md bg-foreground text-background grid place-items-center text-xs font-semibold tnum">
            {(restaurant?.name ?? "—").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{restaurant?.name ?? "No venue yet"}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {restaurant?.currency ?? "—"} · {restaurant?.timezone?.split("/")?.[1] ?? "—"}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const active = item.exact ? path === item.to : path === item.to || path.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-sidebar-accent text-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-2xl border border-sidebar-border bg-card p-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">
          Pro tip
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[10px]">⌘ K</kbd> to jump anywhere.
        </p>
      </div>
    </aside>
  );
}
