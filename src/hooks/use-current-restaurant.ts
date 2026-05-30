import { useQuery } from "@tanstack/react-query";
import { fetchMyMemberships, qk } from "@/lib/queries";
import { useAuth } from "@/lib/auth";

export function useMyRestaurants() {
  const { user } = useAuth();
  return useQuery({
    queryKey: qk.myRestaurants,
    queryFn: fetchMyMemberships,
    enabled: !!user,
  });
}

export function useCurrentRestaurant() {
  const q = useMyRestaurants();
  const first = q.data?.[0];
  return {
    ...q,
    restaurant: first?.restaurants ?? null,
    role: first?.role ?? null,
    restaurantId: first?.restaurant_id ?? null,
  };
}
