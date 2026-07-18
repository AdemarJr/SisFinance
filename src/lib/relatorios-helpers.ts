import { db } from './db';

export interface PeriodoFiltro {
  /** Vazio / undefined = todas as empresas */
  empresaId?: string;
  dataInicio: string;
  dataFim: string;
  /** Filtros opcionais do demonstrativo */
  tipo?: 'todos' | 'Receita' | 'Despesa' | 'Transferência';
  status?: string; // 'todos' ou valor exato
  fornecedorId?: string; // 'todos' ou id
  formaPagamento?: string; // 'todos' ou valor
  busca?: string; // texto em descrição
}

export interface FiltrosAplicados {
  tipo?: string;
  status?: string;
  fornecedor?: string;
  formaPagamento?: string;
  busca?: string;
}

export interface RelatorioData {
  receitaBruta: number;
  impostos: number;
  receitaLiquida: number;
  custosVariaveis: number;
  margemContribuicao: number;
  despesasFixas: number;
  ebitda: number;
  depreciacaoAmortizacao: number;
  ebit: number;
  despesasFinanceiras: number;
  receitasFinanceiras: number;
  lair: number;
  impostoRenda: number;
  lucroLiquido: number;
  saldoInicial: number;
  entradas: number;
  saidas: number;
  saldoFinal: number;
  burnRate: number;
  margemBruta: number;
  margemLiquida: number;
  roi: number;
  pontoEquilibrio: number;
  pmp: number;
  pmr: number;
  pme: number;
  totalReceber: number;
  totalVencido: number;
  percentualInadimplencia: number;
  provisaoDevedoresDuvidosos: number;
  orcadoReceita: number;
  orcadoDespesas: number;
  desvioReceita: number;
  desvioDespesas: number;
}

export interface AgingData {
  periodo: string;
  valor: number;
  percentual: number;
  quantidade: number;
}

export interface MovimentoDetalhe {
  id: string;
  origem: 'Lancamento' | 'Conta a Receber' | 'Conta a Pagar';
  data: string;
  empresaId: string;
  empresaNome: string;
  tipo: 'Receita' | 'Despesa' | 'Transferência';
  descricao: string;
  categoria: string;
  status: string;
  valor: number;
  formaPagamento?: string;
  terceiro?: string;
  fornecedorId?: string;
}

export interface EmpresaResumo {
  empresaId: string;
  empresaNome: string;
  receitas: number;
  despesas: number;
  resultado: number;
  entradas: number;
  saidas: number;
  qtdReceitas: number;
  qtdDespesas: number;
  percentualDespesas: number;
  percentualReceitas: number;
}

export interface GastoFornecedor {
  nome: string;
  total: number;
  quantidade: number;
  percentual: number;
}

export interface RelatorioCompleto extends RelatorioData {
  agingData: AgingData[];
  /** Todos os lançamentos do período (fonte principal) */
  lancamentosDetalhe: MovimentoDetalhe[];
  receitasDetalhe: MovimentoDetalhe[];
  despesasDetalhe: MovimentoDetalhe[];
  porEmpresa: EmpresaResumo[];
  gastosPorFornecedor: GastoFornecedor[];
  totalDespesas: number;
  totalReceitas: number;
  qtdLancamentos: number;
  /** Flags de transparência contábil */
  impostosEstimados: boolean;
  irEstimado: boolean;
  orcadoEstimado: boolean;
  notas: string[];
  filtrosAplicados: FiltrosAplicados;
}

export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function valorConta(conta: Record<string, unknown>, preferPago = false): number {
  if (preferPago) {
    return num(conta.valor_pago ?? conta.valor_recebido ?? conta.valor_total ?? conta.valor);
  }
  return num(conta.valor_total ?? conta.valor_recebido ?? conta.valor_pago ?? conta.valor);
}

const STATUS_RECEBER_ABERTO = [
  'Previsto',
  'Atrasado',
  'Parcial',
  'Em Aberto',
  'Aberto',
  'Pendente',
  'Vencido',
];
const STATUS_RECEBER_RECEBIDO = ['Recebido'];
const STATUS_PAGAR_PAGO = ['Pago'];

type AnyBuilder = {
  eq: (c: string, v: unknown) => AnyBuilder;
  gte: (c: string, v: unknown) => AnyBuilder;
  lte: (c: string, v: unknown) => AnyBuilder;
  in: (c: string, v: unknown[]) => AnyBuilder;
  order: (c: string, o?: { ascending?: boolean }) => AnyBuilder;
  then: PromiseLike<{ data: unknown; error: unknown }>['then'];
};

