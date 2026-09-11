import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useCurrentRestaurant } from "@/hooks/use-current-restaurant";
import { supabase } from "@/integrations/supabase/client";
import { qk, fetchHours, fetchClosures, fetchTables } from "@/lib/queries";
import { friendlyReservationError } from "@/lib/reservation-errors";
import { getConnectStatus, createConnectOnboardingLink, refreshConnectStatus } from "@/lib/stripe-connect.functions";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Copy, LayoutGrid, ArrowRight, CreditCard, CheckCircle2, ExternalLink } from "lucide-react";

const settingsSearchSchema = z.object({
  stripe: z.enum(["return", "refresh"]).optional(),
});

export const Route = createFileRoute("/app/settings")({
  validateSearch: settingsSearchSchema,
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { restaurant, restaurantId } = useCurrentRestaurant();
  const [name, setName] = useState("");
  const [timezone, setTz] = useState("UTC");
  const [currency, setCurrency] = useState("USD");
  const [defaultDeposit, setDeposit] = useState("0");
  const [defaultDuration, setDefaultDuration] = useState("90");
  const [slotInterval, setSlotInterval] = useState("30");
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
      setDefaultDuration(String((restaurant as any).default_duration_minutes ?? 90));
      setSlotInterval(String((restaurant as any).slot_interval_minutes ?? 30));
      setPolicy((restaurant as any).no_show_policy ?? "none");
      setNoShowDeposit(String((restaurant as any).no_show_deposit ?? 0));
      setNoShowFine(String((restaurant as any).no_show_fine ?? 0));
      setOfferTimeout(String((restaurant as any).offer_timeout_minutes ?? 10));
    }
  }, [restaurant]);

  const tables = useQuery({
    queryKey: qk.tables(restaurantId ?? ""),
    queryFn: () => fetchTables(restaurantId!),
    enabled: !!restaurantId,
  });

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
      default_duration_minutes: Math.max(15, parseInt(defaultDuration) || 90),
      slot_interval_minutes: Math.max(5, parseInt(slotInterval) || 30),
    } as any).eq("id", restaurantId);
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Duração média da reserva (min)"><input type="number" min={15} step={5} value={defaultDuration} onChange={(e) => setDefaultDuration(e.target.value)} className="input tnum" /></Field>
            <Field label="Intervalo entre horários (min)"><input type="number" min={5} step={5} value={slotInterval} onChange={(e) => setSlotInterval(e.target.value)} className="input tnum" /></Field>
          </div>
          <button onClick={saveVenue} disabled={saving} className="h-10 px-5 rounded-lg bg-foreground text-background text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50">
            {saving && <Loader2 className="size-4 animate-spin" />} Save changes
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-medium">Tables</h2>
          <p className="text-xs text-muted-foreground mt-1">Add, remove and reposition tables on the floor plan.</p>
        </div>
        <div className="p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-11 rounded-xl bg-muted grid place-items-center">
              <LayoutGrid className="size-5 text-muted-foreground" />
            </div>
            <div>
              <div className="font-serif text-2xl italic tnum">{tables.data?.length ?? "—"}</div>
              <div className="text-xs text-muted-foreground">
                {tables.data ? `${tables.data.length} table${tables.data.length === 1 ? "" : "s"} · ${tables.data.reduce((s, t: any) => s + (t.seats ?? 0), 0)} seats total` : "Loading…"}
              </div>
            </div>
          </div>
          <Link to="/app/floor-plan" className="h-10 px-4 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium inline-flex items-center gap-1.5 shrink-0">
            Manage tables <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {restaurantId && <PaymentsSection restaurantId={restaurantId} />}

      {restaurantId && <HoursSection restaurantId={restaurantId} />}

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

