import { useCallback, useEffect, useMemo, useState } from 'react';
import { db, isUsingMockData } from '../../lib/db';
import { formatarMoeda, formatarNumero, asNumber, toDateInputValue } from '../../lib/formatters';
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
  Calendar,
  Loader2,
  Scale,
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
import { Button } from '../components/ui/button';
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
import {
  gerarRelatorioCompleto,
  calcularIntervaloPeriodo,
  calcularIntervaloMesAno,
  calcularIntervaloAno,
  formatarDataBR,
  normalizeDateOnly,
  type RelatorioCompleto,
} from '../../lib/relatorios-helpers';

type TipoPeriodo = 'semana' | 'mes' | 'ano';

const MESES = [
  { valor: 1, label: 'Janeiro' },
  { valor: 2, label: 'Fevereiro' },
  { valor: 3, label: 'Março' },
  { valor: 4, label: 'Abril' },
  { valor: 5, label: 'Maio' },
  { valor: 6, label: 'Junho' },
  { valor: 7, label: 'Julho' },
  { valor: 8, label: 'Agosto' },
  { valor: 9, label: 'Setembro' },
  { valor: 10, label: 'Outubro' },
  { valor: 11, label: 'Novembro' },
  { valor: 12, label: 'Dezembro' },
];

const STATUS_PAGAR_ABERTO = ['Em Aberto', 'Atrasado', 'Parcial'];
const STATUS_RECEBER_ABERTO = ['Previsto', 'Atrasado', 'Parcial'];

function noPeriodo(data: unknown, inicio: string, fim: string): boolean {
  const d = normalizeDateOnly(data);
  return !!d && d >= inicio && d <= fim;
}

