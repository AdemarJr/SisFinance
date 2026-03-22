import { useEffect, useState } from 'react';
import { db, isUsingMockData } from '../../lib/db';
import { formatarMoeda, formatarNumero } from '../../lib/formatters';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  DollarSign,
  Building2,
  Package,
  Users,
  Calculator,
  Database,
  Cloud,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Badge } from '../components/ui/badge';
import { useEmpresa } from '../contexts/EmpresaContext';

interface Empresa {
  id: string;
  nome: string;
}

export default function DashboardMulti() {
  const { empresaSelecionada, empresas } = useEmpresa();
  const [saldoTotal, setSaldoTotal] = useState(0);
  const [valorEstoque, setValorEstoque] = useState(0);
  const [totalAPagar, setTotalAPagar] = useState(0);
  const [totalAReceber, setTotalAReceber] = useState(0);
  const [totalFuncionarios, setTotalFuncionarios] = useState(0);
  const [totalPagamentosExtras, setTotalPagamentosExtras] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [distribuicaoContas, setDistribuicaoContas] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [empresaSelecionada]);

  const loadData = async () => {
    const [empData, contasData, produtosData, contasPagarData, contasReceberData, funcData, extrasData] = await Promise.all([
      db.from('empresas').select('*'),
      db.from('contas_financeiras').select('*'),
      db.from('produtos').select('*'),
      db.from('contas_pagar').select('*'),
      db.from('contas_receber').select('*'),
      db.from('funcionarios').select('*'),
      db.from('pagamentos_extras').select('*'),
    ]);

    // Filtrar por empresa se selecionada
    const contas = contasData.data || [];
    const produtos = produtosData.data || [];
    const contasPagar = contasPagarData.data || [];
    const contasReceber = contasReceberData.data || [];
    const funcionarios = funcData.data || [];
    const extras = extrasData.data || [];

    const filtrarPorEmpresa = (items: any[]) => 
      !empresaSelecionada ? items : items.filter(i => i.empresa_id === empresaSelecionada);

    const contasFiltradas = filtrarPorEmpresa(contas);
    const produtosFiltrados = filtrarPorEmpresa(produtos);
    const contasPagarFiltradas = filtrarPorEmpresa(contasPagar);
    const contasReceberFiltradas = filtrarPorEmpresa(contasReceber);
    const funcionariosFiltrados = filtrarPorEmpresa(funcionarios);
    const extrasFiltrados = filtrarPorEmpresa(extras);

    // Calcular saldo total
    const saldo = contasFiltradas
      .filter((c: any) => c.ativo)
      .reduce((sum: number, c: any) => sum + c.saldo_atual, 0);
    setSaldoTotal(saldo);

    // Calcular valor do estoque
    const estoque = produtosFiltrados
      .filter((p: any) => p.ativo)
      .reduce((sum: number, p: any) => sum + (p.estoque_atual * p.preco_custo_medio), 0);
    setValorEstoque(estoque);

    // Calcular total a pagar
    const aPagar = contasPagarFiltradas
      .filter((c: any) => ['Em Aberto', 'Atrasado', 'Parcial'].includes(c.status))
      .reduce((sum: number, c: any) => sum + (c.valor_total - c.valor_pago), 0);
    setTotalAPagar(aPagar);

    // Calcular total a receber
    const aReceber = contasReceberFiltradas
      .filter((c: any) => ['Previsto', 'Atrasado', 'Parcial'].includes(c.status))
      .reduce((sum: number, c: any) => sum + (c.valor_total - c.valor_recebido), 0);
    setTotalAReceber(aReceber);

    // Total de funcionários
    setTotalFuncionarios(funcionariosFiltrados.filter((f: any) => f.ativo).length);

    // Total de pagamentos extras hoje
    const hoje = new Date().toISOString().split('T')[0];
    const extrasHoje = extrasFiltrados
      .filter((e: any) => e.data_pagamento === hoje)
      .reduce((sum: number, e: any) => sum + e.valor, 0);
    setTotalPagamentosExtras(extrasHoje);

    // Dados para gráfico de distribuição por empresa
    if (!empresaSelecionada) {
      const empresasChart = (empData.data || []).map((emp: any) => {
        const contasEmp = contas.filter((c: any) => c.empresa_id === emp.id);
        const saldoEmp = contasEmp.reduce((sum: number, c: any) => sum + c.saldo_atual, 0);
        return {
          id: emp.id,
          nome: emp.nome.split(' - ')[0],
          saldo: saldoEmp,
        };
      });
      setChartData(empresasChart);
    }

    // Distribuição de contas
    const distribuicao = contasFiltradas.map((c: any) => ({
      id: c.id,
      nome: c.nome,
      valor: c.saldo_atual,
    }));
    setDistribuicaoContas(distribuicao);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Formatador para gráficos
  const formatarValorGrafico = (value: number) => `R$ ${formatarNumero(value, 2)}`;

  return (
    <div className="space-y-6">
      {/* Indicador de Conexão */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Badge variant={isUsingMockData ? "secondary" : "default"} className="gap-2">
            {isUsingMockData ? (
              <>
                <Database className="h-3 w-3" />
                Modo Demonstração
              </>
            ) : (
              <>
                <Cloud className="h-3 w-3" />
                Conectado ao Supabase
              </>
            )}
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <DollarSign className="h-8 w-8" />
            Dashboard Multientidade
          </h1>
          <p className="text-muted-foreground">
            Visão consolidada das finanças empresariais
          </p>
        </div>
      </div>

      {/* Cards Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(saldoTotal)}</div>
            <p className="text-xs text-muted-foreground">
              Em todas as contas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor do Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatarMoeda(valorEstoque)}
            </div>
            <p className="text-xs text-muted-foreground">
              Capital imobilizado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">A Pagar</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatarMoeda(totalAPagar)}
            </div>
            <p className="text-xs text-muted-foreground">
              Contas em aberto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatarMoeda(totalAReceber)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valores previstos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards Secundários */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div className="text-3xl font-bold">{empresas.length}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unidades operacionais ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div className="text-3xl font-bold">{totalFuncionarios}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de staff ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Extras Pagos Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-orange-600" />
              <div className="text-3xl font-bold">
                {formatarMoeda(totalPagamentosExtras)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Gorjetas e bonificações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        {!empresaSelecionada && chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Saldo por Empresa</CardTitle>
              <CardDescription>
                Distribuição de saldos entre as unidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} id="saldo-empresas-bar">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatarValorGrafico(Number(value))} />
                  <Legend />
                  <Bar dataKey="saldo" fill="#3b82f6" name="Saldo (R$)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Saldos por Conta</CardTitle>
            <CardDescription>
              Como o dinheiro está distribuído
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart id="distribuicao-contas-pie">
                <Pie
                  data={distribuicaoContas}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.nome}: R$ ${formatarNumero(entry.valor, 2)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="valor"
                >
                  {distribuicaoContas.map((entry, index) => (
                    <Cell key={`conta-${entry.nome}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatarValorGrafico(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro Consolidado</CardTitle>
          <CardDescription>
            Visão geral da saúde financeira
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Capital Disponível</p>
                <p className="text-sm text-muted-foreground">
                  Saldo em contas
                </p>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatarMoeda(saldoTotal)}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Capital Imobilizado</p>
                <p className="text-sm text-muted-foreground">
                  Valor em estoque
                </p>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatarMoeda(valorEstoque)}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Capital Total</p>
                <p className="text-sm text-muted-foreground">
                  Disponível + Estoque
                </p>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {formatarMoeda(saldoTotal + valorEstoque)}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Resultado Previsto</p>
                <p className="text-sm text-muted-foreground">
                  A Receber - A Pagar
                </p>
              </div>
              <div
                className={`text-2xl font-bold ${
                  totalAReceber - totalAPagar >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {formatarMoeda(totalAReceber - totalAPagar)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      {totalAPagar > saldoTotal && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              Atenção: Contas a Pagar &gt; Saldo Disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              O total de contas a pagar ({formatarMoeda(totalAPagar)}) é maior que o
              saldo disponível ({formatarMoeda(saldoTotal)}). Considere renegociar
              prazos ou buscar capital de giro.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}