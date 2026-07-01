import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, routeForRole } from "@/lib/auth";
import { ArrowRight, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, inputClass } from "@/components/auth-shell";

export const Route = createFileRoute("/staff/login")({
  head: () => ({ meta: [{ title: "Restaurante — SeatFlow" }] }),
  component: StaffLogin,
});

function StaffLogin() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && role) {
      if (role === "customer") {
        toast.error("Esta conta é de cliente. Redirecionando...");
        navigate({ to: "/cliente", replace: true });
      } else {
        navigate({ to: routeForRole(role), replace: true });
      }
    }
  }, [user, role, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      if (error) toast.error(error.message); else toast.success("Se existir uma conta, enviamos o link.");
    }
    setLoading(false);
  };

  return (
    <AuthShell
      eyebrow="Painel operacional"
      title={mode === "login" ? "Bem-vindo" : "Redefinir senha"}
      subtitle={mode === "login" ? "Entre para gerenciar o serviço de hoje." : "Enviaremos um link seguro para sua senha."}
      side={
        <>
          <Building2 className="size-8 mb-6" />
          <h2 className="font-serif text-4xl md:text-5xl italic leading-tight mb-6">"Uma sala inteligente que simplesmente funciona."</h2>
          <p className="text-background/70 leading-relaxed">Para o maître, o gerente e o dono. SeatFlow desaparece durante o serviço — até você precisar dele.</p>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@restaurante.com" className={inputClass()} />
        </div>
        {mode === "login" && (
          <div>
            <div className="flex items-baseline justify-between">
              <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Senha</label>
              <button type="button" onClick={() => setMode("reset")} className="text-xs text-muted-foreground hover:text-foreground">Esqueceu?</button>
            </div>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputClass()} />
          </div>
        )}
        <button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 inline-flex items-center justify-center gap-2 disabled:opacity-60">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <>{mode === "login" ? "Entrar" : "Enviar link"} <ArrowRight className="size-4" /></>}
        </button>
        {mode === "reset" && (
          <button type="button" onClick={() => setMode("login")} className="w-full text-xs text-muted-foreground hover:text-foreground">Voltar</button>
        )}
      </form>
      <p className="text-xs text-muted-foreground mt-8">
        Sua conta é criada pelo dono do restaurante ou pelo administrador da plataforma.
      </p>
      <p className="text-xs text-muted-foreground mt-3">
        Cliente? <Link to="/cliente/login" className="text-foreground underline">Acesse suas reservas</Link>.
      </p>
    </AuthShell>
  );
}
