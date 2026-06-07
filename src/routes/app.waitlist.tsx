import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useCurrentRestaurant } from "@/hooks/use-current-restaurant";
import { fetchWaitlist, fetchWaitlistHistory, qk } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2, BellRing, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/waitlist")({ component: Waitlist });

function Waitlist() {
  const qc = useQueryClient();
  const { restaurantId, restaurant } = useCurrentRestaurant();
  const list = useQuery({
    queryKey: qk.waitlist(restaurantId ?? ""),
    queryFn: () => fetchWaitlist(restaurantId!),
    enabled: !!restaurantId,
    refetchInterval: 15_000,
  });
  const history = useQuery({
    queryKey: [...qk.waitlist(restaurantId ?? ""), "history"],
    queryFn: () => fetchWaitlistHistory(restaurantId!),
    enabled: !!restaurantId,
  });

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [party, setParty] = useState(2);
  const [busy, setBusy] = useState(false);

  // Auto expire stale offers every 30s
  useEffect(() => {
    if (!restaurantId) return;
    const t = setInterval(async () => {
      await supabase.rpc("expire_stale_waitlist_offers", { _restaurant_id: restaurantId });
      qc.invalidateQueries({ queryKey: qk.waitlist(restaurantId) });
    }, 30_000);
    return () => clearInterval(t);
  }, [restaurantId, qc]);

  const waiting = (list.data ?? []).filter((w) => w.status === "waiting");
  const offered = (list.data ?? []).filter((w) => w.status === "offered");

  // Estimate wait time per position (simplified: 20 min per group ahead)
  const avgTurnMin = 20;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    setBusy(true);
    const estimated = waiting.length * avgTurnMin + avgTurnMin;
    const { error } = await supabase.from("waitlist").insert({
      restaurant_id: restaurantId,
      guest_name: name,
      guest_phone: phone || null,
      party_size: party,
      estimated_minutes: estimated,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setName(""); setPhone(""); setParty(2); setAdding(false);
    toast.success(`${name} added — position ${waiting.length + 1}, ~${estimated} min`);
    qc.invalidateQueries({ queryKey: qk.waitlist(restaurantId) });
  };

  const offerNext = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("promote_next_waitlist", { _restaurant_id: restaurantId! });
      if (error) throw error;
      return data;
    },
    onSuccess: (row: any) => {
      if (!row) return toast.info("No one in the queue");
      toast.success(`Offered to ${row.guest_name} — ${restaurant?.offer_timeout_minutes ?? 10} min to respond`);
      qc.invalidateQueries({ queryKey: qk.waitlist(restaurantId ?? "") });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const patch: any = { status };
      if (status === "seated") patch.seated_at = new Date().toISOString();
      const { error } = await supabase.from("waitlist").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_v, vars) => {
      toast.success(vars.status === "seated" ? "Party seated" : `Marked ${vars.status}`);
      qc.invalidateQueries({ queryKey: qk.waitlist(restaurantId ?? "") });
      qc.invalidateQueries({ queryKey: [...qk.waitlist(restaurantId ?? ""), "history"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl italic">Waitlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {waiting.length} waiting · {offered.length} offered · avg ~{avgTurnMin} min per turn
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => offerNext.mutate()}
            disabled={!waiting.length || offerNext.isPending}
            className="h-10 px-4 rounded-lg border border-border bg-card text-sm font-medium inline-flex items-center gap-2 disabled:opacity-40"
          >
            <BellRing className="size-4" /> Offer next slot
          </button>
          <button onClick={() => setAdding((v) => !v)} className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium inline-flex items-center gap-2">
            <Plus className="size-4" /> Add party
          </button>
        </div>
      </header>

      {adding && (
        <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="h-10 px-3 rounded-lg border border-border bg-background text-sm sm:col-span-2" />
          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 px-3 rounded-lg border border-border bg-background text-sm" />
          <input type="number" min={1} max={50} value={party} onChange={(e) => setParty(parseInt(e.target.value) || 1)} className="h-10 px-3 rounded-lg border border-border bg-background text-sm tnum" />
          <button disabled={busy} className="h-10 rounded-lg bg-foreground text-background text-sm font-medium sm:col-span-4 inline-flex items-center justify-center gap-2">
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Add to waitlist"}
          </button>
        </form>
      )}

      {offered.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Offered — awaiting response</h2>
          <div className="rounded-3xl border border-accent/30 bg-accent/5 divide-y divide-border">
            {offered.map((w) => (
              <OfferedRow
                key={w.id}
                row={w}
                onAccept={() => updateStatus.mutate({ id: w.id, status: "seated" })}
                onDecline={() => updateStatus.mutate({ id: w.id, status: "cancelled" })}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Queue</h2>
        <div className="rounded-3xl border border-border bg-card divide-y divide-border">
          {waiting.length > 0 ? waiting.map((w, idx) => (
            <QueueRow
              key={w.id}
              row={w}
              position={idx + 1}
              estimateMin={(idx + 1) * avgTurnMin}
              onSeat={() => updateStatus.mutate({ id: w.id, status: "seated" })}
              onRemove={() => updateStatus.mutate({ id: w.id, status: "cancelled" })}
            />
          )) : (
            <div className="py-16 text-center">
              <p className="font-serif text-2xl italic">No one waiting</p>
              <p className="text-sm text-muted-foreground mt-2">Add a walk-in party when they arrive.</p>
            </div>
          )}
        </div>
      </section>

      {history.data && history.data.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Recent history</h2>
          <div className="rounded-3xl border border-border bg-card divide-y divide-border">
            {history.data.slice(0, 10).map((w) => (
              <div key={w.id} className="px-5 py-3 text-sm flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-medium truncate">{w.guest_name}</div>
                  <div className="text-xs text-muted-foreground tnum">{w.party_size} guests · {new Date(w.updated_at).toLocaleString()}</div>
                </div>
                <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  w.status === "seated" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : w.status === "expired" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                  : "bg-muted text-muted-foreground"
                }`}>{w.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function QueueRow({ row, position, estimateMin, onSeat, onRemove }: any) {
  const waiting = Math.round((Date.now() - new Date(row.created_at).getTime()) / 60000);
  return (
    <div className="flex items-center justify-between gap-4 p-5">
      <div className="flex items-center gap-4 min-w-0">
        <div className="size-10 rounded-full bg-muted grid place-items-center text-sm font-medium tnum">#{position}</div>
        <div className="min-w-0">
          <div className="font-medium truncate">{row.guest_name}</div>
          <div className="text-xs text-muted-foreground tnum">
            {row.party_size} guests · waiting {waiting} min · est. wait ~{estimateMin} min{row.guest_phone ? ` · ${row.guest_phone}` : ""}
          </div>
        </div>
      </div>
      <div className="flex gap-1.5">
        <button onClick={onSeat} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-foreground text-background hover:opacity-90">Seat</button>
        <button onClick={onRemove} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted">Remove</button>
      </div>
    </div>
  );
}

function OfferedRow({ row, onAccept, onDecline }: any) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const deadline = row.response_deadline ? new Date(row.response_deadline).getTime() : 0;
  const secsLeft = Math.max(0, Math.round((deadline - now) / 1000));
  const m = Math.floor(secsLeft / 60); const s = secsLeft % 60;
  return (
    <div className="flex items-center justify-between gap-4 p-5">
      <div className="flex items-center gap-4 min-w-0">
        <div className="size-10 rounded-full bg-accent/20 text-accent grid place-items-center"><BellRing className="size-4" /></div>
        <div className="min-w-0">
          <div className="font-medium truncate">{row.guest_name}</div>
          <div className="text-xs text-muted-foreground tnum flex items-center gap-1.5">
            <Clock className="size-3" />
            {secsLeft > 0 ? `${m}:${s.toString().padStart(2, "0")} to respond` : "Expired"}
            {row.guest_phone ? ` · ${row.guest_phone}` : ""}
          </div>
        </div>
      </div>
      <div className="flex gap-1.5">
        <button onClick={onAccept} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:opacity-90 inline-flex items-center gap-1.5"><Check className="size-3" /> Seated</button>
        <button onClick={onDecline} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted inline-flex items-center gap-1.5"><X className="size-3" /> Cancel</button>
      </div>
    </div>
  );
}
