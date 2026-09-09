import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCurrentRestaurant, useIsPlatformAdmin } from "@/hooks/use-current-restaurant";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Trash2, ExternalLink } from "lucide-react";
import { PhotoUpload } from "@/components/photo-upload";

export const Route = createFileRoute("/app/public-profile")({ component: PublicProfilePage });

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

function PublicProfilePage() {
  const qc = useQueryClient();
  const { restaurantId, role } = useCurrentRestaurant();
  const { data: isAdmin } = useIsPlatformAdmin();
  const canEdit = isAdmin || role === "owner" || role === "manager";

  const { data: r, isLoading } = useQuery({
    queryKey: ["restaurant-profile", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("*").eq("id", restaurantId!).maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!restaurantId,
  });

  const [form, setForm] = useState<any>({});
  const [photosText, setPhotosText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (r) {
      setForm(r);
      setPhotosText((Array.isArray(r.photos) ? r.photos : []).join("\n"));
    }
  }, [r]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!restaurantId) return;
    setSaving(true);
    const photos = photosText.split("\n").map((s) => s.trim()).filter(Boolean);
    const slug = form.slug?.trim() ? slugify(form.slug) : slugify(form.name || "");
    const payload = {
      name: form.name,
      slug: slug || null,
      description: form.description || null,
      cuisine: form.cuisine || null,
      price_range: form.price_range || null,
      address: form.address || null,
      city: form.city || null,
      phone: form.phone || null,
      whatsapp_phone: form.whatsapp_phone || null,
      email: form.email || null,
      website: form.website || null,
      cover_image_url: form.cover_image_url || null,
      photos,
      is_published: !!form.is_published,
    };
    const { error } = await (supabase.from("restaurants") as any).update(payload).eq("id", restaurantId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil público atualizado");
    qc.invalidateQueries({ queryKey: ["restaurant-profile", restaurantId] });
    qc.invalidateQueries({ queryKey: ["public-restaurants"] });
  };

  if (isLoading || !r) return <div className="p-10 text-muted-foreground">Carregando...</div>;
  if (!canEdit) return <div className="p-10 text-muted-foreground">Você não tem permissão para editar este perfil.</div>;

  const photosList = photosText.split("\n").map((s) => s.trim()).filter(Boolean);
  const publicSlug = (form.slug || slugify(form.name || "")) ?? r.id;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl italic">Perfil público</h1>
          <p className="mt-1 text-sm text-muted-foreground">Fotos, descrição, contato e visibilidade na vitrine.</p>
        </div>
        {form.is_published && publicSlug && (
          <Link to="/r/$slug" params={{ slug: publicSlug }} target="_blank" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            Ver página <ExternalLink className="size-3" />
          </Link>
        )}
      </header>

      <section className="rounded-3xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="font-medium">Publicar na vitrine</div>
            <div className="text-xs text-muted-foreground">Quando ativado, qualquer pessoa pode ver este restaurante.</div>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!form.is_published} onChange={(e) => set("is_published", e.target.checked)} className="size-5" />
            <span className="text-sm">{form.is_published ? "Publicado" : "Oculto"}</span>
          </label>
        </div>

        <Field label="Nome"><input className="input" value={form.name || ""} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Slug (URL pública)"><input className="input" value={form.slug || ""} placeholder={slugify(form.name || "")} onChange={(e) => set("slug", e.target.value)} /></Field>
        <Field label="Descrição"><textarea rows={5} className="input" style={{height:"auto",padding:"12px 14px"}} value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo de cozinha"><input className="input" value={form.cuisine || ""} placeholder="Italiana, Japonesa…" onChange={(e) => set("cuisine", e.target.value)} /></Field>
          <Field label="Faixa de preço"><input className="input" value={form.price_range || ""} placeholder="$$ ou R$ 80–150" onChange={(e) => set("price_range", e.target.value)} /></Field>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-medium">Imagens</h2>
        <Field label="Imagem de capa">
          <div className="flex gap-2">
            <input className="input" value={form.cover_image_url || ""} onChange={(e) => set("cover_image_url", e.target.value)} placeholder="Envie um arquivo ou cole uma URL" />
            <PhotoUpload restaurantId={restaurantId!} label="Enviar" onUploaded={(urls) => set("cover_image_url", urls[0])} />
          </div>
        </Field>
        {form.cover_image_url && <img src={form.cover_image_url} alt="Capa do restaurante" className="rounded-xl w-full max-h-64 object-cover" />}

        <Field label="Galeria de fotos">
          <div className="flex gap-2">
            <PhotoUpload
              restaurantId={restaurantId!}
              multiple
              label="Enviar fotos"
              onUploaded={(urls) =>
                setPhotosText((t) => [...t.split("\n").map((s) => s.trim()).filter(Boolean), ...urls].join("\n"))
              }
            />
          </div>
          <textarea rows={4} className="input mt-2" style={{height:"auto",padding:"12px 14px"}} value={photosText} onChange={(e) => setPhotosText(e.target.value)} placeholder="Ou cole uma URL por linha" />
        </Field>
        {photosList.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photosList.map((p, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-lg bg-muted relative group">
                <img src={p} alt={`Foto ${i + 1} do restaurante`} className="w-full h-full object-cover" />
                <button
                  onClick={() => setPhotosText(photosList.filter((_, j) => j !== i).join("\n"))}
                  className="absolute top-1 right-1 size-7 rounded-md bg-background/90 grid place-items-center opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>


      <section className="rounded-3xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-medium">Contato &amp; endereço</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cidade"><input className="input" value={form.city || ""} onChange={(e) => set("city", e.target.value)} /></Field>
          <Field label="Telefone"><input className="input" value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} /></Field>
        </div>
        <Field label="Endereço completo"><input className="input" value={form.address || ""} onChange={(e) => set("address", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="WhatsApp (com DDI, ex. 5511...)"><input className="input" value={form.whatsapp_phone || ""} onChange={(e) => set("whatsapp_phone", e.target.value)} placeholder="5511999999999" /></Field>
          <Field label="E-mail"><input className="input" value={form.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>
        </div>
        <Field label="Site"><input className="input" value={form.website || ""} onChange={(e) => set("website", e.target.value)} placeholder="https://…" /></Field>
        <p className="text-xs text-muted-foreground">
          Por enquanto o WhatsApp abre uma conversa direta (wa.me). O bot automático será habilitado em breve.
        </p>
      </section>

      <div className="flex gap-3">
        <button onClick={save} disabled={saving} className="h-11 px-6 rounded-lg bg-foreground text-background text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50">
          {saving && <Loader2 className="size-4 animate-spin" />} Salvar alterações
        </button>
        <Link to="/restaurants" className="h-11 px-6 rounded-lg border border-border text-sm font-medium inline-flex items-center gap-2">
          Ver vitrine
        </Link>
      </div>

      <style>{`.input{width:100%;height:42px;padding:0 14px;border-radius:10px;border:1px solid var(--color-border);background:var(--color-background);font-size:14px}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
