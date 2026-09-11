import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Role = "owner" | "manager" | "host" | "staff";

/**
 * A caller may manage the team of a restaurant when they are a platform admin,
 * or an owner/manager of that same restaurant. Everything is checked server side
 * with the admin client so a tampered client payload cannot escalate.
 */
async function assertCanManage(userId: string, restaurantId: string) {
  const { data: admin } = await supabaseAdmin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (admin) return { isPlatformAdmin: true as const };

  const { data: member, error } = await supabaseAdmin
    .from("restaurant_members")
    .select("role")
    .eq("restaurant_id", restaurantId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!member || !["owner", "manager"].includes(member.role)) {
    throw new Error("Você não tem permissão para gerenciar a equipe deste restaurante.");
  }
  return { isPlatformAdmin: false as const, role: member.role as Role };
}

async function emailsFor(userIds: string[]) {
  if (userIds.length === 0) return {} as Record<string, string>;
  const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  return Object.fromEntries((data?.users ?? []).map((u) => [u.id, u.email ?? ""]));
}

export const listTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ restaurantId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertCanManage(context.userId, data.restaurantId);
    const { data: rows, error } = await supabaseAdmin
      .from("restaurant_members")
      .select("id, role, user_id, created_at")
      .eq("restaurant_id", data.restaurantId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const emails = await emailsFor((rows ?? []).map((r) => r.user_id));
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", (rows ?? []).map((r) => r.user_id));
    const names = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name ?? ""]));

    return (rows ?? []).map((r) => ({
      ...r,
      email: emails[r.user_id] ?? "",
      full_name: names[r.user_id] ?? "",
      is_self: r.user_id === context.userId,
    }));
  });

export const inviteTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        restaurantId: z.string().uuid(),
        email: z.string().email(),
        fullName: z.string().min(1).max(120).optional(),
        role: z.enum(["owner", "manager", "host", "staff"]),
        password: z.string().min(8).max(72).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const caller = await assertCanManage(context.userId, data.restaurantId);
    // Only an owner (or platform admin) may hand out the owner role.
    if (data.role === "owner" && !caller.isPlatformAdmin && caller.role !== "owner") {
      throw new Error("Apenas o proprietário pode promover outra pessoa a proprietário.");
    }

    const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    let user = existing?.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
    let createdWithPassword = false;

    if (!user) {
      if (!data.password) {
        throw new Error("Esse e-mail ainda não tem conta. Defina uma senha inicial para criá-la.");
      }
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.fullName ?? data.email.split("@")[0] },
      });
      if (error || !created.user) throw new Error(error?.message ?? "Não foi possível criar a conta.");
      user = created.user;
      createdWithPassword = true;
      await supabaseAdmin
        .from("profiles")
        .upsert({ id: user.id, full_name: data.fullName ?? data.email.split("@")[0] }, { onConflict: "id" });
    }

    const { data: member } = await supabaseAdmin
      .from("restaurant_members")
      .select("id")
      .eq("restaurant_id", data.restaurantId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (member) {
      const { error } = await supabaseAdmin
        .from("restaurant_members")
        .update({ role: data.role })
        .eq("id", member.id);
      if (error) throw new Error(error.message);
      return { userId: user.id, created: false, createdWithPassword: false };
    }

    const { error } = await supabaseAdmin
      .from("restaurant_members")
      .insert({ restaurant_id: data.restaurantId, user_id: user.id, role: data.role });
    if (error) throw new Error(error.message);
    return { userId: user.id, created: true, createdWithPassword };
  });

export const updateTeamRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        restaurantId: z.string().uuid(),
        memberId: z.string().uuid(),
        role: z.enum(["owner", "manager", "host", "staff"]),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const caller = await assertCanManage(context.userId, data.restaurantId);
    if (data.role === "owner" && !caller.isPlatformAdmin && caller.role !== "owner") {
      throw new Error("Apenas o proprietário pode promover outra pessoa a proprietário.");
    }
    await assertNotLastOwner(data.restaurantId, data.memberId, data.role);

    const { error } = await supabaseAdmin
      .from("restaurant_members")
      .update({ role: data.role })
      .eq("id", data.memberId)
      .eq("restaurant_id", data.restaurantId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ restaurantId: z.string().uuid(), memberId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertCanManage(context.userId, data.restaurantId);
    await assertNotLastOwner(data.restaurantId, data.memberId, null);

    const { error } = await supabaseAdmin
      .from("restaurant_members")
      .delete()
      .eq("id", data.memberId)
      .eq("restaurant_id", data.restaurantId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** A restaurant must always keep at least one owner, or nobody can administer it. */
async function assertNotLastOwner(restaurantId: string, memberId: string, nextRole: Role | null) {
  if (nextRole === "owner") return;
  const { data: target } = await supabaseAdmin
    .from("restaurant_members")
    .select("role")
    .eq("id", memberId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (!target || target.role !== "owner") return;

  const { count } = await supabaseAdmin
    .from("restaurant_members")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId)
    .eq("role", "owner");
  if ((count ?? 0) <= 1) {
    throw new Error("O restaurante precisa de pelo menos um proprietário.");
  }
}
