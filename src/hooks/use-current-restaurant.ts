import { useQuery } from "@tanstack/react-query";
import { fetchMyMemberships, qk } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { checkIsPlatformAdmin, adminListRestaurants } from "@/lib/admin.functions";
import { useEffect, useState } from "react";

const SELECTED_KEY = "seatflow:selected-restaurant";

export function useIsPlatformAdmin() {
  const { user } = useAuth();
  const check = useServerFn(checkIsPlatformAdmin);
  return useQuery({
    queryKey: ["is-platform-admin", user?.id],
    queryFn: async () => (await check()).isAdmin,
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useMyRestaurants() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsPlatformAdmin();
  const listAll = useServerFn(adminListRestaurants);

  return useQuery({
    queryKey: [...qk.myRestaurants, isAdmin ?? false],
    queryFn: async () => {
      if (isAdmin) {
        const all = await listAll();
        return all.map((r) => ({
          role: "owner" as const,
          restaurant_id: r.id,
          restaurants: r,
        }));
      }
      return fetchMyMemberships();
    },
    enabled: !!user && typeof isAdmin === "boolean",
  });
}

function getSelectedId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SELECTED_KEY);
}

export function setSelectedRestaurant(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SELECTED_KEY, id);
  window.dispatchEvent(new Event("seatflow:restaurant-changed"));
}

export function useCurrentRestaurant() {
  const q = useMyRestaurants();
  const [selectedId, setSelectedId] = useState<string | null>(getSelectedId());

  useEffect(() => {
    const onChange = () => setSelectedId(getSelectedId());
    window.addEventListener("seatflow:restaurant-changed", onChange);
    return () => window.removeEventListener("seatflow:restaurant-changed", onChange);
  }, []);

  const list = q.data ?? [];
  const found = selectedId ? list.find((m) => m.restaurant_id === selectedId) : null;
  const current = found ?? list[0] ?? null;

  return {
    ...q,
    restaurant: current?.restaurants ?? null,
    role: current?.role ?? null,
    restaurantId: current?.restaurant_id ?? null,
  };
}
