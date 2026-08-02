import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, routeForRole } from "@/lib/auth";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export const Route = createFileRoute("/confirm")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Confirmar e-mail — SeatFlow" },
      { name: "description", content: "Confirme seu e-mail para ativar sua conta SeatFlow." },
      { property: "og:title", content: "Confirmar e-mail — SeatFlow" },
      { property: "og:description", content: "Confirme seu e-mail para ativar sua conta SeatFlow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConfirmPage,
});

function ConfirmPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Validando seu link...");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));

      const errorDescription = params.get("error_description") ?? hash.get("error_description");
      if (errorDescription) {
        setStatus("error");
        setMessage(decodeURIComponent(errorDescription));
        return;
      }

      // Newer Supabase links: ?token_hash=...&type=signup
      const tokenHash = params.get("token_hash") ?? params.get("token");
      const type = (params.get("type") ?? "signup") as
        | "signup"
        | "email"
        | "magiclink"
        | "recovery"
        | "invite"
        | "email_change";

      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (error) {
          setStatus("error");
          setMessage(error.message);
          return;
        }
        setStatus("ok");
        setMessage("E-mail confirmado com sucesso.");
        return;
      }

      // Legacy links: #access_token=...&refresh_token=...
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setStatus("error");
          setMessage(error.message);
          return;
        }
        setStatus("ok");
        setMessage("E-mail confirmado com sucesso.");
        return;
      }

      // Already signed in (Supabase may have consumed the link automatically)
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setStatus("ok");
        setMessage("Sua conta já está confirmada.");
        return;
      }

      setStatus("error");
      setMessage("Link inválido ou expirado. Solicite um novo e-mail de confirmação.");
    })();
  }, []);

  return (
    <div className="min-h-screen grid place-items-center bg-canvas px-6">
      <div className="w-full max-w-sm text-center">
        <Link to="/" className="block font-serif text-2xl mb-8">SeatFlow</Link>
        {status === "loading" && <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />}
        {status === "ok" && <CheckCircle2 className="size-8 mx-auto text-accent" />}
        {status === "error" && <XCircle className="size-8 mx-auto text-destructive" />}
        <h1 className="font-serif text-3xl italic mt-5 mb-2">
          {status === "error" ? "Não foi possível confirmar" : "Confirmação de e-mail"}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">{message}</p>

        {status === "ok" && (
          <button
            onClick={() => navigate({ to: routeForRole(role) === "/" ? "/staff/login" : routeForRole(role), replace: true })}
            className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-medium"
          >
            Continuar
          </button>
        )}
        {status === "error" && (
          <div className="space-y-2">
            <Link to="/staff/login" className="block w-full h-11 leading-[2.75rem] rounded-xl bg-foreground text-background text-sm font-medium">
              Ir para o login
            </Link>
            <Link to="/cliente/login" className="block w-full h-11 leading-[2.75rem] rounded-xl border border-border text-sm font-medium">
              Sou cliente
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
