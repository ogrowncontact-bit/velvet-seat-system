import { createFileRoute } from "@tanstack/react-router";
import { reservations } from "@/lib/demo-data";

export const Route = createFileRoute("/app/bookings")({
  component: Bookings,
});

function Bookings() {
  return (
    <div className="space-y-8 max-w-[1400px]">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl italic">Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">All reservations across services</p>
        </div>
        <button className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 self-start md:self-auto">
          + New reservation
        </button>
      </header>

      <div className="flex gap-2 flex-wrap">
        {["All", "Confirmed", "Seated", "Pending", "Waitlist", "Cancelled"].map((f, i) => (
          <button
            key={f}
            className={`h-9 px-3 rounded-lg text-sm font-medium border ${
              i === 0 ? "bg-foreground text-background border-foreground" : "border-border bg-card hover:bg-muted"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left px-5 py-3">Time</th>
              <th className="text-left px-5 py-3">Guest</th>
              <th className="text-left px-5 py-3">Party</th>
              <th className="text-left px-5 py-3">Table</th>
              <th className="text-left px-5 py-3">Source</th>
              <th className="text-left px-5 py-3">Deposit</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reservations.map((r) => (
              <tr key={r.id} className="hover:bg-muted/40">
                <td className="px-5 py-4 font-mono text-xs">{r.time}</td>
                <td className="px-5 py-4">
                  <div className="font-medium">{r.guest}</div>
                  {r.notes && <div className="text-xs text-muted-foreground">{r.notes}</div>}
                </td>
                <td className="px-5 py-4">{r.party}</td>
                <td className="px-5 py-4 font-mono text-xs">{r.table}</td>
                <td className="px-5 py-4 text-muted-foreground">{r.source}</td>
                <td className="px-5 py-4">{r.deposit ? `$${r.deposit}` : <span className="text-muted-foreground">—</span>}</td>
                <td className="px-5 py-4">
                  <span className="rounded bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button className="text-xs font-medium text-accent hover:underline">Open</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
