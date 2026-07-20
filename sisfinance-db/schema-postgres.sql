BEGIN;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Tabelas base (financeiro)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.empresas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['Unidade Operacional'::text, 'Holding'::text, 'Franquia'::text])),
  cnpj text,
  endereco text,
  responsavel text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  cliente_sistema_id uuid,
  CONSTRAINT empresas_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.contas_financeiras (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empresa_id uuid NOT NULL,
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['Caixa'::text, 'Banco'::text, 'Cartão'::text])),
  banco text,
  agencia text,
  conta text,
  saldo_inicial numeric NOT NULL DEFAULT 0,
  saldo_atual numeric NOT NULL DEFAULT 0,
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT contas_financeiras_pkey PRIMARY KEY (id),
  CONSTRAINT contas_financeiras_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);

CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empresa_id uuid NOT NULL,
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['Pessoa Física'::text, 'Pessoa Jurídica'::text])),
  documento text,
  contato text,
  email text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT clientes_pkey PRIMARY KEY (id),
  CONSTRAINT clientes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);

CREATE TABLE IF NOT EXISTS public.fornecedores (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empresa_id uuid NOT NULL,
  nome text NOT NULL,
  categoria text,
  contato text,
  email text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fornecedores_pkey PRIMARY KEY (id),
  CONSTRAINT fornecedores_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);

CREATE TABLE IF NOT EXISTS public.funcionarios (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empresa_id uuid NOT NULL,
  nome text NOT NULL,
  cargo text NOT NULL CHECK (cargo = ANY (ARRAY['Garçom'::text, 'Atendente'::text, 'Freelancer'::text, 'Cozinheiro'::text, 'Gerente'::text, 'Outro'::text])),
  tipo_contrato text NOT NULL CHECK (tipo_contrato = ANY (ARRAY['CLT'::text, 'Freelancer'::text, 'Diária'::text, 'Temporário'::text])),
  documento text,
  contato text,
  salario_base numeric,
  data_admissao date,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT funcionarios_pkey PRIMARY KEY (id),
  CONSTRAINT funcionarios_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);

CREATE TABLE IF NOT EXISTS public.pagamentos_extras (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empresa_id uuid NOT NULL,
  funcionario_id uuid NOT NULL,
  conta_origem_id uuid NOT NULL,
  tipo_extra text NOT NULL CHECK (tipo_extra = ANY (ARRAY['Gorjeta'::text, 'Diária'::text, 'Comissão'::text, 'Bonificação'::text, 'Adiantamento'::text])),
  valor numeric NOT NULL CHECK (valor > 0::numeric),
  data_pagamento date NOT NULL,
  descricao text,
  status text NOT NULL DEFAULT 'Pago'::text CHECK (status = ANY (ARRAY['Pendente'::text, 'Pago'::text])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT pagamentos_extras_pkey PRIMARY KEY (id),
  CONSTRAINT pagamentos_extras_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id),
  CONSTRAINT pagamentos_extras_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id),
  CONSTRAINT pagamentos_extras_conta_origem_id_fkey FOREIGN KEY (conta_origem_id) REFERENCES public.contas_financeiras(id)
);

CREATE TABLE IF NOT EXISTS public.categorias_produtos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empresa_id uuid NOT NULL,
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT categorias_produtos_pkey PRIMARY KEY (id),
  CONSTRAINT categorias_produtos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);

CREATE TABLE IF NOT EXISTS public.produtos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empresa_id uuid NOT NULL,
  categoria_id uuid,
  codigo text,
  nome text NOT NULL,
  unidade_medida text NOT NULL CHECK (unidade_medida = ANY (ARRAY['UN'::text, 'KG'::text, 'L'::text, 'CX'::text, 'PC'::text])),
  estoque_minimo numeric NOT NULL DEFAULT 0,
  estoque_atual numeric NOT NULL DEFAULT 0,
  preco_custo_medio numeric NOT NULL DEFAULT 0,
  preco_venda numeric,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT produtos_pkey PRIMARY KEY (id),
  CONSTRAINT produtos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias_produtos(id),
  CONSTRAINT produtos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);

CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empresa_id uuid NOT NULL,
  produto_id uuid NOT NULL,
  tipo_movimentacao text NOT NULL CHECK (tipo_movimentacao = ANY (ARRAY['Entrada'::text, 'Saída'::text, 'Ajuste'::text, 'Perda'::text])),
  quantidade numeric NOT NULL,
  preco_unitario numeric,
  valor_total numeric,
  data_movimentacao date NOT NULL DEFAULT CURRENT_DATE,
  documento text,
  observacao text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT movimentacoes_estoque_pkey PRIMARY KEY (id),
  CONSTRAINT movimentacoes_estoque_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id),
  CONSTRAINT movimentacoes_estoque_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES public.produtos(id)
);

CREATE TABLE IF NOT EXISTS public.categorias_receitas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empresa_id uuid,
  nome text NOT NULL,
  grupo text NOT NULL CHECK (grupo = ANY (ARRAY['Operacional'::text, 'Financeira'::text, 'Extraordinária'::text])),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT categorias_receitas_pkey PRIMARY KEY (id),
  CONSTRAINT categorias_receitas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);

CREATE TABLE IF NOT EXISTS public.categorias_despesas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empresa_id uuid,
  nome text NOT NULL,
  grupo text NOT NULL CHECK (grupo = ANY (ARRAY['Fixa'::text, 'Variável'::text, 'Investimento'::text])),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT categorias_despesas_pkey PRIMARY KEY (id),
  CONSTRAINT categorias_despesas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);

CREATE TABLE IF NOT EXISTS public.lancamentos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empresa_id uuid NOT NULL,
  data date NOT NULL,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['Receita'::text, 'Despesa'::text, 'Transferência'::text])),
  categoria_id uuid,
  cliente_id uuid,
  fornecedor_id uuid,
  conta_origem_id uuid NOT NULL,
  conta_destino_id uuid,
  valor numeric NOT NULL CHECK (valor > 0::numeric),
  forma_pagamento text,
  status text NOT NULL CHECK (status = ANY (ARRAY['Previsto'::text, 'Realizado'::text, 'Pago'::text, 'Recebido'::text])),
  descricao text,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT lancamentos_pkey PRIMARY KEY (id),
  CONSTRAINT lancamentos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id),
  CONSTRAINT lancamentos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT lancamentos_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id),
  CONSTRAINT lancamentos_conta_origem_id_fkey FOREIGN KEY (conta_origem_id) REFERENCES public.contas_financeiras(id),
  CONSTRAINT lancamentos_conta_destino_id_fkey FOREIGN KEY (conta_destino_id) REFERENCES public.contas_financeiras(id)
);

CREATE TABLE IF NOT EXISTS public.contas_pagar (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empresa_id uuid NOT NULL,
  fornecedor_id uuid,
  descricao text NOT NULL,
  valor_total numeric NOT NULL CHECK (valor_total > 0::numeric),
  valor_pago numeric NOT NULL DEFAULT 0,
  data_emissao date NOT NULL,
  data_vencimento date NOT NULL,
  data_pagamento date,
  status text NOT NULL CHECK (status = ANY (ARRAY['Em Aberto'::text, 'Pago'::text, 'Atrasado'::text, 'Parcial'::text])),
  categoria_despesa_id uuid,
  conta_origem_id uuid,
  numero_parcela integer,
  total_parcelas integer,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT contas_pagar_pkey PRIMARY KEY (id),
  CONSTRAINT contas_pagar_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id),
  CONSTRAINT contas_pagar_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id),
  CONSTRAINT contas_pagar_categoria_despesa_id_fkey FOREIGN KEY (categoria_despesa_id) REFERENCES public.categorias_despesas(id),
  CONSTRAINT contas_pagar_conta_origem_id_fkey FOREIGN KEY (conta_origem_id) REFERENCES public.contas_financeiras(id)
);

