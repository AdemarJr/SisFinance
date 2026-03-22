/**
 * PyrouStock Financial Integration Example
 * 
 * Este script demonstra como integrar o PyrouStock com seu sistema financeiro.
 * Pode ser executado via cron job ou scheduler para sincronização automática.
 * 
 * Requisitos:
 * - Node.js 18+
 * - npm install node-fetch
 * 
 * Uso:
 * node integration-example.js
 */

// Configuração
const CONFIG = {
  PYROUSTOCK_PROJECT_ID: process.env.PYROUSTOCK_PROJECT_ID || 'seu-project-id',
  API_KEY: process.env.PYROUSTOCK_API_KEY || 'pyroustock_integration_xxxxxxxxxxxxx',
  COMPANY_ID: process.env.PYROUSTOCK_COMPANY_ID || '07800941-938b-4d09-9d74-2742eb4f04d6',
  // Base URL da API
  BASE_URL: function() {
    return `https://${this.PYROUSTOCK_PROJECT_ID}.supabase.co/functions/v1/make-server-8a20b27d/integration`;
  }
};

/**
 * Cliente HTTP para API do PyrouStock
 */
class PyrouStockClient {
  constructor(apiKey, baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async request(endpoint, params = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PyrouStock API Error: ${error.error || error.message}`);
    }

    return await response.json();
  }

  /**
   * Exportação consolidada de dados financeiros
   */
  async getFinancialExport(companyId, startDate, endDate) {
    return this.request('/financial-export', {
      companyId,
      startDate,
      endDate
    });
  }

  /**
   * Buscar vendas
   */
  async getSales(companyId, startDate, endDate, limit = 100, offset = 0) {
    return this.request('/sales', {
      companyId,
      startDate,
      endDate,
      limit,
      offset
    });
  }

  /**
   * Buscar fechamentos de caixa
   */
  async getCashierClosures(companyId, startDate, endDate) {
    return this.request('/cashier-closures', {
      companyId,
      startDate,
      endDate
    });
  }

  /**
   * Buscar produtos
   */
  async getProducts(companyId, category = null) {
    const params = { companyId };
    if (category) params.category = category;
    return this.request('/products', params);
  }
}

/**
 * Processador de dados para sistema financeiro
 */
class FinancialProcessor {
  constructor(systemFinanceiroAPI) {
    this.systemFinanceiroAPI = systemFinanceiroAPI;
  }

  /**
   * Processa vendas e gera lançamentos contábeis
   */
  processSales(sales) {
    console.log(`\n📊 Processando ${sales.length} vendas...`);

    const lancamentos = [];

    sales.forEach(sale => {
      // Lançamento de Receita
      const receita = {
        data: sale.date,
        historico: `Venda ${sale.receiptNumber} - ${sale.userName}`,
        lancamentos: [
          {
            conta: this.getContaBancaria(sale.paymentMethod),
            tipo: 'D',
            valor: sale.total
          },
          {
            conta: '3.1.01', // Receita de Vendas
            tipo: 'C',
            valor: sale.total
          }
        ]
      };

      // Lançamento de Custo (CMV)
      const cmv = {
        data: sale.date,
        historico: `CMV - Venda ${sale.receiptNumber}`,
        lancamentos: [
          {
            conta: '1.1.05', // CMV
            tipo: 'D',
            valor: sale.totalCost
          },
          {
            conta: '1.1.03', // Estoque
            tipo: 'C',
            valor: sale.totalCost
          }
        ]
      };

      lancamentos.push(receita, cmv);

      console.log(`  ✅ Venda ${sale.receiptNumber}: R$ ${sale.total.toFixed(2)} (Lucro: R$ ${sale.totalProfit.toFixed(2)})`);
    });

    return lancamentos;
  }

  /**
   * Mapeia forma de pagamento para conta contábil
   */
  getContaBancaria(paymentMethod) {
    const mapping = {
      'money': '1.1.01', // Caixa
      'pix': '1.1.01',   // Caixa
      'debit': '1.1.01', // Caixa (liquidação imediata)
      'credit': '1.1.02' // Contas a Receber
    };
    return mapping[paymentMethod] || '1.1.01';
  }

  /**
   * Processa fechamentos de caixa
   */
  processCashierClosures(closures) {
    console.log(`\n💰 Processando ${closures.length} fechamentos de caixa...`);

    closures.forEach(closure => {
      console.log(`  📅 ${new Date(closure.closeDate).toLocaleDateString('pt-BR')}`);
      console.log(`     Vendas: R$ ${closure.totalSales.toFixed(2)}`);
      console.log(`     Diferença: R$ ${closure.difference.toFixed(2)}`);
      
      if (Math.abs(closure.difference) > 0.01) {
        console.log(`     ⚠️  ATENÇÃO: Caixa com diferença!`);
      }
    });
  }

  /**
   * Atualiza valor do estoque
   */
  updateInventoryValue(products) {
    const totalValue = products.reduce((sum, p) => sum + p.stockValue, 0);
    console.log(`\n📦 Valor total do estoque: R$ ${totalValue.toFixed(2)}`);
    console.log(`   Total de produtos: ${products.length}`);
    
    // Aqui você pode enviar para seu sistema financeiro
    // this.systemFinanceiroAPI.updateAsset('1.1.03', totalValue);
  }
}

/**
 * Exemplo de sincronização diária
 */
async function syncDailyData() {
  try {
    console.log('🚀 Iniciando sincronização com PyrouStock...\n');

    // Inicializar cliente
    const client = new PyrouStockClient(CONFIG.API_KEY, CONFIG.BASE_URL());

    // Definir período (ontem)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const startDate = yesterday.toISOString();
    const endDate = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();

    console.log(`📅 Período: ${yesterday.toLocaleDateString('pt-BR')}`);
    console.log(`   Início: ${startDate}`);
    console.log(`   Fim: ${endDate}\n`);

    // Buscar dados consolidados
    console.log('⏳ Buscando dados...');
    const data = await client.getFinancialExport(CONFIG.COMPANY_ID, startDate, endDate);

    if (!data.success) {
      throw new Error('Falha na exportação de dados');
    }

    // Exibir resumo
    console.log('\n📈 RESUMO FINANCEIRO');
    console.log('='.repeat(50));
    console.log(`Receita Total:     R$ ${data.summary.totalSales.toFixed(2)}`);
    console.log(`Custo Total:       R$ ${data.summary.totalCost.toFixed(2)}`);
    console.log(`Lucro Bruto:       R$ ${data.summary.totalProfit.toFixed(2)}`);
    console.log(`Margem de Lucro:   ${data.summary.profitMargin.toFixed(2)}%`);
    console.log(`Valor do Estoque:  R$ ${data.summary.inventoryValue.toFixed(2)}`);
    console.log(`Total de Vendas:   ${data.summary.salesCount}`);
    console.log('='.repeat(50));

    // Processar dados
    const processor = new FinancialProcessor(null); // Passar API do seu sistema financeiro aqui

    const lancamentos = processor.processSales(data.sales);
    processor.processCashierClosures(data.cashierClosures);
    processor.updateInventoryValue(data.inventory);

    // Salvar lançamentos (exemplo)
    console.log(`\n💾 Total de lançamentos gerados: ${lancamentos.length}`);
    // await sistemaFinanceiro.importarLancamentos(lancamentos);

    console.log('\n✅ Sincronização concluída com sucesso!');

    return {
      success: true,
      summary: data.summary,
      lancamentosCount: lancamentos.length
    };

  } catch (error) {
    console.error('\n❌ Erro na sincronização:', error.message);
    
    // Enviar alerta (email, Slack, etc)
    // await sendAlert(`Erro na sincronização PyrouStock: ${error.message}`);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Exemplo de busca paginada de vendas
 */
async function paginatedSalesExample() {
  const client = new PyrouStockClient(CONFIG.API_KEY, CONFIG.BASE_URL());
  
  let offset = 0;
  const limit = 50;
  let hasMore = true;
  let totalSales = 0;

  while (hasMore) {
    const result = await client.getSales(
      CONFIG.COMPANY_ID,
      '2024-01-01T00:00:00Z',
      '2024-12-31T23:59:59Z',
      limit,
      offset
    );

    totalSales += result.data.length;
    console.log(`Página ${offset / limit + 1}: ${result.data.length} vendas`);

    hasMore = result.pagination.hasMore;
    offset += limit;
  }

  console.log(`Total de vendas no ano: ${totalSales}`);
}

// Executar sincronização
if (require.main === module) {
  syncDailyData()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

// Exportar para uso como módulo
module.exports = {
  PyrouStockClient,
  FinancialProcessor,
  syncDailyData,
  CONFIG
};
