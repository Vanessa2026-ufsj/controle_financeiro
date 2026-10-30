import type { Ponto, RespostaIndicadores } from "./indicadores.functions";

export type Chave = "selic" | "cdi" | "ipca" | "igpm" | "tr" | "poupanca";
export type Indicador = {
  chave: Chave;
  nome: string;
  fonte: string;
  valor: number; // %
  unidade: string;
  referencia: string; // período
  acum12: number | null; // % acumulado 12 meses
  atualizadoEm: string; // ISO da consulta que trouxe o dado
};

export type Cache = {
  indicadores: Partial<Record<Chave, Indicador>>;
  /** Taxa mensal (%) por mês "AAAA-MM" de cada série. */
  mensal: Partial<Record<Chave, Record<string, number>>>;
};

const CHAVE = "controle-financeiro-indicadores-v1";
const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function rotuloMes(am: string): string {
  const [a, m] = am.split("-");
  return `${MESES_ABREV[Number(m) - 1]}/${a?.slice(2)}`;
}
const dataBr = (iso: string) => iso.split("-").reverse().join("/");

export function carregarCache(): Cache {
  try {
    const b = localStorage.getItem(CHAVE);
    if (b) return JSON.parse(b) as Cache;
  } catch {
    /* ignora */
  }
  return { indicadores: {}, mensal: {} };
}
export function salvarCache(c: Cache) {
  localStorage.setItem(CHAVE, JSON.stringify(c));
}

/** Converte série mensal em mapa AAAA-MM -> %. Para séries diárias (TR, poupança) usa o período iniciado no dia 1º. */
function porMes(pts: Ponto[], diaria: boolean): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of pts) {
    if (diaria && !p.data.endsWith("-01")) continue;
    out[p.data.slice(0, 7)] = p.valor;
  }
  return out;
}

function acumulado(mapa: Record<string, number>, n = 12): number | null {
  const ult = Object.keys(mapa).sort().slice(-n);
  if (ult.length < n) return null;
  return (ult.reduce((f, k) => f * (1 + (mapa[k] ?? 0) / 100), 1) - 1) * 100;
}

/** Mescla a resposta nova ao cache: séries que falharam mantêm o último dado válido. */
export function mesclar(cache: Cache, r: RespostaIndicadores): Cache {
  const novo: Cache = { indicadores: { ...cache.indicadores }, mensal: { ...cache.mensal } };
  const s = r.series;
  const quando = r.consultadoEm;
  const ultimo = (p?: Ponto[]) => (p && p.length ? p[p.length - 1] : undefined);

  if (s.cdiMes) novo.mensal.cdi = porMes(s.cdiMes, false);
  if (s.selicMes) novo.mensal.selic = porMes(s.selicMes, false);
  if (s.ipca) novo.mensal.ipca = porMes(s.ipca, false);
  if (s.igpm) novo.mensal.igpm = porMes(s.igpm, false);
  if (s.tr) novo.mensal.tr = porMes(s.tr, true);
  if (s.poupanca) novo.mensal.poupanca = porMes(s.poupanca, true);

  const sel = ultimo(s.selic);
  if (sel)
    novo.indicadores.selic = { chave: "selic", nome: "Taxa Selic", fonte: "Banco Central (Copom)", valor: sel.valor, unidade: "% a.a.", referencia: `Meta vigente desde ${dataBr(sel.data)}`, acum12: novo.mensal.selic ? acumulado(novo.mensal.selic) : null, atualizadoEm: quando };
  const cdi = ultimo(s.cdi);
  if (cdi)
    novo.indicadores.cdi = { chave: "cdi", nome: "CDI", fonte: "Banco Central (SGS 4389)", valor: cdi.valor, unidade: "% a.a.", referencia: `Anualizado em ${dataBr(cdi.data)}`, acum12: novo.mensal.cdi ? acumulado(novo.mensal.cdi) : null, atualizadoEm: quando };
  const ipca = ultimo(s.ipca);
  if (ipca)
    novo.indicadores.ipca = { chave: "ipca", nome: "IPCA", fonte: "IBGE (via BCB SGS 433)", valor: ipca.valor, unidade: "% no mês", referencia: rotuloMes(ipca.data.slice(0, 7)), acum12: acumulado(novo.mensal.ipca ?? {}), atualizadoEm: quando };
  const igpm = ultimo(s.igpm);
  if (igpm)
    novo.indicadores.igpm = { chave: "igpm", nome: "IGP-M", fonte: "FGV (via BCB SGS 189)", valor: igpm.valor, unidade: "% no mês", referencia: rotuloMes(igpm.data.slice(0, 7)), acum12: acumulado(novo.mensal.igpm ?? {}), atualizadoEm: quando };
  const tr = ultimo(s.tr);
  if (tr)
    novo.indicadores.tr = { chave: "tr", nome: "Taxa Referencial (TR)", fonte: "Banco Central (SGS 226)", valor: tr.valor, unidade: "% no período", referencia: `Período iniciado em ${dataBr(tr.data)}`, acum12: acumulado(novo.mensal.tr ?? {}), atualizadoEm: quando };
  const pp = ultimo(s.poupanca);
  if (pp)
    novo.indicadores.poupanca = { chave: "poupanca", nome: "Rendimento da poupança", fonte: "Banco Central (SGS 195)", valor: pp.valor, unidade: "% no período", referencia: `Período iniciado em ${dataBr(pp.data)}`, acum12: acumulado(novo.mensal.poupanca ?? {}), atualizadoEm: quando };
  return novo;
}

