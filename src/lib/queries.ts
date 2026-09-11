// Centralised TanStack Query keys + queryFns powered by Supabase RLS-scoped reads.
import { supabase } from "@/integrations/supabase/client";

export const qk = {
  me: ["me"] as const,
  myRestaurants: ["my-restaurants"] as const,
  restaurant: (id: string) => ["restaurant", id] as const,
  rooms: (rid: string) => ["rooms", rid] as const,
  tables: (rid: string) => ["tables", rid] as const,
  customers: (rid: string) => ["customers", rid] as const,
  reservations: (rid: string) => ["reservations", rid] as const,
  todayReservations: (rid: string) => ["reservations", rid, "today"] as const,
  waitlist: (rid: string) => ["waitlist", rid] as const,
  members: (rid: string) => ["members", rid] as const,
  activity: (rid: string) => ["activity", rid] as const,
  hours: (rid: string) => ["restaurant-hours", rid] as const,
  closures: (rid: string) => ["restaurant-closures", rid] as const,
};

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchMyMemberships() {
  const { data, error } = await supabase
    .from("restaurant_members")
    .select("role, restaurant_id, restaurants(*)")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchRooms(rid: string) {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("restaurant_id", rid)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchTables(rid: string) {
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .eq("restaurant_id", rid)
    .order("label", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchCustomers(rid: string) {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("restaurant_id", rid)
    .order("last_visit_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchReservations(rid: string) {
  const { data, error } = await supabase
    .from("reservations")
    .select("*, tables(label), customers(full_name, is_vip)")
    .eq("restaurant_id", rid)
    .order("reserved_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchTodayReservations(rid: string) {
  const start = new Date(); start.setHours(0,0,0,0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  const { data, error } = await supabase
    .from("reservations")
    .select("*, tables(label), customers(full_name, is_vip)")
    .eq("restaurant_id", rid)
    .gte("reserved_at", start.toISOString())
    .lt("reserved_at", end.toISOString())
    .order("reserved_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchWaitlist(rid: string) {
  const { data, error } = await supabase
    .from("waitlist")
    .select("*")
    .eq("restaurant_id", rid)
    .in("status", ["waiting", "offered"])
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchWaitlistHistory(rid: string) {
  const { data, error } = await supabase
    .from("waitlist")
    .select("*")
    .eq("restaurant_id", rid)
    .in("status", ["seated", "expired", "cancelled"])
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function fetchActivity(rid: string) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("restaurant_id", rid)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) throw error;
  return data ?? [];
}

export async function fetchHours(rid: string) {
  const { data, error } = await supabase
    .from("restaurant_hours")
    .select("*")
    .eq("restaurant_id", rid)
    .order("weekday", { ascending: true })
    .order("opens_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchClosures(rid: string) {
  const { data, error } = await supabase
    .from("restaurant_closures")
    .select("*")
    .eq("restaurant_id", rid)
    .order("closed_on", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function logActivity(rid: string, kind: string, message: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("activity_log").insert({
    restaurant_id: rid,
    actor_id: user.id,
    kind,
    message,
  });
}
