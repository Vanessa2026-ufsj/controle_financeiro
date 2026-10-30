import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Calculator, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { obterIndicadores } from "@/lib/indicadores.functions";
import {
  NOMES_INDEXADOR,
  carregarAplicacoes,
  carregarCache,
  evolucao,
  mesclar,
  mesesDisponiveis,
  rotuloMes,
  salvarAplicacoes,
  salvarCache,
  taxaAnualAtual,
  type Aplicacao,
  type Cache,
  type Chave,
  type Indexador,
} from "@/lib/indicadores";
import { formatarMoedaZero, novoId } from "@/lib/financeiro";
import { Cartao } from "./Painel";

const pct = (v: number | null | undefined, d = 2) => (v == null ? "—" : `${v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d })}%`);
const ORDEM: Chave[] = ["selic", "cdi", "ipca", "igpm", "tr", "poupanca"];
const COR: Record<Chave, string> = { selic: "var(--chart-3)", cdi: "var(--chart-1)", ipca: "var(--chart-2)", igpm: "var(--chart-5)", tr: "var(--chart-4)", poupanca: "oklch(0.55 0.08 262)" };

export function useIndicadores() {
  const buscar = useServerFn(obterIndicadores);
  const [cache, setCache] = useState<Cache>({ indicadores: {}, mensal: {} });
  const [carregando, setCarregando] = useState(false);
  const [falhas, setFalhas] = useState<string[]>([]);

  const atualizar = useCallback(
    async (manual = false) => {
      setCarregando(true);
      try {
        const r = await buscar();
        setFalhas(r.falhas);
        setCache((prev) => {
          const n = mesclar(prev, r);
          salvarCache(n);
          return n;
        });
        if (manual) r.falhas.length ? toast.warning("Algumas fontes não responderam; mantivemos o último dado válido.") : toast.success("Indicadores atualizados.");
      } catch {
        setFalhas(ORDEM);
        if (manual) toast.error("Fontes indisponíveis no momento. Exibindo os últimos dados válidos.");
      } finally {
        setCarregando(false);
      }
    },
    [buscar],
  );

  useEffect(() => {
    setCache(carregarCache());
    void atualizar();
  }, [atualizar]);

  return { cache, carregando, falhas, atualizar };
}

export type EstadoIndicadores = ReturnType<typeof useIndicadores>;

