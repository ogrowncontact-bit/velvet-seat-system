import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCurrentRestaurant } from "@/hooks/use-current-restaurant";
import { fetchCustomers, qk } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Mail, Phone, TriangleAlert, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/app/customers")({ component: Customers });

type Customer = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  tags: string[];
  notes: string | null;
  allergies: string | null;
  is_vip: boolean;
  visits_count: number;
  lifetime_value: number;
  last_visit_at: string | null;
};

function Customers() {
  const { restaurantId, restaurant } = useCurrentRestaurant();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const customers = useQuery({ queryKey: qk.customers(restaurantId ?? ""), queryFn: () => fetchCustomers(restaurantId!), enabled: !!restaurantId });

  const filtered = (customers.data as Customer[] | undefined)?.filter((c) =>
    c.full_name.toLowerCase().includes(q.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(q.toLowerCase()) ||
    (c.phone ?? "").includes(q) ||
    c.tags.some((t) => t.toLowerCase().includes(q.toLowerCase()))
  ) ?? [];

  const exportCsv = () => {
    const rows = [
      ["Nome", "Email", "Telefone", "VIP", "Visitas", "Valor vitalício", "Última visita", "Tags", "Alergias", "Notas"],
      ...filtered.map((c) => [
        c.full_name, c.email ?? "", c.phone ?? "", c.is_vip ? "Sim" : "Não",
        String(c.visits_count), String(c.lifetime_value), c.last_visit_at ?? "",
        c.tags.join("; "), c.allergies ?? "", (c.notes ?? "").replace(/\n/g, " "),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl italic">Guests</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every guest, every preference, every visit.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guests, email, phone, tags…" className="h-10 px-3.5 flex-1 md:w-72 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
          <button onClick={exportCsv} disabled={filtered.length === 0} className="h-10 px-3.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-40 shrink-0">
            <Download className="size-3.5" /> CSV
          </button>
        </div>
      </header>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelected(g)}
              className="text-left rounded-3xl border border-border bg-card p-6 hover:shadow-elevated transition-shadow"
            >
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

              {(g.email || g.phone) && (
                <div className="flex flex-col gap-1 mb-3 text-xs text-muted-foreground">
                  {g.email && <span className="inline-flex items-center gap-1.5 truncate"><Mail className="size-3 shrink-0" /> {g.email}</span>}
                  {g.phone && <span className="inline-flex items-center gap-1.5"><Phone className="size-3 shrink-0" /> {g.phone}</span>}
                </div>
              )}

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

              {g.allergies && (
                <p className="text-xs text-destructive mt-3 inline-flex items-center gap-1.5">
                  <TriangleAlert className="size-3.5 shrink-0" /> {g.allergies}
                </p>
              )}
              {g.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {g.tags.map((t) => (
                    <span key={t} className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
                  ))}
                </div>
              )}
              {g.notes && <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{g.notes}</p>}
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card py-20 text-center">
          <p className="font-serif text-2xl italic">{q ? "No guests match" : "No guests yet"}</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">{q ? "Try another search." : "Guests are added automatically when reservations are made."}</p>
        </div>
      )}

      {selected && (
        <CustomerDetailDialog customer={selected} onClose={() => setSelected(null)} restaurantId={restaurantId!} />
      )}
    </div>
  );
}

function CustomerDetailDialog({ customer, onClose, restaurantId }: { customer: Customer; onClose: () => void; restaurantId: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    allergies: customer.allergies ?? "",
    notes: customer.notes ?? "",
    tags: customer.tags.join(", "),
    is_vip: customer.is_vip,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("customers")
        .update({
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          allergies: form.allergies.trim() || null,
          notes: form.notes.trim() || null,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          is_vip: form.is_vip,
        })
        .eq("id", customer.id);
      if (error) throw error;
      toast.success("Guest atualizado.");
      qc.invalidateQueries({ queryKey: qk.customers(restaurantId) });
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl italic">{customer.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-lg bg-muted/50 p-2.5">
              <div className="font-serif text-lg italic tnum">{customer.visits_count}</div>
              <div className="text-muted-foreground">Visitas</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5">
              <div className="font-serif text-lg italic tnum">{Number(customer.lifetime_value).toLocaleString()}</div>
              <div className="text-muted-foreground">Lifetime</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5">
              <div className="font-serif text-lg italic">{customer.last_visit_at ? new Date(customer.last_visit_at).toLocaleDateString() : "—"}</div>
              <div className="text-muted-foreground">Última visita</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 w-full h-10 px-3 rounded-xl border border-border bg-card text-sm" />
            </Field>
            <Field label="Telefone">
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5 w-full h-10 px-3 rounded-xl border border-border bg-card text-sm" />
            </Field>
          </div>
          <Field label="Tags (separadas por vírgula)">
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="janela, aniversário, vinho" className="mt-1.5 w-full h-10 px-3 rounded-xl border border-border bg-card text-sm" />
          </Field>
          <Field label="Alergias / restrições">
            <input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="Amendoim, frutos do mar…" className="mt-1.5 w-full h-10 px-3 rounded-xl border border-border bg-card text-sm" />
          </Field>
          <Field label="Notas">
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="mt-1.5 w-full px-3 py-2 rounded-xl border border-border bg-card text-sm" />
          </Field>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.is_vip} onChange={(e) => setForm({ ...form, is_vip: e.target.checked })} className="size-4" />
            <span className="text-sm">Marcar como VIP</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving} className="flex-1 h-11 rounded-xl bg-foreground text-background text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
            </button>
            <button onClick={onClose} className="h-11 px-4 rounded-xl border border-border text-sm inline-flex items-center gap-1.5">
              <X className="size-4" /> Fechar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
