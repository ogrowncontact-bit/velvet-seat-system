import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, routeForRole } from "@/lib/auth";
import { ArrowRight, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, inputClass } from "@/components/auth-shell";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin — SeatFlow" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && role) {
      if (role !== "admin") {
        toast.error("Esta conta não é de administrador. Redirecionando...");
        navigate({ to: routeForRole(role), replace: true });
      } else {
        navigate({ to: "/app/admin", replace: true });
      }
    }
  }, [user, role, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
  };

  return (
    <AuthShell
      eyebrow="Console da plataforma"
      title="Administrador"
      subtitle="Acesso restrito aos operadores da SeatFlow."
      side={
        <>
          <Shield className="size-8 mb-6" />
          <h2 className="font-serif text-4xl md:text-5xl italic leading-tight mb-6">"O painel de controle global."</h2>
          <p className="text-background/70 leading-relaxed">Gerencie restaurantes, times, cobrança e observabilidade em um único lugar.</p>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@seatflow.com" className={inputClass()} />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Senha</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputClass()} />
        </div>
        <button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 inline-flex items-center justify-center gap-2 disabled:opacity-60">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <>Entrar como admin <ArrowRight className="size-4" /></>}
        </button>
      </form>
      <p className="text-xs text-muted-foreground mt-8">
        Restaurante? <Link to="/staff/login" className="text-foreground underline">Entre por aqui</Link>. Cliente? <Link to="/cliente/login" className="text-foreground underline">Acesse suas reservas</Link>.
      </p>
    </AuthShell>
  );
}
