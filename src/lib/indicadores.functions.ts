import { createServerFn } from "@tanstack/react-start";

/** Séries oficiais do Sistema Gerenciador de Séries Temporais (SGS) do Banco Central. */
const SERIES = {
  selic: 432, // meta Selic, % a.a. (Copom)
  cdi: 4389, // CDI anualizado base 252, % a.a.
  selicMes: 4390, // Selic acumulada no mês, %
  cdiMes: 4391, // CDI acumulado no mês, %
  ipca: 433, // IPCA variação mensal, % (IBGE)
  igpm: 189, // IGP-M variação mensal, % (FGV)
  tr: 226, // TR, % ao período
  poupanca: 195, // rendimento da poupança, % ao período
} as const;

export type Ponto = { data: string; valor: number };
export type RespostaIndicadores = {
  series: Partial<Record<keyof typeof SERIES, Ponto[]>>;
  falhas: string[];
  consultadoEm: string;
};

function paraIso(br: string): string {
  const [d, m, a] = br.split("/");
  return `${a}-${m}-${d}`;
}

async function buscar(codigo: number, n: number): Promise<Ponto[]> {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/${n}?formato=json`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const json = (await r.json()) as { data: string; valor: string }[];
    if (!Array.isArray(json) || json.length === 0) throw new Error("vazio");
    return json
      .map((p) => ({ data: paraIso(p.data), valor: Number(p.valor) }))
      .filter((p) => isFinite(p.valor))
      .sort((a, b) => a.data.localeCompare(b.data));
  } finally {
    clearTimeout(t);
  }
}

export const obterIndicadores = createServerFn({ method: "GET" }).handler(async (): Promise<RespostaIndicadores> => {
  const chaves = Object.keys(SERIES) as (keyof typeof SERIES)[];
  const res = await Promise.allSettled(
    chaves.map((k) => buscar(SERIES[k], k === "selic" || k === "cdi" ? 1 : k === "tr" || k === "poupanca" ? 800 : 25)),
  );
  const series: RespostaIndicadores["series"] = {};
  const falhas: string[] = [];
  res.forEach((r, i) => {
    const k = chaves[i]!;
    if (r.status === "fulfilled") series[k] = r.value;
    else {
      falhas.push(k);
      console.error(`Falha na série ${k}:`, r.reason);
    }
  });
  return { series, falhas, consultadoEm: new Date().toISOString() };
});