/** Consulta robusta: tenta com select informado e cai para `*` se o join falhar. */
async function queryRows(
  table: string,
  opts: {
    select?: string;
    empresaId?: string;
    gte?: [string, string];
    lte?: [string, string];
    inFilter?: [string, unknown[]];
    order?: { column: string; ascending?: boolean };
  }
): Promise<any[]> {
  const trySelect = async (select: string) => {
    let q = db.from(table).select(select) as unknown as AnyBuilder;
    if (opts.empresaId) q = q.eq('empresa_id', opts.empresaId);
    if (opts.gte) q = q.gte(opts.gte[0], opts.gte[1]);
    if (opts.lte) q = q.lte(opts.lte[0], opts.lte[1]);
    if (opts.inFilter) q = q.in(opts.inFilter[0], opts.inFilter[1]);
    if (opts.order) q = q.order(opts.order.column, { ascending: opts.order.ascending ?? true });
    const { data, error } = await q;
    if (error) {
      console.warn(`[relatorio] ${table} select="${select}" falhou:`, error);
      return { data: null as any[] | null, error };
    }
    return { data: (data as any[]) || [], error: null };
  };

  const preferred = opts.select || '*';
  const first = await trySelect(preferred);
  if (!first.error) return first.data || [];

  if (preferred !== '*') {
    const fallback = await trySelect('*');
    if (!fallback.error) return fallback.data || [];
  }

  // Última tentativa: sem filtro de empresa (só período), se empresa estava filtrando
  if (opts.empresaId) {
    console.warn(`[relatorio] Tentando ${table} sem filtro de empresa...`);
    return queryRows(table, { ...opts, empresaId: undefined, select: '*' });
  }

  return [];
}

async function buscarEmpresasMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const rows = await queryRows('empresas', { select: 'id, nome, ativo' });
    rows.forEach((e) => {
      if (e.ativo === false) return;
      map.set(e.id, e.nome || 'Sem nome');
    });
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
  }
  return map;
}

async function buscarFornecedoresMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const rows = await queryRows('fornecedores', { select: 'id, nome' });
    rows.forEach((f) => map.set(f.id, f.nome || 'Fornecedor'));
  } catch {
    /* ignore */
  }
  return map;
}

async function buscarClientesMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const rows = await queryRows('clientes', { select: 'id, nome' });
    rows.forEach((c) => map.set(c.id, c.nome || 'Cliente'));
  } catch {
    /* ignore */
  }
  return map;
}

function calcularReceitas(lancamentos: any[], contasRecebidas: any[]) {
  const receitasLanc = lancamentos.filter((l) => String(l.tipo).toLowerCase() === 'receita');
  let receitaBruta = receitasLanc.reduce((sum, l) => sum + num(l.valor), 0);
  const receitaContas = contasRecebidas.reduce((sum, c) => sum + valorConta(c, true), 0);
  if (receitaBruta === 0) receitaBruta = receitaContas;

  const impostosLanc = lancamentos.filter((l) => {
    if (String(l.tipo).toLowerCase() !== 'despesa') return false;
    const cat = String(l.categoria || l.descricao || '').toLowerCase();
    return (
      cat.includes('imposto') ||
      cat.includes('tributo') ||
      cat.includes('iss') ||
      cat.includes('icms') ||
      cat.includes('pis') ||
      cat.includes('cofins')
    );
  });

  const impostosReais = impostosLanc.reduce((sum, l) => sum + num(l.valor), 0);
  const impostosEstimados = impostosLanc.length === 0 && receitaBruta > 0;
  const impostos = impostosEstimados ? receitaBruta * 0.15 : impostosReais;

  return {
    receitaBruta,
    impostos,
    receitaLiquida: receitaBruta - impostos,
    impostosEstimados,
  };
}

function calcularDespesas(lancamentos: any[], contasPagas: any[]) {
  const despesas = lancamentos.filter((l) => String(l.tipo).toLowerCase() === 'despesa');

  const match = (l: any, keys: string[]) => {
    const cat = String(l.categoria || l.descricao || '').toLowerCase();
    return keys.some((k) => cat.includes(k));
  };

  const custosVariaveis = despesas
    .filter((l) => match(l, ['cmv', 'cpv', 'custo variável', 'comiss']))
    .reduce((s, l) => s + num(l.valor), 0);

  const despesasFinanceiras = despesas
    .filter((l) => match(l, ['financeira', 'juros', 'tarifa']))
    .reduce((s, l) => s + num(l.valor), 0);

  const depreciacaoAmortizacao = despesas
    .filter((l) => match(l, ['deprecia', 'amortiza']))
    .reduce((s, l) => s + num(l.valor), 0);

  let despesasFixas = despesas
    .filter(
      (l) =>
        !match(l, [
          'cmv',
          'cpv',
          'custo variável',
          'comiss',
          'financeira',
          'juros',
          'tarifa',
          'deprecia',
          'amortiza',
          'imposto',
          'tributo',
        ])
    )
    .reduce((s, l) => s + num(l.valor), 0);

  const totalLanc =
    custosVariaveis + despesasFixas + despesasFinanceiras + depreciacaoAmortizacao;
  const totalContas = contasPagas.reduce((s, c) => s + valorConta(c, true), 0);
  if (totalLanc === 0 && totalContas > 0) despesasFixas = totalContas;

  return { custosVariaveis, despesasFixas, despesasFinanceiras, depreciacaoAmortizacao };
}

