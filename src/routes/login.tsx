import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — SeatFlow" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/app", replace: true });
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/app", replace: true });
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("If an account exists, a reset link has been sent.");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — form */}
      <div className="flex-1 flex flex-col px-6 md:px-12 py-8 bg-canvas">
        <div className="flex items-center justify-between">
          <Link to="/" className="font-serif text-2xl tracking-tight">SeatFlow</Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="size-4" /> Home
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <h1 className="font-serif text-4xl md:text-5xl italic mb-2">
              {mode === "login" ? "Welcome back" : "Reset password"}
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              {mode === "login"
                ? "Sign in to manage tonight's service."
                : "We'll email you a secure link to set a new password."}
            </p>

            <form onSubmit={mode === "login" ? handleLogin : handleReset} className="space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@restaurant.com"
                  className="mt-2 w-full h-11 px-3.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>

              {mode === "login" && (
                <div>
                  <div className="flex items-baseline justify-between">
                    <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Password</label>
                    <button type="button" onClick={() => setMode("reset")} className="text-xs text-muted-foreground hover:text-foreground">
                      Forgot?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-2 w-full h-11 px-3.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <>
                  {mode === "login" ? "Sign in" : "Send reset link"} <ArrowRight className="size-4" />
                </>}
              </button>

              {mode === "reset" && (
                <button type="button" onClick={() => setMode("login")} className="w-full text-xs text-muted-foreground hover:text-foreground">
                  Back to sign in
                </button>
              )}
            </form>

            <p className="text-xs text-muted-foreground mt-8 leading-relaxed">
              SeatFlow is invite-only. Your restaurant owner creates your account from the Settings panel.
            </p>
          </div>
        </div>
      </div>

      {/* Right — visual */}
      <div className="hidden lg:flex flex-1 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 grid-dots opacity-10" />
        <div className="relative z-10 m-auto max-w-md p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-background/20 px-3 py-1 text-xs mb-8">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            Tonight · 14 covers remaining
          </div>
          <h2 className="font-serif text-4xl md:text-5xl italic leading-tight mb-6">
            "A quiet, intelligent room that just runs."
          </h2>
          <p className="text-background/70 leading-relaxed">
            Built for the maître d', the GM, and the owner. SeatFlow disappears into your service — until you need it.
          </p>
        </div>
      </div>
    </div>
  );
}
