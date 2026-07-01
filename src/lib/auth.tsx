import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";

export type UserRole = "admin" | "staff" | "customer" | null;

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole;
  roleLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  role: null,
  roleLoading: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      queryClient.invalidateQueries();
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const roleQuery = useQuery({
    queryKey: ["user-role", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_role", { _uid: user!.id });
      if (error) throw error;
      return (data ?? "customer") as Exclude<UserRole, null>;
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role: user ? (roleQuery.data ?? null) : null,
        roleLoading: !!user && roleQuery.isLoading,
        signOut: async () => { await supabase.auth.signOut(); },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export function routeForRole(role: UserRole): string {
  if (role === "admin") return "/app/admin";
  if (role === "staff") return "/app";
  if (role === "customer") return "/cliente";
  return "/";
}
