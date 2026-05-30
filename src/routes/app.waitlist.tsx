import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCurrentRestaurant } from "@/hooks/use-current-restaurant";
import { fetchWaitlist, qk } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/waitlist")({ component: Waitlist });

function Waitlist() {
  const qc = useQueryClient();
  const { restaurantId } = useCurrentRestaurant();
  const list = useQuery({ queryKey: qk.waitlist(restaurantId ?? ""), queryFn: () => fetchWaitlist(restaurantId!), enabled: !!restaurantId });
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [party, setParty] = useState(2);
  const [mins, setMins] = useState(15);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    setBusy(true);
    const { error } = await supabase.from("waitlist").insert({
      restaurant_id: restaurantId, guest_name: name, guest_phone: phone || null, party_size: party, estimated_minutes: mins,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setName(""); setPhone(""); setParty(2); setMins(15); setAdding(false);
    qc.invalidateQueries({ queryKey: qk.waitlist(restaurantId) });
  };

  const seat = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("waitlist").update({ status: "seated" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Party seated"); qc.invalidateQueries({ queryKey: qk.waitlist(restaurantId ?? "") }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-fade-in">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl italic">Waitlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">Walk-ins, parties waiting for a table.</p>
        </div>
        <button onClick={() => setAdding((v) => !v)} className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium inline-flex items-center gap-2">
          <Plus className="size-4" /> Add party
        </button>
      </header>

      {adding && (
        <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="h-10 px-3 rounded-lg border border-border bg-background text-sm sm:col-span-2" />
          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 px-3 rounded-lg border border-border bg-background text-sm" />
          <input type="number" min={1} value={party} onChange={(e) => setParty(parseInt(e.target.value))} className="h-10 px-3 rounded-lg border border-border bg-background text-sm tnum" />
          <input type="number" min={5} step={5} value={mins} onChange={(e) => setMins(parseInt(e.target.value))} className="h-10 px-3 rounded-lg border border-border bg-background text-sm tnum" />
          <button disabled={busy} className="h-10 rounded-lg bg-foreground text-background text-sm font-medium sm:col-span-5 inline-flex items-center justify-center gap-2">
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Add to waitlist"}
          </button>
        </form>
      )}

      <div className="rounded-3xl border border-border bg-card divide-y divide-border">
        {list.data && list.data.length > 0 ? list.data.map((w) => {
          const waiting = Math.round((Date.now() - new Date(w.created_at).getTime()) / 60000);
          return (
            <div key={w.id} className="flex items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-4 min-w-0">
                <div className="size-10 rounded-full bg-muted grid place-items-center text-sm font-medium">
                  {w.guest_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{w.guest_name}</div>
                  <div className="text-xs text-muted-foreground tnum">{w.party_size} guests · waiting {waiting} min · est. {w.estimated_minutes} min{w.guest_phone ? ` · ${w.guest_phone}` : ""}</div>
                </div>
              </div>
              <button onClick={() => seat.mutate(w.id)} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-foreground text-background hover:opacity-90">
                Seat now
              </button>
            </div>
          );
        }) : (
          <div className="py-16 text-center">
            <p className="font-serif text-2xl italic">No one waiting</p>
            <p className="text-sm text-muted-foreground mt-2">Add a walk-in party when they arrive.</p>
          </div>
        )}
      </div>
    </div>
  );
}
