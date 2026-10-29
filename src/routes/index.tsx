import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Download, RotateCcw, LayoutDashboard, Table2, ListChecks, CreditCard, BarChart3, ShieldCheck, PanelLeftClose, PanelLeftOpen, Menu, X } from "lucide-react";
import { Painel } from "@/components/financeiro/Painel";
import { Lancamentos } from "@/components/financeiro/Lancamentos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MESES,
  MESES_CURTOS,
  carregarEstado,
  salvarEstado,
  limparEstado,
  estadoInicial,
  novoId,
  mesesVazios,
  somar,
  cartaoPorMes,
  valorParcela,
  formatarMoedaZero,
  exportarCsv,
  type EstadoFinanceiro,
  type Linha,
  type ValoresMeses,
} from "@/lib/financeiro";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Controle Financeiro Mensal" },
      {
        name: "description",
        content:
          "Controle financeiro mensal: receitas, gastos, cartão de crédito parcelado e poupança ao longo dos 12 meses do ano.",
      },
      { property: "og:title", content: "Controle Financeiro Mensal" },
      {
        property: "og:description",
        content:
          "Organize receitas, gastos, cartão de crédito e economias mês a mês.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ControleFinanceiro,
});

type Aba = "painel" | "orcamento" | "lancamentos" | "cartao" | "resumo";

