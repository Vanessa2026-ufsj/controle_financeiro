import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

const NAV = [
  { to: "/painel", label: "Painel" },
  { to: "/bens", label: "Bens" },
  { to: "/movimentacoes", label: "Movimentações" },
  { to: "/inventarios", label: "Inventários" },
  { to: "/cadastros", label: "Cadastros" },
] as const;

export function AppShell({
  children,
  nomeUsuario,
  isAdmin,
}: {
  children: ReactNode;
  nomeUsuario: string;
  isAdmin: boolean;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
          <div className="flex flex-col">
            <span className="font-serif text-lg font-bold leading-tight">
              Controle Patrimonial
            </span>
            <span className="text-xs opacity-80">Setor de Materiais · UFSJ</span>
          </div>
          <nav className="flex flex-1 flex-wrap gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded px-3 py-1.5 text-sm font-medium opacity-85 transition-colors hover:bg-primary-foreground/10 hover:opacity-100"
                activeProps={{ className: "bg-primary-foreground/15 opacity-100" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-right sm:block">
              <span className="block leading-tight">{nomeUsuario}</span>
              <span className="block text-xs opacity-75">
                {isAdmin ? "Administrador" : "Consulta"}
              </span>
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                void sair();
              }}
            >
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}

export function PageHeader({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">{titulo}</h1>
        {descricao ? (
          <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
        ) : null}
      </div>
      {acoes ? <div className="flex flex-wrap gap-2">{acoes}</div> : null}
    </div>
  );
}
