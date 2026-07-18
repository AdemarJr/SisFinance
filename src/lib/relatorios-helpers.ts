import { db } from './db';

export interface PeriodoFiltro {
  empresaId: string;
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

const STATUS_RECEBER_ABERTO = ['Previsto', 'Atrasado', 'Parcial', 'Em Aberto', 'Aberto', 'Pendente', 'Vencido'];
const STATUS_RECEBER_RECEBIDO = ['Recebido'];
const STATUS_PAGAR_PAGO = ['Pago'];

async function buscarLancamentos(filtro: PeriodoFiltro) {
  try {
    const { data, error } = await db
      .from('lancamentos')
      .select('*')
      .eq('empresa_id', filtro.empresaId)
      .gte('data', filtro.dataInicio)
      .lte('data', filtro.dataFim);

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

async function buscarContasRecebidas(filtro: PeriodoFiltro) {
  try {
    const { data, error } = await db
      .from('contas_receber')
      .select('*')
      .eq('empresa_id', filtro.empresaId)
      .in('status', STATUS_RECEBER_RECEBIDO)
      .gte('data_recebimento', filtro.dataInicio)
      .lte('data_recebimento', filtro.dataFim);

    if (error) {
      console.error('Erro ao buscar contas recebidas:', error);
      return [];
    }
    return (data as any[]) || [];
  } catch (error) {
    console.error('Erro ao buscar contas recebidas:', error);
    return [];
  }
}

async function buscarContasPagas(filtro: PeriodoFiltro) {
  try {
    const { data, error } = await db
      .from('contas_pagar')
      .select('*')
      .eq('empresa_id', filtro.empresaId)
      .in('status', STATUS_PAGAR_PAGO)
      .gte('data_pagamento', filtro.dataInicio)
      .lte('data_pagamento', filtro.dataFim);

    if (error) {
      console.error('Erro ao buscar contas pagas:', error);
      return [];
    }
    return (data as any[]) || [];
  } catch (error) {
    console.error('Erro ao buscar contas pagas:', error);
    return [];
  }
}

function calcularReceitas(lancamentos: any[], contasRecebidas: any[]) {
  const receitasLancamentos = lancamentos.filter((l) => l.tipo === 'Receita');
  let receitaBruta = receitasLancamentos.reduce((sum, l) => sum + num(l.valor), 0);

  const receitaContas = contasRecebidas.reduce(
    (sum, c) => sum + valorConta(c, true),
    0
  );
  // Usa contas recebidas só se não houver lançamentos de receita no período
  if (receitaBruta === 0) {
    receitaBruta = receitaContas;
  }

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

  const receitaLiquida = receitaBruta - impostos;
  return { receitaBruta, impostos, receitaLiquida };
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

  // Se não há despesas em lançamentos, usa contas pagas como despesas fixas
  if (totalDespesasLanc === 0 && totalContasPagas > 0) {
    despesasFixas = totalContasPagas;
  }

  return {
    custosVariaveis,
    despesasFixas,
    despesasFinanceiras,
    depreciacaoAmortizacao,
  };
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

    const { data: lancamentosAnteriores } = await db
      .from('lancamentos')
      .select('*')
      .eq('empresa_id', filtro.empresaId)
      .lte('data', dataAnteriorStr);

    const entradasAnteriores = ((lancamentosAnteriores as any[]) || [])
      .filter((l) => l.tipo === 'Receita')
      .reduce((sum, l) => sum + num(l.valor), 0);

    const saidasAnteriores = ((lancamentosAnteriores as any[]) || [])
      .filter((l) => l.tipo === 'Despesa')
      .reduce((sum, l) => sum + num(l.valor), 0);

    const saldoInicial = entradasAnteriores - saidasAnteriores;

    let entradas = contasRecebidas.reduce((sum, c) => sum + valorConta(c, true), 0);
    let saidas = contasPagas.reduce((sum, c) => sum + valorConta(c, true), 0);

    // Complementa com lançamentos realizados só se não houver contas no período
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
    const burnRate = (saidas / diasPeriodo) * 30;

    return { saldoInicial, entradas, saidas, saldoFinal, burnRate };
  } catch (error) {
    console.error('Erro ao calcular fluxo de caixa:', error);
    return {
      saldoInicial: 0,
      entradas: 0,
      saidas: 0,
      saldoFinal: 0,
      burnRate: 0,
    };
  }
}

async function calcularPrazosMedios(filtro: PeriodoFiltro) {
  try {
    const { data: contasRecebidas } = await db
      .from('contas_receber')
      .select('data_emissao, data_recebimento')
      .eq('empresa_id', filtro.empresaId)
      .in('status', STATUS_RECEBER_RECEBIDO)
      .gte('data_recebimento', filtro.dataInicio)
      .lte('data_recebimento', filtro.dataFim);

    let pmr = 28;
    const recebidas = ((contasRecebidas as any[]) || []).filter(
      (c) => c.data_emissao && c.data_recebimento
    );
    if (recebidas.length > 0) {
      const totalDias = recebidas.reduce((sum, c) => {
        const emissao = new Date(`${c.data_emissao}T12:00:00`);
        const recebimento = new Date(`${c.data_recebimento}T12:00:00`);
        const dias = Math.floor(
          (recebimento.getTime() - emissao.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + Math.max(0, dias);
      }, 0);
      pmr = Math.round(totalDias / recebidas.length);
    }

    const { data: contasPagas } = await db
      .from('contas_pagar')
      .select('data_emissao, data_pagamento')
      .eq('empresa_id', filtro.empresaId)
      .in('status', STATUS_PAGAR_PAGO)
      .gte('data_pagamento', filtro.dataInicio)
      .lte('data_pagamento', filtro.dataFim);

    let pmp = 35;
    const pagas = ((contasPagas as any[]) || []).filter(
      (c) => c.data_emissao && c.data_pagamento
    );
    if (pagas.length > 0) {
      const totalDias = pagas.reduce((sum, c) => {
        const emissao = new Date(`${c.data_emissao}T12:00:00`);
        const pagamento = new Date(`${c.data_pagamento}T12:00:00`);
        const dias = Math.floor(
          (pagamento.getTime() - emissao.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + Math.max(0, dias);
      }, 0);
      pmp = Math.round(totalDias / pagas.length);
    }

    return { pmr, pmp, pme: 22 };
  } catch (error) {
    console.error('Erro ao calcular prazos médios:', error);
    return { pmr: 28, pmp: 35, pme: 22 };
  }
}

async function calcularAging(empresaId: string) {
  try {
    const { data: contasReceber, error } = await db
      .from('contas_receber')
      .select('*')
      .eq('empresa_id', empresaId)
      .in('status', STATUS_RECEBER_ABERTO);

    if (error) {
      console.error('Erro ao buscar contas a receber (aging):', error);
    }

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
      const valor = Math.max(
        0,
        num(conta.valor_total) - num(conta.valor_recebido)
      );
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
    const percentualInadimplencia =
      totalReceber > 0 ? (totalVencido / totalReceber) * 100 : 0;
    const provisaoDevedoresDuvidosos = totalVencido * 0.3;

    return {
      aging,
      totalReceber,
      totalVencido,
      percentualInadimplencia,
      provisaoDevedoresDuvidosos,
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
): Promise<RelatorioData & { agingData: AgingData[] }> {
  try {
    console.log('🔄 Gerando relatório para:', filtro);

    const [lancamentos, contasRecebidas, contasPagas] = await Promise.all([
      buscarLancamentos(filtro),
      buscarContasRecebidas(filtro),
      buscarContasPagas(filtro),
    ]);

    console.log('📊 Dados:', {
      lancamentos: lancamentos.length,
      contasRecebidas: contasRecebidas.length,
      contasPagas: contasPagas.length,
    });

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

    const orcadoReceita = receitaBruta > 0 ? receitaBruta * 0.95 : 0;
    const orcadoDespesas =
      fluxoCaixa.saidas > 0 ? fluxoCaixa.saidas * 1.08 : 0;
    const desvioReceita =
      orcadoReceita > 0
        ? ((receitaBruta - orcadoReceita) / orcadoReceita) * 100
        : 0;
    const desvioDespesas =
      orcadoDespesas > 0
        ? ((fluxoCaixa.saidas - orcadoDespesas) / orcadoDespesas) * 100
        : 0;

    console.log('✅ Relatório gerado com sucesso!');

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
      desvioReceita,
      desvioDespesas,
    };
  } catch (error) {
    console.error('❌ Erro ao gerar relatório completo:', error);
    throw error;
  }
}
