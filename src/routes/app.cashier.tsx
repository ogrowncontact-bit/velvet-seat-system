import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useCurrentRestaurant } from "@/hooks/use-current-restaurant";
import { fetchTables, qk } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, X, Loader2, Trash2, Receipt, Lock } from "lucide-react";
import { formatMoney, PAYMENT_METHODS, type PaymentMethod } from "@/lib/pos";

export const Route = createFileRoute("/app/cashier")({ component: CashierPage });

const OPERATOR_KEY = "seatflow:active-operator";

function CashierPage() {
  const qc = useQueryClient();
  const { restaurantId, restaurant } = useCurrentRestaurant();
  const currency = restaurant?.currency ?? "BRL";
  const [operator, setOperator] = useState<{ id: string; name: string } | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(OPERATOR_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null);
  const [openingTableId, setOpeningTableId] = useState<string | null>(null);

  const tables = useQuery({
    queryKey: qk.tables(restaurantId ?? ""),
    queryFn: () => fetchTables(restaurantId!),
    enabled: !!restaurantId,
  });

  const checks = useQuery({
    queryKey: ["checks", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("checks")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("status", "open")
        .order("opened_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (operator) localStorage.setItem(OPERATOR_KEY, JSON.stringify(operator));
    else localStorage.removeItem(OPERATOR_KEY);
  }, [operator]);

  const openCheck = useMutation({
    mutationFn: async ({ tableId, guestName, party }: { tableId: string | null; guestName: string; party: number }) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from("checks")
        .insert({
          restaurant_id: restaurantId,
          table_id: tableId,
          guest_name: guestName || null,
          party_size: party,
          opened_by_user: user.user?.id ?? null,
          opened_by_operator: operator?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (row: any) => {
      qc.invalidateQueries({ queryKey: ["checks", restaurantId] });
      setSelectedCheckId(row.id);
      setOpeningTableId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!restaurantId) {
    return <div className="p-12 text-center text-muted-foreground">Select a restaurant first.</div>;
  }

  const selectedCheck = (checks.data ?? []).find((c: any) => c.id === selectedCheckId);
  const occupiedTableIds = new Set((checks.data ?? []).map((c: any) => c.table_id).filter(Boolean));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl italic">Cashier</h1>
          <p className="mt-1 text-sm text-muted-foreground">Open tabs, add items, take payments.</p>
        </div>
        <div className="flex items-center gap-2">
          {operator ? (
            <>
              <div className="text-sm">
                Operator: <span className="font-medium">{operator.name}</span>
              </div>
              <button
                onClick={() => setOperator(null)}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Switch
              </button>
            </>
          ) : (
            <OperatorPinUnlock restaurantId={restaurantId} onUnlock={setOperator} />
          )}
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_440px] gap-6">
        <div className="space-y-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Open tabs ({(checks.data ?? []).length})
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(checks.data ?? []).map((c: any) => {
                const table = (tables.data ?? []).find((t: any) => t.id === c.table_id);
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCheckId(c.id)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      selectedCheckId === c.id
                        ? "border-foreground shadow-soft"
                        : "border-border bg-card hover:border-foreground/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{table?.label ?? c.guest_name ?? "Walk-in"}</div>
                      <Receipt className="size-4 text-muted-foreground" />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {c.party_size ?? "—"} guests · {new Date(c.opened_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="mt-3 tnum text-lg font-semibold">
                      {formatMoney(c.total, currency)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Tables
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {(tables.data ?? []).map((t: any) => {
                const occupied = occupiedTableIds.has(t.id);
                return (
                  <button
                    key={t.id}
                    disabled={occupied}
                    onClick={() => setOpeningTableId(t.id)}
                    className={`aspect-square rounded-xl border text-center p-2 transition-all ${
                      occupied
                        ? "border-dashed border-border bg-muted/30 text-muted-foreground cursor-not-allowed"
                        : "border-border bg-card hover:border-foreground"
                    }`}
                  >
                    <div className="font-mono text-sm font-bold">{t.label}</div>
                    <div className="text-[10px] text-muted-foreground">{t.seats} seats</div>
                    {occupied && <div className="text-[9px] uppercase mt-1">in use</div>}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setOpeningTableId("walkin")}
              className="mt-3 h-9 px-3 rounded-lg border border-border text-sm inline-flex items-center gap-2 hover:bg-muted"
            >
              <Plus className="size-4" /> Walk-in (no table)
            </button>
          </div>
        </div>

        <div className="lg:sticky lg:top-6 self-start">
          {selectedCheck ? (
            <CheckDetail
              check={selectedCheck}
              currency={currency}
              restaurantId={restaurantId}
              operator={operator}
              onClosed={() => {
                setSelectedCheckId(null);
                qc.invalidateQueries({ queryKey: ["checks", restaurantId] });
              }}
            />
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center">
              <p className="font-serif text-xl italic">Select or open a tab</p>
              <p className="text-xs text-muted-foreground mt-2">
                Click a table to open a new check, or pick an open one above.
              </p>
            </div>
          )}
        </div>
      </div>

      {openingTableId && (
        <OpenCheckDialog
          tableId={openingTableId === "walkin" ? null : openingTableId}
          tableLabel={
            openingTableId === "walkin"
              ? "Walk-in"
              : (tables.data ?? []).find((t: any) => t.id === openingTableId)?.label
          }
          onClose={() => setOpeningTableId(null)}
          onSubmit={(guestName, party) =>
            openCheck.mutate({
              tableId: openingTableId === "walkin" ? null : openingTableId,
              guestName,
              party,
            })
          }
          loading={openCheck.isPending}
        />
      )}
    </div>
  );
}

function OpenCheckDialog({
  tableLabel,
  onClose,
  onSubmit,
  loading,
}: {
  tableId: string | null;
  tableLabel?: string;
  onClose: () => void;
  onSubmit: (guestName: string, party: number) => void;
  loading: boolean;
}) {
  const [guestName, setGuestName] = useState("");
  const [party, setParty] = useState(2);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl italic">Open tab · {tableLabel}</h3>
          <button onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(guestName, party);
          }}
          className="space-y-3"
        >
          <input
            placeholder="Guest name (optional)"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
          />
          <input
            type="number"
            min={1}
            max={50}
            placeholder="Party size"
            value={party}
            onChange={(e) => setParty(parseInt(e.target.value) || 1)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm tnum"
          />
          <button
            disabled={loading}
            className="w-full h-10 rounded-lg bg-foreground text-background text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Open tab"}
          </button>
        </form>
      </div>
    </div>
  );
}

function OperatorPinUnlock({
  restaurantId,
  onUnlock,
}: {
  restaurantId: string;
  onUnlock: (op: { id: string; name: string }) => void;
}) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) return;
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("verify_operator_pin", {
      _restaurant_id: restaurantId,
      _pin: pin,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    const op = Array.isArray(data) ? data[0] : data;
    if (op?.id) {
      toast.success(`Welcome, ${op.name}`);
      onUnlock({ id: op.id, name: op.name });
      return;
    }
    toast.error("Invalid PIN");
    setPin("");
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <Lock className="size-4 text-muted-foreground" />
      <input
        inputMode="numeric"
        maxLength={4}
        placeholder="PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        className="h-9 w-24 px-3 rounded-lg border border-border bg-background text-sm text-center tracking-[0.4em] tnum"
      />
      <button
        disabled={loading || pin.length !== 4}
        className="h-9 px-3 rounded-lg bg-foreground text-background text-xs font-medium disabled:opacity-50"
      >
        Unlock
      </button>
      <span className="text-xs text-muted-foreground">or use your account</span>
    </form>
  );
}

function CheckDetail({
  check,
  currency,
  restaurantId,
  operator,
  onClosed,
}: {
  check: any;
  currency: string;
  restaurantId: string;
  operator: { id: string; name: string } | null;
  onClosed: () => void;
}) {
  const qc = useQueryClient();
  const [showMenu, setShowMenu] = useState(false);
  const [paying, setPaying] = useState(false);

  const items = useQuery({
    queryKey: ["check_items", check.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("check_items")
        .select("*")
        .eq("check_id", check.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("check_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["check_items", check.id] });
      qc.invalidateQueries({ queryKey: ["checks", restaurantId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-serif text-2xl italic">{check.guest_name ?? "Tab"}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Opened {new Date(check.opened_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {check.party_size ? ` · ${check.party_size} guests` : ""}
          </div>
        </div>
        <button
          onClick={() => setShowMenu(true)}
          className="h-9 px-3 rounded-lg bg-foreground text-background text-xs font-medium inline-flex items-center gap-1.5"
        >
          <Plus className="size-3.5" /> Add
        </button>
      </div>

      <div className="mt-6 divide-y divide-border max-h-[420px] overflow-y-auto">
        {(items.data ?? []).length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">No items yet.</div>
        )}
        {(items.data ?? []).map((i: any) => (
          <div key={i.id} className="py-2.5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {i.qty > 1 && <span className="text-muted-foreground tnum">{i.qty}× </span>}
                {i.name}
              </div>
              {i.notes && <div className="text-xs text-muted-foreground">{i.notes}</div>}
            </div>
            <div className="tnum text-sm font-semibold">
              {formatMoney(i.unit_price * i.qty, currency)}
            </div>
            <button
              onClick={() => removeItem.mutate(i.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-border pt-4 space-y-1 text-sm">
        <Row label="Subtotal" value={formatMoney(check.subtotal, currency)} />
        {Number(check.service_charge) > 0 && (
          <Row label="Service" value={formatMoney(check.service_charge, currency)} />
        )}
        {Number(check.discount) > 0 && (
          <Row label="Discount" value={`- ${formatMoney(check.discount, currency)}`} />
        )}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="font-medium">Total</div>
          <div className="font-serif text-2xl italic tnum">{formatMoney(check.total, currency)}</div>
        </div>
      </div>

      <button
        onClick={() => setPaying(true)}
        disabled={Number(check.total) <= 0}
        className="mt-4 w-full h-11 rounded-xl bg-foreground text-background text-sm font-medium disabled:opacity-50"
      >
        Settle & close
      </button>

      {showMenu && (
        <AddItemDrawer
          restaurantId={restaurantId}
          checkId={check.id}
          operator={operator}
          onClose={() => setShowMenu(false)}
          onAdded={() => {
            qc.invalidateQueries({ queryKey: ["check_items", check.id] });
            qc.invalidateQueries({ queryKey: ["checks", restaurantId] });
          }}
        />
      )}

      {paying && (
        <PaymentDialog
          check={check}
          currency={currency}
          operator={operator}
          onClose={() => setPaying(false)}
          onPaid={() => {
            setPaying(false);
            toast.success("Check closed");
            onClosed();
          }}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tnum">{value}</span>
    </div>
  );
}

function AddItemDrawer({
  restaurantId,
  checkId,
  operator,
  onClose,
  onAdded,
}: {
  restaurantId: string;
  checkId: string;
  operator: { id: string; name: string } | null;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [filter, setFilter] = useState("");

  const cats = useQuery({
    queryKey: ["menu_categories", restaurantId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("menu_categories")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("sort_order");
      return data ?? [];
    },
  });

  const items = useQuery({
    queryKey: ["menu_items_available", restaurantId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("available", true)
        .order("sort_order");
      return data ?? [];
    },
  });

  const add = async (item: any) => {
    const { data: user } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("check_items").insert({
      check_id: checkId,
      restaurant_id: restaurantId,
      menu_item_id: item.id,
      name: item.name,
      unit_price: item.price,
      qty: 1,
      added_by_user: user.user?.id ?? null,
      added_by_operator: operator?.id ?? null,
    });
    if (error) return toast.error(error.message);
    onAdded();
  };

  const filtered = (items.data ?? []).filter((i: any) =>
    i.name.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-card h-full p-6 overflow-y-auto animate-slide-in-right">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-2xl italic">Add to tab</h3>
          <button onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>
        <input
          autoFocus
          placeholder="Search items…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm mb-4"
        />
        <div className="space-y-5">
          {(cats.data ?? []).map((c: any) => {
            const list = filtered.filter((i: any) => i.category_id === c.id);
            if (list.length === 0) return null;
            return (
              <div key={c.id}>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                  {c.name}
                </div>
                <div className="space-y-1">
                  {list.map((i: any) => (
                    <button
                      key={i.id}
                      onClick={() => add(i)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted flex items-center justify-between"
                    >
                      <span className="text-sm">{i.name}</span>
                      <span className="tnum text-sm font-medium">
                        {formatMoney(i.price, "BRL")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {filtered.filter((i: any) => !i.category_id).length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                Other
              </div>
              <div className="space-y-1">
                {filtered
                  .filter((i: any) => !i.category_id)
                  .map((i: any) => (
                    <button
                      key={i.id}
                      onClick={() => add(i)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted flex items-center justify-between"
                    >
                      <span className="text-sm">{i.name}</span>
                      <span className="tnum text-sm font-medium">
                        {formatMoney(i.price, "BRL")}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}
          {(items.data ?? []).length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              No menu items yet. Add some in Menu first.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentDialog({
  check,
  currency,
  operator,
  onClose,
  onPaid,
}: {
  check: any;
  currency: string;
  operator: { id: string; name: string } | null;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState<number>(Number(check.total));
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: user } = await supabase.auth.getUser();
    const { error: payErr } = await (supabase as any).from("check_payments").insert({
      check_id: check.id,
      restaurant_id: check.restaurant_id,
      method,
      amount,
      received_by_user: user.user?.id ?? null,
      received_by_operator: operator?.id ?? null,
    });
    if (payErr) {
      setLoading(false);
      return toast.error(payErr.message);
    }
    const { error: closeErr } = await (supabase as any)
      .from("checks")
      .update({ status: "closed", payment_method: method, closed_at: new Date().toISOString() })
      .eq("id", check.id);
    setLoading(false);
    if (closeErr) return toast.error(closeErr.message);
    onPaid();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl italic">Settle check</h3>
          <button onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>
        <div className="text-center mb-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Total due</div>
          <div className="font-serif text-4xl italic tnum mt-1">
            {formatMoney(check.total, currency)}
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMethod(m.value)}
                className={`h-10 rounded-lg border text-xs font-medium ${
                  method === m.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Amount received
            </label>
            <input
              type="number"
              step="0.01"
              required
              min={0.01}
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="mt-1 w-full h-11 px-3 rounded-lg border border-border bg-background text-lg tnum"
            />
          </div>
          {amount > Number(check.total) && (
            <div className="text-xs text-muted-foreground">
              Change: <span className="tnum font-medium">{formatMoney(amount - Number(check.total), currency)}</span>
            </div>
          )}
          <button
            disabled={loading}
            className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Mark as paid"}
          </button>
        </form>
      </div>
    </div>
  );
}
