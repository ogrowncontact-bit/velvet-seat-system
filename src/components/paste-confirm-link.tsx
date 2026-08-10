import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  /** Default OTP type when the pasted link does not carry one. */
  defaultType?: "signup" | "recovery" | "email_change" | "magiclink" | "invite";
  onSuccess?: () => void;
};

/**
 * Fallback for email clients where the confirmation button is inert:
 * the user copies the link from the e-mail and pastes it here.
 */
export function PasteConfirmLink({ defaultType = "signup", onSuccess }: Props) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = value.trim();
    if (!raw) return;
    setLoading(true);
    try {
      let url: URL;
      try {
        url = new URL(raw);
      } catch {
        // maybe they pasted only the token
        url = new URL(`https://x.dev/?token_hash=${encodeURIComponent(raw)}`);
      }

      const params = url.searchParams;
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));

      const errorDescription = params.get("error_description") ?? hash.get("error_description");
      if (errorDescription) throw new Error(decodeURIComponent(errorDescription));

      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) throw error;
      } else {
        const tokenHash = params.get("token_hash") ?? params.get("token") ?? hash.get("token_hash");
        if (!tokenHash) throw new Error("Não encontramos um token válido nesse link. Copie o endereço completo do botão do e-mail.");
        const type = (params.get("type") ?? hash.get("type") ?? defaultType) as
          | "signup"
          | "recovery"
          | "email_change"
          | "magiclink"
          | "invite";
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (error) throw error;
      }

      toast.success("Confirmado com sucesso.");
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Link inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <Link2 className="size-3.5" /> Colar link do e-mail
      </label>
      <p className="text-xs text-muted-foreground">
        Se o botão do e-mail não funcionar, clique com o botão direito nele, copie o endereço do link e cole aqui.
      </p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        placeholder="https://...supabase.co/auth/v1/verify?token=..."
        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="h-10 w-full rounded-xl bg-foreground text-background text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : "Confirmar com o link"}
      </button>
    </form>
  );
}
