import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCurrentRestaurant } from "@/hooks/use-current-restaurant";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, X, Loader2, Trash2 } from "lucide-react";
import { hashPin, randomSalt } from "@/lib/pos";

export const Route = createFileRoute("/app/operators")({ component: OperatorsPage });

function OperatorsPage() {
  const qc = useQueryClient();
  const { restaurantId, role } = useCurrentRestaurant();
  const canManage = role === "owner" || role === "manager";

  const operators = useQuery({
    queryKey: ["staff_operators", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("staff_operators")
        .select("id, name, role, active, created_at")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [creating, setCreating] = useState(false);

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await (supabase as any)
        .from("staff_operators")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff_operators", restaurantId] }),
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("staff_operators").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff_operators", restaurantId] }),
    onError: (e: any) => toast.error(e.message),
  });

  if (!canManage) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Only owners and managers can manage PIN operators.
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1000px] mx-auto animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl italic">Staff PINs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quick-login operators for the cashier and floor — waiters, runners, bartenders.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium inline-flex items-center gap-2"
        >
          <Plus className="size-4" /> New operator
        </button>
      </header>

      <div className="rounded-3xl border border-border bg-card overflow-hidden">
        {(operators.data ?? []).length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-serif text-2xl italic">No operators yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add waiters with a 4-digit PIN so they can open and update tabs on the cashier.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-5 py-3">Role</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(operators.data ?? []).map((op: any) => (
                <tr key={op.id} className="hover:bg-muted/30">
                  <td className="px-5 py-4 font-medium">{op.name}</td>
                  <td className="px-5 py-4 capitalize">{op.role}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        op.active ? "bg-accent/15" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {op.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => toggleActive.mutate({ id: op.id, active: !op.active })}
                      className="text-xs text-muted-foreground hover:text-foreground mr-3"
                    >
                      {op.active ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete operator ${op.name}?`)) remove.mutate(op.id);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="size-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {creating && (
        <NewOperatorDrawer
          restaurantId={restaurantId!}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            qc.invalidateQueries({ queryKey: ["staff_operators", restaurantId] });
          }}
        />
      )}
    </div>
  );
}

function NewOperatorDrawer({
  restaurantId,
  onClose,
  onSaved,
}: {
  restaurantId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState("waiter");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) return toast.error("PIN must be 4 digits");
    setLoading(true);
    const salt = randomSalt();
    const pin_hash = await hashPin(pin, salt);
    const { error } = await (supabase as any).from("staff_operators").insert({
      restaurant_id: restaurantId,
      name: name.trim(),
      role,
      pin_hash,
      pin_salt: salt,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Operator created");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-card h-full p-8 overflow-y-auto animate-slide-in-right">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl italic">New operator</h2>
          <button onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Role">
            <select value={role} onChange={(e) => setRole(e.target.value)} className="input">
              <option value="waiter">Waiter</option>
              <option value="runner">Runner</option>
              <option value="bartender">Bartender</option>
              <option value="cashier">Cashier</option>
            </select>
          </Field>
          <Field label="4-digit PIN">
            <input
              required
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="input tnum tracking-[0.5em] text-center text-xl"
              placeholder="••••"
            />
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Create operator"}
          </button>
        </form>
        <style>{`.input{width:100%;height:42px;padding:0 12px;border-radius:10px;border:1px solid var(--color-border);background:var(--color-background);font-size:14px}`}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
