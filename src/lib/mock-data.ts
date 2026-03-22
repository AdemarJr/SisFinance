// Sistema de dados mock para demonstração
// Funciona com localStorage para persistência local

const STORAGE_KEYS = {
  contas: 'sisfinance_contas',
  clientes: 'sisfinance_clientes',
  fornecedores: 'sisfinance_fornecedores',
  lancamentos: 'sisfinance_lancamentos',
  contas_pagar: 'sisfinance_contas_pagar',
  contas_receber: 'sisfinance_contas_receber',
};

// Dados iniciais de demonstração
const INITIAL_DATA = {
  contas: [
    {
      id: '1',
      nome: 'Caixa Principal',
      tipo: 'Caixa',
      saldo_inicial: 5000,
      saldo_atual: 8500,
      data_inicio: '2024-01-01',
      ativo: true,
    },
    {
      id: '2',
      nome: 'Banco Itaú',
      tipo: 'Banco',
      saldo_inicial: 20000,
      saldo_atual: 25300,
      data_inicio: '2024-01-01',
      ativo: true,
    },
  ],
  clientes: [
    {
      id: '1',
      nome: 'João Silva',
      tipo: 'Pessoa Física',
      documento: '123.456.789-00',
      contato: '(11) 98765-4321',
      email: 'joao@email.com',
      ativo: true,
    },
    {
      id: '2',
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
      id: '1',
      nome: 'Fornecedor XYZ',
      categoria: 'Matéria Prima',
      contato: '(11) 2222-3333',
      email: 'vendas@xyz.com',
      ativo: true,
    },
  ],
  lancamentos: [
    {
      id: '1',
      data: new Date().toISOString().split('T')[0],
      tipo: 'Receita',
      valor: 5000,
      descricao: 'Venda de produtos',
      status: 'Recebido',
      conta_origem_id: '1',
    },
    {
      id: '2',
      data: new Date().toISOString().split('T')[0],
      tipo: 'Despesa',
      valor: 1500,
      descricao: 'Compra de materiais',
      status: 'Pago',
      conta_origem_id: '2',
    },
  ],
  contas_pagar: [
    {
      id: '1',
      fornecedor_id: '1',
      descricao: 'Fornecimento de materiais',
      valor_total: 3000,
      valor_pago: 0,
      data_emissao: new Date().toISOString().split('T')[0],
      data_vencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      status: 'Em Aberto',
    },
  ],
  contas_receber: [
    {
      id: '1',
      cliente_id: '1',
      descricao: 'Venda de serviços',
      valor_total: 2000,
      valor_recebido: 0,
      data_emissao: new Date().toISOString().split('T')[0],
      data_vencimento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      status: 'Previsto',
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
export const mockApi = {
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
          };
        },
        
        // Método in direto
        in: (column: string, values: any[]) => {
          const filtered = data.filter((item: any) => values.includes(item[column]));
          
          return {
            data: filtered,
            error: null,
            
            // gte após in
            gte: (column2: string, value2: any) => ({
              lte: (column3: string, value3: any) => ({
                data: filtered.filter(
                  (item: any) => item[column2] >= value2 && item[column3] <= value3
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
        const filteredData = currentData.filter((item: any) => item[column] !== value);
        setData(tableKey, filteredData);
        return { data: null, error: null };
      },
    }),
  }),
  rpc: (functionName: string) => {
    // Mock para funções RPC
    return { data: null, error: null };
  },
};

// Inicializa dados ao carregar
initializeData();