CREATE TABLE IF NOT EXISTS public.contas_receber (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empresa_id uuid NOT NULL,
  cliente_id uuid,
  descricao text NOT NULL,
  valor_total numeric NOT NULL CHECK (valor_total > 0::numeric),
  valor_recebido numeric NOT NULL DEFAULT 0,
  data_emissao date NOT NULL,
  data_vencimento date NOT NULL,
  data_recebimento date,
  status text NOT NULL CHECK (status = ANY (ARRAY['Previsto'::text, 'Recebido'::text, 'Atrasado'::text, 'Parcial'::text])),
  categoria_receita_id uuid,
  conta_destino_id uuid,
  numero_parcela integer,
  total_parcelas integer,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT contas_receber_pkey PRIMARY KEY (id),
  CONSTRAINT contas_receber_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id),
  CONSTRAINT contas_receber_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT contas_receber_categoria_receita_id_fkey FOREIGN KEY (categoria_receita_id) REFERENCES public.categorias_receitas(id),
  CONSTRAINT contas_receber_conta_destino_id_fkey FOREIGN KEY (conta_destino_id) REFERENCES public.contas_financeiras(id)
);

CREATE TABLE IF NOT EXISTS public.fechamentos_caixa (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empresa_id uuid NOT NULL,
  data_fechamento date NOT NULL,
  conta_caixa_id uuid NOT NULL,
  saldo_inicial numeric NOT NULL,
  total_entradas numeric NOT NULL DEFAULT 0,
  total_saidas numeric NOT NULL DEFAULT 0,
  total_gorjetas numeric NOT NULL DEFAULT 0,
  total_extras_pagos numeric NOT NULL DEFAULT 0,
  saldo_final numeric NOT NULL,
  saldo_esperado numeric NOT NULL,
  diferenca numeric NOT NULL DEFAULT 0,
  deposito_banco_id uuid,
  valor_depositado numeric,
  responsavel text,
  observacoes text,
  status text NOT NULL DEFAULT 'Aberto'::text CHECK (status = ANY (ARRAY['Aberto'::text, 'Fechado'::text, 'Conferido'::text])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fechamentos_caixa_pkey PRIMARY KEY (id),
  CONSTRAINT fechamentos_caixa_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id),
  CONSTRAINT fechamentos_caixa_conta_caixa_id_fkey FOREIGN KEY (conta_caixa_id) REFERENCES public.contas_financeiras(id),
  CONSTRAINT fechamentos_caixa_deposito_banco_id_fkey FOREIGN KEY (deposito_banco_id) REFERENCES public.contas_financeiras(id)
);

CREATE TABLE IF NOT EXISTS public.metas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empresa_id uuid NOT NULL,
  mes integer NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano integer NOT NULL,
  meta_receita numeric,
  meta_despesa numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT metas_pkey PRIMARY KEY (id),
  CONSTRAINT metas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);

CREATE TABLE IF NOT EXISTS public.kv_store_b1600651 (
  key text NOT NULL,
  value jsonb NOT NULL,
  CONSTRAINT kv_store_b1600651_pkey PRIMARY KEY (key)
);

