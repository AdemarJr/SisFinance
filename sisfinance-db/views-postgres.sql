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
ORDER BY p.preco_mensal;;
