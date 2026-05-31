import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertPlatformAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: not a platform admin");
}

// List every restaurant on the platform (admin only)
export const adminListRestaurants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertPlatformAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .select("id, name, slug, currency, timezone, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// List members across all restaurants (admin only)
export const adminListMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertPlatformAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("restaurant_members")
      .select("id, role, user_id, restaurant_id, created_at, restaurants(name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const userIds = [...new Set((data ?? []).map((m) => m.user_id))];
    let emails: Record<string, string> = {};
    if (userIds.length) {
      // Get emails from auth.users via admin
      const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      emails = Object.fromEntries(
        (users?.users ?? []).map((u) => [u.id, u.email ?? ""]),
      );
    }
    return (data ?? []).map((m) => ({ ...m, email: emails[m.user_id] ?? "" }));
  });

// Create a new restaurant with an owner account (invite-only signup)
export const adminCreateRestaurantWithOwner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        restaurantName: z.string().min(1).max(120),
        timezone: z.string().min(1).max(60).default("UTC"),
        currency: z.string().min(3).max(3).default("USD"),
        ownerEmail: z.string().email(),
        ownerPassword: z.string().min(8).max(72),
        ownerFullName: z.string().min(1).max(120),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertPlatformAdmin(context.userId);

    // 1) Create or fetch user
    let userId: string;
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const found = existing?.users.find((u) => u.email?.toLowerCase() === data.ownerEmail.toLowerCase());

    if (found) {
      userId = found.id;
      // Update password so admin can hand it to the client
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: data.ownerPassword,
        email_confirm: true,
      });
    } else {
      const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
        email: data.ownerEmail,
        password: data.ownerPassword,
        email_confirm: true,
        user_metadata: { full_name: data.ownerFullName },
      });
      if (cErr || !created.user) throw new Error(cErr?.message ?? "Failed to create user");
      userId = created.user.id;
    }

    // Ensure profile exists
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, full_name: data.ownerFullName }, { onConflict: "id" });

    // 2) Create restaurant
    const { data: r, error: rErr } = await supabaseAdmin
      .from("restaurants")
      .insert({
        name: data.restaurantName,
        timezone: data.timezone,
        currency: data.currency,
        created_by: userId,
      })
      .select()
      .single();
    if (rErr || !r) throw new Error(rErr?.message ?? "Failed to create restaurant");

    // 3) Membership as owner
    const { error: mErr } = await supabaseAdmin
      .from("restaurant_members")
      .insert({ restaurant_id: r.id, user_id: userId, role: "owner" });
    if (mErr) throw new Error(mErr.message);

    // 4) Default room
    await supabaseAdmin
      .from("rooms")
      .insert({ restaurant_id: r.id, name: "Salão principal", sort_order: 0 });

    return { restaurantId: r.id, userId };
  });

// Reset a user's password (admin)
export const adminResetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid(), newPassword: z.string().min(8).max(72) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertPlatformAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.newPassword,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Add an existing user as a member of a restaurant
export const adminAddMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        restaurantId: z.string().uuid(),
        email: z.string().email(),
        role: z.enum(["owner", "manager", "host", "staff"]),
        password: z.string().min(8).max(72).optional(),
        fullName: z.string().min(1).max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertPlatformAdmin(context.userId);

    const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    let user = existing?.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());

    if (!user) {
      if (!data.password) throw new Error("Password required to create a new user");
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.fullName ?? data.email.split("@")[0] },
      });
      if (error || !created.user) throw new Error(error?.message ?? "Failed to create user");
      user = created.user;
      await supabaseAdmin
        .from("profiles")
        .upsert({ id: user.id, full_name: data.fullName ?? data.email.split("@")[0] }, { onConflict: "id" });
    }

    const { error: mErr } = await supabaseAdmin
      .from("restaurant_members")
      .upsert(
        { restaurant_id: data.restaurantId, user_id: user.id, role: data.role },
        { onConflict: "restaurant_id,user_id" },
      );
    if (mErr) throw new Error(mErr.message);

    return { userId: user.id };
  });

// Check whether the current user is a platform admin
export const checkIsPlatformAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    return { isAdmin: !!data };
  });
