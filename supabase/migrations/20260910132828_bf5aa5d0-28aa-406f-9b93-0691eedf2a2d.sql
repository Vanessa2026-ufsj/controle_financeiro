-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'consulta');
CREATE TYPE public.estado_conservacao AS ENUM ('novo', 'bom', 'regular', 'ruim', 'inservivel');
CREATE TYPE public.situacao_bem AS ENUM ('em_uso', 'em_estoque', 'em_manutencao', 'baixado');
CREATE TYPE public.tipo_movimentacao AS ENUM ('transferencia', 'manutencao', 'baixa', 'cadastro');
CREATE TYPE public.status_conferencia AS ENUM ('pendente', 'conferido', 'nao_localizado', 'divergente');

-- UPDATED AT
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "user_roles_select_authenticated" ON public.user_roles FOR SELECT TO authenticated USING (true);

-- SIGNUP TRIGGER: cria perfil e papel (primeiro usuário vira admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE total INT;
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'full_name', ''), COALESCE(NEW.email, ''));
  SELECT count(*) INTO total FROM public.user_roles;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN total = 0 THEN 'admin'::public.app_role ELSE 'consulta'::public.app_role END);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SETORES
CREATE TABLE public.setores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  sigla TEXT NOT NULL DEFAULT '',
  localizacao TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.setores TO authenticated;
GRANT ALL ON public.setores TO service_role;
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "setores_select" ON public.setores FOR SELECT TO authenticated USING (true);
CREATE POLICY "setores_write" ON public.setores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER setores_updated_at BEFORE UPDATE ON public.setores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CATEGORIAS
CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categorias_select" ON public.categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "categorias_write" ON public.categorias FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER categorias_updated_at BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- BENS
CREATE TABLE public.bens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_patrimonio TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  marca TEXT NOT NULL DEFAULT '',
  modelo TEXT NOT NULL DEFAULT '',
  numero_serie TEXT NOT NULL DEFAULT '',
  valor_aquisicao NUMERIC(14,2) NOT NULL DEFAULT 0,
  data_aquisicao DATE,
  nota_fiscal TEXT NOT NULL DEFAULT '',
  estado public.estado_conservacao NOT NULL DEFAULT 'bom',
  situacao public.situacao_bem NOT NULL DEFAULT 'em_uso',
  setor_id UUID REFERENCES public.setores(id) ON DELETE SET NULL,
  responsavel TEXT NOT NULL DEFAULT '',
  observacoes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bens_setor_idx ON public.bens(setor_id);
CREATE INDEX bens_categoria_idx ON public.bens(categoria_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bens TO authenticated;
GRANT ALL ON public.bens TO service_role;
ALTER TABLE public.bens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bens_select" ON public.bens FOR SELECT TO authenticated USING (true);
CREATE POLICY "bens_write" ON public.bens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER bens_updated_at BEFORE UPDATE ON public.bens FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- MOVIMENTACOES
CREATE TABLE public.movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bem_id UUID NOT NULL REFERENCES public.bens(id) ON DELETE CASCADE,
  tipo public.tipo_movimentacao NOT NULL DEFAULT 'transferencia',
  setor_origem_id UUID REFERENCES public.setores(id) ON DELETE SET NULL,
  setor_destino_id UUID REFERENCES public.setores(id) ON DELETE SET NULL,
  responsavel_origem TEXT NOT NULL DEFAULT '',
  responsavel_destino TEXT NOT NULL DEFAULT '',
  data_movimentacao DATE NOT NULL DEFAULT CURRENT_DATE,
  observacao TEXT NOT NULL DEFAULT '',
  registrado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX movimentacoes_bem_idx ON public.movimentacoes(bem_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentacoes TO authenticated;
GRANT ALL ON public.movimentacoes TO service_role;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "movimentacoes_select" ON public.movimentacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "movimentacoes_write" ON public.movimentacoes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- INVENTARIOS
CREATE TABLE public.inventarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  encerrado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventarios TO authenticated;
GRANT ALL ON public.inventarios TO service_role;
ALTER TABLE public.inventarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventarios_select" ON public.inventarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventarios_write" ON public.inventarios FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER inventarios_updated_at BEFORE UPDATE ON public.inventarios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- INVENTARIO ITENS
CREATE TABLE public.inventario_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventario_id UUID NOT NULL REFERENCES public.inventarios(id) ON DELETE CASCADE,
  bem_id UUID NOT NULL REFERENCES public.bens(id) ON DELETE CASCADE,
  status public.status_conferencia NOT NULL DEFAULT 'pendente',
  observacao TEXT NOT NULL DEFAULT '',
  conferido_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conferido_em TIMESTAMPTZ,
  UNIQUE (inventario_id, bem_id)
);
CREATE INDEX inventario_itens_inv_idx ON public.inventario_itens(inventario_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventario_itens TO authenticated;
GRANT ALL ON public.inventario_itens TO service_role;
ALTER TABLE public.inventario_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventario_itens_select" ON public.inventario_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventario_itens_write" ON public.inventario_itens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- DADOS INICIAIS
INSERT INTO public.setores (nome, sigla, localizacao) VALUES
  ('Setor de Materiais', 'SEMAT', 'Campus Santo Antônio - Prédio Administrativo'),
  ('Almoxarifado Central', 'ALMOX', 'Campus Santo Antônio - Bloco B'),
  ('Divisão de Patrimônio', 'DIPAT', 'Campus Santo Antônio - Sala 12'),
  ('Secretaria Geral', 'SEGER', 'Campus Dom Bosco - Prédio Central'),
  ('Laboratório de Informática', 'LABINF', 'Campus Dom Bosco - Sala 205');

INSERT INTO public.categorias (nome, descricao) VALUES
  ('Mobiliário', 'Mesas, cadeiras, armários e estantes'),
  ('Equipamentos de Informática', 'Computadores, monitores, impressoras e periféricos'),
  ('Equipamentos de Laboratório', 'Instrumentos e aparelhos de uso laboratorial'),
  ('Eletrodomésticos', 'Aparelhos de refrigeração, climatização e copa'),
  ('Veículos', 'Automóveis e utilitários institucionais');