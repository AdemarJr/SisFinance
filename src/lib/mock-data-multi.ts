// Sistema de dados mock multientidade para demonstração
// Funciona com localStorage para persistência local

const STORAGE_KEYS = {
  empresas: 'sisfinance_empresas',
  contas: 'sisfinance_contas',
  clientes: 'sisfinance_clientes',
  clientes_sistema: 'sisfinance_clientes_sistema',
  planos_assinatura: 'sisfinance_planos_assinatura',
  fornecedores: 'sisfinance_fornecedores',
  funcionarios: 'sisfinance_funcionarios',
  pagamentos_extras: 'sisfinance_pagamentos_extras',
  categorias_produtos: 'sisfinance_categorias_produtos',
  produtos: 'sisfinance_produtos',
  movimentacoes_estoque: 'sisfinance_movimentacoes_estoque',
  categorias_receitas: 'sisfinance_categorias_receitas',
  categorias_despesas: 'sisfinance_categorias_despesas',
  lancamentos: 'sisfinance_lancamentos',
  contas_pagar: 'sisfinance_contas_pagar',
  contas_receber: 'sisfinance_contas_receber',
  fechamentos_caixa: 'sisfinance_fechamentos_caixa',
  metas: 'sisfinance_metas',
};

// Dados iniciais de demonstração
const INITIAL_DATA = {
  empresas: [
    {
      id: 'emp1',
      nome: 'Unidade 01 - Centro',
      tipo: 'Unidade Operacional',
      cnpj: '12.345.678/0001-01',
      endereco: 'Av. Principal, 123 - Centro',
      responsavel: 'Carlos Manager',
      ativo: true,
    },
    {
      id: 'emp2',
      nome: 'Unidade 02 - Shopping',
      tipo: 'Unidade Operacional',
      cnpj: '12.345.678/0002-02',
      endereco: 'Shopping Center, Loja 45',
      responsavel: 'Ana Gestora',
      ativo: true,
    },
    {
      id: 'emp3',
      nome: 'Holding Gastronômica',
      tipo: 'Holding',
      cnpj: '12.345.678/0003-03',
      endereco: 'Av. Corporativa, 500',
      responsavel: 'João Diretor',
      ativo: true,
    },
  ],
  contas: [
    // Unidade 01
    {
      id: 'conta1',
      empresa_id: 'emp1',
      nome: 'Caixa Físico',
      tipo: 'Caixa',
      banco: null,
      saldo_inicial: 500,
      saldo_atual: 1200,
      data_inicio: '2024-01-01',
      ativo: true,
    },
    {
      id: 'conta2',
      empresa_id: 'emp1',
      nome: 'Banco Itaú',
      tipo: 'Banco',
      banco: 'Itaú',
      agencia: '1234',
      conta: '56789-0',
      saldo_inicial: 10000,
      saldo_atual: 15000,
      data_inicio: '2024-01-01',
      ativo: true,
    },
    {
      id: 'conta3',
      empresa_id: 'emp1',
      nome: 'Caixa Econômica',
      tipo: 'Banco',
      banco: 'Caixa Econômica Federal',
      agencia: '0987',
      conta: '12345-6',
      saldo_inicial: 5000,
      saldo_atual: 8000,
      data_inicio: '2024-01-01',
      ativo: true,
    },
    // Unidade 02
    {
      id: 'conta4',
      empresa_id: 'emp2',
      nome: 'Caixa Físico',
      tipo: 'Caixa',
      banco: null,
      saldo_inicial: 500,
      saldo_atual: 900,
      data_inicio: '2024-01-01',
      ativo: true,
    },
    {
      id: 'conta5',
      empresa_id: 'emp2',
      nome: 'Banco Itaú',
      tipo: 'Banco',
      banco: 'Itaú',
      agencia: '1234',
      conta: '98765-4',
      saldo_inicial: 8000,
      saldo_atual: 12000,
      data_inicio: '2024-01-01',
      ativo: true,
    },
  ],
  clientes: [
    {
      id: 'cli1',
      empresa_id: 'emp1',
      nome: 'João Silva',
      tipo: 'Pessoa Física',
      documento: '123.456.789-00',
      contato: '(11) 98765-4321',
      email: 'joao@email.com',
      ativo: true,
    },
    {
      id: 'cli2',
      empresa_id: 'emp1',
      nome: 'Empresa ABC Ltda',
      tipo: 'Pessoa Jurídica',
      documento: '12.345.678/0001-90',
      contato: '(11) 3333-4444',
      email: 'contato@empresaabc.com',
      ativo: true,
    },
  ],
  fornecedores: [
    {
      id: 'forn1',
      empresa_id: 'emp1',
      nome: 'Distribuidora de Carnes Premium',
      categoria: 'Matéria Prima',
      contato: '(11) 2222-3333',
      email: 'vendas@carnespremium.com',
      ativo: true,
    },
    {
      id: 'forn2',
      empresa_id: 'emp1',
      nome: 'Bebidas e CIA',
      categoria: 'Bebidas',
      contato: '(11) 4444-5555',
      email: 'pedidos@bebidasecia.com',
      ativo: true,
    },
  ],
  funcionarios: [
    {
      id: 'func1',
      empresa_id: 'emp1',
      nome: 'João Silva',
      cargo: 'Garçom',
      tipo_contrato: 'CLT',
      documento: '123.456.789-00',
      contato: '(11) 91111-2222',
      salario_base: 2000,
      data_admissao: '2024-01-15',
      ativo: true,
    },
    {
      id: 'func2',
      empresa_id: 'emp1',
      nome: 'Maria Santos',
      cargo: 'Atendente',
      tipo_contrato: 'CLT',
      documento: '987.654.321-00',
      contato: '(11) 92222-3333',
      salario_base: 1800,
      data_admissao: '2024-02-01',
      ativo: true,
    },
    {
      id: 'func3',
      empresa_id: 'emp1',
      nome: 'Pedro Costa',
      cargo: 'Freelancer',
      tipo_contrato: 'Freelancer',
      documento: '111.222.333-44',
      contato: '(11) 93333-4444',
      salario_base: 0,
      data_admissao: '2024-03-01',
      ativo: true,
    },
    {
      id: 'func4',
      empresa_id: 'emp1',
      nome: 'Ana Oliveira',
      cargo: 'Cozinheiro',
      tipo_contrato: 'CLT',
      documento: '555.666.777-88',
      contato: '(11) 94444-5555',
      salario_base: 2500,
      data_admissao: '2024-01-10',
      ativo: true,
    },
  ],
  pagamentos_extras: [
    {
      id: 'extra1',
      empresa_id: 'emp1',
      funcionario_id: 'func1',
      conta_origem_id: 'conta1',
      tipo_extra: 'Gorjeta',
      valor: 150,
      data_pagamento: new Date().toISOString().split('T')[0],
      descricao: 'Gorjetas do dia',
      status: 'Pago',
    },
    {
      id: 'extra2',
      empresa_id: 'emp1',
      funcionario_id: 'func3',
      conta_origem_id: 'conta1',
      tipo_extra: 'Diária',
      valor: 200,
      data_pagamento: new Date().toISOString().split('T')[0],
      descricao: 'Diária freelancer',
      status: 'Pago',
    },
  ],
  categorias_produtos: [
    {
      id: 'catprod1',
      empresa_id: 'emp1',
      nome: 'Carnes',
      descricao: 'Carnes e proteínas',
      ativo: true,
    },
    {
      id: 'catprod2',
      empresa_id: 'emp1',
      nome: 'Bebidas',
      descricao: 'Bebidas alcoólicas e não alcoólicas',
      ativo: true,
    },
    {
      id: 'catprod3',
      empresa_id: 'emp1',
      nome: 'Hortifruti',
      descricao: 'Frutas, legumes e verduras',
      ativo: true,
    },
  ],
  produtos: [
    {
      id: 'prod1',
      empresa_id: 'emp1',
      categoria_id: 'catprod1',
      codigo: 'P001',
      nome: 'Picanha',
      unidade_medida: 'KG',
      estoque_minimo: 5,
      estoque_atual: 12,
      preco_custo_medio: 45.0,
      preco_venda: 89.9,
      ativo: true,
    },
    {
      id: 'prod2',
      empresa_id: 'emp1',
      categoria_id: 'catprod2',
      codigo: 'P002',
      nome: 'Cerveja Long Neck',
      unidade_medida: 'UN',
      estoque_minimo: 100,
      estoque_atual: 250,
      preco_custo_medio: 2.5,
      preco_venda: 8.0,
      ativo: true,
    },
    {
      id: 'prod3',
      empresa_id: 'emp1',
      categoria_id: 'catprod3',
      codigo: 'P003',
      nome: 'Alface',
      unidade_medida: 'UN',
      estoque_minimo: 10,
      estoque_atual: 25,
      preco_custo_medio: 1.2,
      preco_venda: 0,
      ativo: true,
    },
  ],
  movimentacoes_estoque: [
    {
      id: 'mov1',
      empresa_id: 'emp1',
      produto_id: 'prod1',
      tipo_movimentacao: 'Entrada',
      quantidade: 20,
      preco_unitario: 45.0,
      valor_total: 900,
      data_movimentacao: '2026-02-10',
      documento: 'NF-12345',
      observacao: 'Compra semanal',
    },
    {
      id: 'mov2',
      empresa_id: 'emp1',
      produto_id: 'prod1',
      tipo_movimentacao: 'Saída',
      quantidade: 8,
      preco_unitario: 45.0,
      valor_total: 360,
      data_movimentacao: '2026-02-12',
      observacao: 'Consumo do dia',
    },
  ],
  categorias_receitas: [
    {
      id: 'catrec1',
      nome: 'Vendas de Alimentos',
      grupo: 'Operacional',
      ativo: true,
    },
    {
      id: 'catrec2',
      nome: 'Vendas de Bebidas',
      grupo: 'Operacional',
      ativo: true,
    },
    {
      id: 'catrec3',
      nome: 'Taxa de Serviço (10%)',
      grupo: 'Operacional',
      ativo: true,
    },
    {
      id: 'catrec4',
      nome: 'Delivery',
      grupo: 'Operacional',
      ativo: true,
    },
  ],
  categorias_despesas: [
    {
      id: 'catdesp1',
      nome: 'Aluguel',
      grupo: 'Fixa',
      ativo: true,
    },
    {
      id: 'catdesp2',
      nome: 'Salários e Encargos',
      grupo: 'Fixa',
      ativo: true,
    },
    {
      id: 'catdesp3',
      nome: 'Energia Elétrica',
      grupo: 'Fixa',
      ativo: true,
    },
    {
      id: 'catdesp4',
      nome: 'Matéria Prima',
      grupo: 'Variável',
      ativo: true,
    },
    {
      id: 'catdesp5',
      nome: 'Comissões e Gorjetas',
      grupo: 'Variável',
      ativo: true,
    },
  ],
  lancamentos: [
    {
      id: 'lanc1',
      empresa_id: 'emp1',
      data: new Date().toISOString().split('T')[0],
      tipo: 'Receita',
      categoria_id: 'catrec1',
      valor: 5000,
      descricao: 'Vendas do dia - Alimentos',
      status: 'Recebido',
      conta_origem_id: 'conta1',
    },
    {
      id: 'lanc2',
      empresa_id: 'emp1',
      data: new Date().toISOString().split('T')[0],
      tipo: 'Despesa',
      categoria_id: 'catdesp4',
      valor: 900,
      descricao: 'Compra de carnes',
      status: 'Pago',
      conta_origem_id: 'conta2',
      fornecedor_id: 'forn1',
    },
  ],
  contas_pagar: [
    {
      id: 'cp1',
      empresa_id: 'emp1',
      fornecedor_id: 'forn1',
      descricao: 'Fornecimento mensal de carnes',
      valor_total: 3000,
      valor_pago: 0,
      data_emissao: new Date().toISOString().split('T')[0],
      data_vencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      status: 'Em Aberto',
      categoria_despesa_id: 'catdesp4',
    },
  ],
  contas_receber: [
    {
      id: 'cr1',
      empresa_id: 'emp1',
      cliente_id: 'cli2',
      descricao: 'Evento corporativo',
      valor_total: 5000,
      valor_recebido: 0,
      data_emissao: new Date().toISOString().split('T')[0],
      data_vencimento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      status: 'Previsto',
      categoria_receita_id: 'catrec1',
    },
  ],
  fechamentos_caixa: [
    {
      id: 'fech1',
      empresa_id: 'emp1',
      data_fechamento: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      conta_caixa_id: 'conta1',
      saldo_inicial: 500,
      total_entradas: 5000,
      total_saidas: 350,
      total_gorjetas: 450,
      total_extras_pagos: 350,
      saldo_final: 4300,
      saldo_esperado: 4650,
      diferenca: -350,
      deposito_banco_id: 'conta2',
      valor_depositado: 4000,
      responsavel: 'Carlos Manager',
      status: 'Fechado',
      observacoes: 'Diferença justificada por pagamento de gorjetas',
    },
  ],
  metas: [
    {
      id: 'meta1',
      empresa_id: 'emp1',
      mes: 2,
      ano: 2026,
      meta_receita: 150000,
      meta_despesa: 100000,
    },
  ],
  planos_assinatura: [
    {
      id: 'plano1',
      nome: 'Gratuito',
      descricao: 'Plano básico gratuito',
      preco_mensal: 0,
      limite_empresas: 1,
      ativo: true,
    },
    {
      id: 'plano2',
      nome: 'Iniciante',
      descricao: 'Plano para pequenos negócios',
      preco_mensal: 49.90,
      limite_empresas: 3,
      ativo: true,
    },
    {
      id: 'plano3',
      nome: 'Profissional',
      descricao: 'Plano para médias empresas',
      preco_mensal: 99.90,
      limite_empresas: 10,
      ativo: true,
    },
    {
      id: 'plano4',
      nome: 'Enterprise',
      descricao: 'Plano para grandes empresas',
      preco_mensal: 299.90,
      limite_empresas: 999,
      ativo: true,
    },
  ],
  clientes_sistema: [
    {
      id: 'cliente1',
      auth_user_id: 'mock_user_id',
      nome_completo: 'Usuário Demo',
      email: 'demo@sisfinance.com',
      telefone: '(11) 98765-4321',
      plano_id: 'plano2',
      status: 'Ativo',
      is_super_admin: false,
      data_assinatura: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    },
  ],
};

