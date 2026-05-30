import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Calendar } from "lucide-react";
import { useCurrentRestaurant } from "@/hooks/use-current-restaurant";
import { fetchTables, fetchTodayReservations, fetchActivity, qk } from "@/lib/queries";
import { TableTile } from "@/components/table-tile";

export const Route = createFileRoute("/app/")({ component: Dashboard });

function Dashboard() {
  const { restaurantId, restaurant } = useCurrentRestaurant();
  const tables = useQuery({ queryKey: qk.tables(restaurantId ?? ""), queryFn: () => fetchTables(restaurantId!), enabled: !!restaurantId });
  const today = useQuery({ queryKey: qk.todayReservations(restaurantId ?? ""), queryFn: () => fetchTodayReservations(restaurantId!), enabled: !!restaurantId });
  const activity = useQuery({ queryKey: qk.activity(restaurantId ?? ""), queryFn: () => fetchActivity(restaurantId!), enabled: !!restaurantId });

  const occupied = tables.data?.filter((t) => t.status === "occupied").length ?? 0;
  const total = tables.data?.length ?? 0;
  const occupancy = total ? Math.round((occupied / total) * 100) : 0;
  const todayCount = today.data?.length ?? 0;
  const confirmed = today.data?.filter((r) => r.status === "confirmed" || r.status === "seated").length ?? 0;
  const covers = today.data?.reduce((s, r) => s + (r.party_size ?? 0), 0) ?? 0;

  const stats = [
    { label: "Occupancy", value: `${occupancy}%`, sub: `${occupied}/${total} tables` },
    { label: "Reservations today", value: todayCount.toString(), sub: `${confirmed} confirmed` },
    { label: "Covers booked", value: covers.toString(), sub: "across all services" },
    { label: "Tables online", value: total.toString(), sub: "configured in venue" },
  ];

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="font-serif text-4xl md:text-5xl italic">{restaurant?.name ?? "Overview"}</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/app/floor-plan" className="h-10 px-4 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted inline-flex items-center gap-2">
            Floor plan <ArrowUpRight className="size-3.5" />
          </Link>
          <Link to="/app/bookings" className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 inline-flex items-center gap-2">
            New reservation
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
            <div className="mt-3 font-serif text-4xl italic tnum">{s.value}</div>
            <p className="text-xs text-muted-foreground mt-2">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-medium">Floor at a glance</h2>
              <Link to="/app/floor-plan" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                Open <ArrowUpRight className="size-3" />
              </Link>
            </div>
            {tables.data && tables.data.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {tables.data.slice(0, 10).map((t) => (
                  <TableTile key={t.id} label={t.label} status={t.status} seats={t.seats} shape={t.shape as any} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No tables yet"
                body="Add your first table from the floor plan editor."
                cta={<Link to="/app/floor-plan" className="text-sm font-medium text-accent">Set up floor plan →</Link>}
              />
            )}
          </section>

          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-medium">Today's reservations</h2>
              <Link to="/app/bookings" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                View all <ArrowUpRight className="size-3" />
              </Link>
            </div>
            {today.data && today.data.length > 0 ? (
              <div className="divide-y divide-border">
                {today.data.slice(0, 8).map((r) => (
                  <div key={r.id} className="flex items-center gap-4 py-3 text-sm">
                    <div className="font-mono text-xs w-14 text-muted-foreground tnum">{new Date(r.reserved_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{r.guest_name}</div>
                      {r.notes && <div className="text-xs text-muted-foreground truncate">{r.notes}</div>}
                    </div>
                    <div className="text-xs text-muted-foreground w-16 tnum">{r.party_size} guests</div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No reservations today"
                body="Once bookings come in through your widget or staff, they'll appear here in real time."
                cta={<Link to="/book" className="text-sm font-medium text-accent">Open booking widget →</Link>}
              />
            )}
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-5">Live activity</h2>
            {activity.data && activity.data.length > 0 ? (
              <div className="relative space-y-5 before:absolute before:top-2 before:left-[11px] before:h-[calc(100%-1rem)] before:w-px before:bg-border">
                {activity.data.map((a) => (
                  <div key={a.id} className="relative flex gap-4">
                    <div className="z-10 mt-1 size-6 rounded-full bg-muted border-2 border-card" />
                    <div>
                      <p className="text-sm leading-snug">{a.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">A live feed of every confirmation, cancellation, seating and check-out will appear here.</p>
            )}
          </section>

          <section className="rounded-3xl bg-foreground text-background p-6">
            <Calendar className="size-5 mb-3" />
            <h2 className="font-serif text-2xl italic leading-tight mb-2">Quietly intelligent.</h2>
            <p className="text-sm text-background/70 leading-relaxed mb-4">
              SeatFlow learns your service rhythm to surface only what needs attention.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: "bg-accent/15 text-foreground border border-accent/30",
    seated: "bg-foreground text-background",
    pending: "bg-warning/15 text-warning-foreground border border-warning/30",
    completed: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/10 text-destructive",
    no_show: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider w-24 text-center ${map[status] ?? "bg-muted"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function EmptyState({ title, body, cta }: { title: string; body: string; cta?: React.ReactNode }) {
  return (
    <div className="py-12 text-center">
      <p className="font-serif text-xl italic">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{body}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}