function ControleFinanceiro() {
  const [estado, setEstado] = useState<EstadoFinanceiro>(estadoInicial);
  const [carregado, setCarregado] = useState(false);
  const [aba, setAba] = useState<Aba>("painel");
  const [recolhido, setRecolhido] = useState(false);
  const [menuMobile, setMenuMobile] = useState(false);

  useEffect(() => {
    setEstado(carregarEstado());
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (carregado) salvarEstado(estado);
  }, [estado, carregado]);

  const cartaoMes = useMemo(() => cartaoPorMes(estado.compras), [estado.compras]);

  function atualizarLinha(tipo: "receitas" | "gastos", id: string, mes: number, valor: number | null) {
    setEstado((prev) => ({
      ...prev,
      [tipo]: prev[tipo].map((l) =>
        l.id === id
          ? { ...l, valores: l.valores.map((v, i) => (i === mes ? valor : v)) }
          : l,
      ),
    }));
  }

  function renomearLinha(tipo: "receitas" | "gastos", id: string, nome: string) {
    setEstado((prev) => ({
      ...prev,
      [tipo]: prev[tipo].map((l) => (l.id === id ? { ...l, nome } : l)),
    }));
  }

  function adicionarLinha(tipo: "receitas" | "gastos") {
    setEstado((prev) => ({
      ...prev,
      [tipo]: [...prev[tipo], { id: novoId(), nome: "Novo item", valores: mesesVazios() }],
    }));
  }

  function removerLinha(tipo: "receitas" | "gastos", id: string) {
    setEstado((prev) => ({
      ...prev,
      [tipo]: prev[tipo].filter((l) => l.id !== id),
    }));
  }

  function atualizarPoupanca(mes: number, valor: number | null) {
    setEstado((prev) => ({
      ...prev,
      poupanca: prev.poupanca.map((v, i) => (i === mes ? valor : v)),
    }));
  }

  function redefinir() {
    limparEstado();
    setEstado(estadoInicial());
    toast.success("Todos os valores foram apagados. Comece de novo!");
  }

  const totaisReceitas = MESES.map((_, m) =>
    estado.receitas.reduce((acc, l) => acc + (l.valores[m] ?? 0), 0),
  );
  const totaisGastos = MESES.map(
    (_, m) =>
      estado.gastos.reduce((acc, l) => acc + (l.valores[m] ?? 0), 0) + (cartaoMes[m] ?? 0),
  );
  const sobra = MESES.map((_, m) => (totaisReceitas[m] ?? 0) - (totaisGastos[m] ?? 0));
  const saldo = MESES.map((_, m) => (sobra[m] ?? 0) - (estado.poupanca[m] ?? 0));

  const itens: { id: Aba; rotulo: string; icone: typeof LayoutDashboard; desc: string }[] = [
    { id: "painel", rotulo: "Painel", icone: LayoutDashboard, desc: "Visão geral das suas finanças" },
    { id: "orcamento", rotulo: "Orçamento", icone: Table2, desc: "Receitas, gastos e economia mês a mês" },
    { id: "lancamentos", rotulo: "Lançamentos", icone: ListChecks, desc: "Pesquise, filtre e ordene seus lançamentos" },
    { id: "cartao", rotulo: "Cartão de Crédito", icone: CreditCard, desc: "Compras parceladas e fatura mensal" },
    { id: "resumo", rotulo: "Resumo do Ano", icone: BarChart3, desc: "Consolidado dos 12 meses" },
  ];
  const atual = itens.find((i) => i.id === aba) ?? itens[0]!;

  const navegacao = (compacto: boolean) => (
    <nav className="flex flex-col gap-1">
      {itens.map((it) => (
        <button
          key={it.id}
          title={compacto ? it.rotulo : undefined}
          onClick={() => {
            setAba(it.id);
            setMenuMobile(false);
          }}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            aba === it.id
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-card"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          } ${compacto ? "justify-center px-0" : ""}`}
        >
          <it.icone className="h-5 w-5 shrink-0" />
          {!compacto && <span className="truncate">{it.rotulo}</span>}
        </button>
      ))}
    </nav>
  );

  const marca = (compacto: boolean) => (
    <div className={`flex items-center gap-3 ${compacto ? "justify-center" : ""}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
        <ShieldCheck className="h-5 w-5" />
      </span>
      {!compacto && (
        <div className="min-w-0 leading-tight">
          <div className="truncate font-serif text-sm font-bold text-sidebar-accent-foreground">Controle Financeiro</div>
          <div className="text-xs text-sidebar-foreground/70">Mensal</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col justify-between bg-sidebar p-4 transition-[width] duration-200 lg:flex ${
          recolhido ? "w-20" : "w-64"
        }`}
      >
        <div className="space-y-8">
          {marca(recolhido)}
          {navegacao(recolhido)}
        </div>
        <button
          onClick={() => setRecolhido((v) => !v)}
          className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent"
          title={recolhido ? "Expandir menu" : "Recolher menu"}
        >
          {recolhido ? <PanelLeftOpen className="h-5 w-5" /> : <><PanelLeftClose className="h-5 w-5" /> Recolher menu</>}
        </button>
      </aside>

      {menuMobile && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMenuMobile(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col gap-8 bg-sidebar p-4">
            <div className="flex items-center justify-between">
              {marca(false)}
              <button onClick={() => setMenuMobile(false)} className="text-sidebar-foreground" aria-label="Fechar menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            {navegacao(false)}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setMenuMobile(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card lg:hidden" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate font-serif text-lg font-bold text-foreground sm:text-xl">{atual.rotulo}</h1>
                <p className="hidden truncate text-xs text-muted-foreground sm:block">{atual.desc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => exportarCsv(estado)} title="Exportar CSV">
                <Download className="h-4 w-4" /> <span className="hidden sm:inline">Exportar CSV</span>
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl text-destructive hover:text-destructive" onClick={redefinir} title="Limpar tudo">
                <RotateCcw className="h-4 w-4" /> <span className="hidden sm:inline">Limpar tudo</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-6">
          {aba === "painel" && (
            <Painel estado={estado} cartaoMes={cartaoMes} totaisReceitas={totaisReceitas} totaisGastos={totaisGastos} sobra={sobra} saldo={saldo} />
          )}
          {aba === "lancamentos" && <Lancamentos estado={estado} cartaoMes={cartaoMes} />}
          {aba === "orcamento" && (
            <Orcamento
              estado={estado}
              cartaoMes={cartaoMes}
              totaisReceitas={totaisReceitas}
              totaisGastos={totaisGastos}
              sobra={sobra}
              saldo={saldo}
              atualizarLinha={atualizarLinha}
              renomearLinha={renomearLinha}
              adicionarLinha={adicionarLinha}
              removerLinha={removerLinha}
              atualizarPoupanca={atualizarPoupanca}
            />
          )}
          {aba === "cartao" && (
            <CartaoCredito estado={estado} setEstado={setEstado} cartaoMes={cartaoMes} />
          )}
          {aba === "resumo" && (
            <Resumo
              estado={estado}
              totaisReceitas={totaisReceitas}
              totaisGastos={totaisGastos}
              sobra={sobra}
              saldo={saldo}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function CelulaValor({
  valor,
  onChange,
  destaque,
}: {
  valor: number | null;
  onChange: (v: number | null) => void;
  destaque?: boolean;
}) {
  return (
    <input
      type="number"
      step="0.01"
      min="0"
      value={valor ?? ""}
      placeholder=""
      onChange={(e) => {
        const t = e.target.value;
        onChange(t === "" ? null : Number(t));
      }}
      className={`h-8 w-24 rounded-lg border border-input bg-background px-2 text-right text-sm outline-none focus:ring-2 focus:ring-ring ${
        destaque ? "font-semibold" : ""
      }`}
    />
  );
}

function SecaoLinhas({
  titulo,
  tipo,
  linhas,
  renomearLinha,
  atualizarLinha,
  adicionarLinha,
  removerLinha,
}: {
  titulo: string;
  tipo: "receitas" | "gastos";
  linhas: Linha[];
  renomearLinha: (tipo: "receitas" | "gastos", id: string, nome: string) => void;
  atualizarLinha: (tipo: "receitas" | "gastos", id: string, mes: number, valor: number | null) => void;
  adicionarLinha: (tipo: "receitas" | "gastos") => void;
  removerLinha: (tipo: "receitas" | "gastos", id: string) => void;
}) {
  return (
    <>
      <tr className="bg-secondary">
        <td colSpan={14} className="px-3 py-2 text-sm font-bold text-foreground">
          <div className="flex items-center justify-between">
            {titulo}
            <Button size="sm" variant="outline" onClick={() => adicionarLinha(tipo)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
            </Button>
          </div>
        </td>
      </tr>
      {linhas.map((linha) => (
        <tr key={linha.id} className="border-b border-border hover:bg-muted/30">
          <td className="px-2 py-1">
            <div className="flex items-center gap-1">
              <Input
                value={linha.nome}
                onChange={(e) => renomearLinha(tipo, linha.id, e.target.value)}
                className="h-8 w-44 border-transparent bg-transparent text-sm hover:border-input focus:bg-background"
              />
              <button
                onClick={() => removerLinha(tipo, linha.id)}
                className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive [tr:hover_&]:opacity-100"
                title="Remover item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </td>
          {MESES.map((_, m) => (
            <td key={m} className="px-1 py-1 text-center">
              <CelulaValor
                valor={linha.valores[m] ?? null}
                onChange={(v) => atualizarLinha(tipo, linha.id, m, v)}
              />
            </td>
          ))}
          <td className="px-2 py-1 text-right text-sm font-semibold text-foreground">
            {formatarMoedaZero(somar(linha.valores))}
          </td>
        </tr>
      ))}
    </>
  );
}

function LinhaTotal({
  rotulo,
  valores,
  cor,
}: {
  rotulo: string;
  valores: number[];
  cor?: "verde" | "vermelho";
}) {
  const classe =
    cor === "verde"
      ? "text-success"
      : cor === "vermelho"
        ? "text-destructive"
        : "text-foreground";
  return (
    <tr className="border-b border-border bg-muted/40">
      <td className={`px-3 py-2 text-sm font-bold ${classe}`}>{rotulo}</td>
      {valores.map((v, i) => (
        <td key={i} className={`px-1 py-2 text-right text-sm font-bold ${classe}`}>
          {formatarMoedaZero(v)}
        </td>
      ))}
      <td className={`px-2 py-2 text-right text-sm font-bold ${classe}`}>
        {formatarMoedaZero(valores.reduce((a, b) => a + b, 0))}
      </td>
    </tr>
  );
}

function Orcamento({
  estado,
  cartaoMes,
  totaisReceitas,
  totaisGastos,
  sobra,
  saldo,
  atualizarLinha,
  renomearLinha,
  adicionarLinha,
  removerLinha,
  atualizarPoupanca,
}: {
  estado: EstadoFinanceiro;
  cartaoMes: number[];
  totaisReceitas: number[];
  totaisGastos: number[];
  sobra: number[];
  saldo: number[];
  atualizarLinha: (tipo: "receitas" | "gastos", id: string, mes: number, valor: number | null) => void;
  renomearLinha: (tipo: "receitas" | "gastos", id: string, nome: string) => void;
  adicionarLinha: (tipo: "receitas" | "gastos") => void;
  removerLinha: (tipo: "receitas" | "gastos", id: string) => void;
  atualizarPoupanca: (mes: number, valor: number | null) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            <th className="px-3 py-2 text-left text-sm font-semibold">Item</th>
            {MESES_CURTOS.map((m) => (
              <th key={m} className="px-1 py-2 text-center text-sm font-semibold">
                {m}
              </th>
            ))}
            <th className="px-2 py-2 text-right text-sm font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          <SecaoLinhas
            titulo="Receitas"
            tipo="receitas"
            linhas={estado.receitas}
            renomearLinha={renomearLinha}
            atualizarLinha={atualizarLinha}
            adicionarLinha={adicionarLinha}
            removerLinha={removerLinha}
          />
          <LinhaTotal rotulo="Total de receitas" valores={totaisReceitas} cor="verde" />

          <SecaoLinhas
            titulo="Gastos"
            tipo="gastos"
            linhas={estado.gastos}
            renomearLinha={renomearLinha}
            atualizarLinha={atualizarLinha}
            adicionarLinha={adicionarLinha}
            removerLinha={removerLinha}
          />
          <tr className="border-b border-border hover:bg-muted/30">
            <td className="px-3 py-1 text-sm font-semibold text-foreground">
              Cartão de crédito (fatura)
            </td>
            {MESES.map((_, m) => (
              <td key={m} className="px-1 py-1 text-right text-sm text-foreground">
                {formatarMoedaZero(cartaoMes[m] ?? 0)}
              </td>
            ))}
            <td className="px-2 py-1 text-right text-sm font-semibold text-foreground">
              {formatarMoedaZero(cartaoMes.reduce((a, b) => a + b, 0))}
            </td>
          </tr>
          <LinhaTotal rotulo="Total de gastos" valores={totaisGastos} cor="vermelho" />
          <LinhaTotal rotulo="Sobra (receitas − gastos)" valores={sobra} />

          <tr className="border-b border-border hover:bg-muted/30">
            <td className="px-3 py-1 text-sm font-semibold text-foreground">
              Poupança (Economia)
            </td>
            {MESES.map((_, m) => (
              <td key={m} className="px-1 py-1 text-center">
                <CelulaValor
                  valor={estado.poupanca[m] ?? null}
                  onChange={(v) => atualizarPoupanca(m, v)}
                />
              </td>
            ))}
            <td className="px-2 py-1 text-right text-sm font-semibold text-foreground">
              {formatarMoedaZero(somar(estado.poupanca))}
            </td>
          </tr>
          <LinhaTotal rotulo="Saldo do mês" valores={saldo} cor="verde" />
        </tbody>
      </table>
      <p className="px-3 py-2 text-xs text-muted-foreground">
        Dica: clique no nome de um item para renomeá-lo. Os valores ficam salvos
        automaticamente neste navegador.
      </p>
    </div>
  );
}

function CartaoCredito({
  estado,
  setEstado,
  cartaoMes,
}: {
  estado: EstadoFinanceiro;
  setEstado: React.Dispatch<React.SetStateAction<EstadoFinanceiro>>;
  cartaoMes: number[];
}) {
  function atualizar(id: string, campo: Partial<(typeof estado.compras)[number]>) {
    setEstado((prev) => ({
      ...prev,
      compras: prev.compras.map((c) => (c.id === id ? { ...c, ...campo } : c)),
    }));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card shadow-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-foreground">
            Compras no cartão de crédito
          </h2>
          <Button
            size="sm"
            onClick={() =>
              setEstado((prev) => ({
                ...prev,
                compras: [
                  ...prev.compras,
                  {
                    id: novoId(),
                    descricao: "Nova compra",
                    valorTotal: null,
                    parcelas: 1,
                    mesInicio: 0,
                  },
                ],
              }))
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Adicionar compra
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-2 py-2">Compra</th>
                <th className="px-2 py-2 text-right">Valor total</th>
                <th className="px-2 py-2 text-right">Parcelas</th>
                <th className="px-2 py-2 text-right">Valor da parcela</th>
                <th className="px-2 py-2">1ª parcela em</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {estado.compras.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-2 py-6 text-center text-sm text-muted-foreground">
                    Nenhuma compra cadastrada. Adicione uma compra parcelada para
                    vê-la distribuída mês a mês na fatura abaixo.
                  </td>
                </tr>
              )}
              {estado.compras.map((c) => (
                <tr key={c.id} className="border-b border-border">
                  <td className="px-2 py-1">
                    <Input
                      value={c.descricao}
                      onChange={(e) => atualizar(c.id, { descricao: e.target.value })}
                      className="h-8 w-52"
                    />
                  </td>
                  <td className="px-2 py-1 text-right">
                    <CelulaValor
                      valor={c.valorTotal}
                      onChange={(v) => atualizar(c.id, { valorTotal: v })}
                    />
                  </td>
                  <td className="px-2 py-1 text-right">
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={c.parcelas}
                      onChange={(e) =>
                        atualizar(c.id, {
                          parcelas: Math.max(1, Math.min(12, Number(e.target.value) || 1)),
                        })
                      }
                      className="h-8 w-16 rounded-lg border border-input bg-background px-2 text-right text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </td>
                  <td className="px-2 py-1 text-right text-sm font-semibold text-foreground">
                    {formatarMoedaZero(valorParcela(c))}
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={c.mesInicio}
                      onChange={(e) => atualizar(c.id, { mesInicio: Number(e.target.value) })}
                      className="h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      {MESES.map((m, i) => (
                        <option key={m} value={i}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <button
                      onClick={() =>
                        setEstado((prev) => ({
                          ...prev,
                          compras: prev.compras.filter((x) => x.id !== c.id),
                        }))
                      }
                      className="text-muted-foreground hover:text-destructive"
                      title="Remover compra"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card p-4 shadow-sm">
        <h2 className="mb-3 font-serif text-lg font-bold text-foreground">
          Fatura do cartão por mês
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {MESES.map((m, i) => (
            <div key={m} className="rounded-xl border border-border bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground">{m}</div>
              <div className="text-sm font-bold text-foreground">
                {formatarMoedaZero(cartaoMes[i] ?? 0)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Resumo({
  estado,
  totaisReceitas,
  totaisGastos,
  sobra,
  saldo,
}: {
  estado: EstadoFinanceiro;
  totaisReceitas: number[];
  totaisGastos: number[];
  sobra: number[];
  saldo: number[];
}) {
  const totalReceitas = totaisReceitas.reduce((a, b) => a + b, 0);
  const totalGastos = totaisGastos.reduce((a, b) => a + b, 0);
  const totalPoupanca = somar(estado.poupanca);
  const totalSaldo = saldo.reduce((a, b) => a + b, 0);

  const cartoes = [
    { rotulo: "Receitas no ano", valor: totalReceitas, cor: "text-success" },
    { rotulo: "Gastos no ano", valor: totalGastos, cor: "text-destructive" },
    { rotulo: "Sobra no ano", valor: sobra.reduce((a, b) => a + b, 0), cor: "text-foreground" },
    { rotulo: "Poupança no ano", valor: totalPoupanca, cor: "text-foreground" },
    { rotulo: "Saldo acumulado", valor: totalSaldo, cor: totalSaldo >= 0 ? "text-success" : "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cartoes.map((c) => (
          <div key={c.rotulo} className="rounded-2xl border border-border bg-card shadow-card p-4 shadow-sm">
            <div className="text-xs text-muted-foreground">{c.rotulo}</div>
            <div className={`mt-1 text-lg font-bold ${c.cor}`}>
              {formatarMoedaZero(c.valor)}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="px-3 py-2 text-left text-sm font-semibold">Mês</th>
              <th className="px-3 py-2 text-right text-sm font-semibold">Receitas</th>
              <th className="px-3 py-2 text-right text-sm font-semibold">Gastos</th>
              <th className="px-3 py-2 text-right text-sm font-semibold">Sobra</th>
              <th className="px-3 py-2 text-right text-sm font-semibold">Poupança</th>
              <th className="px-3 py-2 text-right text-sm font-semibold">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {MESES.map((m, i) => (
              <tr key={m} className="border-b border-border hover:bg-muted/30">
                <td className="px-3 py-2 text-sm font-medium text-foreground">{m}</td>
                <td className="px-3 py-2 text-right text-sm text-success">
                  {formatarMoedaZero(totaisReceitas[i] ?? 0)}
                </td>
                <td className="px-3 py-2 text-right text-sm text-destructive">
                  {formatarMoedaZero(totaisGastos[i] ?? 0)}
                </td>
                <td className="px-3 py-2 text-right text-sm text-foreground">
                  {formatarMoedaZero(sobra[i] ?? 0)}
                </td>
                <td className="px-3 py-2 text-right text-sm text-foreground">
                  {formatarMoedaZero(estado.poupanca[i] ?? 0)}
                </td>
                <td
                  className={`px-3 py-2 text-right text-sm font-semibold ${
                    (saldo[i] ?? 0) >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {formatarMoedaZero(saldo[i] ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
