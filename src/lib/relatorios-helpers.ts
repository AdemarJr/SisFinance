import { db } from './db';

export interface PeriodoFiltro {
  empresaId: string;
  dataInicio: string;
  dataFim: string;
}

export interface RelatorioData {
  // DRE
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

  // Fluxo de Caixa
  saldoInicial: number;
  entradas: number;
  saidas: number;
  saldoFinal: number;
  burnRate: number;

  // KPIs
  margemBruta: number;
  margemLiquida: number;
  roi: number;
  pontoEquilibrio: number;

  // Prazos Médios
  pmp: number;
  pmr: number;
  pme: number;

  // Inadimplência
  totalReceber: number;
  totalVencido: number;
  percentualInadimplencia: number;
  provisaoDevedoresDuvidosos: number;

  // Comparativos
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

// ===== BUSCAR LANÇAMENTOS =====
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

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error);
    return [];
  }
}

// ===== CALCULAR RECEITAS =====
function calcularReceitas(lancamentos: any[]) {
  const receitasLancamentos = lancamentos.filter(l => l.tipo === 'Receita');
  
  const receitaBruta = receitasLancamentos.reduce((sum, l) => sum + Number(l.valor || 0), 0);
  
  // Impostos: buscar categoria específica ou estimar 15%
  const impostosLancamentos = lancamentos.filter(l => 
    l.tipo === 'Despesa' && 
    (l.categoria?.toLowerCase().includes('imposto') || 
     l.categoria?.toLowerCase().includes('tributo') ||
     l.categoria?.toLowerCase().includes('iss') ||
     l.categoria?.toLowerCase().includes('icms') ||
     l.categoria?.toLowerCase().includes('pis') ||
     l.categoria?.toLowerCase().includes('cofins'))
  );
  
  const impostos = impostosLancamentos.length > 0
    ? impostosLancamentos.reduce((sum, l) => sum + Number(l.valor || 0), 0)
    : receitaBruta * 0.15; // 15% como estimativa padrão
  
  const receitaLiquida = receitaBruta - impostos;
  
  return { receitaBruta, impostos, receitaLiquida };
}

// ===== CALCULAR DESPESAS =====
function calcularDespesas(lancamentos: any[]) {
  const despesasLancamentos = lancamentos.filter(l => l.tipo === 'Despesa');
  
  // Custos Variáveis
  const custosVariaveis = despesasLancamentos
    .filter(l => 
      l.categoria?.toLowerCase().includes('cmv') ||
      l.categoria?.toLowerCase().includes('cpv') ||
      l.categoria?.toLowerCase().includes('custo variável') ||
      l.categoria?.toLowerCase().includes('comiss')
    )
    .reduce((sum, l) => sum + Number(l.valor || 0), 0);
  
  // Despesas Financeiras
  const despesasFinanceiras = despesasLancamentos
    .filter(l => 
      l.categoria?.toLowerCase().includes('financeira') ||
      l.categoria?.toLowerCase().includes('juros') ||
      l.categoria?.toLowerCase().includes('tarifa')
    )
    .reduce((sum, l) => sum + Number(l.valor || 0), 0);
  
  // Depreciação/Amortização
  const depreciacaoAmortizacao = despesasLancamentos
    .filter(l => 
      l.categoria?.toLowerCase().includes('deprecia') ||
      l.categoria?.toLowerCase().includes('amortiza')
    )
    .reduce((sum, l) => sum + Number(l.valor || 0), 0);
  
  // Despesas Fixas (tudo que não é custo variável, financeira, depreciação ou imposto)
  const despesasFixas = despesasLancamentos
    .filter(l => {
      const cat = l.categoria?.toLowerCase() || '';
      return !cat.includes('cmv') &&
             !cat.includes('cpv') &&
             !cat.includes('custo variável') &&
             !cat.includes('comiss') &&
             !cat.includes('financeira') &&
             !cat.includes('juros') &&
             !cat.includes('tarifa') &&
             !cat.includes('deprecia') &&
             !cat.includes('amortiza') &&
             !cat.includes('imposto') &&
             !cat.includes('tributo');
    })
    .reduce((sum, l) => sum + Number(l.valor || 0), 0);
  
  return {
    custosVariaveis,
    despesasFixas,
    despesasFinanceiras,
    depreciacaoAmortizacao,
  };
}