export function CardsIndicadores({ ind }: { ind: EstadoIndicadores }) {
  const { cache, carregando, falhas, atualizar } = ind;
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h2 className="font-serif text-base font-semibold text-foreground">Taxas e indicadores do mercado</h2>
          <p className="truncate text-xs text-muted-foreground">Fontes oficiais: Banco Central do Brasil, IBGE e FGV</p>
        </div>
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => atualizar(true)} disabled={carregando}>
          <RefreshCw className={`h-4 w-4 ${carregando ? "animate-spin" : ""}`} /> <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {ORDEM.map((k) => {
          const i = cache.indicadores[k];
          const falhou = falhas.includes(k) || (k === "cdi" && falhas.includes("cdiMes"));
          return (
            <div key={k} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-xs font-semibold text-muted-foreground">{i?.nome ?? k.toUpperCase()}</span>
                {falhou && i && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" aria-label="Último dado válido" />}
              </div>
              {i ? (
                <>
                  <div className="mt-1 font-serif text-xl font-bold text-foreground">{pct(i.valor, i.valor < 1 ? 4 : 2)}</div>
                  <div className="text-[11px] text-muted-foreground">{i.unidade}</div>
                  {i.acum12 != null && (
                    <span className="mt-2 inline-block rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">12 meses: {pct(i.acum12)}</span>
                  )}
                  <div className="mt-2 text-[11px] leading-snug text-muted-foreground">
                    <div>{i.referencia}</div>
                    <div>Atualizado {new Date(i.atualizadoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</div>
                  </div>
                </>
              ) : (
                <div className="mt-2 text-xs text-muted-foreground">{carregando ? "Carregando…" : "Fonte indisponível. Tente atualizar."}</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const sel = "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

export function Investimentos({ ind }: { ind: EstadoIndicadores }) {
  const { cache } = ind;
  const [apl, setApl] = useState<Aplicacao[]>([]);
  const [ok, setOk] = useState(false);
  const [sim, setSim] = useState<{ valor: number | null; meses: number; pctCdi: number; spread: number; pre: number }>({ valor: null, meses: 12, pctCdi: 100, spread: 6, pre: 12 });

  useEffect(() => {
    setApl(carregarAplicacoes());
    setOk(true);
  }, []);
  useEffect(() => {
    if (ok) salvarAplicacoes(apl);
  }, [apl, ok]);

  const meses = useMemo(() => mesesDisponiveis(cache), [cache]);
  const hojeAm = new Date().toISOString().slice(0, 7);
  const atualizar = (id: string, p: Partial<Aplicacao>) => setApl((a) => a.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const evolucoes = useMemo(() => apl.map((a) => ({ a, ev: evolucao(a, cache, meses) })), [apl, cache, meses]);
  const totalAplicado = apl.reduce((s, a) => s + (a.valor ?? 0), 0);
  const totalAtual = evolucoes.reduce((s, { a, ev }) => {
    const ks = Object.keys(ev);
    return s + (ks.length ? (ev[ks[ks.length - 1]!] ?? 0) : (a.valor ?? 0));
  }, 0);
  const rend = totalAtual - totalAplicado;

  const patrimonio = meses
    .filter((m) => apl.some((a) => a.inicio <= m))
    .map((m) => {
      let total = 0;
      let aplicado = 0;
      for (const { a, ev } of evolucoes) {
        if (a.inicio > m || !a.valor) continue;
        aplicado += a.valor;
        const ks = Object.keys(ev).filter((k) => k <= m);
        total += ks.length ? (ev[ks[ks.length - 1]!] ?? a.valor) : a.valor;
      }
      return { mes: rotuloMes(m), Patrimônio: total, Aplicado: aplicado };
    });

  const mensal12 = meses.slice(-12).map((m) => {
    const o: Record<string, string | number | null> = { mes: rotuloMes(m) };
    for (const k of ["selic", "cdi", "ipca", "igpm", "tr", "poupanca"] as Chave[]) o[cache.indicadores[k]?.nome ?? k] = cache.mensal[k]?.[m] ?? null;
    return o;
  });
  const anual = ORDEM.map((k) => ({ nome: cache.indicadores[k]?.nome ?? k, "Acumulado 12 meses": cache.indicadores[k]?.acum12 ?? 0, cor: COR[k] }));

  const comparativo = (
    [
      ["Poupança", taxaAnualAtual("poupanca", null, cache)],
      [`${sim.pctCdi}% do CDI`, taxaAnualAtual("cdi", sim.pctCdi, cache)],
      ["Tesouro Selic", taxaAnualAtual("selic", null, cache)],
      [`IPCA + ${sim.spread}%`, taxaAnualAtual("ipca", sim.spread, cache)],
      [`Prefixado ${sim.pre}%`, taxaAnualAtual("prefixado", sim.pre, cache)],
    ] as [string, number | null][]
  ).map(([nome, ta]) => {
    const fator = ta == null ? null : Math.pow(1 + ta / 100, sim.meses / 12);
    return { nome, taxa: ta, final: fator && sim.valor ? sim.valor * fator : null };
  });
  const melhor = Math.max(...comparativo.map((c) => c.final ?? 0));

  return (
    <div className="space-y-6">
      <CardsIndicadores ind={ind} />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Total aplicado", formatarMoedaZero(totalAplicado), "text-foreground"],
          ["Patrimônio atual", formatarMoedaZero(totalAtual), "text-foreground"],
          ["Rendimento acumulado", `${formatarMoedaZero(rend)} (${pct(totalAplicado ? (rend / totalAplicado) * 100 : 0)})`, rend >= 0 ? "text-success" : "text-destructive"],
        ].map(([r, v, c]) => (
          <div key={r} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="text-xs text-muted-foreground">{r}</div>
            <div className={`mt-1 truncate font-serif text-lg font-bold ${c}`}>{v}</div>
          </div>
        ))}
      </div>

      <Cartao titulo="Simulador: vou investir um valor" subtitulo="Compare quanto o valor renderia com as taxas oficiais atuais. Projeção, não garantia de rentabilidade.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs text-muted-foreground">Valor (R$)
            <Input type="number" min={0} value={sim.valor ?? ""} onChange={(e) => setSim({ ...sim, valor: e.target.value === "" ? null : Number(e.target.value) })} className="mt-1 h-10 rounded-xl" placeholder="Ex.: 1000" />
          </label>
          <label className="text-xs text-muted-foreground">Prazo (meses)
            <Input type="number" min={1} max={360} value={sim.meses} onChange={(e) => setSim({ ...sim, meses: Math.max(1, Number(e.target.value) || 1) })} className="mt-1 h-10 rounded-xl" />
          </label>
          <label className="text-xs text-muted-foreground">% do CDI
            <Input type="number" min={0} value={sim.pctCdi} onChange={(e) => setSim({ ...sim, pctCdi: Number(e.target.value) || 0 })} className="mt-1 h-10 rounded-xl" />
          </label>
          <label className="text-xs text-muted-foreground">IPCA + (% a.a.)
            <Input type="number" min={0} step="0.01" value={sim.spread} onChange={(e) => setSim({ ...sim, spread: Number(e.target.value) || 0 })} className="mt-1 h-10 rounded-xl" />
          </label>
          <label className="text-xs text-muted-foreground">Prefixado (% a.a.)
            <Input type="number" min={0} step="0.01" value={sim.pre} onChange={(e) => setSim({ ...sim, pre: Number(e.target.value) || 0 })} className="mt-1 h-10 rounded-xl" />
          </label>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {comparativo.map((c) => (
            <div key={c.nome} className={`rounded-xl border p-3 ${c.final && c.final === melhor ? "border-success bg-success-soft" : "border-border bg-muted/40"}`}>
              <div className="text-xs font-semibold text-muted-foreground">{c.nome}</div>
              <div className="text-[11px] text-muted-foreground">{c.taxa == null ? "taxa indisponível" : `${pct(c.taxa)} a.a.`}</div>
              <div className="mt-1 font-serif text-base font-bold text-foreground">{c.final ? formatarMoedaZero(c.final) : "—"}</div>
              {c.final && sim.valor ? <div className="text-[11px] text-success">+ {formatarMoedaZero(c.final - sim.valor)}</div> : null}
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">Valores brutos, sem imposto de renda. IPCA+ usa o IPCA acumulado em 12 meses; poupança usa o último rendimento mensal oficial.</p>
      </Cartao>

      <Cartao titulo="Minhas aplicações" subtitulo="Rentabilidade calculada com as taxas oficiais de cada mês desde o início da aplicação">
        <div className="mb-3 flex justify-end">
          <Button size="sm" className="rounded-xl" onClick={() => setApl((a) => [...a, { id: novoId(), descricao: "Nova aplicação", valor: null, inicio: meses[meses.length - 1] ?? hojeAm, indexador: "cdi", taxa: 100 }])}>
            <Plus className="h-4 w-4" /> Adicionar aplicação
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Aplicação</th><th className="px-3 py-2">Indexador</th><th className="px-3 py-2">Taxa</th><th className="px-3 py-2">Início</th><th className="px-3 py-2 text-right">Aplicado</th><th className="px-3 py-2 text-right">Valor atual</th><th className="px-3 py-2 text-right">Rentab.</th><th />
              </tr>
            </thead>
            <tbody>
              {apl.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-10 text-center text-sm text-muted-foreground"><Calculator className="mx-auto mb-2 h-6 w-6" />Nenhuma aplicação cadastrada.</td></tr>
              )}
              {evolucoes.map(({ a, ev }) => {
                const ks = Object.keys(ev);
                const atual = ks.length ? ev[ks[ks.length - 1]!]! : (a.valor ?? 0);
                const r = a.valor ? ((atual - a.valor) / a.valor) * 100 : 0;
                return (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-3 py-2"><Input value={a.descricao} onChange={(e) => atualizar(a.id, { descricao: e.target.value })} className="h-9 w-44 rounded-lg" /></td>
                    <td className="px-3 py-2">
                      <select value={a.indexador} onChange={(e) => atualizar(a.id, { indexador: e.target.value as Indexador })} className={`${sel} h-9 w-36`}>
                        {(Object.keys(NOMES_INDEXADOR) as Indexador[]).map((k) => <option key={k} value={k}>{NOMES_INDEXADOR[k]}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      {a.indexador === "selic" || a.indexador === "poupanca" ? <span className="text-xs text-muted-foreground">oficial</span> : (
                        <Input type="number" step="0.01" value={a.taxa ?? ""} onChange={(e) => atualizar(a.id, { taxa: e.target.value === "" ? null : Number(e.target.value) })} className="h-9 w-24 rounded-lg" title={a.indexador === "cdi" ? "% do CDI" : "% ao ano"} />
                      )}
                    </td>
                    <td className="px-3 py-2"><input type="month" value={a.inicio} onChange={(e) => atualizar(a.id, { inicio: e.target.value })} className={`${sel} h-9 w-40`} /></td>
                    <td className="px-3 py-2 text-right"><Input type="number" min={0} value={a.valor ?? ""} onChange={(e) => atualizar(a.id, { valor: e.target.value === "" ? null : Number(e.target.value) })} className="ml-auto h-9 w-28 rounded-lg text-right" /></td>
                    <td className="px-3 py-2 text-right text-sm font-semibold text-foreground">{formatarMoedaZero(atual)}</td>
                    <td className={`px-3 py-2 text-right text-sm font-semibold ${r >= 0 ? "text-success" : "text-destructive"}`}>{pct(r)}</td>
                    <td className="px-3 py-2"><button onClick={() => setApl((x) => x.filter((y) => y.id !== a.id))} className="text-muted-foreground hover:text-destructive" title="Remover"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">O cálculo usa os meses já publicados pelas fontes oficiais (até 24 meses). Meses ainda não divulgados entram quando a fonte publicar.</p>
      </Cartao>

      <div className="grid gap-6 lg:grid-cols-2">
        <Cartao titulo="Evolução do patrimônio" subtitulo="Valor aplicado x valor corrigido">
          <div className="h-64">
            {patrimonio.length === 0 ? <div className="grid h-full place-items-center text-sm text-muted-foreground">Cadastre uma aplicação para ver a evolução.</div> : (
              <ResponsiveContainer>
                <LineChart data={patrimonio}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="mes" fontSize={11} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
                  <YAxis fontSize={11} width={70} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" tickFormatter={(v) => `R$ ${Math.round(v)}`} />
                  <Tooltip formatter={(v: number) => formatarMoedaZero(v)} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Patrimônio" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="Aplicado" stroke="var(--chart-3)" strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Cartao>
        <Cartao titulo="Desempenho anual" subtitulo="Acumulado dos últimos 12 meses por indicador">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={anual}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="nome" fontSize={10} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" interval={0} tickFormatter={(v: string) => v.split(" ")[0] ?? v} />
                <YAxis fontSize={11} width={40} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number) => pct(v)} />
                <Bar dataKey="Acumulado 12 meses" radius={[6, 6, 0, 0]} fill="var(--chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Cartao>
      </div>

      <Cartao titulo="Desempenho mensal" subtitulo="Variação mensal oficial de cada indicador (% no mês)">
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={mensal12}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="mes" fontSize={11} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
              <YAxis fontSize={11} width={45} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: number) => pct(v, 2)} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              {ORDEM.map((k) => <Line key={k} type="monotone" dataKey={cache.indicadores[k]?.nome ?? k} stroke={COR[k]} strokeWidth={2} dot={false} connectNulls />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Cartao>
    </div>
  );
}