// Inicializa dados se não existirem
function initializeData() {
  Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
    if (!localStorage.getItem(storageKey)) {
      localStorage.setItem(
        storageKey,
        JSON.stringify(INITIAL_DATA[key as keyof typeof INITIAL_DATA] || [])
      );
    }
  });
}

// Funções auxiliares
function getData(key: keyof typeof STORAGE_KEYS) {
  const data = localStorage.getItem(STORAGE_KEYS[key]);
  return data ? JSON.parse(data) : [];
}

function setData(key: keyof typeof STORAGE_KEYS, data: any[]) {
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// API Mock compatível com Supabase
export const mockApiMulti = {
  from: (table: string) => ({
    select: (columns = '*') => {
      const data = getData(table as keyof typeof STORAGE_KEYS);

      return {
        // Retorna os dados diretamente (sem filtros)
        data,
        error: null,

        // Método eq
        eq: (column: string, value: any) => {
          const filtered = data.filter((item: any) => item[column] === value);

          return {
            data: filtered,
            error: null,

            // Método in após eq
            in: (column2: string, values: any[]) => ({
              gte: (column3: string, value3: any) => ({
                lte: (column4: string, value4: any) => ({
                  data: filtered.filter(
                    (item: any) =>
                      values.includes(item[column2]) &&
                      item[column3] >= value3 &&
                      item[column4] <= value4
                  ),
                  error: null,
                }),
              }),
            }),
            
            // single após eq
            single: () => ({
              data: filtered[0] || null,
              error: null,
            }),
          };
        },

        // Método in direto
        in: (column: string, values: any[]) => {
          const filtered = data.filter((item: any) =>
            values.includes(item[column])
          );

          return {
            data: filtered,
            error: null,

            // gte após in
            gte: (column2: string, value2: any) => ({
              lte: (column3: string, value3: any) => ({
                data: filtered.filter(
                  (item: any) =>
                    item[column2] >= value2 && item[column3] <= value3
                ),
                error: null,
              }),
            }),
          };
        },

        // Método single
        single: () => ({
          data: data[0] || null,
          error: null,
        }),

        // Método order
        order: (column: string, options?: any) => ({
          data: [...data].sort((a: any, b: any) => {
            if (options?.ascending === false) {
              return b[column] > a[column] ? 1 : -1;
            }
            return a[column] > b[column] ? 1 : -1;
          }),
          error: null,
        }),

        // Método gte
        gte: (column: string, value: any) => {
          const filtered = data.filter((item: any) => item[column] >= value);

          return {
            data: filtered,
            error: null,

            // lte após gte
            lte: (column2: string, value2: any) => ({
              data: filtered.filter((item: any) => item[column2] <= value2),
              error: null,
            }),
          };
        },
      };
    },
    insert: (newData: any) => {
      const tableKey = table as keyof typeof STORAGE_KEYS;
      const currentData = getData(tableKey);
      const dataWithId = Array.isArray(newData)
        ? newData.map((item) => ({ ...item, id: generateId() }))
        : { ...newData, id: generateId() };

      const updatedData = Array.isArray(dataWithId)
        ? [...currentData, ...dataWithId]
        : [...currentData, dataWithId];

      setData(tableKey, updatedData);
      return { data: dataWithId, error: null };
    },
    update: (updates: any) => ({
      eq: (column: string, value: any) => {
        const tableKey = table as keyof typeof STORAGE_KEYS;
        const currentData = getData(tableKey);
        const updatedData = currentData.map((item: any) =>
          item[column] === value ? { ...item, ...updates } : item
        );
        setData(tableKey, updatedData);
        return { data: updates, error: null };
      },
    }),
    delete: () => ({
      eq: (column: string, value: any) => {
        const tableKey = table as keyof typeof STORAGE_KEYS;
        const currentData = getData(tableKey);
        const filteredData = currentData.filter(
          (item: any) => item[column] !== value
        );
        setData(tableKey, filteredData);
        return { data: null, error: null };
      },
    }),
  }),
  rpc: (functionName: string, params?: any) => {
    // Mock para funções RPC
    if (functionName === 'calcular_valor_estoque') {
      const produtos = getData('produtos');
      const empresaId = params?.p_empresa_id;
      const total = produtos
        .filter((p: any) => p.empresa_id === empresaId && p.ativo)
        .reduce((sum: number, p: any) => sum + p.estoque_atual * p.preco_custo_medio, 0);
      return Promise.resolve({ data: total, error: null });
    }
    if (functionName === 'calcular_projecao_compra') {
      // Mock simples de projeção
      const produtos = getData('produtos');
      const empresaId = params?.p_empresa_id;
      const projecoes = produtos
        .filter((p: any) => p.empresa_id === empresaId && p.estoque_atual < p.estoque_minimo)
        .map((p: any) => ({
          produto_id: p.id,
          produto_nome: p.nome,
          estoque_atual: p.estoque_atual,
          estoque_minimo: p.estoque_minimo,
          consumo_medio_diario: 2,
          quantidade_necessaria: p.estoque_minimo - p.estoque_atual + 60,
          valor_projetado: (p.estoque_minimo - p.estoque_atual + 60) * p.preco_custo_medio,
        }));
      return Promise.resolve({ data: projecoes, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  },
};

// Inicializa dados ao carregar
initializeData();
