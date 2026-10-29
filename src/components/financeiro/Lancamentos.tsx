import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, TrendingDown, TrendingUp, PiggyBank, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MESES, formatarMoedaZero, type EstadoFinanceiro } from "@/lib/financeiro";

type Tipo = "receita" | "despesa" | "cartao" | "poupanca";
type Registro = { id: string; mes: number; item: string; tipo: Tipo; valor: number };
type Coluna = "mes" | "item" | "tipo" | "valor";

const ROTULO: Record<Tipo, string> = { receita: "Receita", despesa: "Despesa", cartao: "Cartão", poupanca: "Economia" };
const ESTILO: Record<Tipo, string> = {
  receita: "bg-success-soft text-success",
  despesa: "bg-destructive-soft text-destructive",
  cartao: "bg-destructive-soft text-destructive",
  poupanca: "bg-secondary text-secondary-foreground",
};
const ICONE = { receita: TrendingUp, despesa: TrendingDown, cartao: CreditCard, poupanca: PiggyBank };

export function Lancamentos({ estado, cartaoMes }: { estado: EstadoFinanceiro; cartaoMes: number[] }) {
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<"todos" | Tipo>("todos");
  const [mes, setMes] = useState<number | -1>(-1);
  const [ord, setOrd] = useState<{ col: Coluna; asc: boolean }>({ col: "mes", asc: true });

  const registros = useMemo(() => {
    const r: Registro[] = [];
    for (let m = 0; m < 12; m++) {
      estado.receitas.forEach((l) => (l.valores[m] ?? 0) !== 0 && r.push({ id: `${l.id}-${m}`, mes: m, item: l.nome, tipo: "receita", valor: l.valores[m] ?? 0 }));
      estado.gastos.forEach((l) => (l.valores[m] ?? 0) !== 0 && r.push({ id: `${l.id}-${m}`, mes: m, item: l.nome, tipo: "despesa", valor: l.valores[m] ?? 0 }));
      if ((cartaoMes[m] ?? 0) > 0) r.push({ id: `cartao-${m}`, mes: m, item: "Cartão de crédito (fatura)", tipo: "cartao", valor: cartaoMes[m] ?? 0 });
      if ((estado.poupanca[m] ?? 0) !== 0) r.push({ id: `poup-${m}`, mes: m, item: "Poupança (Economia)", tipo: "poupanca", valor: estado.poupanca[m] ?? 0 });
    }
    return r;
  }, [estado, cartaoMes]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const lista = registros.filter(
      (r) => (tipo === "todos" || r.tipo === tipo) && (mes === -1 || r.mes === mes) && (!q || r.item.toLowerCase().includes(q)),
    );
    const dir = ord.asc ? 1 : -1;
    return lista.sort((a, b) => {
      const va = a[ord.col];
      const vb = b[ord.col];
      return (typeof va === "number" ? va - (vb as number) : String(va).localeCompare(String(vb))) * dir;
    });
  }, [registros, busca, tipo, mes, ord]);

  const entradas = filtrados.filter((r) => r.tipo === "receita").reduce((a, b) => a + b.valor, 0);
  const saidas = filtrados.filter((r) => r.tipo === "despesa" || r.tipo === "cartao").reduce((a, b) => a + b.valor, 0);

  function Cab({ col, rotulo, direita }: { col: Coluna; rotulo: string; direita?: boolean }) {
    const ativo = ord.col === col;
    const Ic = !ativo ? ArrowUpDown : ord.asc ? ArrowUp : ArrowDown;
    return (
      <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${direita ? "text-right" : "text-left"}`}>
        <button onClick={() => setOrd({ col, asc: ativo ? !ord.asc : true })} className="inline-flex items-center gap-1 hover:text-foreground">
          {rotulo} <Ic className="h-3 w-3" />
        </button>
      </th>
    );
  }

  const sel = "h-10 rounded-xl border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Entradas filtradas", entradas, "text-success"],
          ["Saídas filtradas", saidas, "text-destructive"],
          ["Resultado", entradas - saidas, entradas - saidas >= 0 ? "text-success" : "text-destructive"],
        ].map(([r, v, c]) => (
          <div key={r as string} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="text-xs text-muted-foreground">{r}</div>
            <div className={`mt-1 font-serif text-lg font-bold ${c}`}>{formatarMoedaZero(v as number)}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar lançamento..." className="h-10 rounded-xl pl-9" />
          </div>
          <div className="grid grid-cols-2 gap-3 md:flex">
            <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} className={sel} aria-label="Filtrar por tipo">
              <option value="todos">Todos os tipos</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
              <option value="cartao">Cartão</option>
              <option value="poupanca">Economia</option>
            </select>
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className={sel} aria-label="Filtrar por mês">
              <option value={-1}>Todos os meses</option>
              {MESES.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="bg-muted/50">
              <tr>
                <Cab col="mes" rotulo="Mês" />
                <Cab col="item" rotulo="Lançamento" />
                <Cab col="tipo" rotulo="Tipo" />
                <Cab col="valor" rotulo="Valor" direita />
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Nenhum lançamento encontrado. Preencha valores na tela de Orçamento para vê-los aqui.
                  </td>
                </tr>
              )}
              {filtrados.map((r) => {
                const Ic = ICONE[r.tipo];
                const negativo = r.tipo === "despesa" || r.tipo === "cartao";
                return (
                  <tr key={r.id} className="border-t border-border transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3 text-sm text-muted-foreground">{MESES[r.mes]}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${ESTILO[r.tipo]}`}>
                          <Ic className="h-4 w-4" />
                        </span>
                        {r.item}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTILO[r.tipo]}`}>{ROTULO[r.tipo]}</span>
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-semibold ${negativo ? "text-destructive" : r.tipo === "receita" ? "text-success" : "text-foreground"}`}>
                      {negativo ? "− " : r.tipo === "receita" ? "+ " : ""}
                      {formatarMoedaZero(r.valor)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">{filtrados.length} lançamento(s)</div>
      </div>
    </div>
  );
}
