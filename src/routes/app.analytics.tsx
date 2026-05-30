import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCurrentRestaurant } from "@/hooks/use-current-restaurant";
import { fetchReservations, qk } from "@/lib/queries";

export const Route = createFileRoute("/app/analytics")({ component: Analytics });

function Analytics() {
  const { restaurantId } = useCurrentRestaurant();
  const reservations = useQuery({ queryKey: qk.reservations(restaurantId ?? ""), queryFn: () => fetchReservations(restaurantId!), enabled: !!restaurantId });
  const all = reservations.data ?? [];

  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6); weekStart.setHours(0,0,0,0);
  const inWeek = all.filter((r) => new Date(r.reserved_at) >= weekStart);
  const covers = inWeek.reduce((s, r) => s + r.party_size, 0);
  const noShow = inWeek.filter((r) => r.status === "no_show").length;
  const noShowRate = inWeek.length ? Math.round((noShow / inWeek.length) * 100 * 10) / 10 : 0;
  const avgParty = inWeek.length ? Math.round((covers / inWeek.length) * 10) / 10 : 0;

  // Bookings by hour
  const byHour: Record<number, number> = {};
  inWeek.forEach((r) => { const h = new Date(r.reserved_at).getHours(); byHour[h] = (byHour[h] ?? 0) + 1; });
  const hourly = Array.from({ length: 8 }, (_, i) => ({ hour: `${16 + i}`, value: byHour[16 + i] ?? 0 }));

  // By day
  const byDay: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
    byDay[d.toDateString()] = 0;
  }
  inWeek.forEach((r) => { const k = new Date(r.reserved_at).toDateString(); if (k in byDay) byDay[k]++; });
  const weekly = Object.entries(byDay).map(([k, v]) => ({ label: new Date(k).toLocaleDateString([], { weekday: "short" }), value: v }));

  const kpis = [
    { label: "Covers this week", value: covers.toString() },
    { label: "Reservations", value: inWeek.length.toString() },
    { label: "Avg party size", value: avgParty.toString() },
    { label: "No-show rate", value: `${noShowRate}%` },
  ];

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto animate-fade-in">
      <header>
        <h1 className="font-serif text-4xl md:text-5xl italic">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last 7 days</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{k.label}</p>
            <div className="mt-3 font-serif text-4xl italic tnum">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-medium mb-1">Bookings by day</h2>
          <p className="text-xs text-muted-foreground mb-6">Last 7 days</p>
          <Bars data={weekly} />
        </section>
        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-medium mb-1">Bookings by hour</h2>
          <p className="text-xs text-muted-foreground mb-6">When your service peaks</p>
          <Bars data={hourly} accent />
        </section>
      </div>
    </div>
  );
}

function Bars({ data, accent = false }: { data: { label: string; value: number }[]; accent?: boolean }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-3 h-44">
      {data.map((d, i) => {
        const h = (d.value / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex-1 flex items-end">
              <div className={`w-full rounded-t-md transition-all ${accent ? "bg-accent/70" : "bg-foreground/80"}`} style={{ height: `${h}%`, minHeight: d.value ? "4px" : "0" }} />
            </div>
            <span className="text-[10px] text-muted-foreground tnum">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
