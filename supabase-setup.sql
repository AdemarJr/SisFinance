-- =====================================================
-- SISTEMA FINANCEIRO EMPRESARIAL - MVP
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- Habilitar extensões necessárias
create extension if not exists "uuid-ossp";

-- =====================================================
-- 1. TABELA DE CONTAS FINANCEIRAS
-- =====================================================
create table contas_financeiras (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  tipo text not null check (tipo in ('Caixa', 'Banco', 'Cartão')),
  saldo_inicial numeric(15,2) not null default 0,
  saldo_atual numeric(15,2) not null default 0,
  data_inicio date not null default current_date,
  ativo boolean not null default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =====================================================
-- 2. TABELA DE CLIENTES
-- =====================================================
create table clientes (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  tipo text not null check (tipo in ('Pessoa Física', 'Pessoa Jurídica')),
  documento text,
  contato text,
  email text,
  ativo boolean not null default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =====================================================
-- 3. TABELA DE FORNECEDORES
-- =====================================================
create table fornecedores (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  categoria text,
  contato text,
  email text,
  ativo boolean not null default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =====================================================
-- 4. TABELA DE CATEGORIAS DE RECEITAS
-- =====================================================
create table categorias_receitas (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  grupo text not null check (grupo in ('Operacional', 'Financeira', 'Extraordinária')),
  ativo boolean not null default true,
  created_at timestamp with time zone default now()
);

-- =====================================================
-- 5. TABELA DE CATEGORIAS DE DESPESAS
-- =====================================================
create table categorias_despesas (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  grupo text not null check (grupo in ('Fixa', 'Variável', 'Investimento')),
  ativo boolean not null default true,
  created_at timestamp with time zone default now()
);

-- =====================================================
-- 6. TABELA DE LANÇAMENTOS FINANCEIROS
-- =====================================================
create table lancamentos (
  id uuid primary key default uuid_generate_v4(),
  data date not null,
  tipo text not null check (tipo in ('Receita', 'Despesa', 'Transferência')),
  categoria_id uuid,
  cliente_id uuid references clientes(id),
  fornecedor_id uuid references fornecedores(id),
  conta_origem_id uuid references contas_financeiras(id),
  conta_destino_id uuid references contas_financeiras(id),
  valor numeric(15,2) not null check (valor > 0),
  forma_pagamento text,
  status text not null check (status in ('Previsto', 'Realizado', 'Pago', 'Recebido')),
  descricao text,
  observacoes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =====================================================
-- 7. TABELA DE CONTAS A PAGAR
-- =====================================================
create table contas_pagar (
  id uuid primary key default uuid_generate_v4(),
  fornecedor_id uuid references fornecedores(id),
  descricao text not null,
  valor_total numeric(15,2) not null check (valor_total > 0),
  valor_pago numeric(15,2) not null default 0,
  data_emissao date not null,
  data_vencimento date not null,
  data_pagamento date,
  status text not null check (status in ('Em Aberto', 'Pago', 'Atrasado', 'Parcial')),
  categoria_despesa_id uuid references categorias_despesas(id),
  conta_id uuid references contas_financeiras(id),
  numero_parcela integer,
  total_parcelas integer,
  observacoes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =====================================================
-- 8. TABELA DE CONTAS A RECEBER
-- =====================================================
create table contas_receber (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id),
  descricao text not null,
  valor_total numeric(15,2) not null check (valor_total > 0),
  valor_recebido numeric(15,2) not null default 0,
  data_emissao date not null,
  data_vencimento date not null,
  data_recebimento date,
  status text not null check (status in ('Previsto', 'Recebido', 'Atrasado', 'Parcial')),
  categoria_receita_id uuid references categorias_receitas(id),
  conta_id uuid references contas_financeiras(id),
  numero_parcela integer,
  total_parcelas integer,
  observacoes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =====================================================
-- 9. TABELA DE METAS FINANCEIRAS
-- =====================================================
create table metas (
  id uuid primary key default uuid_generate_v4(),
  mes integer not null check (mes between 1 and 12),
  ano integer not null,
  meta_receita numeric(15,2),
  meta_despesa numeric(15,2),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(mes, ano)
);

-- =====================================================
-- 10. ÍNDICES PARA PERFORMANCE
-- =====================================================
create index idx_lancamentos_data on lancamentos(data);
create index idx_lancamentos_tipo on lancamentos(tipo);
create index idx_lancamentos_status on lancamentos(status);
create index idx_contas_pagar_vencimento on contas_pagar(data_vencimento);
create index idx_contas_pagar_status on contas_pagar(status);
create index idx_contas_receber_vencimento on contas_receber(data_vencimento);
create index idx_contas_receber_status on contas_receber(status);

-- =====================================================
-- 11. FUNÇÃO PARA ATUALIZAR SALDO DAS CONTAS
-- =====================================================
create or replace function atualizar_saldo_conta()
returns trigger as $$
begin
  -- Se for lançamento realizado/pago/recebido
  if new.status in ('Realizado', 'Pago', 'Recebido') then
    
    -- Se for receita, aumenta saldo
    if new.tipo = 'Receita' and new.conta_origem_id is not null then
      update contas_financeiras 
      set saldo_atual = saldo_atual + new.valor,
          updated_at = now()
      where id = new.conta_origem_id;
    end if;
    
    -- Se for despesa, diminui saldo
    if new.tipo = 'Despesa' and new.conta_origem_id is not null then
      update contas_financeiras 
      set saldo_atual = saldo_atual - new.valor,
          updated_at = now()
      where id = new.conta_origem_id;
    end if;
    
    -- Se for transferência
    if new.tipo = 'Transferência' then
      if new.conta_origem_id is not null then
        update contas_financeiras 
        set saldo_atual = saldo_atual - new.valor,
            updated_at = now()
        where id = new.conta_origem_id;
      end if;
      
      if new.conta_destino_id is not null then
        update contas_financeiras 
        set saldo_atual = saldo_atual + new.valor,
            updated_at = now()
        where id = new.conta_destino_id;
      end if;
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- =====================================================
-- 12. TRIGGER PARA ATUALIZAÇÃO AUTOMÁTICA DE SALDO
-- =====================================================
create trigger trigger_atualizar_saldo
after insert on lancamentos
for each row
execute function atualizar_saldo_conta();

-- =====================================================
-- 13. FUNÇÃO PARA ATUALIZAR STATUS DE CONTAS ATRASADAS
-- =====================================================
create or replace function atualizar_status_atrasados()
returns void as $$
begin
  -- Atualizar contas a pagar atrasadas
  update contas_pagar
  set status = 'Atrasado'
  where status = 'Em Aberto' 
    and data_vencimento < current_date;
  
  -- Atualizar contas a receber atrasadas
  update contas_receber
  set status = 'Atrasado'
  where status = 'Previsto' 
    and data_vencimento < current_date;
end;
$$ language plpgsql;

-- =====================================================
-- 14. DADOS INICIAIS - CATEGORIAS PADRÃO
-- =====================================================

-- Categorias de Receitas
insert into categorias_receitas (nome, grupo) values
  ('Vendas de Produtos', 'Operacional'),
  ('Prestação de Serviços', 'Operacional'),
  ('Rendimentos de Aplicações', 'Financeira'),
  ('Juros Recebidos', 'Financeira'),
  ('Venda de Ativos', 'Extraordinária'),
  ('Outras Receitas', 'Extraordinária');

-- Categorias de Despesas
insert into categorias_despesas (nome, grupo) values
  ('Aluguel', 'Fixa'),
  ('Salários e Encargos', 'Fixa'),
  ('Energia Elétrica', 'Fixa'),
  ('Internet e Telefone', 'Fixa'),
  ('Matéria Prima', 'Variável'),
  ('Comissões', 'Variável'),
  ('Marketing', 'Variável'),
  ('Manutenção', 'Variável'),
  ('Equipamentos', 'Investimento'),
  ('Software', 'Investimento'),
  ('Infraestrutura', 'Investimento');

-- Conta inicial padrão
insert into contas_financeiras (nome, tipo, saldo_inicial, saldo_atual) values
  ('Caixa Principal', 'Caixa', 0, 0);

-- =====================================================
-- 15. POLICIES RLS (Row Level Security) - OPCIONAL
-- =====================================================
-- Descomente se quiser ativar segurança por linha
-- Neste MVP, vamos deixar desabilitado para simplificar

-- alter table contas_financeiras enable row level security;
-- alter table clientes enable row level security;
-- alter table fornecedores enable row level security;
-- alter table lancamentos enable row level security;
-- alter table contas_pagar enable row level security;
-- alter table contas_receber enable row level security;

-- =====================================================
-- 16. VIEW PARA DASHBOARD
-- =====================================================
create or replace view dashboard_resumo as
select
  (select sum(saldo_atual) from contas_financeiras where ativo = true) as saldo_total,
  (select count(*) from contas_pagar where status = 'Atrasado') as contas_pagar_atrasadas,
  (select count(*) from contas_receber where status = 'Atrasado') as contas_receber_atrasadas,
  (select sum(valor_total - valor_pago) from contas_pagar where status in ('Em Aberto', 'Atrasado', 'Parcial')) as total_a_pagar,
  (select sum(valor_total - valor_recebido) from contas_receber where status in ('Previsto', 'Atrasado', 'Parcial')) as total_a_receber;

-- =====================================================
-- SETUP COMPLETO!
-- =====================================================
-- Após executar este SQL:
-- 1. Vá em Authentication > Policies e configure conforme necessário
-- 2. Copie a URL e a anon key do projeto
-- 3. Configure no frontend da aplicação
-- =====================================================
