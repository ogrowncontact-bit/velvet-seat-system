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
  const completed = inWeek.filter((r) => r.status === "completed").length;
  const noShow = inWeek.filter((r) => r.status === "no_show").length;
  const cancelled = inWeek.filter((r) => r.status === "cancelled").length;
  const closed = completed + noShow + cancelled;
  const showRate = closed ? Math.round((completed / closed) * 100 * 10) / 10 : 0;
  const noShowRate = closed ? Math.round((noShow / closed) * 100 * 10) / 10 : 0;
  const cancelRate = closed ? Math.round((cancelled / closed) * 100 * 10) / 10 : 0;
  const avgParty = inWeek.length ? Math.round((covers / inWeek.length) * 10) / 10 : 0;

  // Top offenders (last 90 days)
  const ninety = new Date(now); ninety.setDate(now.getDate() - 90);
  const recent = all.filter((r) => new Date(r.reserved_at) >= ninety);
  const offenderMap = new Map<string, { name: string; phone: string | null; no_shows: number; total: number }>();
  recent.forEach((r: any) => {
    const key = r.customers?.full_name ?? r.guest_name ?? r.guest_phone ?? "Guest";
    const prev = offenderMap.get(key) ?? { name: key, phone: r.guest_phone ?? null, no_shows: 0, total: 0 };
    prev.total += 1;
    if (r.status === "no_show") prev.no_shows += 1;
    offenderMap.set(key, prev);
  });
  const offenders = Array.from(offenderMap.values())
    .filter((o) => o.no_shows > 0)
    .sort((a, b) => b.no_shows - a.no_shows)
    .slice(0, 8);

  // Bookings by hour
  const byHour: Record<number, number> = {};
  inWeek.forEach((r) => { const h = new Date(r.reserved_at).getHours(); byHour[h] = (byHour[h] ?? 0) + 1; });
  const hourly = Array.from({ length: 8 }, (_, i) => ({ label: `${16 + i}`, value: byHour[16 + i] ?? 0 }));

  // By day
  const byDay: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
    byDay[d.toDateString()] = 0;
  }
  inWeek.forEach((r) => { const k = new Date(r.reserved_at).toDateString(); if (k in byDay) byDay[k]++; });
  const weekly = Object.entries(byDay).map(([k, v]) => ({ label: new Date(k).toLocaleDateString([], { weekday: "short" }), value: v }));

  const kpis = [
    { label: "Show rate", value: `${showRate}%` },
    { label: "No-show rate", value: `${noShowRate}%` },
    { label: "Cancel rate", value: `${cancelRate}%` },
    { label: "Avg party", value: avgParty.toString() },
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
