import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

const BUCKET = "restaurant-photos";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export async function uploadRestaurantPhoto(restaurantId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${restaurantId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, TEN_YEARS);
  if (signErr || !data?.signedUrl) throw signErr ?? new Error("Não foi possível gerar o link da imagem");
  return data.signedUrl;
}

export function PhotoUpload({
  restaurantId,
  multiple,
  label = "Enviar imagem",
  onUploaded,
}: {
  restaurantId: string;
  multiple?: boolean;
  label?: string;
  onUploaded: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const tooBig = list.find((f) => f.size > 10 * 1024 * 1024);
    if (tooBig) return toast.error("Cada imagem deve ter no máximo 10 MB");
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of list) urls.push(await uploadRestaurantPhoto(restaurantId, f));
      onUploaded(urls);
      toast.success(urls.length > 1 ? `${urls.length} imagens enviadas` : "Imagem enviada");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao enviar a imagem");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="h-10 px-4 rounded-lg border border-border text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {busy ? "Enviando..." : label}
      </button>
    </>
  );
}