-- -----------------------------------------------------------------------------
-- Tabelas SaaS / multi-tenant (adaptadas para Postgres puro, sem Supabase Auth)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.planos_assinatura (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome text NOT NULL UNIQUE CHECK (nome IN ('Gratuito', 'Iniciante', 'Profissional', 'Enterprise')),
  limite_empresas integer NOT NULL,
  preco_mensal numeric(10,2) NOT NULL DEFAULT 0,
  descricao text,
  recursos jsonb,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clientes_sistema (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id uuid,
  nome_completo text NOT NULL,
  email text NOT NULL UNIQUE,
  telefone text,
  documento text,
  plano_id uuid NOT NULL REFERENCES public.planos_assinatura(id),
  limite_empresas integer NOT NULL DEFAULT 1,
  data_assinatura timestamptz DEFAULT now(),
  data_expiracao timestamptz,
  status text NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Suspenso', 'Cancelado')),
  is_super_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.empresas
  DROP CONSTRAINT IF EXISTS empresas_cliente_sistema_id_fkey;
ALTER TABLE public.empresas
  ADD CONSTRAINT empresas_cliente_sistema_id_fkey
  FOREIGN KEY (cliente_sistema_id) REFERENCES public.clientes_sistema(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_clientes_sistema_email ON public.clientes_sistema(email);
CREATE INDEX IF NOT EXISTS idx_clientes_sistema_auth_user_id ON public.clientes_sistema(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_sistema_plano_id ON public.clientes_sistema(plano_id);
CREATE INDEX IF NOT EXISTS idx_empresas_cliente_sistema_id ON public.empresas(cliente_sistema_id);

CREATE TABLE IF NOT EXISTS public.log_acoes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_sistema_id uuid REFERENCES public.clientes_sistema(id) ON DELETE CASCADE,
  acao text NOT NULL,
  entidade text,
  entidade_id uuid,
  dados_anteriores jsonb,
  dados_novos jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_log_acoes_cliente_sistema_id ON public.log_acoes(cliente_sistema_id);
CREATE INDEX IF NOT EXISTS idx_log_acoes_created_at ON public.log_acoes(created_at DESC);

-- -----------------------------------------------------------------------------
-- Views (substituem os arquivos *_rows.sql de views exportados do Supabase)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.saldos_por_conta AS
SELECT
  cf.id,
  cf.empresa_id,
  e.nome AS empresa_nome,
  cf.nome AS conta_nome,
  cf.tipo AS conta_tipo,
  cf.banco,
  cf.saldo_atual,
  cf.ativo
FROM public.contas_financeiras cf
JOIN public.empresas e ON e.id = cf.empresa_id;

CREATE OR REPLACE VIEW public.dashboard_resumo_empresa AS
SELECT
  e.id AS empresa_id,
  e.nome AS empresa_nome,
  (
    SELECT sum(cf.saldo_atual)
    FROM public.contas_financeiras cf
    WHERE cf.empresa_id = e.id AND cf.ativo = true
  ) AS saldo_total,
  (
    SELECT count(*)
    FROM public.contas_pagar cp
    WHERE cp.empresa_id = e.id AND cp.status = 'Atrasado'
  ) AS contas_pagar_atrasadas,
  (
    SELECT count(*)
    FROM public.contas_receber cr
    WHERE cr.empresa_id = e.id AND cr.status = 'Atrasado'
  ) AS contas_receber_atrasadas,
  (
    SELECT sum(cp.valor_total - cp.valor_pago)
    FROM public.contas_pagar cp
    WHERE cp.empresa_id = e.id
      AND cp.status IN ('Em Aberto', 'Atrasado', 'Parcial')
  ) AS total_a_pagar,
  (
    SELECT sum(cr.valor_total - cr.valor_recebido)
    FROM public.contas_receber cr
    WHERE cr.empresa_id = e.id
      AND cr.status IN ('Previsto', 'Atrasado', 'Parcial')
  ) AS total_a_receber,
  (
    SELECT sum(p.estoque_atual * p.preco_custo_medio)
    FROM public.produtos p
    WHERE p.empresa_id = e.id AND p.ativo = true
  ) AS valor_estoque
FROM public.empresas e;

CREATE OR REPLACE VIEW public.vw_clientes_resumo AS
SELECT
  c.id,
  c.nome_completo,
  c.email,
  c.status,
  p.nome AS plano_nome,
  p.limite_empresas AS plano_limite,
  c.limite_empresas AS limite_atual,
  (
    SELECT count(*)
    FROM public.empresas e
    WHERE e.cliente_sistema_id = c.id AND e.ativo = true
  ) AS total_empresas,
  c.data_assinatura,
  c.data_expiracao,
  c.is_super_admin
FROM public.clientes_sistema c
JOIN public.planos_assinatura p ON c.plano_id = p.id
ORDER BY c.created_at DESC;

CREATE OR REPLACE VIEW public.vw_uso_sistema AS
SELECT
  p.nome AS plano,
  count(c.id) AS total_clientes,
  sum(CASE WHEN c.status = 'Ativo' THEN 1 ELSE 0 END) AS clientes_ativos,
  sum((
    SELECT count(*)
    FROM public.empresas e
    WHERE e.cliente_sistema_id = c.id AND e.ativo = true
  )) AS total_empresas
FROM public.planos_assinatura p
LEFT JOIN public.clientes_sistema c ON c.plano_id = p.id
GROUP BY p.id, p.nome
ORDER BY p.preco_mensal;

-- Desabilita RLS (API usa conexão direta no Postgres)
ALTER TABLE public.planos_assinatura DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_sistema DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas DISABLE ROW LEVEL SECURITY;

