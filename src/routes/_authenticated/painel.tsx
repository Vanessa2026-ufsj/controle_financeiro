import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ESTADOS, SITUACOES, formatarMoeda, type Bem, type Setor } from "@/lib/patrimonio";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel | Patrimônio UFSJ" },
      {
        name: "description",
        content: "Visão geral dos bens patrimoniais do Setor de Materiais da UFSJ.",
      },
      { property: "og:title", content: "Painel | Patrimônio UFSJ" },
      {
        property: "og:description",
        content: "Totais, valores e distribuição dos bens patrimoniais por setor e estado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Painel,
});

function Painel() {
  const { data, isLoading } = useQuery({
    queryKey: ["painel"],
    queryFn: async () => {
      const [bens, setores] = await Promise.all([
        supabase.from("bens").select("*"),
        supabase.from("setores").select("*").order("nome"),
      ]);
      if (bens.error) throw bens.error;
      if (setores.error) throw setores.error;
      return {
        bens: (bens.data ?? []) as unknown as Bem[],
        setores: (setores.data ?? []) as unknown as Setor[],
      };
    },
  });

  const bens = data?.bens ?? [];
  const setores = data?.setores ?? [];
  const total = bens.length;
  const valorTotal = bens.reduce((soma, b) => soma + Number(b.valor_aquisicao ?? 0), 0);
  const ativos = bens.filter((b) => b.situacao !== "baixado").length;
  const manutencao = bens.filter((b) => b.situacao === "em_manutencao").length;

  const porSetor = setores
    .map((s) => ({
      nome: s.sigla || s.nome,
      quantidade: bens.filter((b) => b.setor_id === s.id).length,
    }))
    .concat([{ nome: "Sem setor", quantidade: bens.filter((b) => !b.setor_id).length }])
    .filter((s) => s.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade);

  const maxSetor = Math.max(1, ...porSetor.map((s) => s.quantidade));

  return (
    <>
      <PageHeader
        titulo="Painel"
        descricao="Situação geral do patrimônio do setor."
        acoes={
          <>
            <Button asChild>
              <Link to="/bens/novo">Cadastrar bem</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/inventarios">Inventários</Link>
            </Button>
          </>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando informações...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Indicador titulo="Bens cadastrados" valor={String(total)} />
            <Indicador titulo="Valor total" valor={formatarMoeda(valorTotal)} />
            <Indicador titulo="Bens ativos" valor={String(ativos)} />
            <Indicador titulo="Em manutenção" valor={String(manutencao)} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bens por setor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {porSetor.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum bem cadastrado ainda.</p>
                ) : (
                  porSetor.map((s) => (
                    <div key={s.nome}>
                      <div className="flex justify-between text-sm">
                        <span>{s.nome}</span>
                        <span className="font-medium">{s.quantidade}</span>
                      </div>
                      <div className="mt-1 h-2 rounded bg-secondary">
                        <div
                          className="h-2 rounded bg-primary"
                          style={{ width: `${(s.quantidade / maxSetor) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estado de conservação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(ESTADOS).map(([chave, rotulo]) => (
                  <div key={chave} className="flex justify-between border-b border-border py-1 text-sm last:border-0">
                    <span>{rotulo}</span>
                    <span className="font-medium">
                      {bens.filter((b) => b.estado === chave).length}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Situação dos bens</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-4">
                {Object.entries(SITUACOES).map(([chave, rotulo]) => (
                  <div key={chave} className="rounded border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {rotulo}
                    </p>
                    <p className="mt-1 text-xl font-semibold">
                      {bens.filter((b) => b.situacao === chave).length}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}

function Indicador({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{titulo}</p>
        <p className="mt-2 font-serif text-2xl font-bold text-foreground">{valor}</p>
      </CardContent>
    </Card>
  );
}
