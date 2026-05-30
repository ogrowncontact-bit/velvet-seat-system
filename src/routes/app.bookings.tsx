import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCurrentRestaurant } from "@/hooks/use-current-restaurant";
import { fetchReservations, fetchTables, qk } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import type { ReservationStatus } from "@/lib/demo-data";
import { toast } from "sonner";
import { Plus, X, Loader2 } from "lucide-react";

export const Route = createFileRoute("/app/bookings")({ component: Bookings });

const FILTERS: { label: string; value: ReservationStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Seated", value: "seated" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

function Bookings() {
  const qc = useQueryClient();
  const { restaurantId } = useCurrentRestaurant();
  const reservations = useQuery({ queryKey: qk.reservations(restaurantId ?? ""), queryFn: () => fetchReservations(restaurantId!), enabled: !!restaurantId });
  const tables = useQuery({ queryKey: qk.tables(restaurantId ?? ""), queryFn: () => fetchTables(restaurantId!), enabled: !!restaurantId });
  const [filter, setFilter] = useState<ReservationStatus | "all">("all");
  const [creating, setCreating] = useState(false);

  const filtered = reservations.data?.filter((r) => filter === "all" || r.status === filter) ?? [];

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReservationStatus }) => {
      const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.reservations(restaurantId ?? "") }),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl italic">Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every reservation, every service.</p>
        </div>
        <button onClick={() => setCreating(true)} className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 inline-flex items-center gap-2">
          <Plus className="size-4" /> New reservation
        </button>
      </header>

      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)} className={`h-9 px-3.5 rounded-lg text-sm font-medium transition-colors ${filter === f.value ? "bg-foreground text-background" : "bg-card border border-border hover:bg-muted"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-serif text-2xl italic">No reservations yet</p>
            <p className="text-sm text-muted-foreground mt-2">Create your first reservation or share your booking link.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">When</th>
                <th className="text-left px-5 py-3">Guest</th>
                <th className="text-left px-5 py-3">Party</th>
                <th className="text-left px-5 py-3">Table</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4 tnum">
                    <div className="font-mono text-xs">{new Date(r.reserved_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium">{r.guest_name}</div>
                    {r.guest_phone && <div className="text-xs text-muted-foreground">{r.guest_phone}</div>}
                  </td>
                  <td className="px-5 py-4 tnum">{r.party_size}</td>
                  <td className="px-5 py-4 font-mono text-xs">{(r as any).tables?.label ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      r.status === "confirmed" ? "bg-accent/15 border border-accent/30" :
                      r.status === "seated" ? "bg-foreground text-background" :
                      r.status === "pending" ? "bg-warning/15 text-warning-foreground" :
                      r.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {r.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {r.status === "pending" && <button onClick={() => updateStatus.mutate({ id: r.id, status: "confirmed" })} className="text-xs font-medium text-accent hover:underline mr-3">Confirm</button>}
                    {r.status === "confirmed" && <button onClick={() => updateStatus.mutate({ id: r.id, status: "seated" })} className="text-xs font-medium text-accent hover:underline mr-3">Seat</button>}
                    {r.status === "seated" && <button onClick={() => updateStatus.mutate({ id: r.id, status: "completed" })} className="text-xs font-medium text-accent hover:underline mr-3">Complete</button>}
                    {!["cancelled","completed","no_show"].includes(r.status) && <button onClick={() => updateStatus.mutate({ id: r.id, status: "cancelled" })} className="text-xs text-muted-foreground hover:text-destructive">Cancel</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {creating && <NewReservationDrawer onClose={() => setCreating(false)} restaurantId={restaurantId!} tables={tables.data ?? []} />}
    </div>
  );
}

function NewReservationDrawer({ onClose, restaurantId, tables }: { onClose: () => void; restaurantId: string; tables: any[] }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [party, setParty] = useState(2);
  const [when, setWhen] = useState(() => {
    const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [tableId, setTableId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("reservations").insert({
      restaurant_id: restaurantId,
      guest_name: name,
      guest_phone: phone || null,
      party_size: party,
      reserved_at: new Date(when).toISOString(),
      table_id: tableId || null,
      notes: notes || null,
      status: "confirmed",
      source: "staff",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Reservation created");
    qc.invalidateQueries({ queryKey: qk.reservations(restaurantId) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-card h-full p-8 overflow-y-auto animate-slide-in-right">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl italic">New reservation</h2>
          <button onClick={onClose}><X className="size-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Guest name"><input required value={name} onChange={(e) => setName(e.target.value)} className="input" /></Field>
          <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="+1 555…" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Party"><input type="number" min={1} max={50} required value={party} onChange={(e) => setParty(parseInt(e.target.value))} className="input tnum" /></Field>
            <Field label="Date & time"><input type="datetime-local" required value={when} onChange={(e) => setWhen(e.target.value)} className="input" /></Field>
          </div>
          <Field label="Table">
            <select value={tableId} onChange={(e) => setTableId(e.target.value)} className="input">
              <option value="">Auto-assign later</option>
              {tables.map((t) => <option key={t.id} value={t.id}>{t.label} · {t.seats} seats</option>)}
            </select>
          </Field>
          <Field label="Notes"><textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="input" placeholder="Allergies, occasion, preferences…" /></Field>
          <button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Create reservation"}
          </button>
        </form>
        <style>{`.input{width:100%;height:42px;padding:0 12px;border-radius:10px;border:1px solid var(--color-border);background:var(--color-background);font-size:14px}textarea.input{height:auto;padding:10px 12px}`}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
