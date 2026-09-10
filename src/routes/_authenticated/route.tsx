import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: LayoutAutenticado,
});

function LayoutAutenticado() {
  const { perfil, isAdmin, user } = useAuth();
  const nome = perfil?.nome || perfil?.email || user?.email || "Usuário";

  return (
    <AppShell nomeUsuario={nome} isAdmin={isAdmin}>
      <Outlet />
    </AppShell>
  );
}
