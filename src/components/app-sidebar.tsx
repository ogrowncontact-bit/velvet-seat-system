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
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/app/floor-plan", label: "Floor Plan", icon: LayoutGrid },
  { to: "/app/bookings", label: "Bookings", icon: CalendarClock },
  { to: "/app/waitlist", label: "Waitlist", icon: Clock },
  { to: "/app/customers", label: "Guests", icon: Users },
  { to: "/app/analytics", label: "Analytics", icon: LineChart },
  { to: "/app/billing", label: "Billing", icon: CreditCard },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link to="/" className="font-serif text-2xl font-medium tracking-tight">
          SeatFlow
        </Link>
      </div>

      <div className="px-3 py-4 border-b border-border">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted transition-colors">
          <div className="size-7 rounded-md bg-foreground text-background grid place-items-center text-[10px] font-bold">
            LV
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">Lumière, Madrid</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Switch venue
            </div>
          </div>
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = item.exact ? path === item.to : path.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-2xl border border-border bg-muted/40 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="size-4 text-accent" />
          <span className="text-xs font-semibold">AI Assistant</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          Tonight is trending +18% vs. last Friday. Open 2 extra tables at 20:30?
        </p>
        <button className="w-full text-xs font-medium rounded-md bg-foreground text-background py-1.5 hover:opacity-90">
          Review suggestion
        </button>
      </div>
    </aside>
  );
}
