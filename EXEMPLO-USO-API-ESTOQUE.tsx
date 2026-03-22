/**
 * 📦 EXEMPLO DE USO - API DE ESTOQUE
 * 
 * Este arquivo contém exemplos práticos de como integrar
 * o sistema de estoque com os endpoints do servidor.
 * 
 * Copie e cole os trechos necessários na sua aplicação.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';

// ========================================
// CONFIGURAÇÃO BASE
// ========================================

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-b1600651`;

const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erro na requisição');
  }

  return data;
};

// ========================================
// EXEMPLO 1: LISTAR PRODUTOS
// ========================================

export function ExemploListarProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      const empresaId = 'emp1'; // Substitua pelo ID da empresa selecionada

      const resultado = await fetchAPI(`/produtos/${empresaId}`);
      
      setProdutos(resultado.data);
      console.log(`✅ ${resultado.total} produtos carregados`);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <h2>Produtos ({produtos.length})</h2>
      <ul>
        {produtos.map((produto: any) => (
          <li key={produto.id}>
            {produto.codigo} - {produto.nome} | Estoque: {produto.estoque_atual}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ========================================
// EXEMPLO 2: CADASTRAR PRODUTO
// ========================================

export function ExemploCadastrarProduto() {
  const handleCadastrar = async () => {
    try {
      const novoProduto = {
        empresa_id: 'emp1',
        categoria_id: 'catprod1',
        codigo: 'P999',
        nome: 'Filé Mignon',
        unidade_medida: 'KG',
        estoque_minimo: 3,
        estoque_atual: 10,
        preco_custo_medio: 65.00,
        preco_venda: 120.00,
        ativo: true,
      };

      const resultado = await fetchAPI('/produtos', {
        method: 'POST',
        body: JSON.stringify(novoProduto),
      });

      console.log('✅ Produto cadastrado:', resultado.data);
      toast.success(resultado.message);
      
      return resultado.data;
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      toast.error(error.message);
    }
  };

  return (
    <button onClick={handleCadastrar}>
      Cadastrar Produto de Exemplo
    </button>
  );
}

// ========================================
// EXEMPLO 3: ATUALIZAR PRODUTO
// ========================================

export function ExemploAtualizarProduto() {
  const handleAtualizar = async (produtoId: string) => {
    try {
      const empresaId = 'emp1';
      const dadosAtualizacao = {
        estoque_minimo: 5,
        preco_custo_medio: 70.00,
      };

      const resultado = await fetchAPI(`/produtos/${empresaId}/${produtoId}`, {
        method: 'PUT',
        body: JSON.stringify(dadosAtualizacao),
      });

      console.log('✅ Produto atualizado:', resultado.data);
      toast.success(resultado.message);
      
      return resultado.data;
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error(error.message);
    }
  };

  return (
    <button onClick={() => handleAtualizar('prod1')}>
      Atualizar Produto
    </button>
  );
}

// ========================================
// EXEMPLO 4: DELETAR PRODUTO
// ========================================

export function ExemploDeletarProduto() {
  const handleDeletar = async (produtoId: string) => {
    try {
      const empresaId = 'emp1';

      const resultado = await fetchAPI(`/produtos/${empresaId}/${produtoId}`, {
        method: 'DELETE',
      });

      console.log('✅ Produto deletado');
      toast.success(resultado.message);
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      toast.error(error.message);
    }
  };

  return (
    <button onClick={() => handleDeletar('prod1')}>
      Deletar Produto
    </button>
  );
}

// ========================================
// EXEMPLO 5: REGISTRAR MOVIMENTAÇÃO (ENTRADA)
// ========================================

export function ExemploMovimentacaoEntrada() {
  const handleEntrada = async () => {
    try {
      const movimentacao = {
        empresa_id: 'emp1',
        produto_id: 'prod1',
        tipo_movimentacao: 'Entrada',
        quantidade: 50,
        preco_unitario: 45.50,
        data_movimentacao: new Date().toISOString().split('T')[0],
        documento: 'NF-98765',
        observacao: 'Compra de picanha',
      };

      const resultado = await fetchAPI('/movimentacoes', {
        method: 'POST',
        body: JSON.stringify(movimentacao),
      });

      console.log('✅ Movimentação registrada');
      console.log('Estoque anterior:', resultado.data.estoque_anterior);
      console.log('Estoque novo:', resultado.data.estoque_novo);
      console.log('Produto atualizado:', resultado.data.produto);
      
      toast.success(resultado.message);
      
      return resultado.data;
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
      toast.error(error.message);
    }
  };

  return (
    <button onClick={handleEntrada}>
      Registrar Entrada
    </button>
  );
}

// ========================================
// EXEMPLO 6: REGISTRAR SAÍDA DE ESTOQUE
// ========================================

export function ExemploMovimentacaoSaida() {
  const handleSaida = async () => {
    try {
      const movimentacao = {
        empresa_id: 'emp1',
        produto_id: 'prod1',
        tipo_movimentacao: 'Saída',
        quantidade: 5,
        preco_unitario: 0, // Não altera o custo médio
        data_movimentacao: new Date().toISOString().split('T')[0],
        observacao: 'Consumo do dia',
      };

      const resultado = await fetchAPI('/movimentacoes', {
        method: 'POST',
        body: JSON.stringify(movimentacao),
      });

      toast.success(`Saída registrada! Estoque: ${resultado.data.estoque_novo}`);
      
      return resultado.data;
    } catch (error) {
      console.error('Erro ao registrar saída:', error);
      toast.error(error.message);
    }
  };

  return (
    <button onClick={handleSaida}>
      Registrar Saída
    </button>
  );
}

// ========================================
// EXEMPLO 7: LISTAR MOVIMENTAÇÕES
// ========================================

export function ExemploListarMovimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState([]);

  useEffect(() => {
    carregarMovimentacoes();
  }, []);

  const carregarMovimentacoes = async () => {
    try {
      const empresaId = 'emp1';

      const resultado = await fetchAPI(`/movimentacoes/${empresaId}`);
      
      setMovimentacoes(resultado.data);
      console.log(`✅ ${resultado.total} movimentações carregadas`);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
      toast.error('Erro ao carregar movimentações');
    }
  };

  return (
    <div>
      <h2>Movimentações ({movimentacoes.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th>Quantidade</th>
            <th>Estoque Anterior</th>
            <th>Estoque Novo</th>
          </tr>
        </thead>
        <tbody>
          {movimentacoes.map((mov: any) => (
            <tr key={mov.id}>
              <td>{mov.data_movimentacao}</td>
              <td>{mov.tipo_movimentacao}</td>
              <td>{mov.quantidade}</td>
              <td>{mov.estoque_anterior}</td>
              <td>{mov.estoque_novo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ========================================
// EXEMPLO 8: PROJEÇÃO DE COMPRA
// ========================================

export function ExemploProjecaoCompra() {
  const [projecoes, setProjecoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [valorTotal, setValorTotal] = useState(0);

  useEffect(() => {
    carregarProjecoes();
  }, []);

  const carregarProjecoes = async () => {
    try {
      setLoading(true);
      const empresaId = 'emp1';

      const resultado = await fetchAPI(`/projecao/${empresaId}`);
      
      setProjecoes(resultado.data);
      setValorTotal(resultado.valor_total_projetado);
      
      console.log(`✅ ${resultado.total_produtos} produtos abaixo do mínimo`);
      console.log(`💰 Valor total projetado: R$ ${resultado.valor_total_projetado.toFixed(2)}`);
      
      if (resultado.total_produtos > 0) {
        toast.warning(`⚠️ ${resultado.total_produtos} produtos críticos!`);
      } else {
        toast.success('✅ Todos os produtos com estoque adequado');
      }
    } catch (error) {
      console.error('Erro ao carregar projeções:', error);
      toast.error('Erro ao carregar projeções');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Calculando projeção...</div>;

  return (
    <div>
      <h2>Projeção de Compra (30 dias)</h2>
      
      {projecoes.length === 0 ? (
        <p>✅ Nenhum produto abaixo do estoque mínimo</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Estoque Atual</th>
                <th>Estoque Mínimo</th>
                <th>Consumo/Dia</th>
                <th>Qtd. Necessária</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {projecoes.map((proj: any) => (
                <tr key={proj.produto_id}>
                  <td>{proj.produto_codigo} - {proj.produto_nome}</td>
                  <td>{proj.estoque_atual}</td>
                  <td>{proj.estoque_minimo}</td>
                  <td>{proj.consumo_medio_diario}</td>
                  <td className="font-bold">{proj.quantidade_necessaria}</td>
                  <td className="font-bold text-green-600">
                    R$ {proj.valor_projetado.toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-100">
                <td colSpan={5} className="text-right font-bold">
                  Total Projetado:
                </td>
                <td className="font-bold text-green-600 text-lg">
                  R$ {valorTotal.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

// ========================================
// EXEMPLO 9: ESTATÍSTICAS DE ESTOQUE
// ========================================

export function ExemploEstatisticasEstoque() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    try {
      const empresaId = 'emp1';

      const resultado = await fetchAPI(`/estoque/stats/${empresaId}`);
      
      setStats(resultado.data);
      console.log('📊 Estatísticas de estoque:', resultado.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas');
    }
  };

  if (!stats) return <div>Carregando estatísticas...</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm text-gray-600">Total de Produtos</p>
        <p className="text-3xl font-bold">{stats.total_produtos}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm text-gray-600">Valor Total</p>
        <p className="text-3xl font-bold text-green-600">
          R$ {stats.valor_total_estoque.toFixed(2)}
        </p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm text-gray-600">Abaixo do Mínimo</p>
        <p className="text-3xl font-bold text-orange-600">
          {stats.produtos_abaixo_minimo}
        </p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm text-gray-600">Produtos OK</p>
        <p className="text-3xl font-bold text-green-600">
          {stats.produtos_ok}
        </p>
      </div>
    </div>
  );
}

// ========================================
// EXEMPLO 10: COMPONENTE COMPLETO
// ========================================

export default function GestaoEstoqueCompleta() {
  const [empresaId, setEmpresaId] = useState('emp1');
  const [produtos, setProdutos] = useState([]);
  const [stats, setStats] = useState(null);
  const [projecoes, setProjecoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarTudo();
  }, [empresaId]);

  const carregarTudo = async () => {
    try {
      setLoading(true);

      // Carregar tudo em paralelo
      const [produtosRes, statsRes, projecoesRes] = await Promise.all([
        fetchAPI(`/produtos/${empresaId}`),
        fetchAPI(`/estoque/stats/${empresaId}`),
        fetchAPI(`/projecao/${empresaId}`),
      ]);

      setProdutos(produtosRes.data);
      setStats(statsRes.data);
      setProjecoes(projecoesRes.data);

      console.log('✅ Todos os dados carregados');
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleNovaEntrada = async (produtoId: string, quantidade: number, precoUnitario: number) => {
    try {
      const movimentacao = {
        empresa_id: empresaId,
        produto_id: produtoId,
        tipo_movimentacao: 'Entrada',
        quantidade,
        preco_unitario: precoUnitario,
        data_movimentacao: new Date().toISOString().split('T')[0],
      };

      await fetchAPI('/movimentacoes', {
        method: 'POST',
        body: JSON.stringify(movimentacao),
      });

      toast.success('Entrada registrada!');
      carregarTudo(); // Recarregar dados
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleNovaSaida = async (produtoId: string, quantidade: number) => {
    try {
      const movimentacao = {
        empresa_id: empresaId,
        produto_id: produtoId,
        tipo_movimentacao: 'Saída',
        quantidade,
        preco_unitario: 0,
        data_movimentacao: new Date().toISOString().split('T')[0],
      };

      await fetchAPI('/movimentacoes', {
        method: 'POST',
        body: JSON.stringify(movimentacao),
      });

      toast.success('Saída registrada!');
      carregarTudo(); // Recarregar dados
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando estoque...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Gestão de Estoque</h1>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total de Produtos</p>
            <p className="text-3xl font-bold">{stats.total_produtos}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Valor Total</p>
            <p className="text-3xl font-bold text-green-600">
              R$ {stats.valor_total_estoque.toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Abaixo do Mínimo</p>
            <p className="text-3xl font-bold text-orange-600">
              {stats.produtos_abaixo_minimo}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Produtos Zerados</p>
            <p className="text-3xl font-bold text-red-600">
              {stats.produtos_zerados}
            </p>
          </div>
        </div>
      )}

      {/* Lista de Produtos */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Produtos ({produtos.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estoque
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mínimo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {produtos.map((produto: any) => {
                const abaixoMinimo = produto.estoque_atual < produto.estoque_minimo;
                const zerado = produto.estoque_atual === 0;

                return (
                  <tr key={produto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {produto.codigo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {produto.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {produto.estoque_atual} {produto.unidade_medida}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {produto.estoque_minimo} {produto.unidade_medida}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {zerado ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          Zerado
                        </span>
                      ) : abaixoMinimo ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                          Crítico
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleNovaEntrada(produto.id, 10, produto.preco_custo_medio)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        + Entrada
                      </button>
                      <button
                        onClick={() => handleNovaSaida(produto.id, 1)}
                        className="text-red-600 hover:text-red-800"
                      >
                        - Saída
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Projeção de Compra */}
      {projecoes.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-orange-800 mb-4">
            ⚠️ Projeção de Compra (30 dias)
          </h2>
          <p className="text-orange-700 mb-4">
            {projecoes.length} produto(s) abaixo do estoque mínimo
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-orange-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-orange-800">
                    Produto
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-orange-800">
                    Quantidade Necessária
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-orange-800">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {projecoes.map((proj: any) => (
                  <tr key={proj.produto_id} className="border-b border-orange-200">
                    <td className="px-4 py-2 text-sm">
                      {proj.produto_codigo} - {proj.produto_nome}
                    </td>
                    <td className="px-4 py-2 text-sm font-semibold">
                      {proj.quantidade_necessaria}
                    </td>
                    <td className="px-4 py-2 text-sm font-bold text-green-600">
                      R$ {proj.valor_projetado.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// EXEMPLO 11: HOOK PERSONALIZADO
// ========================================

/**
 * Hook personalizado para gerenciar estoque
 */
export function useEstoque(empresaId: string) {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      setError(null);

      const resultado = await fetchAPI(`/produtos/${empresaId}`);
      setProdutos(resultado.data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  const registrarMovimentacao = async (movimentacao: any) => {
    try {
      const resultado = await fetchAPI('/movimentacoes', {
        method: 'POST',
        body: JSON.stringify({
          ...movimentacao,
          empresa_id: empresaId,
        }),
      });

      toast.success(resultado.message);
      carregarProdutos(); // Recarregar produtos
      
      return resultado.data;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  useEffect(() => {
    if (empresaId) {
      carregarProdutos();
    }
  }, [empresaId]);

  return {
    produtos,
    loading,
    error,
    carregarProdutos,
    registrarMovimentacao,
  };
}

// Uso do hook:
// const { produtos, loading, registrarMovimentacao } = useEstoque('emp1');
