import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, routeForRole } from "@/lib/auth";
import { ArrowRight, Loader2, Utensils } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, inputClass } from "@/components/auth-shell";
import { PasteConfirmLink } from "@/components/paste-confirm-link";

export const Route = createFileRoute("/cliente/login")({
  head: () => ({ meta: [{ title: "Clientes — SeatFlow" }] }),
  component: ClienteLogin,
});

function ClienteLogin() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && role) {
      if (role === "admin" || role === "staff") {
        navigate({ to: routeForRole(role), replace: true });
      } else {
        navigate({ to: "/cliente", replace: true });
      }
    }
  }, [user, role, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/confirm?type=signup`,
            data: { full_name: name, phone, role: "customer" },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          toast.success("Enviamos um link de confirmação para seu e-mail.");
        } else toast.success("Conta criada! Você já está logado.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("Se existir uma conta, enviamos o link.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "login" ? "Bem-vindo de volta" : mode === "signup" ? "Crie sua conta" : "Redefinir senha";
  const subtitle = mode === "login"
    ? "Acesse suas reservas em restaurantes SeatFlow."
    : mode === "signup"
      ? "Reserve, remarque e cancele mesas em segundos."
      : "Enviaremos um link seguro para sua senha.";

  return (
    <AuthShell
      eyebrow="Área do cliente"
      title={title}
      subtitle={subtitle}
      side={
        <>
          <Utensils className="size-8 mb-6" />
          <h2 className="font-serif text-4xl md:text-5xl italic leading-tight mb-6">"Sua mesa favorita, sempre à mão."</h2>
          <p className="text-background/70 leading-relaxed">Descubra restaurantes, reserve com um toque e receba lembretes discretos no WhatsApp.</p>
        </>
      }
    >
      {sent && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm mb-6">
          <p className="font-medium mb-1">Verifique seu e-mail</p>
          <p className="text-muted-foreground">
            Enviamos um link de confirmação para <strong>{email}</strong>. Se o botão do e-mail não funcionar, copie o endereço do link e cole abaixo.
          </p>
          <button
            type="button"
            onClick={async () => {
              const { error } = await supabase.auth.resend({
                type: "signup",
                email,
                options: { emailRedirectTo: `${window.location.origin}/confirm?type=signup` },
              });
              if (error) toast.error(error.message);
              else toast.success("Novo e-mail de confirmação enviado.");
            }}
            className="mt-4 h-10 w-full rounded-xl border border-border text-sm font-medium hover:bg-muted"
          >
            Reenviar e-mail de confirmação
          </button>
          <div className="mt-5 pt-5 border-t border-border">
            <PasteConfirmLink onSuccess={() => navigate({ to: "/cliente", replace: true })} />
          </div>
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <>
            <div>
              <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Nome completo</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass()} placeholder="Ex.: Maria Silva" />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Telefone (WhatsApp)</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass()} placeholder="+55 11 99999-9999" />
            </div>
          </>
        )}
        <div>
          <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass()} placeholder="voce@email.com" />
        </div>
        {mode !== "reset" && (
          <div>
            <div className="flex items-baseline justify-between">
              <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Senha</label>
              {mode === "login" && (
                <button type="button" onClick={() => setMode("reset")} className="text-xs text-muted-foreground hover:text-foreground">Esqueceu?</button>
              )}
            </div>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass()} placeholder="••••••••" />
          </div>
        )}
        <button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 inline-flex items-center justify-center gap-2 disabled:opacity-60">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <>{mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"} <ArrowRight className="size-4" /></>}
        </button>
      </form>
      <div className="text-xs text-muted-foreground mt-6 space-y-1">
        {mode === "login" ? (
          <p>Novo por aqui? <button onClick={() => setMode("signup")} className="text-foreground underline">Criar conta</button></p>
        ) : (
          <p>Já tem conta? <button onClick={() => setMode("login")} className="text-foreground underline">Entrar</button></p>
        )}
        <p>É funcionário de um restaurante? <Link to="/staff/login" className="text-foreground underline">Entre por aqui</Link>.</p>
      </div>
    </AuthShell>
  );
}
