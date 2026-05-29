import { createFileRoute, Link } from "@tanstack/react-router";
import { stats, floorTables, vipGuests, activity, reservations, weekRevenue } from "@/lib/demo-data";
import { TableTile } from "@/components/table-tile";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="space-y-8 max-w-[1600px]">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl italic">Service overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Friday, October 24 · Dinner service</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-10 px-4 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted">
            Export logs
          </button>
          <Link
            to="/app/bookings"
            className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 inline-flex items-center"
          >
            + New reservation
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              {s.label}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight">{s.value}</span>
              <span className="text-xs font-medium text-success">{s.delta}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-medium">Main dining room</h2>
              <Link to="/app/floor-plan" className="text-xs font-medium text-accent inline-flex items-center gap-1 hover:underline">
                Open floor plan <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {floorTables.slice(0, 8).map((t) => (
                <TableTile key={t.id} {...t} />
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-medium">Tonight's reservations</h2>
              <Link to="/app/bookings" className="text-xs font-medium text-accent inline-flex items-center gap-1 hover:underline">
                View all <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {reservations.slice(0, 6).map((r) => (
                <div key={r.id} className="flex items-center gap-4 py-3 text-sm">
                  <div className="font-mono text-xs w-12 text-muted-foreground">{r.time}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{r.guest}</div>
                    {r.notes && <div className="text-xs text-muted-foreground truncate">{r.notes}</div>}
                  </div>
                  <div className="text-xs text-muted-foreground w-16">{r.party} guests</div>
                  <div className="text-xs font-mono w-16">{r.table}</div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-medium mb-5">Weekly revenue</h2>
            <RevenueChart />
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Upcoming VIPs
            </h2>
            <div className="space-y-4">
              {vipGuests.slice(0, 4).map((g) => (
                <div key={g.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-full bg-muted grid place-items-center text-xs font-medium">
                      {g.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{g.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{g.next ?? `${g.visits} visits`}</p>
                    </div>
                  </div>
                  <span className="rounded bg-muted px-2 py-1 text-[9px] font-bold uppercase tracking-wider">
                    {g.tag}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Live activity
            </h2>
            <div className="relative space-y-5 before:absolute before:top-2 before:left-[11px] before:h-[calc(100%-1rem)] before:w-px before:bg-border">
              {activity.map((a) => (
                <div key={a.id} className="relative flex gap-4">
                  <div
                    className={`z-10 mt-1 size-6 rounded-full border-2 border-card ${
                      a.tone === "accent"
                        ? "bg-accent"
                        : a.tone === "primary"
                          ? "bg-foreground"
                          : a.tone === "success"
                            ? "bg-success"
                            : a.tone === "destructive"
                              ? "bg-destructive"
                              : "bg-muted"
                    }`}
                  />
                  <div>
                    <p className="text-sm leading-snug">{a.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: "bg-accent/10 text-accent",
    seated: "bg-foreground text-background",
    pending: "bg-warning/15 text-warning-foreground",
    cancelled: "bg-destructive/10 text-destructive",
    waitlist: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider w-24 text-center ${map[status]}`}>
      {status}
    </span>
  );
}

function RevenueChart() {
  const max = Math.max(...weekRevenue.map((d) => d.value));
  return (
    <div className="flex items-end gap-3 h-40">
      {weekRevenue.map((d) => {
        const h = (d.value / max) * 100;
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex-1 flex items-end">
              <div
                className={`w-full rounded-t-md ${d.day === "Fri" ? "bg-accent" : "bg-foreground/80"}`}
                style={{ height: `${h}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}
