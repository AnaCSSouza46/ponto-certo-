import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  cargo: string | null;
  jornada_minutos: number;
  sector_id: string | null;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isGestor, setIsGestor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async (s: Session | null) => {
      if (!active) return;
      setSession(s);
      if (!s) {
        setProfile(null);
        setIsGestor(false);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const [{ data: p }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", s.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", s.user.id),
      ]);
      if (!active) return;
      setProfile((p as Profile) ?? null);
      setIsGestor((roles ?? []).some((r) => r.role === "gestor" || r.role === "admin"));
      setIsAdmin((roles ?? []).some((r) => r.role === "admin"));
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => load(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      void load(s);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, profile, isGestor, isAdmin, loading };
}