export default function DashboardMulti() {
  const { empresaSelecionada, empresas } = useEmpresa();
  const hoje = useMemo(() => new Date(), []);

  const [tipoPeriodo, setTipoPeriodo] = useState<TipoPeriodo>('mes');
  const [mesSelecionado, setMesSelecionado] = useState(hoje.getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(hoje.getFullYear());
  const [loading, setLoading] = useState(true);

  const [relatorio, setRelatorio] = useState<RelatorioCompleto | null>(null);
  const [saldoTotal, setSaldoTotal] = useState(0);
  const [valorEstoque, setValorEstoque] = useState(0);
  const [totalAPagar, setTotalAPagar] = useState(0);
  const [totalAReceber, setTotalAReceber] = useState(0);
  const [totalFuncionarios, setTotalFuncionarios] = useState(0);
  const [totalPagamentosExtras, setTotalPagamentosExtras] = useState(0);
  const [chartEmpresas, setChartEmpresas] = useState<
    { id: string; nome: string; receitas: number; despesas: number }[]
  >([]);
  const [distribuicaoContas, setDistribuicaoContas] = useState<
    { id: string; nome: string; valor: number }[]
  >([]);

  const anosDisponiveis = useMemo(() => {
    const atual = hoje.getFullYear();
    return Array.from({ length: 6 }, (_, i) => atual - i);
  }, [hoje]);

  const intervalo = useMemo(() => {
    switch (tipoPeriodo) {
      case 'semana':
        return calcularIntervaloPeriodo('semana');
      case 'ano':
        return calcularIntervaloAno(anoSelecionado);
      case 'mes':
      default:
        return calcularIntervaloMesAno(anoSelecionado, mesSelecionado);
    }
  }, [tipoPeriodo, mesSelecionado, anoSelecionado]);

  const { dataInicio, dataFim } = intervalo;

  const labelPeriodo = useMemo(() => {
    if (tipoPeriodo === 'semana') return 'Últimos 7 dias';
    if (tipoPeriodo === 'ano') return `Ano ${anoSelecionado}`;
    const mesLabel = MESES.find((m) => m.valor === mesSelecionado)?.label ?? '';
    return `${mesLabel} de ${anoSelecionado}`;
  }, [tipoPeriodo, mesSelecionado, anoSelecionado]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const empresaId = empresaSelecionada || undefined;

      const [
        relatorioData,
        contasData,
        produtosData,
        contasPagarData,
        contasReceberData,
        funcData,
        extrasData,
      ] = await Promise.all([
        gerarRelatorioCompleto({ empresaId, dataInicio, dataFim }),
        db.from('contas_financeiras').select('*'),
        db.from('produtos').select('*'),
        db.from('contas_pagar').select('*'),
        db.from('contas_receber').select('*'),
        db.from('funcionarios').select('*'),
        db.from('pagamentos_extras').select('*'),
      ]);

      setRelatorio(relatorioData);

      const filtrarPorEmpresa = (items: any[]) =>
        !empresaSelecionada
          ? items
          : items.filter((i) => i.empresa_id === empresaSelecionada);

      const contas = filtrarPorEmpresa(contasData.data || []);
      const produtos = filtrarPorEmpresa(produtosData.data || []);
      const contasPagar = filtrarPorEmpresa(contasPagarData.data || []);
      const contasReceber = filtrarPorEmpresa(contasReceberData.data || []);
      const funcionarios = filtrarPorEmpresa(funcData.data || []);
      const extras = filtrarPorEmpresa(extrasData.data || []);

      setSaldoTotal(
        contas
          .filter((c: any) => c.ativo)
          .reduce((sum: number, c: any) => sum + asNumber(c.saldo_atual), 0)
      );

      setValorEstoque(
        produtos
          .filter((p: any) => p.ativo)
          .reduce(
            (sum: number, p: any) =>
              sum + asNumber(p.estoque_atual) * asNumber(p.preco_custo_medio),
            0
          )
      );

      setTotalAPagar(
        contasPagar
          .filter((c: any) => STATUS_PAGAR_ABERTO.includes(c.status))
          .filter((c: any) => noPeriodo(c.data_vencimento, dataInicio, dataFim))
          .reduce(
            (sum: number, c: any) =>
              sum + (asNumber(c.valor_total) - asNumber(c.valor_pago)),
            0
          )
      );

      setTotalAReceber(
        contasReceber
          .filter((c: any) => STATUS_RECEBER_ABERTO.includes(c.status))
          .filter((c: any) => noPeriodo(c.data_vencimento, dataInicio, dataFim))
          .reduce(
            (sum: number, c: any) =>
              sum + (asNumber(c.valor_total) - asNumber(c.valor_recebido)),
            0
          )
      );

      setTotalFuncionarios(funcionarios.filter((f: any) => f.ativo).length);

      setTotalPagamentosExtras(
        extras
          .filter((e: any) => noPeriodo(e.data_pagamento, dataInicio, dataFim))
          .reduce((sum: number, e: any) => sum + asNumber(e.valor), 0)
      );

      if (!empresaSelecionada && relatorioData.porEmpresa.length > 0) {
        setChartEmpresas(
          relatorioData.porEmpresa.map((e) => ({
            id: e.empresaId,
            nome: e.empresaNome.split(' - ')[0],
            receitas: e.receitas,
            despesas: e.despesas,
          }))
        );
      } else {
        setChartEmpresas([]);
      }

      setDistribuicaoContas(
        contas.map((c: any) => ({
          id: c.id,
          nome: c.nome,
          valor: asNumber(c.saldo_atual),
        }))
      );
    } catch (error) {
      console.error('[dashboard] Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [empresaSelecionada, dataInicio, dataFim]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  const formatarValorGrafico = (value: number) => `R$ ${formatarNumero(value, 2)}`;

  const receitas = relatorio?.totalReceitas ?? 0;
  const despesas = relatorio?.totalDespesas ?? 0;
  const lucro = relatorio?.lucroLiquido ?? 0;
  const saldoDevedor = relatorio?.totalVencido ?? 0;
  const entradas = relatorio?.entradas ?? 0;
  const saidas = relatorio?.saidas ?? 0;

  const chartReceitaDespesa = [
    { nome: 'Receitas', valor: receitas },
    { nome: 'Despesas', valor: despesas },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Badge variant={isUsingMockData ? 'secondary' : 'default'} className="gap-2">
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
        {loading && (
          <Badge variant="outline" className="gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Atualizando...
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <DollarSign className="h-8 w-8" />
            Dashboard Multientidade
          </h1>
          <p className="text-muted-foreground">
            Métricas vinculadas ao período selecionado
          </p>
        </div>

        <Card className="w-full lg:w-auto lg:min-w-[420px]">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Período: {labelPeriodo}
            </div>
            <div className="flex flex-wrap gap-2">
              {(['semana', 'mes', 'ano'] as TipoPeriodo[]).map((tipo) => (
                <Button
                  key={tipo}
                  type="button"
                  size="sm"
                  variant={tipoPeriodo === tipo ? 'default' : 'outline'}
                  onClick={() => setTipoPeriodo(tipo)}
                >
                  {tipo === 'semana' ? 'Semana' : tipo === 'mes' ? 'Mês' : 'Ano'}
                </Button>
              ))}
            </div>
            {tipoPeriodo === 'mes' && (
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={String(mesSelecionado)}
                  onValueChange={(v) => setMesSelecionado(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((m) => (
                      <SelectItem key={m.valor} value={String(m.valor)}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={String(anoSelecionado)}
                  onValueChange={(v) => setAnoSelecionado(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {anosDisponiveis.map((a) => (
                      <SelectItem key={a} value={String(a)}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {tipoPeriodo === 'ano' && (
              <Select
                value={String(anoSelecionado)}
                onValueChange={(v) => setAnoSelecionado(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {anosDisponiveis.map((a) => (
                    <SelectItem key={a} value={String(a)}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              {formatarDataBR(dataInicio)} — {formatarDataBR(dataFim)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas do período */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatarMoeda(receitas)}
            </div>
            <p className="text-xs text-muted-foreground">
              Lançamentos e recebimentos no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                lucro >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatarMoeda(lucro)}
            </div>
            <p className="text-xs text-muted-foreground">
              Resultado líquido estimado no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatarMoeda(despesas)}
            </div>
            <p className="text-xs text-muted-foreground">
              Saídas e pagamentos no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Devedor</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatarMoeda(saldoDevedor)}
            </div>
            <p className="text-xs text-muted-foreground">
              Contas a receber vencidas (inadimplência)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contas a pagar/receber + posição */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contas a Pagar</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatarMoeda(totalAPagar)}
            </div>
            <p className="text-xs text-muted-foreground">
              Vencimento no período · em aberto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contas a Receber</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatarMoeda(totalAReceber)}
            </div>
            <p className="text-xs text-muted-foreground">
              Vencimento no período · previsto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo em Contas</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(saldoTotal)}</div>
            <p className="text-xs text-muted-foreground">
              Posição atual (não varia com o filtro)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor do Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatarMoeda(valorEstoque)}
            </div>
            <p className="text-xs text-muted-foreground">
              Posição atual (capital imobilizado)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards operacionais */}
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
              Staff ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Extras no Período</CardTitle>
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
        <Card>
          <CardHeader>
            <CardTitle>Receita vs Despesas</CardTitle>
            <CardDescription>{labelPeriodo}</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            <div className="h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={chartReceitaDespesa} id="receita-despesa-bar">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatarValorGrafico(Number(value))} />
                  <Legend />
                  <Bar dataKey="valor" name="Valor (R$)">
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {!empresaSelecionada && chartEmpresas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Receita e Despesa por Empresa</CardTitle>
              <CardDescription>{labelPeriodo}</CardDescription>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="h-[300px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={chartEmpresas} id="empresas-periodo-bar">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatarValorGrafico(Number(value))} />
                    <Legend />
                    <Bar dataKey="receitas" fill="#22c55e" name="Receitas" />
                    <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className={!empresaSelecionada && chartEmpresas.length > 0 ? 'md:col-span-2' : ''}>
          <CardHeader>
            <CardTitle>Distribuição de Saldos por Conta</CardTitle>
            <CardDescription>Posição atual em caixa e bancos</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            {distribuicaoContas.length > 0 ? (
              <div className="h-[300px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart id="distribuicao-contas-pie">
                    <Pie
                      data={distribuicaoContas}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) =>
                        `${entry.nome}: R$ ${formatarNumero(entry.valor, 2)}`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="valor"
                    >
                      {distribuicaoContas.map((entry, index) => (
                        <Cell
                          key={`conta-${entry.nome}-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatarValorGrafico(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Nenhuma conta financeira cadastrada
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumo do período */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Período</CardTitle>
          <CardDescription>
            {formatarDataBR(dataInicio)} a {formatarDataBR(dataFim)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Entradas (caixa)</p>
                <p className="text-sm text-muted-foreground">Recebimentos realizados</p>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatarMoeda(entradas)}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Saídas (caixa)</p>
                <p className="text-sm text-muted-foreground">Pagamentos realizados</p>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {formatarMoeda(saidas)}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Resultado do Período</p>
                <p className="text-sm text-muted-foreground">Receitas − Despesas</p>
              </div>
              <div
                className={`text-2xl font-bold ${
                  receitas - despesas >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatarMoeda(receitas - despesas)}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Compromissos no Período</p>
                <p className="text-sm text-muted-foreground">A receber − A pagar (vencimento)</p>
              </div>
              <div
                className={`text-2xl font-bold ${
                  totalAReceber - totalAPagar >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatarMoeda(totalAReceber - totalAPagar)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {totalAPagar > saldoTotal && saldoTotal > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              Atenção: contas a pagar no período &gt; saldo disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              Contas a pagar com vencimento no período ({formatarMoeda(totalAPagar)}) superam
              o saldo em contas ({formatarMoeda(saldoTotal)}). Avalie renegociação de prazos
              ou capital de giro.
            </p>
          </CardContent>
        </Card>
      )}

      {relatorio?.avisoPeriodo && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 text-base">
              <AlertCircle className="h-5 w-5" />
              Sem movimentos no período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-800 text-sm">{relatorio.avisoPeriodo.mensagem}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
