import { db } from './db';

export interface PeriodoFiltro {
  /** Vazio / undefined = todas as empresas */
  empresaId?: string;
  dataInicio: string;
  dataFim: string;
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
  tipo: 'Receita' | 'Despesa';
  descricao: string;
  categoria: string;
  status: string;
  valor: number;
  terceiro?: string;
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
  receitasDetalhe: MovimentoDetalhe[];
  despesasDetalhe: MovimentoDetalhe[];
  porEmpresa: EmpresaResumo[];
  gastosPorFornecedor: GastoFornecedor[];
  totalDespesas: number;
  totalReceitas: number;
}

/** YYYY-MM-DD no fuso local (evita -1 dia do toISOString). */
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

type QueryBuilder = {
  eq: (column: string, value: unknown) => QueryBuilder;
  gte: (column: string, value: unknown) => QueryBuilder;
  lte: (column: string, value: unknown) => QueryBuilder;
  in: (column: string, values: unknown[]) => QueryBuilder;
  then: PromiseLike<{ data: unknown; error: unknown }>['then'];
};

function aplicarEmpresa(query: QueryBuilder, empresaId?: string): QueryBuilder {
  if (empresaId) return query.eq('empresa_id', empresaId);
  return query;
}

async function buscarEmpresasMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const { data } = await db.from('empresas').select('id, nome');
    ((data as any[]) || []).forEach((e) => map.set(e.id, e.nome || 'Sem nome'));
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
  }
  return map;
}

async function buscarLancamentos(filtro: PeriodoFiltro) {
  try {
    const query = aplicarEmpresa(
      db
        .from('lancamentos')
        .select('*, fornecedores(nome)')
        .gte('data', filtro.dataInicio)
        .lte('data', filtro.dataFim) as unknown as QueryBuilder,
      filtro.empresaId
    );
    const { data, error } = await query;
    if (error) {
      console.error('Erro ao buscar lançamentos:', error);
      return [];
    }
    return (data as any[]) || [];
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error);
    return [];
  }
}

async function buscarContasReceberPeriodo(filtro: PeriodoFiltro, soRecebidas = false) {
  try {
    let query = aplicarEmpresa(
      db
        .from('contas_receber')
        .select('*, clientes(nome)')
        .gte(soRecebidas ? 'data_recebimento' : 'data_vencimento', filtro.dataInicio)
        .lte(soRecebidas ? 'data_recebimento' : 'data_vencimento', filtro.dataFim) as unknown as QueryBuilder,
      filtro.empresaId
    );
    if (soRecebidas) {
      query = query.in('status', STATUS_RECEBER_RECEBIDO);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Erro ao buscar contas a receber:', error);
      return [];
    }
    return (data as any[]) || [];
  } catch (error) {
    console.error('Erro ao buscar contas a receber:', error);
    return [];
  }
}

async function buscarContasPagarPeriodo(filtro: PeriodoFiltro, soPagas = false) {
  try {
    let query = aplicarEmpresa(
      db
        .from('contas_pagar')
        .select('*, fornecedores(nome)')
        .gte(soPagas ? 'data_pagamento' : 'data_vencimento', filtro.dataInicio)
        .lte(soPagas ? 'data_pagamento' : 'data_vencimento', filtro.dataFim) as unknown as QueryBuilder,
      filtro.empresaId
    );
    if (soPagas) {
      query = query.in('status', STATUS_PAGAR_PAGO);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Erro ao buscar contas a pagar:', error);
      return [];
    }
    return (data as any[]) || [];
  } catch (error) {
    console.error('Erro ao buscar contas a pagar:', error);
    return [];
  }
}

function calcularReceitas(lancamentos: any[], contasRecebidas: any[]) {
  const receitasLancamentos = lancamentos.filter((l) => l.tipo === 'Receita');
  let receitaBruta = receitasLancamentos.reduce((sum, l) => sum + num(l.valor), 0);
  const receitaContas = contasRecebidas.reduce((sum, c) => sum + valorConta(c, true), 0);
  if (receitaBruta === 0) receitaBruta = receitaContas;

  const impostosLancamentos = lancamentos.filter(
    (l) =>
      l.tipo === 'Despesa' &&
      (l.categoria?.toLowerCase().includes('imposto') ||
        l.categoria?.toLowerCase().includes('tributo') ||
        l.categoria?.toLowerCase().includes('iss') ||
        l.categoria?.toLowerCase().includes('icms') ||
        l.categoria?.toLowerCase().includes('pis') ||
        l.categoria?.toLowerCase().includes('cofins'))
  );

  const impostos =
    impostosLancamentos.length > 0
      ? impostosLancamentos.reduce((sum, l) => sum + num(l.valor), 0)
      : receitaBruta * 0.15;

  return { receitaBruta, impostos, receitaLiquida: receitaBruta - impostos };
}

