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

  const [policy, setPolicy] = useState<"none" | "card" | "deposit" | "fine">("none");
  const [noShowDeposit, setNoShowDeposit] = useState("0");
  const [noShowFine, setNoShowFine] = useState("0");
  const [offerTimeout, setOfferTimeout] = useState("10");
  const [savingPolicy, setSavingPolicy] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name);
      setTz(restaurant.timezone);
      setCurrency(restaurant.currency);
      setDeposit(String(restaurant.default_deposit ?? 0));
      setPolicy((restaurant as any).no_show_policy ?? "none");
      setNoShowDeposit(String((restaurant as any).no_show_deposit ?? 0));
      setNoShowFine(String((restaurant as any).no_show_fine ?? 0));
      setOfferTimeout(String((restaurant as any).offer_timeout_minutes ?? 10));
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

  const savePolicy = async () => {
    if (!restaurantId) return;
    setSavingPolicy(true);
    const { error } = await supabase.from("restaurants").update({
      no_show_policy: policy,
      no_show_deposit: parseFloat(noShowDeposit) || 0,
      no_show_fine: parseFloat(noShowFine) || 0,
      offer_timeout_minutes: Math.max(1, parseInt(offerTimeout) || 10),
    } as any).eq("id", restaurantId);
    setSavingPolicy(false);
    if (error) return toast.error(error.message);
    toast.success("Policy updated");
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
        <div className="p-6 border-b border-border"><h2 className="font-medium">No-show policy</h2><p className="text-xs text-muted-foreground mt-1">Protect your service from no-shows. Applied to new reservations.</p></div>
        <div className="p-6 space-y-4">
          <Field label="Policy type">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {([
                { v: "none", label: "None" },
                { v: "card", label: "Card hold" },
                { v: "deposit", label: "Deposit" },
                { v: "fine", label: "Fine on no-show" },
              ] as const).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setPolicy(opt.v)}
                  className={`h-10 rounded-lg border text-sm font-medium transition ${policy === opt.v ? "bg-foreground text-background border-foreground" : "border-border bg-card hover:bg-muted"}`}
                >{opt.label}</button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Deposit (${currency})`}>
              <input type="number" min={0} step="0.01" value={noShowDeposit} onChange={(e) => setNoShowDeposit(e.target.value)} className="input tnum" disabled={policy !== "deposit"} />
            </Field>
            <Field label={`Fine (${currency})`}>
              <input type="number" min={0} step="0.01" value={noShowFine} onChange={(e) => setNoShowFine(e.target.value)} className="input tnum" disabled={policy !== "fine"} />
            </Field>
          </div>
          <Field label="Waitlist offer timeout (minutes)">
            <input type="number" min={1} max={60} value={offerTimeout} onChange={(e) => setOfferTimeout(e.target.value)} className="input tnum" />
          </Field>
          <button onClick={savePolicy} disabled={savingPolicy} className="h-10 px-5 rounded-lg bg-foreground text-background text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50">
            {savingPolicy && <Loader2 className="size-4 animate-spin" />} Save policy
          </button>
        </div>
      </section>

      {restaurantId && <WhatsAppSection restaurantId={restaurantId} restaurant={restaurant as any} />}

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

const KINDS = [
  { k: "confirmation", label: "Confirmação (imediata)" },
  { k: "reminder_24h", label: "Lembrete — 24h antes" },
  { k: "reminder_2h", label: "Lembrete — 2h antes" },
  { k: "waitlist_offer", label: "Oferta de vaga (fila)" },
  { k: "reply_confirmed", label: "Resposta: confirmada" },
  { k: "reply_cancelled", label: "Resposta: cancelada" },
] as const;

function WhatsAppSection({ restaurantId, restaurant }: { restaurantId: string; restaurant: any }) {
  const qc = useQueryClient();
  const [enabled, setEnabled] = useState(false);
  const [fromNumber, setFromNumber] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setEnabled(!!restaurant.whatsapp_enabled);
      setFromNumber(restaurant.whatsapp_from ?? "");
    }
  }, [restaurant]);

  const templates = useQuery({
    queryKey: ["msg-templates", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("id, kind, body, enabled")
        .eq("restaurant_id", restaurantId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const log = useQuery({
    queryKey: ["msg-log", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_log")
        .select("id, direction, kind, to_phone, from_phone, body, status, error, created_at")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  const saveVenueWA = async () => {
    setSaving(true);
    const { error } = await supabase.from("restaurants").update({
      whatsapp_enabled: enabled, whatsapp_from: fromNumber || null,
    } as any).eq("id", restaurantId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("WhatsApp atualizado");
    qc.invalidateQueries({ queryKey: qk.myRestaurants });
  };

  const updateTpl = async (id: string, patch: { body?: string; enabled?: boolean }) => {
    const { error } = await supabase.from("message_templates").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["msg-templates", restaurantId] });
  };

  return (
    <section className="rounded-3xl border border-border bg-card overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="font-medium">WhatsApp</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Confirmações, lembretes e oferta de fila via Twilio. Variáveis: <code>{"{{guest}}"}</code> <code>{"{{time}}"}</code> <code>{"{{party}}"}</code> <code>{"{{restaurant}}"}</code> <code>{"{{minutes}}"}</code>.
        </p>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
          <div>
            <div className="text-sm font-medium">Envios automáticos</div>
            <div className="text-xs text-muted-foreground">Ative para começar a disparar mensagens.</div>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <span className={`relative inline-block w-10 h-6 rounded-full transition ${enabled ? "bg-foreground" : "bg-muted"}`}>
              <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-background transition ${enabled ? "translate-x-4" : ""}`} />
            </span>
          </label>
        </div>
        <Field label="Número WhatsApp do restaurante (E.164)">
          <input value={fromNumber} onChange={(e) => setFromNumber(e.target.value)} placeholder="+5511999999999" className="input" />
        </Field>
        <button onClick={saveVenueWA} disabled={saving} className="h-10 px-5 rounded-lg bg-foreground text-background text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50">
          {saving && <Loader2 className="size-4 animate-spin" />} Salvar
        </button>
      </div>

      <div className="border-t border-border p-6 space-y-4">
        <h3 className="text-sm font-medium">Modelos de mensagem</h3>
        {templates.isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          KINDS.map(({ k, label }) => {
            const tpl = templates.data?.find((t) => t.kind === k);
            if (!tpl) return null;
            return (
              <div key={tpl.id} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                  <label className="text-xs inline-flex items-center gap-1.5">
                    <input type="checkbox" checked={tpl.enabled} onChange={(e) => updateTpl(tpl.id, { enabled: e.target.checked })} />
                    Ativo
                  </label>
                </div>
                <textarea
                  defaultValue={tpl.body}
                  onBlur={(e) => e.target.value !== tpl.body && updateTpl(tpl.id, { body: e.target.value })}
                  rows={2}
                  className="w-full text-sm p-3 rounded border border-border bg-background"
                />
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-border p-6">
        <h3 className="text-sm font-medium mb-3">Histórico ({log.data?.length ?? 0})</h3>
        <div className="divide-y divide-border max-h-96 overflow-y-auto rounded-lg border border-border">
          {(log.data ?? []).map((m) => (
            <div key={m.id} className="p-3 text-xs flex items-start gap-3">
              <span className={`mt-0.5 inline-block size-5 rounded-full grid place-items-center text-[10px] font-bold ${m.direction === "in" ? "bg-blue-500/15 text-blue-700 dark:text-blue-400" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"}`}>
                {m.direction === "in" ? "↓" : "↑"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono tnum">{m.direction === "in" ? m.from_phone : m.to_phone}</span>
                  {m.kind && <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wider">{m.kind}</span>}
                  <span className={`rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${
                    m.status === "failed" ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                    : m.status === "received" ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"}`}>{m.status}</span>
                  <span className="text-muted-foreground tnum ml-auto">{new Date(m.created_at).toLocaleString()}</span>
                </div>
                {m.body && <div className="mt-1 text-muted-foreground line-clamp-2">{m.body}</div>}
                {m.error && <div className="mt-1 text-rose-600 dark:text-rose-400">⚠ {m.error}</div>}
              </div>
            </div>
          ))}
          {log.data?.length === 0 && <div className="p-6 text-center text-xs text-muted-foreground">Nenhuma mensagem ainda.</div>}
        </div>
      </div>
    </section>
  );
}
