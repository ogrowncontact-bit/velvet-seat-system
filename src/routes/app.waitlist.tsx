import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/waitlist")({
  component: Waitlist,
});

const waitlist = [
  { name: "Sarah Jenkins", party: 2, since: "20 min", phone: "+34 612 ···", status: "Notified" },
  { name: "R. Petrov", party: 4, since: "12 min", phone: "+34 698 ···", status: "Waiting" },
  { name: "Y. Tanaka", party: 3, since: "8 min", phone: "+34 645 ···", status: "Waiting" },
  { name: "Whitney Hale", party: 2, since: "3 min", phone: "+34 671 ···", status: "Waiting" },
];

export default function _() {}

function Waitlist() {
  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="font-serif text-4xl md:text-5xl italic">Waitlist</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Parties auto-notified by WhatsApp the moment a table opens.
        </p>
      </header>

      <div className="rounded-3xl border border-border bg-card divide-y divide-border">
        {waitlist.map((w) => (
          <div key={w.name} className="flex items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="size-10 rounded-full bg-muted grid place-items-center text-sm font-medium">
                {w.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="font-medium truncate">{w.name}</div>
                <div className="text-xs text-muted-foreground">
                  {w.party} guests · waiting {w.since} · {w.phone}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${w.status === "Notified" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
                {w.status}
              </span>
              <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-foreground text-background hover:opacity-90">
                Seat now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
