import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — SeatFlow" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated.");
    navigate({ to: "/app", replace: true });
  };

  return (
    <div className="min-h-screen grid place-items-center bg-canvas px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="block font-serif text-2xl mb-8">SeatFlow</Link>
        <h1 className="font-serif text-3xl italic mb-2">Set a new password</h1>
        <p className="text-sm text-muted-foreground mb-8">Choose a strong password for your account.</p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            required
            minLength={8}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-medium inline-flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <>Update password <ArrowRight className="size-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
