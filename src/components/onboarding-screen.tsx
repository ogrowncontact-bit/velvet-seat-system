import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { qk } from "@/lib/queries";

const TZS = ["UTC", "America/New_York", "America/Los_Angeles", "America/Sao_Paulo", "Europe/London", "Europe/Madrid", "Europe/Paris", "Asia/Tokyo", "Asia/Dubai"];
const CURRENCIES = ["USD", "EUR", "GBP", "BRL", "JPY", "AED"];

export function OnboardingScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [timezone, setTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { data: r, error: e1 } = await supabase
        .from("restaurants")
        .insert({ name, timezone, currency, created_by: user.id })
        .select()
        .single();
      if (e1 || !r) throw e1 ?? new Error("Failed to create");

      const { error: e2 } = await supabase
        .from("restaurant_members")
        .insert({ restaurant_id: r.id, user_id: user.id, role: "owner" });
      if (e2) throw e2;

      // Seed default room
      await supabase.from("rooms").insert({ restaurant_id: r.id, name: "Main dining room", sort_order: 0 });

      await qc.invalidateQueries({ queryKey: qk.myRestaurants });
      toast.success(`${name} is live.`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create restaurant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-canvas">
      <div className="flex flex-col p-8 md:p-14">
        <div className="font-serif text-2xl">SeatFlow</div>
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs mb-6">
              <Sparkles className="size-3 text-accent" />
              Step 1 of 1 · Set up your venue
            </div>
            <h1 className="font-serif text-4xl md:text-5xl italic leading-tight mb-3">
              Let's name your restaurant.
            </h1>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              You can add tables, rooms, and your team in the next moments. Everything is editable later from Settings.
            </p>
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Restaurant name</label>
                <input
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Lumière, Madrid"
                  className="mt-2 w-full h-11 px-3.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Timezone</label>
                  <select value={timezone} onChange={(e) => setTz(e.target.value)} className="mt-2 w-full h-11 px-3 rounded-xl border border-border bg-card text-sm">
                    {TZS.map((tz) => <option key={tz}>{tz}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-2 w-full h-11 px-3 rounded-xl border border-border bg-card text-sm">
                    {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full h-12 rounded-xl bg-foreground text-background text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <>Open my dashboard <ArrowRight className="size-4" /></>}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 grid-dots opacity-10" />
        <div className="m-auto max-w-md p-12 relative">
          <h2 className="font-serif text-4xl italic leading-tight mb-6">
            A calm operating system for the dining room.
          </h2>
          <p className="text-background/70 leading-relaxed">
            One place for reservations, the floor plan, your guests, and your service. Designed to disappear into your night.
          </p>
        </div>
      </div>
    </div>
  );
}
