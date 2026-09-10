import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Perfil = {
  id: string;
  nome: string;
  email: string;
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    const carregarExtras = async (userId: string) => {
      const [{ data: perfilData }, { data: papeis }] = await Promise.all([
        supabase.from("profiles").select("id, nome, email").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      if (!ativo) return;
      setPerfil((perfilData as Perfil | null) ?? null);
      setIsAdmin((papeis ?? []).some((p) => p.role === "admin"));
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
      if (!ativo) return;
      setSession(novaSessao);
      if (novaSessao?.user) {
        void carregarExtras(novaSessao.user.id);
      } else {
        setPerfil(null);
        setIsAdmin(false);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      setSession(data.session);
      if (data.session?.user) void carregarExtras(data.session.user.id);
      setCarregando(false);
    });

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, perfil, isAdmin, carregando, user: session?.user ?? null };
}
