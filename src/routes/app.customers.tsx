import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useCurrentRestaurant } from "@/hooks/use-current-restaurant";
import { fetchCustomers, qk } from "@/lib/queries";

export const Route = createFileRoute("/app/customers")({ component: Customers });

function Customers() {
  const { restaurantId, restaurant } = useCurrentRestaurant();
  const [q, setQ] = useState("");
  const customers = useQuery({ queryKey: qk.customers(restaurantId ?? ""), queryFn: () => fetchCustomers(restaurantId!), enabled: !!restaurantId });

  const filtered = customers.data?.filter((c) => c.full_name.toLowerCase().includes(q.toLowerCase())) ?? [];

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl italic">Guests</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every guest, every preference, every visit.</p>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guests…" className="h-10 px-3.5 w-full md:w-72 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
      </header>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <div key={g.id} className="rounded-3xl border border-border bg-card p-6 hover:shadow-elevated transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-full bg-foreground text-background grid place-items-center text-sm font-medium">
                    {g.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-medium">{g.full_name}</div>
                    <div className="text-xs text-muted-foreground tnum">{g.visits_count} visits</div>
                  </div>
                </div>
                {g.is_vip && <span className="rounded bg-accent/20 text-accent px-2 py-1 text-[10px] font-bold uppercase tracking-wider">VIP</span>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Lifetime</div>
                  <div className="font-serif text-xl italic tnum">{restaurant?.currency ?? "$"} {Number(g.lifetime_value).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Last visit</div>
                  <div className="font-serif text-xl italic">{g.last_visit_at ? new Date(g.last_visit_at).toLocaleDateString() : "—"}</div>
                </div>
              </div>
              {g.notes && <p className="text-xs text-muted-foreground mt-4 line-clamp-2">{g.notes}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card py-20 text-center">
          <p className="font-serif text-2xl italic">{q ? "No guests match" : "No guests yet"}</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">{q ? "Try another search." : "Guests are added automatically when reservations are made."}</p>
        </div>
      )}
    </div>
  );
}