function PaymentsSection({ restaurantId }: { restaurantId: string }) {
  const { stripe: stripeReturn } = useSearch({ from: "/app/settings" });
  const qc = useQueryClient();
  const getStatus = useServerFn(getConnectStatus);
  const createLink = useServerFn(createConnectOnboardingLink);
  const refreshStatus = useServerFn(refreshConnectStatus);
  const [connecting, setConnecting] = useState(false);

  const status = useQuery({
    queryKey: ["stripe-connect-status", restaurantId],
    queryFn: () => getStatus({ data: { restaurantId } }),
  });

  const refresh = useMutation({
    mutationFn: () => refreshStatus({ data: { restaurantId } }),
    onSuccess: (r) => {
      qc.setQueryData(["stripe-connect-status", restaurantId], r);
    },
  });

  // Landed back from Stripe's hosted onboarding — re-sync immediately instead
  // of waiting for the account.updated webhook to arrive.
  useEffect(() => {
    if (stripeReturn === "return" || stripeReturn === "refresh") refresh.mutate();
  }, [stripeReturn]); // eslint-disable-line react-hooks/exhaustive-deps

  const connect = async () => {
    setConnecting(true);
    try {
      const { url } = await createLink({ data: { restaurantId } });
      window.location.href = url;
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to start Stripe onboarding");
      setConnecting(false);
    }
  };

  const s = status.data;

  return (
    <section className="rounded-3xl border border-border bg-card overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="font-medium">Pagamentos</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Conecte sua conta Stripe para receber depósitos de reserva diretamente na sua conta bancária. 100% do
          depósito vai para o restaurante — a plataforma não retém nada disso. Configure o valor em "Default deposit
          per guest" acima; deixe em 0 para não cobrar depósito.
        </p>
      </div>
      <div className="p-6">
        {status.isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : s?.chargesEnabled ? (
          <div className="flex items-center gap-4">
            <div className="size-11 rounded-xl bg-success/15 text-success grid place-items-center shrink-0">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Conta Stripe conectada</div>
              <div className="text-xs text-muted-foreground">Pronto para receber depósitos de clientes.</div>
            </div>
            <button
              onClick={connect}
              disabled={connecting}
              className="h-9 px-3.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50 shrink-0"
            >
              Gerenciar <ExternalLink className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="size-11 rounded-xl bg-muted grid place-items-center shrink-0">
              <CreditCard className="size-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">
                {s?.connected ? "Configuração pendente" : "Nenhuma conta conectada"}
              </div>
              <div className="text-xs text-muted-foreground">
                {s?.connected
                  ? "Você começou a configurar sua conta Stripe, mas ainda falta concluir."
                  : "Sem uma conta Stripe conectada, as reservas não pedem depósito."}
              </div>
            </div>
            <button
              onClick={connect}
              disabled={connecting}
              className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50 shrink-0"
            >
              {connecting && <Loader2 className="size-4 animate-spin" />}
              {s?.connected ? "Continuar configuração" : "Conectar conta Stripe"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

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

type HourRow = {
  id: string;
  restaurant_id: string;
  weekday: number;
  shift_name: string;
  opens_at: string;
  closes_at: string;
  last_seating_offset_minutes: number;
  active: boolean;
};

type ClosureRow = { id: string; restaurant_id: string; closed_on: string; reason: string | null };

const WEEKDAYS = [
  { v: 0, label: "Domingo" },
  { v: 1, label: "Segunda" },
  { v: 2, label: "Terça" },
  { v: 3, label: "Quarta" },
  { v: 4, label: "Quinta" },
  { v: 5, label: "Sexta" },
  { v: 6, label: "Sábado" },
] as const;

function hhmm(t: string) {
  return (t || "").slice(0, 5);
}

function HoursSection({ restaurantId }: { restaurantId: string }) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.hours(restaurantId) });
  const invalidateClosures = () => qc.invalidateQueries({ queryKey: qk.closures(restaurantId) });

  const hours = useQuery({ queryKey: qk.hours(restaurantId), queryFn: () => fetchHours(restaurantId) as Promise<HourRow[]> });
  const closures = useQuery({ queryKey: qk.closures(restaurantId), queryFn: () => fetchClosures(restaurantId) as Promise<ClosureRow[]> });

  const byDay: Record<number, HourRow[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const h of hours.data ?? []) byDay[h.weekday]?.push(h);

  const openDay = async (weekday: number) => {
    const existing = byDay[weekday] ?? [];
    if (existing.length === 0) {
      const { error } = await supabase.from("restaurant_hours").insert({
        restaurant_id: restaurantId, weekday, shift_name: "Serviço", opens_at: "12:00", closes_at: "22:00",
        last_seating_offset_minutes: 60, active: true,
      } as any);
      if (error) return toast.error(friendlyReservationError(error.message));
    } else {
      const { error } = await supabase.from("restaurant_hours").update({ active: true } as any)
        .eq("restaurant_id", restaurantId).eq("weekday", weekday);
      if (error) return toast.error(friendlyReservationError(error.message));
    }
    invalidate();
  };

  const closeDay = async (weekday: number) => {
    const { error } = await supabase.from("restaurant_hours").update({ active: false } as any)
      .eq("restaurant_id", restaurantId).eq("weekday", weekday);
    if (error) return toast.error(friendlyReservationError(error.message));
    invalidate();
  };

  const addShift = async (weekday: number) => {
    const { error } = await supabase.from("restaurant_hours").insert({
      restaurant_id: restaurantId, weekday, shift_name: "Turno", opens_at: "12:00", closes_at: "15:00",
      last_seating_offset_minutes: 60, active: true,
    } as any);
    if (error) return toast.error(friendlyReservationError(error.message));
    invalidate();
  };

  const updateShift = async (id: string, patch: Partial<HourRow>) => {
    const { error } = await supabase.from("restaurant_hours").update(patch as any).eq("id", id);
    if (error) return toast.error(friendlyReservationError(error.message));
    invalidate();
  };

  const removeShift = async (id: string) => {
    const { error } = await supabase.from("restaurant_hours").delete().eq("id", id);
    if (error) return toast.error(friendlyReservationError(error.message));
    invalidate();
  };

  const copyToAllDays = async (weekday: number) => {
    const source = byDay[weekday] ?? [];
    if (source.length === 0) return toast.error("Configure pelo menos um turno neste dia antes de copiar.");
    const others = WEEKDAYS.map((d) => d.v).filter((v) => v !== weekday);
    const { error: delError } = await supabase.from("restaurant_hours").delete()
      .eq("restaurant_id", restaurantId).in("weekday", others);
    if (delError) return toast.error(friendlyReservationError(delError.message));
    const rows = others.flatMap((wd) => source.map((s) => ({
      restaurant_id: restaurantId, weekday: wd, shift_name: s.shift_name,
      opens_at: s.opens_at, closes_at: s.closes_at,
      last_seating_offset_minutes: s.last_seating_offset_minutes, active: true,
    })));
    const { error: insError } = await supabase.from("restaurant_hours").insert(rows as any);
    if (insError) return toast.error(friendlyReservationError(insError.message));
    toast.success("Horários copiados para todos os dias");
    invalidate();
  };

  const [closureDate, setClosureDate] = useState("");
  const [closureReason, setClosureReason] = useState("");
  const [addingClosure, setAddingClosure] = useState(false);

  const addClosure = async () => {
    if (!closureDate) return;
    setAddingClosure(true);
    const { error } = await supabase.from("restaurant_closures").insert({
      restaurant_id: restaurantId, closed_on: closureDate, reason: closureReason || null,
    } as any);
    setAddingClosure(false);
    if (error) return toast.error(friendlyReservationError(error.message));
    setClosureDate("");
    setClosureReason("");
    invalidateClosures();
  };

  const removeClosure = async (id: string) => {
    const { error } = await supabase.from("restaurant_closures").delete().eq("id", id);
    if (error) return toast.error(friendlyReservationError(error.message));
    invalidateClosures();
  };

  return (
    <section className="rounded-3xl border border-border bg-card overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="font-medium">Horários</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Só é possível reservar dentro dos turnos abertos aqui. Nenhum turno cadastrado = reservas aceitas em qualquer horário.
        </p>
      </div>

      {hours.isLoading ? (
        <div className="p-6"><Loader2 className="size-4 animate-spin" /></div>
      ) : (
        <div className="divide-y divide-border">
          {WEEKDAYS.map((day) => {
            const shifts = (byDay[day.v] ?? []).filter((s) => s.active);
            const isOpen = shifts.length > 0;
            return (
              <div key={day.v} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium w-24 shrink-0">{day.label}</span>
                  <div className="flex items-center gap-2">
                    {isOpen && (
                      <button
                        type="button"
                        onClick={() => copyToAllDays(day.v)}
                        title="Copiar para todos os dias"
                        className="h-8 px-2.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted inline-flex items-center gap-1.5"
                      >
                        <Copy className="size-3.5" /> Copiar p/ todos
                      </button>
                    )}
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isOpen}
                        onChange={(e) => (e.target.checked ? openDay(day.v) : closeDay(day.v))}
                      />
                      <span className={`relative inline-block w-10 h-6 rounded-full transition ${isOpen ? "bg-foreground" : "bg-muted"}`}>
                        <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-background transition ${isOpen ? "translate-x-4" : ""}`} />
                      </span>
                    </label>
                  </div>
                </div>

                {isOpen ? (
                  <div className="mt-3 space-y-2 pl-0 sm:pl-[6.5rem]">
                    {shifts.map((s) => (
                      <div key={s.id} className="flex flex-wrap items-center gap-2">
                        <input
                          defaultValue={s.shift_name}
                          onBlur={(e) => e.target.value !== s.shift_name && updateShift(s.id, { shift_name: e.target.value })}
                          className="h-9 w-28 px-2.5 rounded-lg border border-border bg-background text-xs"
                          placeholder="Almoço, Jantar…"
                        />
                        <input
                          type="time"
                          defaultValue={hhmm(s.opens_at)}
                          onBlur={(e) => e.target.value && updateShift(s.id, { opens_at: e.target.value })}
                          className="h-9 px-2 rounded-lg border border-border bg-background text-xs tnum"
                        />
                        <span className="text-xs text-muted-foreground">até</span>
                        <input
                          type="time"
                          defaultValue={hhmm(s.closes_at)}
                          onBlur={(e) => e.target.value && updateShift(s.id, { closes_at: e.target.value })}
                          className="h-9 px-2 rounded-lg border border-border bg-background text-xs tnum"
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">última reserva</span>
                        <input
                          type="number"
                          min={0}
                          max={240}
                          step={5}
                          defaultValue={s.last_seating_offset_minutes}
                          onBlur={(e) => updateShift(s.id, { last_seating_offset_minutes: parseInt(e.target.value) || 0 })}
                          className="h-9 w-16 px-2 rounded-lg border border-border bg-background text-xs tnum"
                        />
                        <span className="text-xs text-muted-foreground">min antes de fechar</span>
                        <button onClick={() => removeShift(s.id)} className="ml-auto text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addShift(day.v)}
                      className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="size-3.5" /> Adicionar turno
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground pl-0 sm:pl-[6.5rem]">Fechado</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-border p-6 space-y-4">
        <h3 className="text-sm font-medium">Fechamentos pontuais</h3>
        <p className="text-xs text-muted-foreground -mt-2">Feriados, férias, eventos privados — datas específicas em que não aceita reservas.</p>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Data</label>
            <input type="date" value={closureDate} onChange={(e) => setClosureDate(e.target.value)} className="mt-1.5 h-9 px-2.5 rounded-lg border border-border bg-background text-xs" />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Motivo (opcional)</label>
            <input value={closureReason} onChange={(e) => setClosureReason(e.target.value)} placeholder="Feriado, férias…" className="mt-1.5 w-full h-9 px-2.5 rounded-lg border border-border bg-background text-xs" />
          </div>
          <button onClick={addClosure} disabled={!closureDate || addingClosure} className="h-9 px-3.5 rounded-lg bg-foreground text-background text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50">
            {addingClosure ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Adicionar
          </button>
        </div>
        {(closures.data?.length ?? 0) > 0 && (
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {closures.data!.map((c) => (
              <div key={c.id} className="p-3 flex items-center justify-between text-xs">
                <span className="tnum">
                  {new Date(c.closed_on + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  {c.reason && <span className="text-muted-foreground"> — {c.reason}</span>}
                </span>
                <button onClick={() => removeClosure(c.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
