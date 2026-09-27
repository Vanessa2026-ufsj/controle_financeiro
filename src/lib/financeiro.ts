export const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export const MESES_CURTOS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

export type ValoresMeses = (number | null)[];

export type Linha = {
  id: string;
  nome: string;
  valores: ValoresMeses;
};

export type CompraCartao = {
  id: string;
  descricao: string;
  valorTotal: number | null;
  parcelas: number;
  mesInicio: number; // 0-11
};

export type EstadoFinanceiro = {
  receitas: Linha[];
  gastos: Linha[];
  poupanca: ValoresMeses;
  compras: CompraCartao[];
};

export function novoId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function mesesVazios(): ValoresMeses {
  return Array(12).fill(null);
}

export function estadoInicial(): EstadoFinanceiro {
  return {
    receitas: [
      { id: novoId(), nome: "Salário", valores: mesesVazios() },
      { id: novoId(), nome: "Complemento", valores: mesesVazios() },
    ],
    gastos: [
      { id: novoId(), nome: "Aluguel", valores: mesesVazios() },
      { id: novoId(), nome: "Energia", valores: mesesVazios() },
      { id: novoId(), nome: "Água", valores: mesesVazios() },
      { id: novoId(), nome: "Supermercado", valores: mesesVazios() },
      { id: novoId(), nome: "Combustível", valores: mesesVazios() },
      { id: novoId(), nome: "Celular", valores: mesesVazios() },
      { id: novoId(), nome: "Saúde", valores: mesesVazios() },
      { id: novoId(), nome: "Lazer", valores: mesesVazios() },
    ],
    poupanca: mesesVazios(),
    compras: [],
  };
}

const CHAVE = "controle-financeiro-mensal-v1";

export function carregarEstado(): EstadoFinanceiro {
  if (typeof window === "undefined") return estadoInicial();
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return estadoInicial();
    const dados = JSON.parse(bruto) as EstadoFinanceiro;
    if (!Array.isArray(dados.receitas) || !Array.isArray(dados.gastos)) {
      return estadoInicial();
    }
    return {
      receitas: dados.receitas,
      gastos: dados.gastos,
      poupanca:
        Array.isArray(dados.poupanca) && dados.poupanca.length === 12
          ? dados.poupanca
          : mesesVazios(),
      compras: Array.isArray(dados.compras) ? dados.compras : [],
    };
  } catch {
    return estadoInicial();
  }
}

export function salvarEstado(estado: EstadoFinanceiro) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAVE, JSON.stringify(estado));
}

export function limparEstado() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CHAVE);
}

export function somar(valores: ValoresMeses): number {
  return valores.reduce<number>((acc, v) => acc + (v ?? 0), 0);
}

export function valorParcela(compra: CompraCartao): number {
  if (!compra.valorTotal || compra.parcelas <= 0) return 0;
  return compra.valorTotal / compra.parcelas;
}

/** Distribui as parcelas de cada compra pelos meses e retorna o total do cartão por mês. */
export function cartaoPorMes(compras: CompraCartao[]): number[] {
  const totais = Array(12).fill(0) as number[];
  for (const compra of compras) {
    const parcela = valorParcela(compra);
    if (parcela <= 0) continue;
    for (let i = 0; i < compra.parcelas; i++) {
      const mes = compra.mesInicio + i;
      if (mes < 12) totais[mes] = (totais[mes] ?? 0) + parcela;
    }
  }
  return totais;
}

export function formatarMoeda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "";
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function formatarMoedaZero(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function exportarCsv(estado: EstadoFinanceiro) {
  const cartao = cartaoPorMes(estado.compras);
  const linhas: string[][] = [];
  linhas.push(["Item", ...MESES, "Total"]);

  const addLinha = (nome: string, valores: ValoresMeses) => {
    linhas.push([
      nome,
      ...valores.map((v) => (v === null ? "" : String(v).replace(".", ","))),
      String(somar(valores)).replace(".", ","),
    ]);
  };

  linhas.push(["RECEITAS", ...Array(13).fill("")]);
  estado.receitas.forEach((l) => addLinha(l.nome, l.valores));
  linhas.push(["GASTOS", ...Array(13).fill("")]);
  estado.gastos.forEach((l) => addLinha(l.nome, l.valores));
  linhas.push([
    "Cartão de crédito",
    ...cartao.map((v) => String(v.toFixed(2)).replace(".", ",")),
    String(cartao.reduce((a, b) => a + b, 0).toFixed(2)).replace(".", ","),
  ]);
  addLinha("Poupança (Economia)", estado.poupanca);

  const csv = linhas.map((l) => l.map((c) => `"${c}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "controle-financeiro-mensal.csv";
  a.click();
  URL.revokeObjectURL(url);
}
