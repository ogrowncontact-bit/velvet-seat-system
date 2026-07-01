import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth, routeForRole } from "@/lib/auth";
import { Loader2 } from "lucide-react";

// Compat: /login redirects to appropriate portal based on role.
export const Route = createFileRoute("/login")({
  component: LoginRedirect,
});

function LoginRedirect() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user && role) {
      navigate({ to: routeForRole(role), replace: true });
    } else {
      navigate({ to: "/staff/login", replace: true });
    }
  }, [user, role, loading, navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-canvas">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  );
}
