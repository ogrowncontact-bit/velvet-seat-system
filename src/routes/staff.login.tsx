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
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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
    } else if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/app`,
          data: { full_name: fullName, role: "staff" },
        },
      });
      if (error) toast.error(error.message);
      else if (!data.session) {
        setSent(true);
        toast.success("Confirme seu e-mail para continuar o cadastro.");
      } else {
        toast.success("Conta criada. Vamos configurar seu restaurante.");
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      if (error) toast.error(error.message); else toast.success("Se existir uma conta, enviamos o link.");
    }
    setLoading(false);
  };

  const titles = {
    login: { t: "Bem-vindo", s: "Entre para gerenciar o serviço de hoje." },
    signup: { t: "Cadastre seu restaurante", s: "Crie a conta do administrador e ative sua casa em minutos." },
    reset: { t: "Redefinir senha", s: "Enviaremos um link seguro para sua senha." },
  }[mode];

  return (
    <AuthShell
      eyebrow="Painel operacional"
      title={titles.t}
      subtitle={titles.s}
      side={
        <>
          <Building2 className="size-8 mb-6" />
          <h2 className="font-serif text-4xl md:text-5xl italic leading-tight mb-6">"Uma sala inteligente que simplesmente funciona."</h2>
          <p className="text-background/70 leading-relaxed">Para o maître, o gerente e o dono. SeatFlow desaparece durante o serviço — até você precisar dele.</p>
        </>
      }
    >
      {sent ? (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm">
          <p className="font-medium mb-1">Verifique seu e-mail</p>
          <p className="text-muted-foreground">
            Enviamos um link de confirmação para <strong>{email}</strong>. Depois de confirmar, você entra e cadastra o restaurante em 4 passos.
          </p>
          <button onClick={() => { setSent(false); setMode("login"); }} className="mt-4 text-xs text-foreground underline">Voltar ao login</button>
        </div>
      ) : (
      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Seu nome</label>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Maria Souza" className={inputClass()} />
          </div>
        )}
        <div>
          <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@restaurante.com" className={inputClass()} />
        </div>
        {mode !== "reset" && (
          <div>
            <div className="flex items-baseline justify-between">
              <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Senha</label>
              {mode === "login" && (
                <button type="button" onClick={() => setMode("reset")} className="text-xs text-muted-foreground hover:text-foreground">Esqueceu?</button>
              )}
            </div>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputClass()} />
          </div>
        )}
        <button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 inline-flex items-center justify-center gap-2 disabled:opacity-60">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <>{mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"} <ArrowRight className="size-4" /></>}
        </button>
        {mode !== "login" && (
          <button type="button" onClick={() => setMode("login")} className="w-full text-xs text-muted-foreground hover:text-foreground">Voltar ao login</button>
        )}
      </form>
      )}

      {mode === "login" && !sent && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-medium">Ainda não tem restaurante no SeatFlow?</p>
          <p className="text-xs text-muted-foreground mt-1">Crie a conta do administrador e ative sua casa em 4 passos.</p>
          <button onClick={() => setMode("signup")} className="mt-3 h-10 w-full rounded-xl border border-border text-sm font-medium hover:bg-muted">
            Cadastrar meu restaurante
          </button>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-6">
        Funcionários recebem acesso do dono do restaurante.
      </p>
      <p className="text-xs text-muted-foreground mt-3">
        Cliente? <Link to="/cliente/login" className="text-foreground underline">Acesse suas reservas</Link>.
      </p>
    </AuthShell>
  );
}