function calcularDespesas(lancamentos: any[], contasPagas: any[]) {
  const despesasLancamentos = lancamentos.filter((l) => l.tipo === 'Despesa');

  const custosVariaveis = despesasLancamentos
    .filter(
      (l) =>
        l.categoria?.toLowerCase().includes('cmv') ||
        l.categoria?.toLowerCase().includes('cpv') ||
        l.categoria?.toLowerCase().includes('custo variável') ||
        l.categoria?.toLowerCase().includes('comiss')
    )
    .reduce((sum, l) => sum + num(l.valor), 0);

  const despesasFinanceiras = despesasLancamentos
    .filter(
      (l) =>
        l.categoria?.toLowerCase().includes('financeira') ||
        l.categoria?.toLowerCase().includes('juros') ||
        l.categoria?.toLowerCase().includes('tarifa')
    )
    .reduce((sum, l) => sum + num(l.valor), 0);

  const depreciacaoAmortizacao = despesasLancamentos
    .filter(
      (l) =>
        l.categoria?.toLowerCase().includes('deprecia') ||
        l.categoria?.toLowerCase().includes('amortiza')
    )
    .reduce((sum, l) => sum + num(l.valor), 0);

  let despesasFixas = despesasLancamentos
    .filter((l) => {
      const cat = l.categoria?.toLowerCase() || '';
      return (
        !cat.includes('cmv') &&
        !cat.includes('cpv') &&
        !cat.includes('custo variável') &&
        !cat.includes('comiss') &&
        !cat.includes('financeira') &&
        !cat.includes('juros') &&
        !cat.includes('tarifa') &&
        !cat.includes('deprecia') &&
        !cat.includes('amortiza') &&
        !cat.includes('imposto') &&
        !cat.includes('tributo')
      );
    })
    .reduce((sum, l) => sum + num(l.valor), 0);

  const totalDespesasLanc =
    custosVariaveis + despesasFixas + despesasFinanceiras + depreciacaoAmortizacao;
  const totalContasPagas = contasPagas.reduce((sum, c) => sum + valorConta(c, true), 0);
  if (totalDespesasLanc === 0 && totalContasPagas > 0) {
    despesasFixas = totalContasPagas;
  }

  return { custosVariaveis, despesasFixas, despesasFinanceiras, depreciacaoAmortizacao };
}

