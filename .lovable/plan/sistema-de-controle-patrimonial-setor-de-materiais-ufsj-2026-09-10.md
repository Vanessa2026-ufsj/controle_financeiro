# Sistema de Controle Patrimonial — Setor de Materiais UFSJ

Sistema web para cadastrar, localizar e conferir os bens patrimoniais do setor de materiais, com dados salvos na nuvem (Lovable Cloud) e acesso por login.

## Como vai funcionar

**Entrar no sistema**
- Página de acesso com e-mail e senha.
- Dois perfis: administrador (cadastra, edita e remove) e consulta (apenas visualiza).

**Painel inicial**
- Total de bens cadastrados, valor total do patrimônio, bens por estado de conservação e por setor.
- Atalhos para cadastrar bem e abrir o inventário.

**Cadastro de bens**
- Número de patrimônio (único), descrição, categoria, marca/modelo, número de série.
- Valor de aquisição, data de aquisição, nota fiscal (número).
- Estado de conservação: novo, bom, regular, ruim, inservível.
- Situação: em uso, em estoque, em manutenção, baixado.
- Setor/sala onde está e servidor responsável.

**Consulta**
- Lista em tabela com busca por número, descrição ou responsável.
- Filtros por setor, categoria, estado e situação.
- Página de detalhe de cada bem com o histórico de movimentações.

**Movimentações**
- Registrar transferência de um bem entre setores/responsáveis, com data e observação.
- Registrar baixa do bem com motivo.

**Inventário**
- Criar uma campanha de conferência por período.
- Marcar cada bem como conferido, não localizado ou divergente.
- Ver o percentual conferido e a lista de pendências.

**Cadastros auxiliares**
- Setores/salas, categorias e responsáveis, gerenciados pelo administrador.

**Relatórios**
- Exportar a listagem filtrada em CSV e versão para impressão.

## Visual

Estilo institucional sóbrio com a identidade da UFSJ: base clara, tipografia legível, tabelas densas e bem espaçadas, foco em leitura rápida. Cabeçalho fixo com navegação entre Painel, Bens, Movimentações, Inventário e Cadastros.

## Detalhes técnicos

- Lovable Cloud para banco de dados e autenticação.
- Tabelas: `profiles`, `user_roles` (tabela separada + função `has_role`), `setores`, `categorias`, `bens`, `movimentacoes`, `inventarios`, `inventario_itens`.
- RLS em todas as tabelas: leitura para usuários autenticados; escrita restrita ao papel admin.
- Leituras e escritas via server functions do TanStack Start; rotas protegidas sob `_authenticated`, página pública apenas para login.
- Alguns setores e categorias de exemplo são inseridos na migração para o sistema já abrir utilizável.

## Observações

Os setores, categorias e usuários iniciais serão exemplos genéricos. Envie a lista real do setor de materiais (setores/salas e responsáveis) que eu substituo.

## Etapas

1. Ativar o Lovable Cloud e criar o banco com as tabelas e regras de acesso.
2. Login, perfis e proteção das páginas.
3. Cadastro, listagem, busca e detalhe dos bens.
4. Movimentações e baixa.
5. Inventário e conferência.
6. Painel com indicadores e exportação.
