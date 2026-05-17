import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      qc.invalidateQueries({ queryKey: ["is-admin"] });
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin", session?.user.id ?? null],
    enabled: !!session,
    queryFn: async () => {
      if (!session) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      return !!data?.some((r) => r.role === "admin" || r.role === "superadmin");
    },
  });

  return {
    session,
    user: session?.user as User | undefined,
    isAdmin: !!isAdmin,
    loading: loading || (!!session && roleLoading),
    signOut: () => supabase.auth.signOut(),
  };
}