async function calcularFluxoCaixa(
  filtro: PeriodoFiltro,
  contasRecebidas: any[],
  contasPagas: any[],
  lancamentos: any[]
) {
  try {
    const dataInicial = new Date(`${filtro.dataInicio}T12:00:00`);
    const dataAnterior = new Date(dataInicial);
    dataAnterior.setDate(dataAnterior.getDate() - 1);
    const dataAnteriorStr = toLocalDateString(dataAnterior);

    const queryAnt = aplicarEmpresa(
      db.from('lancamentos').select('*').lte('data', dataAnteriorStr) as unknown as QueryBuilder,
      filtro.empresaId
    );
    const { data: lancamentosAnteriores } = await queryAnt;

    const entradasAnteriores = ((lancamentosAnteriores as any[]) || [])
      .filter((l) => l.tipo === 'Receita')
      .reduce((sum, l) => sum + num(l.valor), 0);
    const saidasAnteriores = ((lancamentosAnteriores as any[]) || [])
      .filter((l) => l.tipo === 'Despesa')
      .reduce((sum, l) => sum + num(l.valor), 0);
    const saldoInicial = entradasAnteriores - saidasAnteriores;

    let entradas = contasRecebidas.reduce((sum, c) => sum + valorConta(c, true), 0);
    let saidas = contasPagas.reduce((sum, c) => sum + valorConta(c, true), 0);

    const statusCaixa = ['Realizado', 'Recebido', 'Pago'];
    if (entradas === 0) {
      entradas = lancamentos
        .filter((l) => l.tipo === 'Receita' && statusCaixa.includes(l.status))
        .reduce((sum, l) => sum + num(l.valor), 0);
    }
    if (saidas === 0) {
      saidas = lancamentos
        .filter((l) => l.tipo === 'Despesa' && statusCaixa.includes(l.status))
        .reduce((sum, l) => sum + num(l.valor), 0);
    }

    const saldoFinal = saldoInicial + entradas - saidas;
    const dataIni = new Date(`${filtro.dataInicio}T12:00:00`);
    const dataFim = new Date(`${filtro.dataFim}T12:00:00`);
    const diasPeriodo = Math.max(
      1,
      Math.floor((dataFim.getTime() - dataIni.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    return {
      saldoInicial,
      entradas,
      saidas,
      saldoFinal,
      burnRate: (saidas / diasPeriodo) * 30,
    };
  } catch (error) {
    console.error('Erro ao calcular fluxo de caixa:', error);
    return { saldoInicial: 0, entradas: 0, saidas: 0, saldoFinal: 0, burnRate: 0 };
  }
}

async function calcularPrazosMedios(filtro: PeriodoFiltro) {
  try {
    let qRec = aplicarEmpresa(
      db
        .from('contas_receber')
        .select('data_emissao, data_recebimento')
        .in('status', STATUS_RECEBER_RECEBIDO)
        .gte('data_recebimento', filtro.dataInicio)
        .lte('data_recebimento', filtro.dataFim) as unknown as QueryBuilder,
      filtro.empresaId
    );
    const { data: contasRecebidas } = await qRec;

    let pmr = 28;
    const recebidas = ((contasRecebidas as any[]) || []).filter(
      (c) => c.data_emissao && c.data_recebimento
    );
    if (recebidas.length > 0) {
      const totalDias = recebidas.reduce((sum, c) => {
        const emissao = new Date(`${c.data_emissao}T12:00:00`);
        const recebimento = new Date(`${c.data_recebimento}T12:00:00`);
        return (
          sum +
          Math.max(
            0,
            Math.floor((recebimento.getTime() - emissao.getTime()) / (1000 * 60 * 60 * 24))
          )
        );
      }, 0);
      pmr = Math.round(totalDias / recebidas.length);
    }

    let qPag = aplicarEmpresa(
      db
        .from('contas_pagar')
        .select('data_emissao, data_pagamento')
        .in('status', STATUS_PAGAR_PAGO)
        .gte('data_pagamento', filtro.dataInicio)
        .lte('data_pagamento', filtro.dataFim) as unknown as QueryBuilder,
      filtro.empresaId
    );
    const { data: contasPagas } = await qPag;

    let pmp = 35;
    const pagas = ((contasPagas as any[]) || []).filter(
      (c) => c.data_emissao && c.data_pagamento
    );
    if (pagas.length > 0) {
      const totalDias = pagas.reduce((sum, c) => {
        const emissao = new Date(`${c.data_emissao}T12:00:00`);
        const pagamento = new Date(`${c.data_pagamento}T12:00:00`);
        return (
          sum +
          Math.max(
            0,
            Math.floor((pagamento.getTime() - emissao.getTime()) / (1000 * 60 * 60 * 24))
          )
        );
      }, 0);
      pmp = Math.round(totalDias / pagas.length);
    }

    return { pmr, pmp, pme: 22 };
  } catch (error) {
    console.error('Erro ao calcular prazos médios:', error);
    return { pmr: 28, pmp: 35, pme: 22 };
  }
}

async function calcularAging(empresaId?: string) {
  try {
    const query = aplicarEmpresa(
      db
        .from('contas_receber')
        .select('*')
        .in('status', STATUS_RECEBER_ABERTO) as unknown as QueryBuilder,
      empresaId
    );
    const { data: contasReceber, error } = await query;
    if (error) console.error('Erro ao buscar contas a receber (aging):', error);

    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);

    const aging: AgingData[] = [
      { periodo: 'A Vencer', valor: 0, percentual: 0, quantidade: 0 },
      { periodo: '1-30 dias', valor: 0, percentual: 0, quantidade: 0 },
      { periodo: '31-60 dias', valor: 0, percentual: 0, quantidade: 0 },
      { periodo: '61-90 dias', valor: 0, percentual: 0, quantidade: 0 },
      { periodo: '> 90 dias', valor: 0, percentual: 0, quantidade: 0 },
    ];

    let totalReceber = 0;
    ((contasReceber as any[]) || []).forEach((conta) => {
      if (!conta.data_vencimento) return;
      const vencimento = new Date(`${conta.data_vencimento}T12:00:00`);
      const diasVencidos = Math.floor(
        (hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24)
      );
      const valor = Math.max(0, num(conta.valor_total) - num(conta.valor_recebido));
      if (valor <= 0) return;
      totalReceber += valor;
      if (diasVencidos < 0) {
        aging[0].valor += valor;
        aging[0].quantidade++;
      } else if (diasVencidos <= 30) {
        aging[1].valor += valor;
        aging[1].quantidade++;
      } else if (diasVencidos <= 60) {
        aging[2].valor += valor;
        aging[2].quantidade++;
      } else if (diasVencidos <= 90) {
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
    const totalVencido = aging.slice(1).reduce((sum, a) => sum + a.valor, 0);

    return {
      aging,
      totalReceber,
      totalVencido,
      percentualInadimplencia: totalReceber > 0 ? (totalVencido / totalReceber) * 100 : 0,
      provisaoDevedoresDuvidosos: totalVencido * 0.3,
    };
  } catch (error) {
    console.error('Erro ao calcular aging:', error);
    return {
      aging: [
        { periodo: 'A Vencer', valor: 0, percentual: 0, quantidade: 0 },
        { periodo: '1-30 dias', valor: 0, percentual: 0, quantidade: 0 },
        { periodo: '31-60 dias', valor: 0, percentual: 0, quantidade: 0 },
        { periodo: '61-90 dias', valor: 0, percentual: 0, quantidade: 0 },
        { periodo: '> 90 dias', valor: 0, percentual: 0, quantidade: 0 },
      ],
      totalReceber: 0,
      totalVencido: 0,
      percentualInadimplencia: 0,
      provisaoDevedoresDuvidosos: 0,
    };
  }
}

function montarDetalhes(
  lancamentos: any[],
  contasReceber: any[],
  contasPagar: any[],
  empresasMap: Map<string, string>
): { receitasDetalhe: MovimentoDetalhe[]; despesasDetalhe: MovimentoDetalhe[] } {
  const receitasDetalhe: MovimentoDetalhe[] = [];
  const despesasDetalhe: MovimentoDetalhe[] = [];

  lancamentos.forEach((l) => {
    const item: MovimentoDetalhe = {
      id: String(l.id),
      origem: 'Lancamento',
      data: l.data || '',
      empresaId: l.empresa_id || '',
      empresaNome: empresasMap.get(l.empresa_id) || 'Sem empresa',
      tipo: l.tipo === 'Receita' ? 'Receita' : 'Despesa',
      descricao: l.descricao || '-',
      categoria: l.categoria || '-',
      status: l.status || '-',
      valor: num(l.valor),
      terceiro: l.fornecedores?.nome || l.clientes?.nome || undefined,
    };
    if (l.tipo === 'Receita') receitasDetalhe.push(item);
    else if (l.tipo === 'Despesa') despesasDetalhe.push(item);
  });

  contasReceber.forEach((c) => {
    receitasDetalhe.push({
      id: String(c.id),
      origem: 'Conta a Receber',
      data: c.data_recebimento || c.data_vencimento || c.data_emissao || '',
      empresaId: c.empresa_id || '',
      empresaNome: empresasMap.get(c.empresa_id) || 'Sem empresa',
      tipo: 'Receita',
      descricao: c.descricao || c.clientes?.nome || 'Conta a receber',
      categoria: c.categoria || 'Contas a Receber',
      status: c.status || '-',
      valor: valorConta(c, c.status === 'Recebido'),
      terceiro: c.clientes?.nome,
    });
  });

  contasPagar.forEach((c) => {
    despesasDetalhe.push({
      id: String(c.id),
      origem: 'Conta a Pagar',
      data: c.data_pagamento || c.data_vencimento || c.data_emissao || '',
      empresaId: c.empresa_id || '',
      empresaNome: empresasMap.get(c.empresa_id) || 'Sem empresa',
      tipo: 'Despesa',
      descricao: c.descricao || c.fornecedores?.nome || 'Conta a pagar',
      categoria: c.categoria || 'Contas a Pagar',
      status: c.status || '-',
      valor: valorConta(c, c.status === 'Pago'),
      terceiro: c.fornecedores?.nome,
    });
  });

  const byDate = (a: MovimentoDetalhe, b: MovimentoDetalhe) =>
    (b.data || '').localeCompare(a.data || '');
  receitasDetalhe.sort(byDate);
  despesasDetalhe.sort(byDate);

  return { receitasDetalhe, despesasDetalhe };
}

function montarPorEmpresa(
  receitasDetalhe: MovimentoDetalhe[],
  despesasDetalhe: MovimentoDetalhe[],
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

  // Garante todas as empresas cadastradas aparecem
  empresasMap.forEach((nome, id) => {
    const row = ensure(id);
    row.empresaNome = nome;
  });

  receitasDetalhe.forEach((r) => {
    const row = ensure(r.empresaId);
    row.receitas += r.valor;
    row.qtdReceitas += 1;
    if (['Recebido', 'Realizado', 'Pago'].includes(r.status) || r.origem === 'Lancamento') {
      row.entradas += r.valor;
    }
  });

  despesasDetalhe.forEach((d) => {
    const row = ensure(d.empresaId);
    row.despesas += d.valor;
    row.qtdDespesas += 1;
    if (['Pago', 'Realizado', 'Recebido'].includes(d.status) || d.origem === 'Lancamento') {
      row.saidas += d.valor;
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

function montarGastosFornecedor(
  despesasDetalhe: MovimentoDetalhe[]
): GastoFornecedor[] {
  const map = new Map<string, { nome: string; total: number; quantidade: number }>();
  despesasDetalhe.forEach((d) => {
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
  try {
    console.log('🔄 Gerando relatório para:', filtro);

    const [
      empresasMap,
      lancamentos,
      contasRecebidas,
      contasPagas,
      contasReceberTodas,
      contasPagarTodas,
    ] = await Promise.all([
      buscarEmpresasMap(),
      buscarLancamentos(filtro),
      buscarContasReceberPeriodo(filtro, true),
      buscarContasPagarPeriodo(filtro, true),
      buscarContasReceberPeriodo(filtro, false),
      buscarContasPagarPeriodo(filtro, false),
    ]);

    const { receitaBruta, impostos, receitaLiquida } = calcularReceitas(
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
          l.tipo === 'Receita' && l.categoria?.toLowerCase().includes('financeira')
      )
      .reduce((sum, l) => sum + num(l.valor), 0);
    const lair = ebit + receitasFinanceiras - despesasFinanceiras;
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
    const roi =
      receitaLiquida > 0 ? (lucroLiquido / (receitaLiquida / 2)) * 100 : 0;
    const pontoEquilibrio =
      margemBruta > 0 ? despesasFixas / (margemBruta / 100) : 0;

    const [prazosMedios, inadimplencia] = await Promise.all([
      calcularPrazosMedios(filtro),
      calcularAging(filtro.empresaId),
    ]);

    const { receitasDetalhe, despesasDetalhe } = montarDetalhes(
      lancamentos,
      contasReceberTodas,
      contasPagarTodas,
      empresasMap
    );

    // Evita duplicar lançamentos vs contas: se há lançamentos de receita, detalhe de contas só as não cobertas fica ok
    // Mantemos ambos para visão completa do sistema (origem distinta)

    const porEmpresa = montarPorEmpresa(receitasDetalhe, despesasDetalhe, empresasMap);
    const gastosPorFornecedor = montarGastosFornecedor(despesasDetalhe);

    const totalReceitas = receitasDetalhe.reduce((s, r) => s + r.valor, 0);
    const totalDespesas = despesasDetalhe.reduce((s, d) => s + d.valor, 0);

    const orcadoReceita = receitaBruta > 0 ? receitaBruta * 0.95 : 0;
    const orcadoDespesas = fluxoCaixa.saidas > 0 ? fluxoCaixa.saidas * 1.08 : 0;

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
      desvioReceita:
        orcadoReceita > 0 ? ((receitaBruta - orcadoReceita) / orcadoReceita) * 100 : 0,
      desvioDespesas:
        orcadoDespesas > 0
          ? ((fluxoCaixa.saidas - orcadoDespesas) / orcadoDespesas) * 100
          : 0,
      receitasDetalhe,
      despesasDetalhe,
      porEmpresa,
      gastosPorFornecedor,
      totalReceitas,
      totalDespesas,
    };
  } catch (error) {
    console.error('❌ Erro ao gerar relatório completo:', error);
    throw error;
  }
}