async function calcularFluxoCaixa(
  filtro: PeriodoFiltro,
  contasRecebidas: any[],
  contasPagas: any[],
  lancamentos: any[]
) {
  try {
    const dataAnterior = new Date(`${filtro.dataInicio}T12:00:00`);
    dataAnterior.setDate(dataAnterior.getDate() - 1);
    const dataAnteriorStr = toLocalDateString(dataAnterior);

    const anteriores = await queryRows('lancamentos', {
      select: '*',
      empresaId: filtro.empresaId,
      lte: ['data', dataAnteriorStr],
    });

    const saldoInicial =
      anteriores
        .filter((l) => String(l.tipo).toLowerCase() === 'receita')
        .reduce((s, l) => s + num(l.valor), 0) -
      anteriores
        .filter((l) => String(l.tipo).toLowerCase() === 'despesa')
        .reduce((s, l) => s + num(l.valor), 0);

    let entradas = contasRecebidas.reduce((s, c) => s + valorConta(c, true), 0);
    let saidas = contasPagas.reduce((s, c) => s + valorConta(c, true), 0);

    const statusCaixa = ['realizado', 'recebido', 'pago'];
    const entradasLanc = lancamentos
      .filter(
        (l) =>
          String(l.tipo).toLowerCase() === 'receita' &&
          statusCaixa.includes(String(l.status || '').toLowerCase())
      )
      .reduce((s, l) => s + num(l.valor), 0);
    const saidasLanc = lancamentos
      .filter(
        (l) =>
          String(l.tipo).toLowerCase() === 'despesa' &&
          statusCaixa.includes(String(l.status || '').toLowerCase())
      )
      .reduce((s, l) => s + num(l.valor), 0);

    // Preferência: lançamentos realizados; se vazios, usa contas
    if (entradasLanc > 0) entradas = entradasLanc;
    else if (entradas === 0) {
      entradas = lancamentos
        .filter((l) => String(l.tipo).toLowerCase() === 'receita')
        .reduce((s, l) => s + num(l.valor), 0);
    }

    if (saidasLanc > 0) saidas = saidasLanc;
    else if (saidas === 0) {
      saidas = lancamentos
        .filter((l) => String(l.tipo).toLowerCase() === 'despesa')
        .reduce((s, l) => s + num(l.valor), 0);
    }

    const dataIni = new Date(`${filtro.dataInicio}T12:00:00`);
    const dataFim = new Date(`${filtro.dataFim}T12:00:00`);
    const dias = Math.max(
      1,
      Math.floor((dataFim.getTime() - dataIni.getTime()) / 86400000) + 1
    );

    return {
      saldoInicial,
      entradas,
      saidas,
      saldoFinal: saldoInicial + entradas - saidas,
      burnRate: (saidas / dias) * 30,
    };
  } catch (error) {
    console.error('Erro fluxo de caixa:', error);
    return { saldoInicial: 0, entradas: 0, saidas: 0, saldoFinal: 0, burnRate: 0 };
  }
}

async function calcularPrazosMedios(filtro: PeriodoFiltro) {
  try {
    const recebidas = await queryRows('contas_receber', {
      select: 'data_emissao, data_recebimento',
      empresaId: filtro.empresaId,
      inFilter: ['status', STATUS_RECEBER_RECEBIDO],
      gte: ['data_recebimento', filtro.dataInicio],
      lte: ['data_recebimento', filtro.dataFim],
    });

    let pmr = 28;
    const recOk = recebidas.filter((c) => c.data_emissao && c.data_recebimento);
    if (recOk.length > 0) {
      const total = recOk.reduce((sum, c) => {
        const a = new Date(`${c.data_emissao}T12:00:00`).getTime();
        const b = new Date(`${c.data_recebimento}T12:00:00`).getTime();
        return sum + Math.max(0, Math.floor((b - a) / 86400000));
      }, 0);
      pmr = Math.round(total / recOk.length);
    }

    const pagas = await queryRows('contas_pagar', {
      select: 'data_emissao, data_pagamento',
      empresaId: filtro.empresaId,
      inFilter: ['status', STATUS_PAGAR_PAGO],
      gte: ['data_pagamento', filtro.dataInicio],
      lte: ['data_pagamento', filtro.dataFim],
    });

    let pmp = 35;
    const pagOk = pagas.filter((c) => c.data_emissao && c.data_pagamento);
    if (pagOk.length > 0) {
      const total = pagOk.reduce((sum, c) => {
        const a = new Date(`${c.data_emissao}T12:00:00`).getTime();
        const b = new Date(`${c.data_pagamento}T12:00:00`).getTime();
        return sum + Math.max(0, Math.floor((b - a) / 86400000));
      }, 0);
      pmp = Math.round(total / pagOk.length);
    }

    return { pmr, pmp, pme: 22 };
  } catch {
    return { pmr: 28, pmp: 35, pme: 22 };
  }
}

