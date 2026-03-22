export interface Venda {
  id: string;
  data: string;
  total: number;
  lucro_total: number;
  custo_total: number;
  margem_lucro: number;
  forma_pagamento: string;
  usuario_nome: string;
  numero_recibo?: string;
}

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  estoque_atual: number;
  estoque_minimo: number;
  preco_custo_medio: number;
  preco_venda: number;
  valor_estoque: number;
}

export interface Caixa {
  id: string;
  data_abertura: string;
  data_fechamento: string;
  duracao: string;
  total_vendas: number;
  diferenca: number;
  saldo_abertura: number;
  saldo_fechamento: number;
}

export interface Totais {
  totalVendas: number;
  totalLucro: number;
  totalCusto: number;
  quantidade: number;
}

export interface EstatisticasPorChave {
  total: number;
  quantidade: number;
}

/**
 * Processador de dados do PyrouStock
 * Fornece métodos utilitários para análise e transformação de dados
 */
export class PyrouStockProcessor {
  /**
   * Calcular totais gerais de vendas
   */
  static calcularTotais(vendas: Venda[]): Totais {
    return vendas.reduce(
      (acc, venda) => ({
        totalVendas: acc.totalVendas + (venda.total || 0),
        totalLucro: acc.totalLucro + (venda.lucro_total || 0),
        totalCusto: acc.totalCusto + (venda.custo_total || 0),
        quantidade: acc.quantidade + 1,
      }),
      { totalVendas: 0, totalLucro: 0, totalCusto: 0, quantidade: 0 }
    );
  }

  /**
   * Agrupar vendas por forma de pagamento
   */
  static agruparPorFormaPagamento(
    vendas: Venda[]
  ): Record<string, EstatisticasPorChave> {
    return vendas.reduce((acc, venda) => {
      const forma = venda.forma_pagamento || 'Não informado';
      if (!acc[forma]) {
        acc[forma] = { total: 0, quantidade: 0 };
      }
      acc[forma].total += venda.total || 0;
      acc[forma].quantidade += 1;
      return acc;
    }, {} as Record<string, EstatisticasPorChave>);
  }

  /**
   * Agrupar vendas por dia
   */
  static agruparPorDia(vendas: Venda[]): Record<
    string,
    { total: number; lucro: number; quantidade: number }
  > {
    return vendas.reduce((acc, venda) => {
      const dia = new Date(venda.data).toISOString().split('T')[0];
      if (!acc[dia]) {
        acc[dia] = { total: 0, lucro: 0, quantidade: 0 };
      }
      acc[dia].total += venda.total || 0;
      acc[dia].lucro += venda.lucro_total || 0;
      acc[dia].quantidade += 1;
      return acc;
    }, {} as Record<string, { total: number; lucro: number; quantidade: number }>);
  }

  /**
   * Agrupar vendas por semana
   */
  static agruparPorSemana(vendas: Venda[]): Record<
    string,
    { total: number; lucro: number; quantidade: number }
  > {
    return vendas.reduce((acc, venda) => {
      const data = new Date(venda.data);
      // Obter primeiro dia da semana (domingo)
      const primeiroDiaSemana = new Date(data);
      primeiroDiaSemana.setDate(data.getDate() - data.getDay());
      const semana = primeiroDiaSemana.toISOString().split('T')[0];

      if (!acc[semana]) {
        acc[semana] = { total: 0, lucro: 0, quantidade: 0 };
      }
      acc[semana].total += venda.total || 0;
      acc[semana].lucro += venda.lucro_total || 0;
      acc[semana].quantidade += 1;
      return acc;
    }, {} as Record<string, { total: number; lucro: number; quantidade: number }>);
  }

  /**
   * Calcular margem de lucro média
   */
  static calcularMargemLucro(vendas: Venda[]): number {
    const totais = this.calcularTotais(vendas);
    if (totais.totalVendas === 0) return 0;
    return (totais.totalLucro / totais.totalVendas) * 100;
  }

  /**
   * Calcular ticket médio
   */
  static calcularTicketMedio(vendas: Venda[]): number {
    const totais = this.calcularTotais(vendas);
    if (totais.quantidade === 0) return 0;
    return totais.totalVendas / totais.quantidade;
  }

