import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useCurrentRestaurant } from "@/hooks/use-current-restaurant";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "@/lib/queries";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/app/settings")({ component: SettingsPage });

function SettingsPage() {
  const qc = useQueryClient();
  const { restaurant, restaurantId } = useCurrentRestaurant();
  const [name, setName] = useState("");
  const [timezone, setTz] = useState("UTC");
  const [currency, setCurrency] = useState("USD");
  const [defaultDeposit, setDeposit] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name);
      setTz(restaurant.timezone);
      setCurrency(restaurant.currency);
      setDeposit(String(restaurant.default_deposit ?? 0));
    }
  }, [restaurant]);

  const members = useQuery({
    queryKey: qk.members(restaurantId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_members")
        .select("id, role, user_id, created_at")
        .eq("restaurant_id", restaurantId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!restaurantId,
  });

  const saveVenue = async () => {
    if (!restaurantId) return;
    setSaving(true);
    const { error } = await supabase.from("restaurants").update({
      name, timezone, currency, default_deposit: parseFloat(defaultDeposit) || 0,
    }).eq("id", restaurantId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Venue updated");
    qc.invalidateQueries({ queryKey: qk.myRestaurants });
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-fade-in">
      <header>
        <h1 className="font-serif text-4xl md:text-5xl italic">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Venue, team, integrations.</p>
      </header>

      <section className="rounded-3xl border border-border bg-card overflow-hidden">
        <div className="p-6 border-b border-border"><h2 className="font-medium">Venue</h2></div>
        <div className="p-6 space-y-4">
          <Field label="Restaurant name"><input value={name} onChange={(e) => setName(e.target.value)} className="input" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Timezone"><input value={timezone} onChange={(e) => setTz(e.target.value)} className="input" /></Field>
            <Field label="Currency"><input value={currency} onChange={(e) => setCurrency(e.target.value)} className="input" /></Field>
          </div>
          <Field label="Default deposit per guest"><input type="number" min={0} value={defaultDeposit} onChange={(e) => setDeposit(e.target.value)} className="input tnum" /></Field>
          <button onClick={saveVenue} disabled={saving} className="h-10 px-5 rounded-lg bg-foreground text-background text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50">
            {saving && <Loader2 className="size-4 animate-spin" />} Save changes
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="font-medium">Team</h2>
          <span className="text-xs text-muted-foreground">{members.data?.length ?? 0} member{(members.data?.length ?? 0) === 1 ? "" : "s"}</span>
        </div>
        <div className="divide-y divide-border">
          {members.data?.map((m) => (
            <div key={m.id} className="p-5 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium font-mono text-xs">{m.user_id.slice(0, 8)}…</div>
                <div className="text-xs text-muted-foreground">Member since {new Date(m.created_at).toLocaleDateString()}</div>
              </div>
              <span className="rounded bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wider">{m.role}</span>
            </div>
          ))}
        </div>
        <div className="p-5 bg-muted/40 text-xs text-muted-foreground leading-relaxed">
          To invite a teammate, ask them to sign up at the login page and then add them here. Multi-user invitations are coming soon.
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card overflow-hidden">
        <div className="p-6 border-b border-border"><h2 className="font-medium">Integrations</h2></div>
        <div className="divide-y divide-border">
          {[
            { name: "WhatsApp Business", status: "Coming soon" },
            { name: "Stripe payments", status: "Coming soon" },
            { name: "Google Reserve", status: "Coming soon" },
            { name: "Instagram bio link", status: "Coming soon" },
          ].map((i) => (
            <div key={i.name} className="flex items-center justify-between p-5 text-sm">
              <span>{i.name}</span>
              <span className="rounded bg-muted text-muted-foreground px-2 py-1 text-[10px] font-bold uppercase tracking-wider">{i.status}</span>
            </div>
          ))}
        </div>
      </section>
      <style>{`.input{width:100%;height:42px;padding:0 14px;border-radius:10px;border:1px solid var(--color-border);background:var(--color-background);font-size:14px}`}</style>
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
