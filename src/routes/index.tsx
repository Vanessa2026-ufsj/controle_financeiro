import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Download, RotateCcw } from "lucide-react";
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

type Aba = "orcamento" | "cartao" | "resumo";

function ControleFinanceiro() {
  const [estado, setEstado] = useState<EstadoFinanceiro>(estadoInicial);
  const [carregado, setCarregado] = useState(false);
  const [aba, setAba] = useState<Aba>("orcamento");

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
  const totaisGastos = MESES.map((_, m) =>
    estado.gastos.reduce((acc, l) => acc + (l.valores[m] ?? 0), 0) + cartaoMes[m],
  );
  const sobra = MESES.map((_, m) => totaisReceitas[m] - totaisGastos[m]);
  const saldo = MESES.map((_, m) => sobra[m] - (estado.poupanca[m] ?? 0));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-4 py-3">
          <div className="flex flex-col">
            <span className="font-serif text-lg font-bold leading-tight">
              Controle Financeiro Mensal
            </span>
            <span className="text-xs opacity-80">
              Receitas, gastos, cartão e economias — mês a mês
            </span>
          </div>
          <nav className="flex flex-1 gap-1">
            {(
              [
                ["orcamento", "Orçamento"],
                ["cartao", "Cartão de Crédito"],
                ["resumo", "Resumo do Ano"],
              ] as [Aba, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setAba(id)}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  aba === id
                    ? "bg-primary-foreground/15 opacity-100"
                    : "opacity-85 hover:bg-primary-foreground/10 hover:opacity-100"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => exportarCsv(estado)}
            >
              <Download className="mr-1 h-4 w-4" /> Exportar CSV
            </Button>
            <Button size="sm" variant="secondary" onClick={redefinir}>
              <RotateCcw className="mr-1 h-4 w-4" /> Limpar tudo
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6">
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
      className={`h-8 w-24 rounded border border-input bg-background px-2 text-right text-sm outline-none focus:ring-2 focus:ring-ring ${
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
      <tr className="bg-muted/60">
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
                valor={linha.valores[m]}
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
      ? "text-emerald-700"
      : cor === "vermelho"
        ? "text-red-700"
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
    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
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
          <tr className="border-b border-border bg-muted/20">
            <td className="px-3 py-1 text-sm italic text-muted-foreground">
              Cartão de crédito (automático)
            </td>
            {cartaoMes.map((v, i) => (
              <td key={i} className="px-1 py-1 text-right text-sm italic text-muted-foreground">
                {v > 0 ? formatarMoedaZero(v) : ""}
              </td>
            ))}
            <td className="px-2 py-1 text-right text-sm font-semibold italic text-muted-foreground">
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
                  valor={estado.poupanca[m]}
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
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
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
                    distribuí-la automaticamente nos meses do orçamento.
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
                      className="h-8 w-16 rounded border border-input bg-background px-2 text-right text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </td>
                  <td className="px-2 py-1 text-right text-sm font-semibold text-foreground">
                    {formatarMoedaZero(valorParcela(c))}
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={c.mesInicio}
                      onChange={(e) => atualizar(c.id, { mesInicio: Number(e.target.value) })}
                      className="h-8 rounded border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
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

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 font-serif text-lg font-bold text-foreground">
          Fatura do cartão por mês
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {MESES.map((m, i) => (
            <div key={m} className="rounded border border-border bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground">{m}</div>
              <div className="text-sm font-bold text-foreground">
                {formatarMoedaZero(cartaoMes[i])}
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
    { rotulo: "Receitas no ano", valor: totalReceitas, cor: "text-emerald-700" },
    { rotulo: "Gastos no ano", valor: totalGastos, cor: "text-red-700" },
    { rotulo: "Sobra no ano", valor: sobra.reduce((a, b) => a + b, 0), cor: "text-foreground" },
    { rotulo: "Poupança no ano", valor: totalPoupanca, cor: "text-foreground" },
    { rotulo: "Saldo acumulado", valor: totalSaldo, cor: totalSaldo >= 0 ? "text-emerald-700" : "text-red-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cartoes.map((c) => (
          <div key={c.rotulo} className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="text-xs text-muted-foreground">{c.rotulo}</div>
            <div className={`mt-1 text-lg font-bold ${c.cor}`}>
              {formatarMoedaZero(c.valor)}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
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
                <td className="px-3 py-2 text-right text-sm text-emerald-700">
                  {formatarMoedaZero(totaisReceitas[i])}
                </td>
                <td className="px-3 py-2 text-right text-sm text-red-700">
                  {formatarMoedaZero(totaisGastos[i])}
                </td>
                <td className="px-3 py-2 text-right text-sm text-foreground">
                  {formatarMoedaZero(sobra[i])}
                </td>
                <td className="px-3 py-2 text-right text-sm text-foreground">
                  {formatarMoedaZero(estado.poupanca[i] ?? 0)}
                </td>
                <td
                  className={`px-3 py-2 text-right text-sm font-semibold ${
                    saldo[i] >= 0 ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {formatarMoedaZero(saldo[i])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