async function calcularAging(empresaId?: string) {
  const vazios = (): AgingData[] => [
    { periodo: 'A Vencer', valor: 0, percentual: 0, quantidade: 0 },
    { periodo: '1-30 dias', valor: 0, percentual: 0, quantidade: 0 },
    { periodo: '31-60 dias', valor: 0, percentual: 0, quantidade: 0 },
    { periodo: '61-90 dias', valor: 0, percentual: 0, quantidade: 0 },
    { periodo: '> 90 dias', valor: 0, percentual: 0, quantidade: 0 },
  ];

  try {
    const contas = await queryRows('contas_receber', {
      select: '*',
      empresaId,
      inFilter: ['status', STATUS_RECEBER_ABERTO],
    });

    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);
    const aging = vazios();
    let totalReceber = 0;

    contas.forEach((conta) => {
      if (!conta.data_vencimento) return;
      const venc = new Date(`${conta.data_vencimento}T12:00:00`);
      const dias = Math.floor((hoje.getTime() - venc.getTime()) / 86400000);
      const valor = Math.max(0, num(conta.valor_total) - num(conta.valor_recebido));
      if (valor <= 0) return;
      totalReceber += valor;
      if (dias < 0) {
        aging[0].valor += valor;
        aging[0].quantidade++;
      } else if (dias <= 30) {
        aging[1].valor += valor;
        aging[1].quantidade++;
      } else if (dias <= 60) {
        aging[2].valor += valor;
        aging[2].quantidade++;
      } else if (dias <= 90) {
        aging[3].valor += valor;
        aging[3].quantidade++;
      } else {
        aging[4].valor += valor;
        aging[4].quantidade++;
      }
    });

    aging.forEach((a) => {
      a.percentual = totalReceber > 0 ? (a.valor / totalReceber) * 100 : 0;
    });
    const totalVencido = aging.slice(1).reduce((s, a) => s + a.valor, 0);

    return {
      aging,
      totalReceber,
      totalVencido,
      percentualInadimplencia: totalReceber > 0 ? (totalVencido / totalReceber) * 100 : 0,
      provisaoDevedoresDuvidosos: totalVencido * 0.3,
    };
  } catch {
    return {
      aging: vazios(),
      totalReceber: 0,
      totalVencido: 0,
      percentualInadimplencia: 0,
      provisaoDevedoresDuvidosos: 0,
    };
  }
}

function normalizarTipo(tipo: unknown): 'Receita' | 'Despesa' | 'Transferência' {
  const t = String(tipo || '').toLowerCase();
  if (t.includes('receita')) return 'Receita';
  if (t.includes('transf')) return 'Transferência';
  return 'Despesa';
}

function aplicarFiltrosLancamentos(lancamentos: any[], filtro: PeriodoFiltro): any[] {
  const tipo = filtro.tipo && filtro.tipo !== 'todos' ? filtro.tipo : null;
  const status =
    filtro.status && filtro.status !== 'todos'
      ? filtro.status.toLowerCase()
      : null;
  const fornecedorId =
    filtro.fornecedorId && filtro.fornecedorId !== 'todos'
      ? filtro.fornecedorId
      : null;
  const forma =
    filtro.formaPagamento && filtro.formaPagamento !== 'todos'
      ? filtro.formaPagamento.toLowerCase()
      : null;
  const busca = (filtro.busca || '').trim().toLowerCase();

  return lancamentos.filter((l) => {
    if (tipo && normalizarTipo(l.tipo) !== tipo) return false;
    if (status && String(l.status || '').toLowerCase() !== status) return false;
    if (fornecedorId && String(l.fornecedor_id || '') !== fornecedorId) return false;
    if (forma && String(l.forma_pagamento || '').toLowerCase() !== forma) return false;
    if (busca) {
      const texto = `${l.descricao || ''} ${l.categoria || ''} ${l.forma_pagamento || ''}`.toLowerCase();
      if (!texto.includes(busca)) return false;
    }
    return true;
  });
}

function aplicarFiltrosContasPagar(contas: any[], filtro: PeriodoFiltro): any[] {
  const fornecedorId =
    filtro.fornecedorId && filtro.fornecedorId !== 'todos'
      ? filtro.fornecedorId
      : null;
  const status =
    filtro.status && filtro.status !== 'todos'
      ? filtro.status.toLowerCase()
      : null;
  const busca = (filtro.busca || '').trim().toLowerCase();
  const tipo = filtro.tipo && filtro.tipo !== 'todos' ? filtro.tipo : null;

  // Contas a pagar são despesas — se filtro for só Receita, zera
  if (tipo === 'Receita' || tipo === 'Transferência') return [];

  return contas.filter((c) => {
    if (fornecedorId && String(c.fornecedor_id || '') !== fornecedorId) return false;
    if (status && String(c.status || '').toLowerCase() !== status) return false;
    if (busca) {
      const texto = `${c.descricao || ''} ${c.categoria || ''}`.toLowerCase();
      if (!texto.includes(busca)) return false;
    }
    return true;
  });
}

