import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "supplier" | "buyer";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const { data: roles = [] } = useQuery({
    queryKey: ["roles", user?.id],
    queryFn: async () => {
      if (!user) return [] as AppRole[];
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      return (data ?? []).map((r) => r.role as AppRole);
    },
    enabled: !!user,
  });

  return {
    user,
    loading,
    roles,
    isAdmin: roles.includes("admin"),
    isSupplier: roles.includes("supplier"),
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };
}