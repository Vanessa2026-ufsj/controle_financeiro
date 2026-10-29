import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
  Landmark,
} from "lucide-react";
import { MESES, MESES_CURTOS, formatarMoedaZero, type EstadoFinanceiro } from "@/lib/financeiro";

type Props = {
  estado: EstadoFinanceiro;
  cartaoMes: number[];
  totaisReceitas: number[];
  totaisGastos: number[];
  sobra: number[];
  saldo: number[];
};

const CORES = ["var(--chart-3)", "var(--chart-1)", "var(--chart-4)", "var(--chart-5)", "var(--chart-2)", "oklch(0.55 0.08 262)", "oklch(0.7 0.1 163)", "oklch(0.65 0.05 250)"];

const moedaCurta = (v: number) =>
  Math.abs(v) >= 1000 ? `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k` : `R$ ${v.toFixed(0)}`;

function variacao(atual: number, anterior: number): number | null {
  if (!anterior) return null;
  return ((atual - anterior) / Math.abs(anterior)) * 100;
}

function Indicador({ valor, inverso }: { valor: number | null; inverso?: boolean }) {
  if (valor === null || !isFinite(valor)) return <span className="text-xs text-muted-foreground">sem comparação</span>;
  const bom = inverso ? valor <= 0 : valor >= 0;
  const Icone = valor >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${bom ? "bg-success-soft text-success" : "bg-destructive-soft text-destructive"}`}>
      <Icone className="h-3 w-3" />
      {Math.abs(valor).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
    </span>
  );
}

function TooltipMoeda({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-card">
      {label && <div className="mb-1 font-semibold text-foreground">{label}</div>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-foreground">{p.name.includes("%") ? `${p.value.toFixed(1)}%` : formatarMoedaZero(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function Cartao({ titulo, subtitulo, children, className = "" }: { titulo: string; subtitulo?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-5 shadow-card ${className}`}>
      <header className="mb-4">
        <h3 className="font-serif text-base font-semibold text-foreground">{titulo}</h3>
        {subtitulo && <p className="text-xs text-muted-foreground">{subtitulo}</p>}
      </header>
      {children}
    </section>
  );
}