function aplicarFiltrosContasReceber(contas: any[], filtro: PeriodoFiltro): any[] {
  const tipo = filtro.tipo && filtro.tipo !== 'todos' ? filtro.tipo : null;
  const status =
    filtro.status && filtro.status !== 'todos'
      ? filtro.status.toLowerCase()
      : null;
  const busca = (filtro.busca || '').trim().toLowerCase();
  const fornecedorId =
    filtro.fornecedorId && filtro.fornecedorId !== 'todos'
      ? filtro.fornecedorId
      : null;

  // Contas a receber não têm fornecedor — se filtro de fornecedor ativo, zera
  if (fornecedorId) return [];
  if (tipo === 'Despesa' || tipo === 'Transferência') return [];

  return contas.filter((c) => {
    if (status && String(c.status || '').toLowerCase() !== status) return false;
    if (busca) {
      const texto = `${c.descricao || ''} ${c.categoria || ''}`.toLowerCase();
      if (!texto.includes(busca)) return false;
    }
    return true;
  });
}

function montarFiltrosAplicados(
  filtro: PeriodoFiltro,
  fornecedoresMap: Map<string, string>
): FiltrosAplicados {
  const out: FiltrosAplicados = {};
  if (filtro.tipo && filtro.tipo !== 'todos') out.tipo = filtro.tipo;
  if (filtro.status && filtro.status !== 'todos') out.status = filtro.status;
  if (filtro.fornecedorId && filtro.fornecedorId !== 'todos') {
    out.fornecedor =
      fornecedoresMap.get(filtro.fornecedorId) || filtro.fornecedorId;
  }
  if (filtro.formaPagamento && filtro.formaPagamento !== 'todos') {
    out.formaPagamento = filtro.formaPagamento;
  }
  if (filtro.busca?.trim()) out.busca = filtro.busca.trim();
  return out;
}

/** Lista fornecedores para o select de filtros do relatório */
export async function listarFornecedoresRelatorio(): Promise<
  { id: string; nome: string }[]