// ---------- Aplicações ----------

export type Indexador = "cdi" | "selic" | "ipca" | "poupanca" | "prefixado";
export type Aplicacao = {
  id: string;
  descricao: string;
  valor: number | null;
  inicio: string; // AAAA-MM
  indexador: Indexador;
  /** cdi: % do CDI; ipca: spread % a.a.; prefixado: % a.a.; demais: ignorado */
  taxa: number | null;
};

export const NOMES_INDEXADOR: Record<Indexador, string> = {
  cdi: "% do CDI",
  selic: "Tesouro Selic",
  ipca: "IPCA +",
  poupanca: "Poupança",
  prefixado: "Prefixado",
};

const CHAVE_APL = "controle-financeiro-aplicacoes-v1";
export function carregarAplicacoes(): Aplicacao[] {
  try {
    const b = localStorage.getItem(CHAVE_APL);
    if (b) return JSON.parse(b) as Aplicacao[];
  } catch {
    /* ignora */
  }
  return [];
}
export function salvarAplicacoes(a: Aplicacao[]) {
  localStorage.setItem(CHAVE_APL, JSON.stringify(a));
}

/** Taxa mensal (%) da aplicação num mês com dados oficiais; null se o mês não tem dado. */
export function taxaMensal(a: Aplicacao, mes: string, c: Cache): number | null {
  const anual = (t: number) => (Math.pow(1 + t / 100, 1 / 12) - 1) * 100;
  switch (a.indexador) {
    case "cdi": {
      const v = c.mensal.cdi?.[mes];
      return v === undefined ? null : (v * (a.taxa ?? 100)) / 100;
    }
    case "selic":
      return c.mensal.selic?.[mes] ?? null;
    case "poupanca":
      return c.mensal.poupanca?.[mes] ?? null;
    case "ipca": {
      const v = c.mensal.ipca?.[mes];
      return v === undefined ? null : ((1 + v / 100) * (1 + anual(a.taxa ?? 0) / 100) - 1) * 100;
    }
    case "prefixado":
      return anual(a.taxa ?? 0);
  }
}

/** Meses com dados oficiais disponíveis (união das séries), em ordem. */
export function mesesDisponiveis(c: Cache): string[] {
  const s = new Set<string>();
  for (const k of ["cdi", "selic", "ipca", "poupanca"] as const) Object.keys(c.mensal[k] ?? {}).forEach((m) => s.add(m));
  return [...s].sort();
}

/** Evolução do saldo da aplicação mês a mês com as taxas oficiais realizadas. */
export function evolucao(a: Aplicacao, c: Cache, meses: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  if (!a.valor) return out;
  let saldo = a.valor;
  for (const m of meses) {
    if (m < a.inicio) continue;
    const t = taxaMensal(a, m, c);
    if (t === null) break;
    saldo *= 1 + t / 100;
    out[m] = saldo;
  }
  return out;
}

/** Projeção de 12 meses pelas taxas atuais (não é garantia de rentabilidade futura). */
export function taxaAnualAtual(ind: Indexador, taxa: number | null, c: Cache): number | null {
  const i = c.indicadores;
  switch (ind) {
    case "cdi":
      return i.cdi ? (i.cdi.valor * (taxa ?? 100)) / 100 : null;
    case "selic":
      return i.selic?.valor ?? null;
    case "poupanca":
      return i.poupanca ? (Math.pow(1 + i.poupanca.valor / 100, 12) - 1) * 100 : null;
    case "ipca":
      return i.ipca?.acum12 != null ? ((1 + i.ipca.acum12 / 100) * (1 + (taxa ?? 0) / 100) - 1) * 100 : null;
    case "prefixado":
      return taxa ?? null;
  }
}