// ===== CALCULAR FLUXO DE CAIXA =====
async function calcularFluxoCaixa(filtro: PeriodoFiltro) {
  try {
    // Saldo Inicial: buscar todas as entradas/saídas antes da data inicial
    const dataInicial = new Date(filtro.dataInicio);
    const dataAnterior = new Date(dataInicial);
    dataAnterior.setDate(dataAnterior.getDate() - 1);
    
    const { data: lancamentosAnteriores } = await db
      .from('lancamentos')
      .select('*')
      .eq('empresa_id', filtro.empresaId)
      .lte('data', dataAnterior.toISOString().split('T')[0]);
    
    const entradasAnteriores = (lancamentosAnteriores || [])
      .filter(l => l.tipo === 'Receita')
      .reduce((sum, l) => sum + Number(l.valor || 0), 0);
    
    const saidasAnteriores = (lancamentosAnteriores || [])
      .filter(l => l.tipo === 'Despesa')
      .reduce((sum, l) => sum + Number(l.valor || 0), 0);
    
    const saldoInicial = entradasAnteriores - saidasAnteriores;

    // Entradas: Contas Recebidas (pagas) no período
    const { data: contasRecebidas } = await db
      .from('contas_receber')
      .select('*')
      .eq('empresa_id', filtro.empresaId)
      .eq('status', 'Recebido')
      .gte('data_recebimento', filtro.dataInicio)
      .lte('data_recebimento', filtro.dataFim);

    const entradas = (contasRecebidas || [])
      .reduce((sum, c) => sum + Number(c.valor_recebido || c.valor || 0), 0);

    // Saídas: Contas Pagas no período
    const { data: contasPagas } = await db
      .from('contas_pagar')
      .select('*')
      .eq('empresa_id', filtro.empresaId)
      .eq('status', 'Pago')
      .gte('data_pagamento', filtro.dataInicio)
      .lte('data_pagamento', filtro.dataFim);

    const saidas = (contasPagas || [])
      .reduce((sum, c) => sum + Number(c.valor_pago || c.valor || 0), 0);

    const saldoFinal = saldoInicial + entradas - saidas;
    
    // Burn Rate: média mensal de saídas
    const dataIni = new Date(filtro.dataInicio);
    const dataFim = new Date(filtro.dataFim);
    const diasPeriodo = Math.max(1, Math.floor((dataFim.getTime() - dataIni.getTime()) / (1000 * 60 * 60 * 24)));
    const burnRate = (saidas / diasPeriodo) * 30;

    return {
      saldoInicial,
      entradas,
      saidas,
      saldoFinal,
      burnRate,
    };
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

// ===== CALCULAR PRAZOS MÉDIOS =====
async function calcularPrazosMedios(filtro: PeriodoFiltro) {
  try {
    // PMR - Prazo Médio de Recebimento
    const { data: contasRecebidas } = await db
      .from('contas_receber')
      .select('data_emissao, data_recebimento')
      .eq('empresa_id', filtro.empresaId)
      .eq('status', 'Recebido')
      .not('data_recebimento', 'is', null)
      .gte('data_recebimento', filtro.dataInicio)
      .lte('data_recebimento', filtro.dataFim);

    let pmr = 28; // valor padrão
    if (contasRecebidas && contasRecebidas.length > 0) {
      const totalDias = contasRecebidas.reduce((sum, c) => {
        const emissao = new Date(c.data_emissao);
        const recebimento = new Date(c.data_recebimento);
        const dias = Math.floor((recebimento.getTime() - emissao.getTime()) / (1000 * 60 * 60 * 24));
        return sum + Math.max(0, dias);
      }, 0);
      pmr = Math.round(totalDias / contasRecebidas.length);
    }

    // PMP - Prazo Médio de Pagamento
    const { data: contasPagas } = await db
      .from('contas_pagar')
      .select('data_emissao, data_pagamento')
      .eq('empresa_id', filtro.empresaId)
      .eq('status', 'Pago')
      .not('data_pagamento', 'is', null)
      .gte('data_pagamento', filtro.dataInicio)
      .lte('data_pagamento', filtro.dataFim);

    let pmp = 35; // valor padrão
    if (contasPagas && contasPagas.length > 0) {
      const totalDias = contasPagas.reduce((sum, c) => {
        const emissao = new Date(c.data_emissao);
        const pagamento = new Date(c.data_pagamento);
        const dias = Math.floor((pagamento.getTime() - emissao.getTime()) / (1000 * 60 * 60 * 24));
        return sum + Math.max(0, dias);
      }, 0);
      pmp = Math.round(totalDias / contasPagas.length);
    }

    // PME - Prazo Médio de Estoque (simplificado - valor fixo por enquanto)
    const pme = 22;

    return { pmr, pmp, pme };
  } catch (error) {
    console.error('Erro ao calcular prazos médios:', error);
    return { pmr: 28, pmp: 35, pme: 22 };
  }
}

// ===== CALCULAR AGING =====
async function calcularAging(empresaId: string): Promise<{ aging: AgingData[]; totalReceber: number; totalVencido: number; percentualInadimplencia: number; provisaoDevedoresDuvidosos: number }> {
  try {
    const { data: contasReceber } = await db
      .from('contas_receber')
      .select('*')
      .eq('empresa_id', empresaId)
      .in('status', ['Aberto', 'Pendente', 'Vencido']);

    const hoje = new Date();
    
    const aging: AgingData[] = [
      { periodo: 'A Vencer', valor: 0, percentual: 0, quantidade: 0 },
      { periodo: '1-30 dias', valor: 0, percentual: 0, quantidade: 0 },
      { periodo: '31-60 dias', valor: 0, percentual: 0, quantidade: 0 },
      { periodo: '61-90 dias', valor: 0, percentual: 0, quantidade: 0 },
      { periodo: '> 90 dias', valor: 0, percentual: 0, quantidade: 0 },
    ];

    let totalReceber = 0;

    (contasReceber || []).forEach(conta => {
      const vencimento = new Date(conta.data_vencimento);
      const diasVencidos = Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
      const valor = Number(conta.valor || 0);
      
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

    // Calcular percentuais
    aging.forEach(a => {
      a.percentual = totalReceber > 0 ? (a.valor / totalReceber) * 100 : 0;
    });

    const totalVencido = aging.slice(1).reduce((sum, a) => sum + a.valor, 0);
    const percentualInadimplencia = totalReceber > 0 ? (totalVencido / totalReceber) * 100 : 0;
    
    // PECLD: 30% do total vencido
    const provisaoDevedoresDuvidosos = totalVencido * 0.30;

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

// ===== FUNÇÃO PRINCIPAL =====
export async function gerarRelatorioCompleto(filtro: PeriodoFiltro): Promise<RelatorioData & { agingData: AgingData[] }> {
  try {
    console.log('🔄 Gerando relatório para:', filtro);

    // 1. Buscar lançamentos
    const lancamentos = await buscarLancamentos(filtro);
    console.log('📊 Lançamentos encontrados:', lancamentos.length);
    
    // 2. Calcular DRE
    const { receitaBruta, impostos, receitaLiquida } = calcularReceitas(lancamentos);
    const { custosVariaveis, despesasFixas, despesasFinanceiras, depreciacaoAmortizacao } = calcularDespesas(lancamentos);
    
    const margemContribuicao = receitaLiquida - custosVariaveis;
    const ebitda = margemContribuicao - despesasFixas;
    const ebit = ebitda - depreciacaoAmortizacao;
    
    const receitasFinanceiras = lancamentos
      .filter(l => l.tipo === 'Receita' && l.categoria?.toLowerCase().includes('financeira'))
      .reduce((sum, l) => sum + Number(l.valor || 0), 0);
    
    const lair = ebit + receitasFinanceiras - despesasFinanceiras;
    const impostoRenda = Math.max(0, lair * 0.30); // 30% simplificado
    const lucroLiquido = lair - impostoRenda;
    
    // 3. Calcular Fluxo de Caixa
    const fluxoCaixa = await calcularFluxoCaixa(filtro);
    
    // 4. Calcular KPIs
    const margemBruta = receitaLiquida > 0 ? (margemContribuicao / receitaLiquida) * 100 : 0;
    const margemLiquida = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0;
    const roi = receitaLiquida > 0 ? (lucroLiquido / (receitaLiquida / 2)) * 100 : 0;
    const pontoEquilibrio = margemBruta > 0 ? despesasFixas / (margemBruta / 100) : 0;
    
    // 5. Calcular Prazos Médios
    const prazosMedios = await calcularPrazosMedios(filtro);
    
    // 6. Calcular Inadimplência
    const inadimplencia = await calcularAging(filtro.empresaId);
    
    // 7. Orçamento (valores estimados - pode ser implementado com tabela específica)
    const orcadoReceita = receitaBruta * 0.95; // 95% do realizado como estimativa
    const orcadoDespesas = fluxoCaixa.saidas * 1.08; // 108% do realizado
    const desvioReceita = orcadoReceita > 0 ? ((receitaBruta - orcadoReceita) / orcadoReceita) * 100 : 0;
    const desvioDespesas = orcadoDespesas > 0 ? ((fluxoCaixa.saidas - orcadoDespesas) / orcadoDespesas) * 100 : 0;
    
    console.log('✅ Relatório gerado com sucesso!');
    
    return {
      // DRE
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
      
      // Fluxo de Caixa
      ...fluxoCaixa,
      
      // KPIs
      margemBruta,
      margemLiquida,
      roi,
      pontoEquilibrio,
      
      // Prazos Médios
      ...prazosMedios,
      
      // Inadimplência
      totalReceber: inadimplencia.totalReceber,
      totalVencido: inadimplencia.totalVencido,
      percentualInadimplencia: inadimplencia.percentualInadimplencia,
      provisaoDevedoresDuvidosos: inadimplencia.provisaoDevedoresDuvidosos,
      agingData: inadimplencia.aging,
      
      // Comparativos
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
