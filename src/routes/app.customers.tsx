import { createFileRoute } from "@tanstack/react-router";
import { vipGuests } from "@/lib/demo-data";

export const Route = createFileRoute("/app/customers")({
  component: Customers,
});

const extra = [
  { id: "g6", name: "Hartmann Group", tag: "Recurring" as const, visits: 5, spend: "$4,200" },
  { id: "g7", name: "Whitney Hale", tag: "VIP" as const, visits: 11, spend: "$2,950" },
  { id: "g8", name: "Park Family", tag: "Recurring" as const, visits: 6, spend: "$1,820" },
];

function Customers() {
  const all = [...vipGuests, ...extra];
  return (
    <div className="space-y-8 max-w-[1400px]">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl italic">Guests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every guest, every preference, every visit — at a glance.
          </p>
        </div>
        <input
          placeholder="Search guests…"
          className="h-10 px-3 w-full md:w-72 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {all.map((g) => (
          <div key={g.id} className="rounded-3xl border border-border bg-card p-6 hover:shadow-elevated transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-full bg-foreground text-background grid place-items-center text-sm font-medium">
                  {g.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div className="font-medium">{g.name}</div>
                  <div className="text-xs text-muted-foreground">{g.visits} visits</div>
                </div>
              </div>
              <span className="rounded bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
                {g.tag}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Lifetime</div>
                <div className="font-serif text-xl italic">{g.spend}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Avg party</div>
                <div className="font-serif text-xl italic">{Math.max(2, Math.floor(g.visits / 4))}</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 h-9 rounded-lg border border-border bg-card text-xs font-medium hover:bg-muted">
                Profile
              </button>
              <button className="flex-1 h-9 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90">
                Book again
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
