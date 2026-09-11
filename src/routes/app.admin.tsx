import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListRestaurants,
  adminListMembers,
  adminCreateRestaurantWithOwner,
  adminAddMember,
  adminResetUserPassword,
  adminSetRestaurantStatus,
} from "@/lib/admin.functions";
import { useIsPlatformAdmin, setSelectedRestaurant } from "@/hooks/use-current-restaurant";
import { toast } from "sonner";
import { Loader2, Plus, Shield, KeyRound, UserPlus, LogIn, Building2, Check, X, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/app/admin")({
  component: AdminPage,
});

const TZS = ["UTC", "America/Sao_Paulo", "America/New_York", "Europe/London", "Europe/Madrid"];
const CURRENCIES = ["USD", "EUR", "GBP", "BRL"];
const ROLES = ["owner", "manager", "host", "staff"] as const;

function AdminPage() {
  const { data: isAdmin, isLoading } = useIsPlatformAdmin();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const listRestaurants = useServerFn(adminListRestaurants);
  const listMembers = useServerFn(adminListMembers);

  const { data: restaurants } = useQuery({
    queryKey: ["admin", "restaurants"],
    queryFn: () => listRestaurants(),
    enabled: !!isAdmin,
  });
  const { data: members } = useQuery({
    queryKey: ["admin", "members"],
    queryFn: () => listMembers(),
    enabled: !!isAdmin,
  });

  const pending = restaurants?.filter((r: any) => r.status === "pending") ?? [];

  if (isLoading) {
    return (
      <div className="grid place-items-center py-32">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-24 text-center">
        <Shield className="size-10 mx-auto mb-3 text-muted-foreground" />
        <h1 className="font-serif text-2xl mb-1">Acesso restrito</h1>
        <p className="text-sm text-muted-foreground">
          Esta área é exclusiva para administradores da plataforma.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs mb-3">
            <Shield className="size-3" /> Platform admin
          </div>
          <h1 className="font-serif text-4xl md:text-5xl italic leading-tight">Console da plataforma</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Crie restaurantes, gerencie contas dos clientes e acesse qualquer ambiente para suporte remoto.
          </p>
        </div>
        <NewRestaurantDialog onCreated={() => {
          qc.invalidateQueries({ queryKey: ["admin"] });
          qc.invalidateQueries({ queryKey: ["my-restaurants"] });
        }} />
      </header>

      {pending.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-accent inline-flex items-center gap-1.5">
            <Clock className="size-3.5" /> Pendentes de aprovação ({pending.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pending.map((r: any) => (
              <RestaurantCard
                key={r.id}
                r={r}
                onEnter={() => {
                  setSelectedRestaurant(r.id);
                  toast.success(`Entrando como ${r.name}`);
                  navigate({ to: "/app" });
                }}
                onMemberAdded={() => qc.invalidateQueries({ queryKey: ["admin", "members"] })}
                onStatusChanged={() => qc.invalidateQueries({ queryKey: ["admin", "restaurants"] })}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Restaurantes ({restaurants?.length ?? 0})
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurants?.map((r: any) => (
            <RestaurantCard
              key={r.id}
              r={r}
              onEnter={() => {
                setSelectedRestaurant(r.id);
                toast.success(`Entrando como ${r.name}`);
                navigate({ to: "/app" });
              }}
              onMemberAdded={() => qc.invalidateQueries({ queryKey: ["admin", "members"] })}
              onStatusChanged={() => qc.invalidateQueries({ queryKey: ["admin", "restaurants"] })}
            />
          ))}
          {restaurants && restaurants.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Nenhum restaurante ainda. Crie o primeiro.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Membros ({members?.length ?? 0})
        </h2>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground bg-muted/40">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Email</th>
                <th className="text-left px-5 py-3 font-medium">Restaurante</th>
                <th className="text-left px-5 py-3 font-medium">Papel</th>
                <th className="text-right px-5 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {members?.map((m: any) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{m.email || m.user_id.slice(0, 8)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{m.restaurants?.name ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-muted">
                      {m.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <ResetPasswordDialog userId={m.user_id} email={m.email} />
                  </td>
                </tr>
              ))}
              {members && members.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    Nenhum membro ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-accent/15 text-accent",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

function RestaurantCard({
  r,
  onEnter,
  onMemberAdded,
  onStatusChanged,
}: {
  r: any;
  onEnter: () => void;
  onMemberAdded: () => void;
  onStatusChanged: () => void;
}) {
  const setStatus = useServerFn(adminSetRestaurantStatus);
  const [busy, setBusy] = useState(false);
  const status = r.status ?? "approved";

  const changeStatus = async (next: "approved" | "rejected") => {
    setBusy(true);
    try {
      await setStatus({ data: { restaurantId: r.id, status: next } });
      toast.success(next === "approved" ? `${r.name} aprovado.` : `${r.name} rejeitado.`);
      onStatusChanged();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao atualizar status");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-foreground text-background grid place-items-center text-xs font-semibold">
            {r.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-medium leading-tight">{r.name}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
              {r.currency} · {r.timezone}
            </div>
          </div>
        </div>
        <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded font-semibold ${STATUS_STYLES[status] ?? ""}`}>
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>

      {status === "pending" && (
        <div className="flex gap-2">
          <button
            onClick={() => changeStatus("approved")}
            disabled={busy}
            className="flex-1 h-9 rounded-lg bg-success text-success-foreground hover:opacity-90 text-xs font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Aprovar
          </button>
          <button
            onClick={() => changeStatus("rejected")}
            disabled={busy}
            className="flex-1 h-9 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <X className="size-3.5" /> Rejeitar
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onEnter}
          className="flex-1 h-9 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium inline-flex items-center justify-center gap-1.5"
        >
          <LogIn className="size-3.5" /> Entrar
        </button>
        <AddMemberDialog restaurantId={r.id} restaurantName={r.name} onAdded={onMemberAdded} />
        {status === "rejected" && (
          <button
            onClick={() => changeStatus("approved")}
            disabled={busy}
            className="h-9 px-3 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium disabled:opacity-50"
          >
            Reconsiderar
          </button>
        )}
      </div>
    </div>
  );
}

function NewRestaurantDialog({ onCreated }: { onCreated: () => void }) {
  const create = useServerFn(adminCreateRestaurantWithOwner);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    restaurantName: "",
    timezone: "America/Sao_Paulo",
    currency: "BRL",
    ownerEmail: "",
    ownerPassword: "",
    ownerFullName: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await create({ data: form });
      toast.success(`${form.restaurantName} criado.`);
      setOpen(false);
      setForm({ ...form, restaurantName: "", ownerEmail: "", ownerPassword: "", ownerFullName: "" });
      onCreated();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao criar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="h-11 px-5 rounded-xl bg-foreground text-background text-sm font-medium inline-flex items-center gap-2">
          <Plus className="size-4" /> Novo restaurante
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl italic">Novo restaurante + cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 mt-2">
          <div>
            <Label>Nome do restaurante</Label>
            <Input value={form.restaurantName} onChange={(v) => setForm({ ...form, restaurantName: v })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Timezone</Label>
              <Select value={form.timezone} onChange={(v) => setForm({ ...form, timezone: v })}>
                {TZS.map((t) => <option key={t}>{t}</option>)}
              </Select>
            </div>
            <div>
              <Label>Moeda</Label>
              <Select value={form.currency} onChange={(v) => setForm({ ...form, currency: v })}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Conta do cliente (dono)
            </div>
            <div className="space-y-3">
              <div>
                <Label>Nome completo</Label>
                <Input value={form.ownerFullName} onChange={(v) => setForm({ ...form, ownerFullName: v })} required />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.ownerEmail} onChange={(v) => setForm({ ...form, ownerEmail: v })} required />
              </div>
              <div>
                <Label>Senha temporária</Label>
                <Input type="text" value={form.ownerPassword} onChange={(v) => setForm({ ...form, ownerPassword: v })} required minLength={8} />
                <p className="text-[10px] text-muted-foreground mt-1">Mínimo 8 caracteres. Compartilhe com o cliente.</p>
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <><Building2 className="size-4" /> Criar restaurante</>}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddMemberDialog({ restaurantId, restaurantName, onAdded }: { restaurantId: string; restaurantName: string; onAdded: () => void }) {
  const add = useServerFn(adminAddMember);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "staff" as (typeof ROLES)[number],
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await add({ data: { restaurantId, ...form } });
      toast.success("Membro adicionado.");
      setOpen(false);
      setForm({ email: "", password: "", fullName: "", role: "staff" });
      onAdded();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="h-9 px-3 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium inline-flex items-center gap-1.5">
          <UserPlus className="size-3.5" /> Membro
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-xl italic">Adicionar membro a {restaurantName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3 mt-2">
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          </div>
          <div>
            <Label>Nome (se criar novo)</Label>
            <Input value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} />
          </div>
          <div>
            <Label>Senha (se criar novo)</Label>
            <Input type="text" value={form.password} onChange={(v) => setForm({ ...form, password: v })} minLength={8} />
          </div>
          <div>
            <Label>Papel</Label>
            <Select value={form.role} onChange={(v) => setForm({ ...form, role: v as any })}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </Select>
          </div>
          <button type="submit" disabled={loading} className="w-full h-10 rounded-xl bg-foreground text-background text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Adicionar"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ userId, email }: { userId: string; email: string }) {
  const reset = useServerFn(adminResetUserPassword);
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await reset({ data: { userId, newPassword: pw } });
      toast.success("Senha redefinida.");
      setOpen(false);
      setPw("");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="h-8 px-2.5 rounded-md border border-border bg-card hover:bg-muted text-xs inline-flex items-center gap-1">
          <KeyRound className="size-3" /> Senha
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-xl italic">Redefinir senha de {email}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3 mt-2">
          <div>
            <Label>Nova senha</Label>
            <Input type="text" value={pw} onChange={setPw} required minLength={8} />
          </div>
          <button type="submit" disabled={loading} className="w-full h-10 rounded-xl bg-foreground text-background text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Redefinir"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{children}</label>;
}
function Input({ value, onChange, type = "text", required, minLength }: { value: string; onChange: (v: string) => void; type?: string; required?: boolean; minLength?: number }) {
  return (
    <input
      type={type}
      required={required}
      minLength={minLength}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1.5 w-full h-10 px-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
    />
  );
}
function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full h-10 px-3 rounded-xl border border-border bg-card text-sm">
      {children}
    </select>
  );
}
