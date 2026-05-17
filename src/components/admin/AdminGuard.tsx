import { Navigate, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

export function AdminGuard({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const { session, isAdmin, loading } = useAuth();

  // Login page is public
  if (loc.pathname === "/admin/login") return <>{children}</>;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!session) return <Navigate to="/admin/login" search={{ redirect: loc.pathname }} />;
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="font-serif text-2xl">Access denied</h1>
        <p className="text-sm text-muted-foreground">
          Your account ({session.user.email}) doesn't have admin access.
        </p>
        <p className="text-xs text-muted-foreground">
          Ask the project owner to grant your user the <code>admin</code> role.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