export function Painel({ estado, cartaoMes, totaisReceitas, totaisGastos, saldo }: Props) {
  const [mes, setMes] = useState(() => new Date().getMonth());
  const ant = mes - 1;
  const g = (arr: (number | null)[], i: number) => (i >= 0 ? (arr[i] ?? 0) : 0);

  const investAcum = useMemo(() => {
    let acc = 0;
    return estado.poupanca.map((v) => (acc += v ?? 0));
  }, [estado.poupanca]);

  const saldoAcum = useMemo(() => {
    let acc = 0;
    return saldo.map((v) => (acc += v));
  }, [saldo]);

  const kpis = [
    { rotulo: "Saldo do mês", valor: g(saldo, mes), var: ant >= 0 ? variacao(g(saldo, mes), g(saldo, ant)) : null, icone: Wallet, tom: "bg-primary text-primary-foreground" },
    { rotulo: "Receitas", valor: g(totaisReceitas, mes), var: ant >= 0 ? variacao(g(totaisReceitas, mes), g(totaisReceitas, ant)) : null, icone: TrendingUp, tom: "bg-success-soft text-success" },
    { rotulo: "Despesas", valor: g(totaisGastos, mes), var: ant >= 0 ? variacao(g(totaisGastos, mes), g(totaisGastos, ant)) : null, icone: TrendingDown, tom: "bg-destructive-soft text-destructive", inverso: true },
    { rotulo: "Investimentos acumulados", valor: g(investAcum, mes), var: ant >= 0 ? variacao(g(investAcum, mes), g(investAcum, ant)) : null, icone: Landmark, tom: "bg-secondary text-secondary-foreground" },
    { rotulo: "Economia mensal", valor: g(estado.poupanca, mes), var: ant >= 0 ? variacao(g(estado.poupanca, mes), g(estado.poupanca, ant)) : null, icone: PiggyBank, tom: "bg-accent text-accent-foreground" },
  ];

  const receitaMes = g(totaisReceitas, mes);
  const taxaPoupanca = receitaMes ? (g(estado.poupanca, mes) / receitaMes) * 100 : 0;
  const comprometido = receitaMes ? (g(totaisGastos, mes) / receitaMes) * 100 : 0;

  const dadosMeses = MESES_CURTOS.map((m, i) => ({
    mes: m,
    Receitas: totaisReceitas[i] ?? 0,
    Despesas: totaisGastos[i] ?? 0,
    "Saldo acumulado": saldoAcum[i] ?? 0,
    Investimentos: investAcum[i] ?? 0,
    "Taxa de poupança %": totaisReceitas[i] ? ((estado.poupanca[i] ?? 0) / (totaisReceitas[i] ?? 1)) * 100 : 0,
  }));

  const distribuicao = [
    ...estado.gastos.map((l) => ({ nome: l.nome, valor: l.valores[mes] ?? 0 })),
    { nome: "Cartão de crédito (fatura)", valor: cartaoMes[mes] ?? 0 },
  ]
    .filter((d) => d.valor > 0)
    .sort((a, b) => b.valor - a.valor);
  const totalDist = distribuicao.reduce((a, b) => a + b.valor, 0);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-hero p-6 text-primary-foreground shadow-card sm:p-8">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0">
            <p className="text-sm opacity-80">Visão geral de {MESES[mes]}</p>
            <p className="mt-1 font-serif text-3xl font-bold sm:text-4xl">{formatarMoedaZero(g(saldo, mes))}</p>
            <p className="mt-2 text-sm opacity-80">Saldo disponível após despesas e economia do mês</p>
          </div>
          <label className="flex flex-col gap-1 text-xs opacity-90">
            Mês de referência
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="h-10 rounded-xl border border-primary-foreground/25 bg-primary-foreground/10 px-3 text-sm font-medium text-primary-foreground outline-none backdrop-blur focus:ring-2 focus:ring-ring"
            >
              {MESES.map((m, i) => (
                <option key={m} value={i} className="text-foreground">
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["Taxa de poupança", taxaPoupanca],
            ["Renda comprometida com despesas", comprometido],
          ].map(([r, v]) => (
            <div key={r as string} className="rounded-2xl bg-primary-foreground/10 p-3 backdrop-blur">
              <div className="flex justify-between text-xs opacity-90">
                <span>{r}</span>
                <span className="font-semibold">{(v as number).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary-foreground/20">
                <div className="h-full rounded-full bg-success" style={{ width: `${Math.min(100, Math.max(0, v as number))}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.rotulo} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">{k.rotulo}</span>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${k.tom}`}>
                <k.icone className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 truncate font-serif text-xl font-bold text-foreground">{formatarMoedaZero(k.valor)}</div>
            <div className="mt-2 flex items-center gap-2">
              <Indicador valor={k.var} inverso={k.inverso} />
              {k.var !== null && <span className="text-xs text-muted-foreground">vs. mês anterior</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Cartao titulo="Receitas x Despesas" subtitulo="Comparativo mensal do ano">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={dadosMeses} barGap={4}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis tickFormatter={moedaCurta} tickLine={false} axisLine={false} fontSize={11} width={60} stroke="var(--muted-foreground)" />
                <Tooltip content={<TooltipMoeda />} cursor={{ fill: "var(--muted)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Receitas" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Despesas" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Cartao>

        <Cartao titulo="Evolução do saldo" subtitulo="Saldo acumulado mês a mês">
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={dadosMeses}>
                <defs>
                  <linearGradient id="gSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis tickFormatter={moedaCurta} tickLine={false} axisLine={false} fontSize={11} width={60} stroke="var(--muted-foreground)" />
                <Tooltip content={<TooltipMoeda />} />
                <Area type="monotone" dataKey="Saldo acumulado" stroke="var(--chart-3)" strokeWidth={2.5} fill="url(#gSaldo)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Cartao>

        <Cartao titulo="Distribuição dos gastos" subtitulo={`Por categoria em ${MESES[mes]}`}>
          {distribuicao.length === 0 ? (
            <div className="grid h-64 place-items-center text-sm text-muted-foreground">Nenhum gasto lançado neste mês.</div>
          ) : (
            <div className="grid items-center gap-4 sm:grid-cols-2">
              <div className="h-56">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={distribuicao} dataKey="valor" nameKey="nome" innerRadius="58%" outerRadius="90%" paddingAngle={2} stroke="none">
                      {distribuicao.map((_, i) => (
                        <Cell key={i} fill={CORES[i % CORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<TooltipMoeda />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2">
                {distribuicao.map((d, i) => (
                  <li key={d.nome} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CORES[i % CORES.length] }} />
                    <span className="min-w-0 flex-1 truncate text-foreground">{d.nome}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{((d.valor / totalDist) * 100).toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Cartao>

        <Cartao titulo="Rentabilidade dos investimentos" subtitulo="Poupança acumulada e taxa de poupança sobre a renda">
          <div className="h-64">
            <ResponsiveContainer>
              <ComposedChart data={dadosMeses}>
                <defs>
                  <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis yAxisId="v" tickFormatter={moedaCurta} tickLine={false} axisLine={false} fontSize={11} width={60} stroke="var(--muted-foreground)" />
                <YAxis yAxisId="p" orientation="right" tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} fontSize={11} width={40} stroke="var(--muted-foreground)" />
                <Tooltip content={<TooltipMoeda />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Area yAxisId="v" type="monotone" dataKey="Investimentos" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#gInv)" />
                <Line yAxisId="p" type="monotone" dataKey="Taxa de poupança %" stroke="var(--chart-5)" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Cartao>
      </div>
    </div>
  );
}
