import { createFileRoute } from "@tanstack/react-router";
import { hourlyBookings, weekRevenue } from "@/lib/demo-data";

export const Route = createFileRoute("/app/analytics")({
  component: Analytics,
});

function Analytics() {
  const kpis = [
    { label: "Covers this week", value: "1,284", delta: "+18%" },
    { label: "Avg party size", value: "3.4", delta: "+0.2" },
    { label: "Repeat guests", value: "62%", delta: "+4pts" },
    { label: "No-show rate", value: "1.1%", delta: "−0.6pts" },
  ];

  return (
    <div className="space-y-8 max-w-[1400px]">
      <header>
        <h1 className="font-serif text-4xl md:text-5xl italic">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Week of October 21 — 27</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{k.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight">{k.value}</span>
              <span className="text-xs font-medium text-success">{k.delta}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-medium mb-1">Revenue by day</h2>
          <p className="text-xs text-muted-foreground mb-6">Friday peak · $14,200 forecast for Saturday</p>
          <Bars data={weekRevenue.map((d) => ({ label: d.day, value: d.value }))} />
        </section>

        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-medium mb-1">Bookings by hour</h2>
          <p className="text-xs text-muted-foreground mb-6">20:00 remains your busiest slot</p>
          <Bars data={hourlyBookings.map((d) => ({ label: d.hour, value: d.value }))} accent />
        </section>
      </div>

      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-medium mb-5">Reservation sources</h2>
        <div className="space-y-3">
          {[
            { label: "Booking widget", pct: 48 },
            { label: "Google Reserve", pct: 22 },
            { label: "Instagram bio link", pct: 14 },
            { label: "Phone", pct: 10 },
            { label: "Walk-in", pct: 6 },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-4">
              <div className="w-44 text-sm">{s.label}</div>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-foreground" style={{ width: `${s.pct}%` }} />
              </div>
              <div className="w-12 text-right text-sm font-medium">{s.pct}%</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Bars({ data, accent = false }: { data: { label: string; value: number }[]; accent?: boolean }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-3 h-48">
      {data.map((d, i) => {
        const h = (d.value / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex-1 flex items-end">
              <div
                className={`w-full rounded-t-md ${accent ? "bg-accent" : "bg-foreground/80"}`}
                style={{ height: `${h}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