> {
  const rows = await queryRows('fornecedores', { select: 'id, nome' });
  return rows
    .map((f) => ({ id: String(f.id), nome: String(f.nome || 'Fornecedor') }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

function montarLancamentosDetalhe(
  lancamentos: any[],
  empresasMap: Map<string, string>,
  fornecedoresMap: Map<string, string>
): MovimentoDetalhe[] {
  return lancamentos
    .map((l) => ({
      id: String(l.id),
      origem: 'Lancamento' as const,
      data: String(l.data || '').slice(0, 10),
      empresaId: l.empresa_id || '',
      empresaNome: empresasMap.get(l.empresa_id) || 'Sem empresa',
      tipo: normalizarTipo(l.tipo),
      descricao: l.descricao || '-',
      categoria: l.categoria || l.forma_pagamento || '-',
      status: l.status || '-',
      valor: num(l.valor),
      formaPagamento: l.forma_pagamento || undefined,
      fornecedorId: l.fornecedor_id ? String(l.fornecedor_id) : undefined,
      terceiro:
        l.fornecedores?.nome ||
        fornecedoresMap.get(l.fornecedor_id) ||
        undefined,
    }))
    .sort((a, b) => (b.data || '').localeCompare(a.data || ''));
}

function montarDetalhesContas(
  contasReceber: any[],
  contasPagar: any[],
  empresasMap: Map<string, string>,
  clientesMap: Map<string, string>,
  fornecedoresMap: Map<string, string>
): { receitasDetalhe: MovimentoDetalhe[]; despesasDetalhe: MovimentoDetalhe[] } {
  const receitasDetalhe: MovimentoDetalhe[] = contasReceber.map((c) => ({
    id: String(c.id),
    origem: 'Conta a Receber' as const,
    data: String(c.data_recebimento || c.data_vencimento || c.data_emissao || '').slice(0, 10),
    empresaId: c.empresa_id || '',
    empresaNome: empresasMap.get(c.empresa_id) || 'Sem empresa',
    tipo: 'Receita' as const,
    descricao: c.descricao || c.clientes?.nome || clientesMap.get(c.cliente_id) || 'Conta a receber',
    categoria: c.categoria || 'Contas a Receber',
    status: c.status || '-',
    valor: valorConta(c, String(c.status).toLowerCase() === 'recebido'),
    terceiro: c.clientes?.nome || clientesMap.get(c.cliente_id),
  }));

  const despesasDetalhe: MovimentoDetalhe[] = contasPagar.map((c) => ({
    id: String(c.id),
    origem: 'Conta a Pagar' as const,
    data: String(c.data_pagamento || c.data_vencimento || c.data_emissao || '').slice(0, 10),
    empresaId: c.empresa_id || '',
    empresaNome: empresasMap.get(c.empresa_id) || 'Sem empresa',
    tipo: 'Despesa' as const,
    descricao:
      c.descricao || c.fornecedores?.nome || fornecedoresMap.get(c.fornecedor_id) || 'Conta a pagar',
    categoria: c.categoria || 'Contas a Pagar',
    status: c.status || '-',
    valor: valorConta(c, String(c.status).toLowerCase() === 'pago'),
    fornecedorId: c.fornecedor_id ? String(c.fornecedor_id) : undefined,
    terceiro: c.fornecedores?.nome || fornecedoresMap.get(c.fornecedor_id),
  }));

  const byDate = (a: MovimentoDetalhe, b: MovimentoDetalhe) =>
    (b.data || '').localeCompare(a.data || '');
  receitasDetalhe.sort(byDate);
  despesasDetalhe.sort(byDate);
  return { receitasDetalhe, despesasDetalhe };
}

function montarPorEmpresa(
  lancamentosDetalhe: MovimentoDetalhe[],
  receitasExtra: MovimentoDetalhe[],
  despesasExtra: MovimentoDetalhe[],
  empresasMap: Map<string, string>
): EmpresaResumo[] {
  const map = new Map<
    string,
    {
      empresaId: string;
      empresaNome: string;
      receitas: number;
      despesas: number;
      entradas: number;
      saidas: number;
      qtdReceitas: number;
      qtdDespesas: number;
    }
  >();

  const ensure = (empresaId: string) => {
    const id = empresaId || '_sem';
    if (!map.has(id)) {
      map.set(id, {
        empresaId: id,
        empresaNome: empresasMap.get(id) || (id === '_sem' ? 'Sem empresa' : 'Empresa'),
        receitas: 0,
        despesas: 0,
        entradas: 0,
        saidas: 0,
        qtdReceitas: 0,
        qtdDespesas: 0,
      });
    }
    return map.get(id)!;
  };

  empresasMap.forEach((nome, id) => {
    ensure(id).empresaNome = nome;
  });

  // Lançamentos são a fonte principal
  lancamentosDetalhe.forEach((l) => {
    const row = ensure(l.empresaId);
    if (l.tipo === 'Receita') {
      row.receitas += l.valor;
      row.entradas += l.valor;
      row.qtdReceitas += 1;
    } else if (l.tipo === 'Despesa') {
      row.despesas += l.valor;
      row.saidas += l.valor;
      row.qtdDespesas += 1;
    }
  });

  // Complementa com contas só se a empresa não tiver lançamentos daquele tipo
  receitasExtra.forEach((r) => {
    const row = ensure(r.empresaId);
    if (row.qtdReceitas === 0) {
      row.receitas += r.valor;
      row.qtdReceitas += 1;
    }
  });
  despesasExtra.forEach((d) => {
    const row = ensure(d.empresaId);
    if (row.qtdDespesas === 0) {
      row.despesas += d.valor;
      row.qtdDespesas += 1;
    }
  });

  const lista = Array.from(map.values());
  const totalReceitas = lista.reduce((s, e) => s + e.receitas, 0);
  const totalDespesas = lista.reduce((s, e) => s + e.despesas, 0);

  return lista
    .map((e) => ({
      ...e,
      resultado: e.receitas - e.despesas,
      percentualReceitas: totalReceitas > 0 ? (e.receitas / totalReceitas) * 100 : 0,
      percentualDespesas: totalDespesas > 0 ? (e.despesas / totalDespesas) * 100 : 0,
    }))
    .sort((a, b) => b.despesas - a.despesas || b.receitas - a.receitas);
}

function montarGastosFornecedor(despesas: MovimentoDetalhe[]): GastoFornecedor[] {
  const map = new Map<string, { nome: string; total: number; quantidade: number }>();
  despesas.forEach((d) => {
    const nome = d.terceiro || 'Sem fornecedor';
    const atual = map.get(nome);
    if (atual) {
      atual.total += d.valor;
      atual.quantidade += 1;
    } else {
      map.set(nome, { nome, total: d.valor, quantidade: 1 });
    }
  });
  const arr = Array.from(map.values()).sort((a, b) => b.total - a.total);
  const total = arr.reduce((s, x) => s + x.total, 0);
  return arr.map((x) => ({
    ...x,
    percentual: total > 0 ? (x.total / total) * 100 : 0,
  }));
}

export function formatarDataBR(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function periodoAnterior(dataInicio: string, dataFim: string): PeriodoFiltro {
  const ini = new Date(`${dataInicio}T12:00:00`);
  const fim = new Date(`${dataFim}T12:00:00`);
  const dias = Math.max(1, Math.floor((fim.getTime() - ini.getTime()) / 86400000) + 1);
  const fimAnt = new Date(ini);
  fimAnt.setDate(fimAnt.getDate() - 1);
  const iniAnt = new Date(fimAnt);
  iniAnt.setDate(iniAnt.getDate() - (dias - 1));
  return {
    dataInicio: toLocalDateString(iniAnt),
    dataFim: toLocalDateString(fimAnt),
  };
}

export function calcularIntervaloPeriodo(
  periodo: string,
  referencia: Date = new Date()
): { dataInicio: string; dataFim: string } {
  const hoje = new Date(referencia);
  hoje.setHours(12, 0, 0, 0);
  let dataInicio: Date;
  const dataFim = hoje;

  switch (periodo) {
    case 'semana': {
      dataInicio = new Date(hoje);
      dataInicio.setDate(hoje.getDate() - 6);
      break;
    }
    case 'trimestre': {
      const trimestre = Math.floor(hoje.getMonth() / 3);
      dataInicio = new Date(hoje.getFullYear(), trimestre * 3, 1);
      break;
    }
    case 'ano': {
      dataInicio = new Date(hoje.getFullYear(), 0, 1);
      break;
    }
    case 'tudo': {
      dataInicio = new Date(2000, 0, 1);
      break;
    }
    case 'mes-atual':
    default: {
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      break;
    }
  }

  dataInicio.setHours(12, 0, 0, 0);
  return {
    dataInicio: toLocalDateString(dataInicio),
    dataFim: toLocalDateString(dataFim),
  };
}

export async function gerarRelatorioCompleto(
  filtro: PeriodoFiltro
): Promise<RelatorioCompleto> {
  console.log('🔄 Gerando relatório profissional:', filtro);

  const [empresasMap, fornecedoresMap, clientesMap] = await Promise.all([
    buscarEmpresasMap(),
    buscarFornecedoresMap(),
    buscarClientesMap(),
  ]);

  // Lançamentos: fonte principal — select simples (sem join) para não falhar
  let lancamentos = await queryRows('lancamentos', {
    select: '*',
    empresaId: filtro.empresaId,
    gte: ['data', filtro.dataInicio],
    lte: ['data', filtro.dataFim],
    order: { column: 'data', ascending: false },
  });

  // Se período sem lançamentos, tenta sem filtro de data (último recurso informativo)
  if (lancamentos.length === 0) {
    console.warn(
      '⚠️ Nenhum lançamento no período. Buscando todos os lançamentos para diagnóstico...'
    );
    const todos = await queryRows('lancamentos', {
      select: '*',
      empresaId: filtro.empresaId,
      order: { column: 'data', ascending: false },
    });
    console.log(`📋 Total de lançamentos no banco (escopo): ${todos.length}`);
  }

  let [contasRecebidas, contasPagas, contasReceberTodas, contasPagarTodas] =
    await Promise.all([
      queryRows('contas_receber', {
        select: '*',
        empresaId: filtro.empresaId,
        inFilter: ['status', STATUS_RECEBER_RECEBIDO],
        gte: ['data_recebimento', filtro.dataInicio],
        lte: ['data_recebimento', filtro.dataFim],
      }),
      queryRows('contas_pagar', {
        select: '*',
        empresaId: filtro.empresaId,
        inFilter: ['status', STATUS_PAGAR_PAGO],
        gte: ['data_pagamento', filtro.dataInicio],
        lte: ['data_pagamento', filtro.dataFim],
      }),
      queryRows('contas_receber', {
        select: '*',
        empresaId: filtro.empresaId,
        gte: ['data_vencimento', filtro.dataInicio],
        lte: ['data_vencimento', filtro.dataFim],
      }),
      queryRows('contas_pagar', {
        select: '*',
        empresaId: filtro.empresaId,
        gte: ['data_vencimento', filtro.dataInicio],
        lte: ['data_vencimento', filtro.dataFim],
      }),
    ]);

  // Aplica filtros do demonstrativo (tipo, status, fornecedor, etc.)
  lancamentos = aplicarFiltrosLancamentos(lancamentos, filtro);
  contasRecebidas = aplicarFiltrosContasReceber(contasRecebidas, filtro);
  contasPagas = aplicarFiltrosContasPagar(contasPagas, filtro);
  contasReceberTodas = aplicarFiltrosContasReceber(contasReceberTodas, filtro);
  contasPagarTodas = aplicarFiltrosContasPagar(contasPagarTodas, filtro);

  const filtrosAplicados = montarFiltrosAplicados(filtro, fornecedoresMap);

  console.log('📊 Contagens (após filtros):', {
    lancamentos: lancamentos.length,
    contasRecebidas: contasRecebidas.length,
    contasPagas: contasPagas.length,
    filtros: filtrosAplicados,
  });

  const { receitaBruta, impostos, receitaLiquida, impostosEstimados } = calcularReceitas(
    lancamentos,
    contasRecebidas
  );
  const {
    custosVariaveis,
    despesasFixas,
    despesasFinanceiras,
    depreciacaoAmortizacao,
  } = calcularDespesas(lancamentos, contasPagas);

  const margemContribuicao = receitaLiquida - custosVariaveis;
  const ebitda = margemContribuicao - despesasFixas;
  const ebit = ebitda - depreciacaoAmortizacao;
  const receitasFinanceiras = lancamentos
    .filter(
      (l) =>
        String(l.tipo).toLowerCase() === 'receita' &&
        String(l.categoria || l.descricao || '')
          .toLowerCase()
          .includes('financeira')
    )
    .reduce((s, l) => s + num(l.valor), 0);
  const lair = ebit + receitasFinanceiras - despesasFinanceiras;
  const irEstimado = lair > 0;
  const impostoRenda = Math.max(0, lair * 0.3);
  const lucroLiquido = lair - impostoRenda;

  const fluxoCaixa = await calcularFluxoCaixa(
    filtro,
    contasRecebidas,
    contasPagas,
    lancamentos
  );

  const margemBruta =
    receitaLiquida > 0 ? (margemContribuicao / receitaLiquida) * 100 : 0;
  const margemLiquida =
    receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0;
  const roi = receitaLiquida > 0 ? (lucroLiquido / (receitaLiquida / 2)) * 100 : 0;
  const pontoEquilibrio =
    margemBruta > 0 ? despesasFixas / (margemBruta / 100) : 0;

  const [prazosMedios, inadimplencia] = await Promise.all([
    calcularPrazosMedios(filtro),
    calcularAging(filtro.empresaId),
  ]);

  const lancamentosDetalhe = montarLancamentosDetalhe(
    lancamentos,
    empresasMap,
    fornecedoresMap
  );

  const { receitasDetalhe: receitasContas, despesasDetalhe: despesasContas } =
    montarDetalhesContas(
      contasReceberTodas,
      contasPagarTodas,
      empresasMap,
      clientesMap,
      fornecedoresMap
    );

  // Receitas/despesas detalhadas = lançamentos + contas
  const receitasDetalhe = [
    ...lancamentosDetalhe.filter((l) => l.tipo === 'Receita'),
    ...receitasContas,
  ].sort((a, b) => (b.data || '').localeCompare(a.data || ''));

  const despesasDetalhe = [
    ...lancamentosDetalhe.filter((l) => l.tipo === 'Despesa'),
    ...despesasContas,
  ].sort((a, b) => (b.data || '').localeCompare(a.data || ''));

  const porEmpresa = montarPorEmpresa(
    lancamentosDetalhe,
    receitasContas,
    despesasContas,
    empresasMap
  );
  const gastosPorFornecedor = montarGastosFornecedor(despesasDetalhe);

  const totalReceitas = receitasDetalhe.reduce((s, r) => s + r.valor, 0);
  const totalDespesas = despesasDetalhe.reduce((s, d) => s + d.valor, 0);

  // Sem orçamento cadastrado no sistema — não inventar valores
  const orcadoReceita = 0;
  const orcadoDespesas = 0;
  const orcadoEstimado = false;

  const notas: string[] = [
    'Regime de competência aplicado aos lançamentos pela data do lançamento.',
    'Fluxo de caixa considera lançamentos com status Realizado/Recebido/Pago; na ausência, usa contas liquidadas.',
  ];
  if (impostosEstimados) {
    notas.push(
      'Impostos sobre vendas estimados em 15% da receita bruta (não há lançamentos classificados como imposto no período).'
    );
  }
  if (irEstimado) {
    notas.push(
      'IR/CSLL estimado em 30% do LAIR apenas para fins gerenciais — não substitui apuração fiscal.'
    );
  }
  if (prazosMedios.pme === 22) {
    notas.push('PME (prazo médio de estoque) usa valor de referência (22 dias) — não calculado do estoque.');
  }

  if (Object.keys(filtrosAplicados).length > 0) {
    const partes = Object.entries(filtrosAplicados)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');
    notas.push(`Filtros aplicados no demonstrativo — ${partes}.`);
  }

  return {
    receitaBruta,
    impostos,
    receitaLiquida,
    custosVariaveis,
    margemContribuicao,
    despesasFixas,
    ebitda,
    depreciacaoAmortizacao,
    ebit,
    despesasFinanceiras,
    receitasFinanceiras,
    lair,
    impostoRenda,
    lucroLiquido,
    ...fluxoCaixa,
    margemBruta,
    margemLiquida,
    roi,
    pontoEquilibrio,
    ...prazosMedios,
    totalReceber: inadimplencia.totalReceber,
    totalVencido: inadimplencia.totalVencido,
    percentualInadimplencia: inadimplencia.percentualInadimplencia,
    provisaoDevedoresDuvidosos: inadimplencia.provisaoDevedoresDuvidosos,
    agingData: inadimplencia.aging,
    orcadoReceita,
    orcadoDespesas,
    desvioReceita: 0,
    desvioDespesas: 0,
    lancamentosDetalhe,
    receitasDetalhe,
    despesasDetalhe,
    porEmpresa,
    gastosPorFornecedor,
    totalReceitas,
    totalDespesas,
    qtdLancamentos: lancamentosDetalhe.length,
    impostosEstimados,
    irEstimado,
    orcadoEstimado,
    notas,
    filtrosAplicados,
  };
}
