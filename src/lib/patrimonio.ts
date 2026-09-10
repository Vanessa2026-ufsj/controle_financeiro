export const ESTADOS = {
  novo: "Novo",
  bom: "Bom",
  regular: "Regular",
  ruim: "Ruim",
  inservivel: "Inservível",
} as const;

export const SITUACOES = {
  em_uso: "Em uso",
  em_estoque: "Em estoque",
  em_manutencao: "Em manutenção",
  baixado: "Baixado",
} as const;

export const TIPOS_MOV = {
  cadastro: "Cadastro",
  transferencia: "Transferência",
  manutencao: "Manutenção",
  baixa: "Baixa",
} as const;

export const STATUS_CONFERENCIA = {
  pendente: "Pendente",
  conferido: "Conferido",
  nao_localizado: "Não localizado",
  divergente: "Divergente",
} as const;

export type Estado = keyof typeof ESTADOS;
export type Situacao = keyof typeof SITUACOES;
export type TipoMov = keyof typeof TIPOS_MOV;
export type StatusConferencia = keyof typeof STATUS_CONFERENCIA;

export type Setor = {
  id: string;
  nome: string;
  sigla: string;
  localizacao: string;
};

export type Categoria = {
  id: string;
  nome: string;
  descricao: string;
};

export type Bem = {
  id: string;
  numero_patrimonio: string;
  descricao: string;
  categoria_id: string | null;
  marca: string;
  modelo: string;
  numero_serie: string;
  valor_aquisicao: number;
  data_aquisicao: string | null;
  nota_fiscal: string;
  estado: Estado;
  situacao: Situacao;
  setor_id: string | null;
  responsavel: string;
  observacoes: string;
  created_at: string;
};

export function formatarMoeda(valor: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(valor ?? 0),
  );
}

export function formatarData(data: string | null | undefined) {
  if (!data) return "—";
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  if (!ano || !mes || !dia) return "—";
  return `${dia}/${mes}/${ano}`;
}

export function baixarCsv(nomeArquivo: string, linhas: (string | number)[][]) {
  const conteudo = linhas
    .map((linha) =>
      linha
        .map((celula) => `"${String(celula ?? "").replace(/"/g, '""')}"`)
        .join(";"),
    )
    .join("\n");
  const blob = new Blob(["\uFEFF" + conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}