  /**
   * Encontrar top vendedores
   */
  static topVendedores(
    vendas: Venda[],
    limit = 5
  ): Array<{ nome: string; total: number; quantidade: number }> {
    const vendedores = vendas.reduce((acc, venda) => {
      const nome = venda.usuario_nome || 'Sem nome';
      if (!acc[nome]) {
        acc[nome] = { total: 0, quantidade: 0 };
      }
      acc[nome].total += venda.total || 0;
      acc[nome].quantidade += 1;
      return acc;
    }, {} as Record<string, EstatisticasPorChave>);

    return Object.entries(vendedores)
      .map(([nome, stats]) => ({ nome, ...stats }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  /**
   * Produtos com estoque baixo
   */
  static produtosEstoqueBaixo(produtos: Produto[]): Produto[] {
    return produtos.filter(
      (p) => p.estoque_atual <= p.estoque_minimo
    );
  }

  /**
   * Valor total do estoque
   */
  static valorTotalEstoque(produtos: Produto[]): number {
    return produtos.reduce((sum, p) => sum + (p.valor_estoque || 0), 0);
  }

  /**
   * Top produtos por valor em estoque
   */
  static topProdutosPorValor(produtos: Produto[], limit = 10): Produto[] {
    return [...produtos]
      .sort((a, b) => b.valor_estoque - a.valor_estoque)
      .slice(0, limit);
  }

  /**
   * Análise de fechamentos de caixa
   */
  static analisarCaixas(caixas: Caixa[]): {
    totalVendas: number;
    totalDiferencas: number;
    caixasComDiferenca: number;
    mediaDiferenca: number;
  } {
    const totalVendas = caixas.reduce((sum, c) => sum + (c.total_vendas || 0), 0);
    const totalDiferencas = caixas.reduce((sum, c) => sum + Math.abs(c.diferenca || 0), 0);
    const caixasComDiferenca = caixas.filter((c) => Math.abs(c.diferenca || 0) > 0.01).length;

    return {
      totalVendas,
      totalDiferencas,
      caixasComDiferenca,
      mediaDiferenca: caixas.length > 0 ? totalDiferencas / caixas.length : 0,
    };
  }

  /**
   * Filtrar vendas por período
   */
  static filtrarPorPeriodo(
    vendas: Venda[],
    dataInicio: Date,
    dataFim: Date
  ): Venda[] {
    return vendas.filter((venda) => {
      const data = new Date(venda.data);
      return data >= dataInicio && data <= dataFim;
    });
  }

  /**
   * Converter vendas para formato CSV
   */
  static toCSV(vendas: Venda[]): string {
    const headers = ['Data', 'Recibo', 'Vendedor', 'Total', 'Lucro', 'Forma Pagamento'];
    const rows = vendas.map((v) => [
      new Date(v.data).toLocaleString('pt-BR'),
      v.numero_recibo || '-',
      v.usuario_nome || '-',
      v.total.toFixed(2),
      v.lucro_total.toFixed(2),
      v.forma_pagamento || '-',
    ]);

    return [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');
  }

  /**
   * Gerar resumo executivo
   */
  static gerarResumoExecutivo(
    vendas: Venda[],
    produtos: Produto[],
    caixas: Caixa[]
  ): {
    vendas: Totais & { ticketMedio: number; margemLucro: number };
    estoque: { valorTotal: number; produtosBaixos: number; totalProdutos: number };
    caixas: ReturnType<typeof PyrouStockProcessor.analisarCaixas>;
  } {
    const totaisVendas = this.calcularTotais(vendas);
    const ticketMedio = this.calcularTicketMedio(vendas);
    const margemLucro = this.calcularMargemLucro(vendas);

    const valorTotalEstoque = this.valorTotalEstoque(produtos);
    const produtosBaixos = this.produtosEstoqueBaixo(produtos);

    const analiseCaixas = this.analisarCaixas(caixas);

    return {
      vendas: {
        ...totaisVendas,
        ticketMedio,
        margemLucro,
      },
      estoque: {
        valorTotal: valorTotalEstoque,
        produtosBaixos: produtosBaixos.length,
        totalProdutos: produtos.length,
      },
      caixas: analiseCaixas,
    };
  }
}
