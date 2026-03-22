import { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { formatarMoeda, formatarNumero, formatarPorcentagem, formatarInteiro } from '../../lib/formatters';
import { gerarRelatorioCompleto, type AgingData } from '../../lib/relatorios-helpers';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  DollarSign,
  Activity,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  CreditCard,
  Wallet,
  TrendingUpDown,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
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
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import { useEmpresa } from '../contexts/EmpresaContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { PageHeader } from '../components/PageHeader';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

// Cores para gráficos
const COLORS = {
  primary: '#10b981',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#a855f7',
  indigo: '#6366f1',
  teal: '#14b8a6',
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.info,
  COLORS.warning,
  COLORS.purple,
  COLORS.teal,
  COLORS.danger,
];

interface RelatorioData {
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
  pmp: number; // Prazo Médio de Pagamento
  pmr: number; // Prazo Médio de Recebimento
  pme: number; // Prazo Médio de Estoque

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

export function Relatorios() {
  const { empresaSelecionada, empresaAtual } = useEmpresa();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes-atual');
  const [dados, setDados] = useState<RelatorioData | null>(null);
  const [agingData, setAgingData] = useState<AgingData[]>([]);
  const [gastosPorFornecedor, setGastosPorFornecedor] = useState<any[]>([]);

  useEffect(() => {
    if (empresaSelecionada && empresaAtual) {
      carregarDados();
    }
  }, [empresaSelecionada, empresaAtual, periodo]);

  const carregarGastosPorFornecedor = async (dataInicio: string, dataFim: string) => {
    try {
      // Buscar todas as contas a pagar do período
      const { data: contasPagar, error: erroContas } = await db
        .from('contas_pagar')
        .select('*, fornecedores(nome)')
        .eq('empresa_id', empresaSelecionada)
        .gte('data_vencimento', dataInicio)
        .lte('data_vencimento', dataFim);

      if (erroContas) {
        console.error('Erro ao carregar contas a pagar:', erroContas);
        setGastosPorFornecedor([]);
        return;
      }

      // Buscar lançamentos com fornecedor do período
      const { data: lancamentos, error: erroLancamentos } = await db
        .from('lancamentos')
        .select('*, fornecedores(nome)')
        .eq('empresa_id', empresaSelecionada)
        .eq('tipo', 'Despesa')
        .gte('data', dataInicio)
        .lte('data', dataFim)
        .not('fornecedor_id', 'is', null);

      if (erroLancamentos) {
        console.error('Erro ao carregar lançamentos:', erroLancamentos);
      }

      // Agrupar por fornecedor
      const gastosPorFornecedorMap = new Map();

      // Processar contas a pagar
      if (contasPagar) {
        contasPagar.forEach((conta: any) => {
          const fornecedorNome = conta.fornecedores?.nome || 'Sem Fornecedor';
          const valor = Number(conta.valor_total || 0);
          
          if (gastosPorFornecedorMap.has(fornecedorNome)) {
            gastosPorFornecedorMap.set(fornecedorNome, {
              nome: fornecedorNome,
              total: gastosPorFornecedorMap.get(fornecedorNome).total + valor,
              quantidade: gastosPorFornecedorMap.get(fornecedorNome).quantidade + 1,
            });
          } else {
            gastosPorFornecedorMap.set(fornecedorNome, {
              nome: fornecedorNome,
              total: valor,
              quantidade: 1,
            });
          }
        });
      }

      // Processar lançamentos
      if (lancamentos) {
        lancamentos.forEach((lanc: any) => {
          const fornecedorNome = lanc.fornecedores?.nome || 'Outros';
          const valor = Number(lanc.valor || 0);
          
          if (gastosPorFornecedorMap.has(fornecedorNome)) {
            gastosPorFornecedorMap.set(fornecedorNome, {
              nome: fornecedorNome,
              total: gastosPorFornecedorMap.get(fornecedorNome).total + valor,
              quantidade: gastosPorFornecedorMap.get(fornecedorNome).quantidade + 1,
            });
          } else {
            gastosPorFornecedorMap.set(fornecedorNome, {
              nome: fornecedorNome,
              total: valor,
              quantidade: 1,
            });
          }
        });
      }

      // Converter para array e ordenar por total
      const gastosArray = Array.from(gastosPorFornecedorMap.values())
        .sort((a, b) => b.total - a.total);

      // Calcular percentuais
      const totalGeral = gastosArray.reduce((sum, f) => sum + f.total, 0);
      const gastosComPercentual = gastosArray.map(f => ({
        ...f,
        percentual: totalGeral > 0 ? (f.total / totalGeral) * 100 : 0,
      }));

      setGastosPorFornecedor(gastosComPercentual);
      console.log('✅ Gastos por fornecedor carregados:', gastosComPercentual);
    } catch (error) {
      console.error('Erro ao carregar gastos por fornecedor:', error);
      setGastosPorFornecedor([]);
    }
  };

  const carregarDados = async () => {
    if (!empresaSelecionada || !empresaAtual) return;
    
    setLoading(true);
    try {
      // Calcular datas do período selecionado
      const hoje = new Date();
      let dataInicio: Date;
      let dataFim: Date = hoje;
      
      switch (periodo) {
        case 'mes-atual':
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
          break;
        case 'trimestre':
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
          break;
        case 'ano':
          dataInicio = new Date(hoje.getFullYear(), 0, 1);
          break;
        default:
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      }
      
      console.log('📊 Gerando relatório para período:', {
        empresa: empresaAtual.nome,
        empresaId: empresaSelecionada,
        periodo,
        dataInicio: dataInicio.toISOString().split('T')[0],
        dataFim: dataFim.toISOString().split('T')[0],
      });
      
      // Gerar relatório completo com dados reais do Supabase
      const dadosRelatorio = await gerarRelatorioCompleto({
        empresaId: empresaSelecionada, // empresaSelecionada já é o ID
        dataInicio: dataInicio.toISOString().split('T')[0],
        dataFim: dataFim.toISOString().split('T')[0],
      });
      
      setDados(dadosRelatorio);
      setAgingData(dadosRelatorio.agingData);
      
      // Carregar gastos por fornecedor
      await carregarGastosPorFornecedor(dataInicio.toISOString().split('T')[0], dataFim.toISOString().split('T')[0]);
      
      console.log('✅ Relatório gerado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao carregar dados do relatório:', error);
      toast.error('Erro ao gerar relatório. Usando dados vazios.');
      
      // Fallback para dados zerados em caso de erro
      console.log('⚠️ Usando dados zerados como fallback');
      const dadosSimulados: RelatorioData = {
        // DRE
        receitaBruta: 0,
        impostos: 0,
        receitaLiquida: 0,
        custosVariaveis: 0,
        margemContribuicao: 0,
        despesasFixas: 0,
        ebitda: 0,
        depreciacaoAmortizacao: 0,
        ebit: 0,
        despesasFinanceiras: 0,
        receitasFinanceiras: 0,
        lair: 0,
        impostoRenda: 0,
        lucroLiquido: 0,

        // Fluxo de Caixa
        saldoInicial: 0,
        entradas: 0,
        saidas: 0,
        saldoFinal: 0,
        burnRate: 0,

        // KPIs
        margemBruta: 0,
        margemLiquida: 0,
        roi: 0,
        pontoEquilibrio: 0,

        // Prazos Médios
        pmp: 0,
        pmr: 0,
        pme: 0,

        // Inadimplência
        totalReceber: 0,
        totalVencido: 0,
        percentualInadimplencia: 0,
        provisaoDevedoresDuvidosos: 0,

        // Comparativos
        orcadoReceita: 0,
        orcadoDespesas: 0,
        desvioReceita: 0,
        desvioDespesas: 0,
      };

      setDados(dadosSimulados);
      setAgingData([
        { periodo: 'A Vencer', valor: 0, percentual: 0, quantidade: 0 },
        { periodo: '1-30 dias', valor: 0, percentual: 0, quantidade: 0 },
        { periodo: '31-60 dias', valor: 0, percentual: 0, quantidade: 0 },
        { periodo: '61-90 dias', valor: 0, percentual: 0, quantidade: 0 },
        { periodo: '> 90 dias', valor: 0, percentual: 0, quantidade: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!empresaSelecionada) {
    return (
      <div className="p-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Selecione uma empresa para visualizar os relatórios financeiros.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading || !dados) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Gerando relatórios...</p>
          </div>
        </div>
      </div>
    );
  }

  // Dados para gráficos
  const dreData = [
    { nome: 'Receita Bruta', valor: dados.receitaBruta },
    { nome: 'Impostos', valor: -dados.impostos },
    { nome: 'Custos Variáveis', valor: -dados.custosVariaveis },
    { nome: 'Despesas Fixas', valor: -dados.despesasFixas },
    { nome: 'Lucro Líquido', valor: dados.lucroLiquido },
  ];

  const fluxoCaixaData = [
    { nome: 'Saldo Inicial', valor: dados.saldoInicial },
    { nome: 'Entradas', valor: dados.entradas },
    { nome: 'Saídas', valor: dados.saidas },
    { nome: 'Saldo Final', valor: dados.saldoFinal },
  ];

  const margemData = [
    { nome: 'Receita Líquida', valor: dados.receitaLiquida, margem: 100 },
    { nome: 'Margem Contrib.', valor: dados.margemContribuicao, margem: dados.margemBruta },
    { nome: 'EBITDA', valor: dados.ebitda, margem: (dados.ebitda / dados.receitaLiquida) * 100 },
    { nome: 'Lucro Líquido', valor: dados.lucroLiquido, margem: dados.margemLiquida },
  ];

  const comparativoData = [
    {
      categoria: 'Receitas',
      orcado: dados.orcadoReceita,
      realizado: dados.receitaBruta,
      desvio: dados.desvioReceita,
    },
    {
      categoria: 'Despesas',
      orcado: dados.orcadoDespesas,
      realizado: dados.saidas,
      desvio: dados.desvioDespesas,
    },
  ];

  const cicloFinanceiroData = [
    { indicador: 'PMR', dias: dados.pmr, descricao: 'Prazo Médio de Recebimento' },
    { indicador: 'PME', dias: dados.pme, descricao: 'Prazo Médio de Estoque' },
    { indicador: 'PMP', dias: dados.pmp, descricao: 'Prazo Médio de Pagamento' },
    { indicador: 'CCF', dias: dados.pmr + dados.pme - dados.pmp, descricao: 'Ciclo de Caixa Financeiro' },
  ];

  const exportarPDF = () => {
    // Implementar exportação real em produção
    alert('Funcionalidade de exportação será implementada em breve!');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios Financeiros"
        description="Análise detalhada da saúde financeira da empresa"
        icon={FileText}
      />

      {/* Filtros e Ações */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2">
          <Button
            variant={periodo === 'mes-atual' ? 'default' : 'outline'}
            onClick={() => setPeriodo('mes-atual')}
            size="sm"
          >
            Mês Atual
          </Button>
          <Button
            variant={periodo === 'trimestre' ? 'default' : 'outline'}
            onClick={() => setPeriodo('trimestre')}
            size="sm"
          >
            Trimestre
          </Button>
          <Button
            variant={periodo === 'ano' ? 'default' : 'outline'}
            onClick={() => setPeriodo('ano')}
            size="sm"
          >
            Ano
          </Button>
        </div>

        <Button onClick={exportarPDF} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      <Tabs defaultValue="sumario" className="space-y-6">
        <TabsList className="grid grid-cols-3 lg:grid-cols-7 gap-2">
          <TabsTrigger value="sumario">Sumário</TabsTrigger>
          <TabsTrigger value="dre">DRE</TabsTrigger>
          <TabsTrigger value="fluxo-caixa">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
          <TabsTrigger value="inadimplencia">Inadimplência</TabsTrigger>
          <TabsTrigger value="conclusao">Conclusão</TabsTrigger>
        </TabsList>

        {/* ===== SUMÁRIO EXECUTIVO ===== */}
        <TabsContent value="sumario" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Sumário Executivo
              </CardTitle>
              <CardDescription>
                Visão macro da saúde financeira - {periodo.replace('-', ' ').toUpperCase()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Indicadores Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-muted-foreground">Receita Líquida</p>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold">{formatarMoeda(dados.receitaLiquida)}</p>
                    <p className="text-xs text-green-600 mt-1">
                      +{formatarPorcentagem(dados.desvioReceita)} vs orçado
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-muted-foreground">Lucro Líquido</p>
                      <DollarSign className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold">{formatarMoeda(dados.lucroLiquido)}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {formatarPorcentagem(dados.margemLiquida)} margem líquida
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-muted-foreground">EBITDA</p>
                      <Zap className="h-4 w-4 text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold">{formatarMoeda(dados.ebitda)}</p>
                    <p className="text-xs text-purple-600 mt-1">
                      {formatarPorcentagem((dados.ebitda / dados.receitaLiquida) * 100)} margem
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-muted-foreground">Saldo Caixa</p>
                      <Wallet className="h-4 w-4 text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold">{formatarMoeda(dados.saldoFinal)}</p>
                    <p className="text-xs text-orange-600 mt-1">
                      {dados.saldoFinal > dados.saldoInicial ? '+' : ''}
                      {formatarMoeda(dados.saldoFinal - dados.saldoInicial)} vs inicial
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico de Margens */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Evolução de Margens</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={margemData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="nome" stroke="#9ca3af" />
                    <YAxis yAxisId="left" stroke="#9ca3af" tickFormatter={(v) => formatarMoeda(v)} />
                    <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      formatter={(value: any, name: string) => {
                        if (name === 'margem') return [formatarPorcentagem(value), 'Margem %'];
                        return [formatarMoeda(value), 'Valor'];
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="valor" fill={COLORS.primary} name="Valor" />
                    <Line yAxisId="right" type="monotone" dataKey="margem" stroke={COLORS.warning} strokeWidth={2} name="Margem %" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Alertas e Observações */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Destaques do Período</h3>
                
                {dados.desvioReceita > 5 && (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                      <strong>Receita acima do orçado:</strong> Superou a meta em {formatarPorcentagem(dados.desvioReceita)}, 
                      equivalente a {formatarMoeda(dados.receitaBruta - dados.orcadoReceita)}.
                    </AlertDescription>
                  </Alert>
                )}

                {dados.percentualInadimplencia > 10 && (
                  <Alert className="border-yellow-500/50 bg-yellow-500/10">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <AlertDescription>
                      <strong>Atenção à inadimplência:</strong> {formatarPorcentagem(dados.percentualInadimplencia)} das contas 
                      a receber estão vencidas ({formatarMoeda(dados.totalVencido)}).
                    </AlertDescription>
                  </Alert>
                )}

                {dados.margemLiquida < 10 && (
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription>
                      <strong>Margem líquida abaixo do ideal:</strong> Margem de {formatarPorcentagem(dados.margemLiquida)} 
                      está abaixo dos 10% recomendados. Revisar estrutura de custos.
                    </AlertDescription>
                  </Alert>
                )}

                {cicloFinanceiroData[3].dias > 30 && (
                  <Alert className="border-orange-500/50 bg-orange-500/10">
                    <Info className="h-4 w-4 text-orange-500" />
                    <AlertDescription>
                      <strong>Ciclo de caixa elevado:</strong> {cicloFinanceiroData[3].dias} dias. 
                      Considere renegociar prazos com fornecedores ou reduzir PMR.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== DRE - DEMONSTRATIVO DE RESULTADOS ===== */}
        <TabsContent value="dre" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                DRE - Demonstrativo de Resultado do Exercício
              </CardTitle>
              <CardDescription>
                Estrutura detalhada de receitas, custos e lucros
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tabela DRE */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[400px]">Descrição</TableHead>
                      <TableHead className="text-right">Valor (R$)</TableHead>
                      <TableHead className="text-right">% Receita Líq.</TableHead>
                      <TableHead className="text-right">AV (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="font-semibold bg-primary/5">
                      <TableCell>RECEITA BRUTA</TableCell>
                      <TableCell className="text-right">{formatarMoeda(dados.receitaBruta)}</TableCell>
                      <TableCell className="text-right">{formatarPorcentagem((dados.receitaBruta / dados.receitaLiquida) * 100)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell className="pl-8">(-) Impostos sobre Vendas</TableCell>
                      <TableCell className="text-right text-red-400">({formatarMoeda(dados.impostos)})</TableCell>
                      <TableCell className="text-right">{formatarPorcentagem((dados.impostos / dados.receitaLiquida) * 100)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>

                    <TableRow className="font-semibold bg-blue-500/5 border-t-2 border-blue-500/20">
                      <TableCell>= RECEITA LÍQUIDA</TableCell>
                      <TableCell className="text-right">{formatarMoeda(dados.receitaLiquida)}</TableCell>
                      <TableCell className="text-right">100,00%</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="pl-8">(-) Custos Variáveis</TableCell>
                      <TableCell className="text-right text-red-400">({formatarMoeda(dados.custosVariaveis)})</TableCell>
                      <TableCell className="text-right">{formatarPorcentagem((dados.custosVariaveis / dados.receitaLiquida) * 100)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>

                    <TableRow className="font-semibold bg-green-500/5 border-t-2 border-green-500/20">
                      <TableCell>= MARGEM DE CONTRIBUIÇÃO</TableCell>
                      <TableCell className="text-right text-green-400">{formatarMoeda(dados.margemContribuicao)}</TableCell>
                      <TableCell className="text-right">{formatarPorcentagem(dados.margemBruta)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="pl-8">(-) Despesas Fixas</TableCell>
                      <TableCell className="text-right text-red-400">({formatarMoeda(dados.despesasFixas)})</TableCell>
                      <TableCell className="text-right">{formatarPorcentagem((dados.despesasFixas / dados.receitaLiquida) * 100)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>

                    <TableRow className="font-semibold bg-purple-500/5 border-t-2 border-purple-500/20">
                      <TableCell>= EBITDA</TableCell>
                      <TableCell className="text-right text-purple-400">{formatarMoeda(dados.ebitda)}</TableCell>
                      <TableCell className="text-right">{formatarPorcentagem((dados.ebitda / dados.receitaLiquida) * 100)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="pl-8">(-) Depreciação/Amortização</TableCell>
                      <TableCell className="text-right text-red-400">({formatarMoeda(dados.depreciacaoAmortizacao)})</TableCell>
                      <TableCell className="text-right">{formatarPorcentagem((dados.depreciacaoAmortizacao / dados.receitaLiquida) * 100)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>

                    <TableRow className="font-semibold bg-indigo-500/5 border-t-2 border-indigo-500/20">
                      <TableCell>= EBIT (Resultado Operacional)</TableCell>
                      <TableCell className="text-right">{formatarMoeda(dados.ebit)}</TableCell>
                      <TableCell className="text-right">{formatarPorcentagem((dados.ebit / dados.receitaLiquida) * 100)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="pl-8">(+) Receitas Financeiras</TableCell>
                      <TableCell className="text-right text-green-400">{formatarMoeda(dados.receitasFinanceiras)}</TableCell>
                      <TableCell className="text-right">{formatarPorcentagem((dados.receitasFinanceiras / dados.receitaLiquida) * 100)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="pl-8">(-) Despesas Financeiras</TableCell>
                      <TableCell className="text-right text-red-400">({formatarMoeda(dados.despesasFinanceiras)})</TableCell>
                      <TableCell className="text-right">{formatarPorcentagem((dados.despesasFinanceiras / dados.receitaLiquida) * 100)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>

                    <TableRow className="font-semibold bg-orange-500/5 border-t-2 border-orange-500/20">
                      <TableCell>= LAIR (Lucro Antes IR)</TableCell>
                      <TableCell className="text-right">{formatarMoeda(dados.lair)}</TableCell>
                      <TableCell className="text-right">{formatarPorcentagem((dados.lair / dados.receitaLiquida) * 100)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="pl-8">(-) Imposto de Renda/CSLL</TableCell>
                      <TableCell className="text-right text-red-400">({formatarMoeda(dados.impostoRenda)})</TableCell>
                      <TableCell className="text-right">{formatarPorcentagem((dados.impostoRenda / dados.receitaLiquida) * 100)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>

                    <TableRow className="font-bold bg-primary/10 border-t-4 border-primary/30">
                      <TableCell className="text-lg">= LUCRO LÍQUIDO</TableCell>
                      <TableCell className="text-right text-lg text-primary">{formatarMoeda(dados.lucroLiquido)}</TableCell>
                      <TableCell className="text-right text-lg">{formatarPorcentagem(dados.margemLiquida)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Gráfico Cascata DRE */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Cascata de Resultados</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={dreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="nome" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" tickFormatter={(v) => formatarMoeda(v)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      formatter={(value: any) => formatarMoeda(Math.abs(value))}
                    />
                    <Bar dataKey="valor" fill={COLORS.primary}>
                      {dreData.map((entry, index) => (
                        <Cell key={`dre-${entry.nome}-${index}`} fill={entry.valor >= 0 ? COLORS.success : COLORS.danger} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Insights DRE */}
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription>
                  <strong>Análise Vertical:</strong> A Margem de Contribuição de {formatarPorcentagem(dados.margemBruta)} 
                  indica que a cada R$ 100 em vendas, R$ {formatarNumero(dados.margemBruta, 2)} cobrem as despesas fixas e geram lucro. 
                  A margem líquida de {formatarPorcentagem(dados.margemLiquida)} está {dados.margemLiquida >= 15 ? 'saudável' : 'abaixo do ideal de 15%'}.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== FLUXO DE CAIXA ===== */}
        <TabsContent value="fluxo-caixa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpDown className="h-5 w-5 text-primary" />
                Fluxo de Caixa - Regime de Caixa
              </CardTitle>
              <CardDescription>
                Movimentações financeiras efetivas do período
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Saldo Inicial</p>
                    <p className="text-2xl font-bold">{formatarMoeda(dados.saldoInicial)}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                      <p className="text-sm font-medium text-muted-foreground">Entradas</p>
                    </div>
                    <p className="text-2xl font-bold text-green-500">{formatarMoeda(dados.entradas)}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                      <p className="text-sm font-medium text-muted-foreground">Saídas</p>
                    </div>
                    <p className="text-2xl font-bold text-red-500">{formatarMoeda(dados.saidas)}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Saldo Final</p>
                    <p className="text-2xl font-bold text-purple-400">{formatarMoeda(dados.saldoFinal)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {dados.saldoFinal > dados.saldoInicial ? 'Variação positiva' : 'Variação negativa'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico de Fluxo */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Movimentação de Caixa</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={fluxoCaixaData}>
                    <defs>
                      <linearGradient id="colorCaixa" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="nome" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" tickFormatter={(v) => formatarMoeda(v)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      formatter={(value: any) => formatarMoeda(value)}
                    />
                    <Area
                      type="monotone"
                      dataKey="valor"
                      stroke={COLORS.primary}
                      fillOpacity={1}
                      fill="url(#colorCaixa)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Burn Rate */}
              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-5 w-5 text-orange-500" />
                        <h3 className="text-lg font-semibold">Burn Rate (Taxa de Queima)</h3>
                      </div>
                      <p className="text-3xl font-bold text-orange-400 mb-2">
                        {formatarMoeda(dados.burnRate)}/mês
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Taxa média de queima de caixa mensal (despesas operacionais)
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-4 w-4 text-orange-500" />
                          <p className="text-sm">
                            <strong>Runway (Pista):</strong> {formatarNumero(dados.saldoFinal / dados.burnRate, 1)} meses de operação
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-4 w-4 text-orange-500" />
                          <p className="text-sm">
                            <strong>Fluxo Líquido:</strong> {formatarMoeda(dados.entradas - dados.saidas)} no período
                          </p>
                        </div>
                      </div>
                    </div>
                    <Badge variant={dados.saldoFinal > dados.saldoInicial ? 'default' : 'destructive'} className="text-sm">
                      {dados.saldoFinal > dados.saldoInicial ? 'Positivo' : 'Negativo'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Análise de Liquidez */}
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription>
                  <strong>Análise de Liquidez:</strong> Com saldo final de {formatarMoeda(dados.saldoFinal)} e burn rate 
                  de {formatarMoeda(dados.burnRate)}, a empresa possui capacidade de operar por aproximadamente{' '}
                  <strong>{formatarNumero(dados.saldoFinal / dados.burnRate, 1)} meses</strong> sem novas receitas. 
                  {dados.saldoFinal / dados.burnRate < 3 && ' Atenção: Runway crítico! Considere captação ou redução de custos.'}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== KPIs ===== */}
        <TabsContent value="kpis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Indicadores de Desempenho (KPIs)
              </CardTitle>
              <CardDescription>
                Principais métricas financeiras com fórmulas e interpretações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Grid de KPIs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* EBITDA */}
                <Card className="border-purple-500/20 bg-purple-500/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>EBITDA</span>
                      <Badge variant="outline" className="text-purple-400 border-purple-400">
                        {formatarMoeda(dados.ebitda)}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Earnings Before Interest, Taxes, Depreciation and Amortization
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-purple-400">Fórmula:</p>
                      <code className="block p-3 bg-background/50 rounded text-xs">
                        EBITDA = Lucro Operacional + Depreciação + Amortização
                        <br />
                        EBITDA = {formatarMoeda(dados.ebit)} + {formatarMoeda(dados.depreciacaoAmortizacao)}
                        <br />
                        EBITDA = {formatarMoeda(dados.ebitda)}
                      </code>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-purple-400">Interpretação:</p>
                      <p className="text-sm text-muted-foreground">
                        Mede a capacidade operacional de geração de caixa, desconsiderando efeitos financeiros e 
                        tributários. Margem EBITDA de <strong>{formatarPorcentagem((dados.ebitda / dados.receitaLiquida) * 100)}</strong> indica 
                        {(dados.ebitda / dados.receitaLiquida) * 100 > 20 ? ' excelente ' : ' adequada '}
                        geração de caixa operacional.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-purple-500/10 rounded">
                      <CheckCircle className="h-4 w-4 text-purple-400" />
                      <p className="text-xs">
                        Ideal: {'>'}20% da receita líquida | Atual: {formatarPorcentagem((dados.ebitda / dados.receitaLiquida) * 100)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* ROI */}
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>ROI - Retorno sobre Investimento</span>
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        {formatarPorcentagem(dados.roi)}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Return on Investment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-green-400">Fórmula:</p>
                      <code className="block p-3 bg-background/50 rounded text-xs">
                        ROI = (Lucro Líquido / Investimento Total) × 100
                        <br />
                        ROI = ({formatarMoeda(dados.lucroLiquido)} / {formatarMoeda(dados.receitaLiquida / 2)}) × 100
                        <br />
                        ROI = {formatarPorcentagem(dados.roi)}
                      </code>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-green-400">Interpretação:</p>
                      <p className="text-sm text-muted-foreground">
                        Mede a eficiência do capital investido. Um ROI de <strong>{formatarPorcentagem(dados.roi)}</strong> significa 
                        que a cada R$ 100 investidos, há retorno de R$ {formatarNumero(dados.roi, 2)}. 
                        {dados.roi > 30 && ' Excelente retorno!'}
                        {dados.roi >= 15 && dados.roi <= 30 && ' Retorno adequado.'}
                        {dados.roi < 15 && ' Retorno abaixo do esperado.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <p className="text-xs">
                        Ideal: {'>'}25% ao ano | Atual: {formatarPorcentagem(dados.roi)} ao mês
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Ponto de Equilíbrio */}
                <Card className="border-blue-500/20 bg-blue-500/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>Ponto de Equilíbrio (Break-even)</span>
                      <Badge variant="outline" className="text-blue-400 border-blue-400">
                        {formatarMoeda(dados.pontoEquilibrio)}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Receita necessária para cobrir todos os custos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-blue-400">Fórmula:</p>
                      <code className="block p-3 bg-background/50 rounded text-xs">
                        PE = Despesas Fixas / (Margem de Contribuição %)
                        <br />
                        PE = {formatarMoeda(dados.despesasFixas)} / {formatarPorcentagem(dados.margemBruta / 100)}
                        <br />
                        PE = {formatarMoeda(dados.pontoEquilibrio)}
                      </code>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-blue-400">Interpretação:</p>
                      <p className="text-sm text-muted-foreground">
                        É necessário faturar <strong>{formatarMoeda(dados.pontoEquilibrio)}</strong> para não ter 
                        prejuízo nem lucro. Atualmente faturando {formatarMoeda(dados.receitaLiquida)}, está{' '}
                        <strong>{formatarPorcentagem(((dados.receitaLiquida - dados.pontoEquilibrio) / dados.pontoEquilibrio) * 100)}</strong> acima 
                        do ponto de equilíbrio.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded">
                      {dados.receitaLiquida > dados.pontoEquilibrio ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-blue-400" />
                          <p className="text-xs">
                            Margem de Segurança: {formatarMoeda(dados.receitaLiquida - dados.pontoEquilibrio)}
                          </p>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-yellow-400" />
                          <p className="text-xs">Abaixo do ponto de equilíbrio!</p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Ciclo de Caixa Financeiro */}
                <Card className="border-orange-500/20 bg-orange-500/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>Ciclo de Caixa Financeiro</span>
                      <Badge variant="outline" className="text-orange-400 border-orange-400">
                        {cicloFinanceiroData[3].dias} dias
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Tempo entre pagamento a fornecedores e recebimento de clientes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {cicloFinanceiroData.map((item) => (
                        <div key={item.indicador} className="flex items-center justify-between p-3 bg-background/50 rounded">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-400" />
                            <div>
                              <p className="text-sm font-semibold">{item.indicador}</p>
                              <p className="text-xs text-muted-foreground">{item.descricao}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-orange-400">
                            {item.dias} dias
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-orange-400">Fórmula:</p>
                      <code className="block p-3 bg-background/50 rounded text-xs">
                        CCF = PMR + PME - PMP
                        <br />
                        CCF = {dados.pmr} + {dados.pme} - {dados.pmp}
                        <br />
                        CCF = {cicloFinanceiroData[3].dias} dias
                      </code>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-orange-400">Interpretação:</p>
                      <p className="text-sm text-muted-foreground">
                        A empresa leva <strong>{cicloFinanceiroData[3].dias} dias</strong> para converter seus 
                        investimentos em caixa. 
                        {cicloFinanceiroData[3].dias < 15 && ' Ciclo muito bom!'}
                        {cicloFinanceiroData[3].dias >= 15 && cicloFinanceiroData[3].dias <= 30 && ' Ciclo adequado.'}
                        {cicloFinanceiroData[3].dias > 30 && ' Ciclo elevado - considere otimizar prazos.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Comparativo Orçado vs Realizado */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comparativo: Orçado vs Realizado</CardTitle>
                  <CardDescription>
                    Análise de variação entre planejado e executado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto mb-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Categoria</TableHead>
                          <TableHead className="text-right">Orçado</TableHead>
                          <TableHead className="text-right">Realizado</TableHead>
                          <TableHead className="text-right">Variação (R$)</TableHead>
                          <TableHead className="text-right">Variação (%)</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparativoData.map((item) => {
                          const variacao = item.realizado - item.orcado;
                          const isReceita = item.categoria === 'Receitas';
                          const isPositivo = isReceita ? variacao > 0 : variacao < 0;
                          
                          return (
                            <TableRow key={item.categoria}>
                              <TableCell className="font-medium">{item.categoria}</TableCell>
                              <TableCell className="text-right">{formatarMoeda(item.orcado)}</TableCell>
                              <TableCell className="text-right">{formatarMoeda(item.realizado)}</TableCell>
                              <TableCell className={`text-right ${isPositivo ? 'text-green-400' : 'text-red-400'}`}>
                                {variacao > 0 ? '+' : ''}{formatarMoeda(variacao)}
                              </TableCell>
                              <TableCell className={`text-right ${isPositivo ? 'text-green-400' : 'text-red-400'}`}>
                                {item.desvio > 0 ? '+' : ''}{formatarPorcentagem(Math.abs(item.desvio))}
                              </TableCell>
                              <TableCell className="text-center">
                                {isPositivo ? (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    Positivo
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                    Negativo
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={comparativoData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="categoria" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" tickFormatter={(v) => formatarMoeda(v)} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                        formatter={(value: any) => formatarMoeda(value)}
                      />
                      <Legend />
                      <Bar dataKey="orcado" fill={COLORS.info} name="Orçado" />
                      <Bar dataKey="realizado" fill={COLORS.primary} name="Realizado" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== GASTOS POR FORNECEDOR ===== */}
        <TabsContent value="fornecedores" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Gastos por Fornecedor
              </CardTitle>
              <CardDescription>
                Análise de despesas por fornecedor no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Resumo de Gastos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-muted-foreground">Total de Gastos</p>
                      <DollarSign className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold">
                      {formatarMoeda(gastosPorFornecedor.reduce((sum, f) => sum + f.total, 0))}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-muted-foreground">Fornecedores Ativos</p>
                      <Activity className="h-4 w-4 text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold">{gastosPorFornecedor.length}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-muted-foreground">Gasto Médio</p>
                      <BarChart3 className="h-4 w-4 text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold">
                      {formatarMoeda(gastosPorFornecedor.length > 0 
                        ? gastosPorFornecedor.reduce((sum, f) => sum + f.total, 0) / gastosPorFornecedor.length 
                        : 0)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela de Fornecedores */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Detalhamento por Fornecedor</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead className="text-right">Total Gasto</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Ticket Médio</TableHead>
                        <TableHead className="text-right">% do Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gastosPorFornecedor.length > 0 ? (
                        gastosPorFornecedor.map((fornecedor, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                            <TableCell className="text-right font-semibold text-red-400">
                              {formatarMoeda(fornecedor.total)}
                            </TableCell>
                            <TableCell className="text-right">{fornecedor.quantidade}</TableCell>
                            <TableCell className="text-right">
                              {formatarMoeda(fornecedor.total / fornecedor.quantidade)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className={
                                fornecedor.percentual > 30 
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                                  : fornecedor.percentual > 15 
                                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                  : 'bg-green-500/20 text-green-400 border-green-500/30'
                              }>
                                {formatarPorcentagem(fornecedor.percentual)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Nenhum gasto com fornecedor encontrado no período
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Gráfico de Pizza */}
              {gastosPorFornecedor.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Distribuição de Gastos</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={gastosPorFornecedor.slice(0, 10)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ nome, percentual }) => `${nome}: ${formatarPorcentagem(percentual)}`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="total"
                      >
                        {gastosPorFornecedor.slice(0, 10).map((entry, index) => (
                          <Cell key={`fornecedor-${entry.nome}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                        formatter={(value: any) => formatarMoeda(value)}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Alertas */}
              {gastosPorFornecedor.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Análise de Concentração</h3>
                  
                  {gastosPorFornecedor[0]?.percentual > 40 && (
                    <Alert className="border-red-500/50 bg-red-500/10">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <AlertDescription>
                        <strong>Alta Concentração de Gastos:</strong> O fornecedor "{gastosPorFornecedor[0].nome}" 
                        representa {formatarPorcentagem(gastosPorFornecedor[0].percentual)} dos gastos totais 
                        ({formatarMoeda(gastosPorFornecedor[0].total)}). Considere diversificar para reduzir riscos.
                      </AlertDescription>
                    </Alert>
                  )}

                  {gastosPorFornecedor.slice(0, 3).reduce((sum, f) => sum + f.percentual, 0) > 70 && (
                    <Alert className="border-yellow-500/50 bg-yellow-500/10">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <AlertDescription>
                        <strong>Concentração nos Top 3:</strong> Os três principais fornecedores representam {' '}
                        {formatarPorcentagem(gastosPorFornecedor.slice(0, 3).reduce((sum, f) => sum + f.percentual, 0))} 
                        dos gastos. Avalie oportunidades de negociação e melhores condições.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Alert className="border-blue-500/50 bg-blue-500/10">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertDescription>
                      <strong>Dica:</strong> Revise os contratos com os principais fornecedores mensalmente. 
                      Negocie prazos de pagamento maiores e busque descontos por volume ou antecipação.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== INADIMPLÊNCIA ===== */}
        <TabsContent value="inadimplencia" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Análise de Inadimplência
              </CardTitle>
              <CardDescription>
                Envelhecimento de dívidas (Aging) e impacto no provisionamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Resumo de Inadimplência */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Total a Receber</p>
                    <p className="text-2xl font-bold">{formatarMoeda(dados.totalReceber)}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <p className="text-sm font-medium text-muted-foreground">Total Vencido</p>
                    </div>
                    <p className="text-2xl font-bold text-yellow-500">{formatarMoeda(dados.totalVencido)}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground mb-2">% Inadimplência</p>
                    <p className="text-2xl font-bold text-red-500">{formatarPorcentagem(dados.percentualInadimplencia)}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Provisão (PECLD)</p>
                    <p className="text-2xl font-bold text-purple-400">{formatarMoeda(dados.provisaoDevedoresDuvidosos)}</p>
                    <p className="text-xs text-muted-foreground mt-1">30% do vencido</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela de Aging */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Aging - Envelhecimento de Contas a Receber</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Período de Vencimento</TableHead>
                        <TableHead className="text-right">Valor (R$)</TableHead>
                        <TableHead className="text-right">% do Total</TableHead>
                        <TableHead className="text-right">Qtd. Títulos</TableHead>
                        <TableHead className="text-center">Risco</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agingData.map((item) => {
                        let risco = 'Baixo';
                        let corRisco = 'default';
                        
                        if (item.periodo.includes('31-60')) {
                          risco = 'Médio';
                          corRisco = 'warning';
                        } else if (item.periodo.includes('61-90')) {
                          risco = 'Alto';
                          corRisco = 'destructive';
                        } else if (item.periodo.includes('> 90')) {
                          risco = 'Crítico';
                          corRisco = 'destructive';
                        }
                        
                        return (
                          <TableRow key={item.periodo}>
                            <TableCell className="font-medium">{item.periodo}</TableCell>
                            <TableCell className="text-right">{formatarMoeda(item.valor)}</TableCell>
                            <TableCell className="text-right">{formatarPorcentagem(item.percentual)}</TableCell>
                            <TableCell className="text-right">{item.quantidade}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={corRisco as any}>{risco}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="font-semibold bg-primary/5 border-t-2">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-right">{formatarMoeda(dados.totalReceber)}</TableCell>
                        <TableCell className="text-right">100%</TableCell>
                        <TableCell className="text-right">{agingData.reduce((sum, item) => sum + item.quantidade, 0)}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Gráfico de Aging */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Distribuição por Período de Vencimento</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={agingData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.periodo}: ${formatarPorcentagem(entry.percentual)}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="valor"
                    >
                      {agingData.map((entry, index) => (
                        <Cell key={`aging-${entry.periodo}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      formatter={(value: any) => formatarMoeda(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* PECLD - Provisão para Créditos de Liquidação Duvidosa */}
              <Card className="border-yellow-500/20 bg-yellow-500/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    PECLD - Provisão para Créditos de Liquidação Duvidosa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Provisão contábil para cobrir possíveis perdas com inadimplência, calculada com base no histórico 
                    de recebimento e risco de cada faixa de vencimento.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-background/50 rounded space-y-2">
                      <p className="text-sm font-semibold text-yellow-400">Critério de Provisão:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• A vencer: 0% de provisão</li>
                        <li>• 1-30 dias: 10% de provisão</li>
                        <li>• 31-60 dias: 25% de provisão</li>
                        <li>• 61-90 dias: 50% de provisão</li>
                        <li>• {'>'} 90 dias: 100% de provisão</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-background/50 rounded space-y-2">
                      <p className="text-sm font-semibold text-yellow-400">Impacto Contábil:</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Vencido:</span>
                          <span className="font-semibold">{formatarMoeda(dados.totalVencido)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Provisão (30%):</span>
                          <span className="font-semibold text-yellow-400">
                            ({formatarMoeda(dados.provisaoDevedoresDuvidosos)})
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-2">
                          <span className="text-muted-foreground">Valor Líquido:</span>
                          <span className="font-bold">
                            {formatarMoeda(dados.totalReceber - dados.provisaoDevedoresDuvidosos)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recomendações */}
              <Alert className={dados.percentualInadimplencia > 10 ? 'border-red-500/50 bg-red-500/10' : 'border-green-500/50 bg-green-500/10'}>
                <Info className={`h-4 w-4 ${dados.percentualInadimplencia > 10 ? 'text-red-500' : 'text-green-500'}`} />
                <AlertDescription>
                  <strong>Análise:</strong> Inadimplência de {formatarPorcentagem(dados.percentualInadimplencia)} 
                  {dados.percentualInadimplencia <= 5 && ' está dentro do padrão aceitável (até 5%).'}
                  {dados.percentualInadimplencia > 5 && dados.percentualInadimplencia <= 10 && ' está no limite aceitável. Monitorar de perto.'}
                  {dados.percentualInadimplencia > 10 && ' está acima do aceitável! Ações urgentes necessárias:'}
                  
                  {dados.percentualInadimplencia > 10 && (
                    <ul className="mt-2 ml-4 space-y-1">
                      <li>• Revisar política de crédito</li>
                      <li>• Intensificar cobrança</li>
                      <li>• Oferecer descontos para quitação</li>
                      <li>• Renegociar prazos com devedores</li>
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== CONCLUSÃO E RECOMENDAÇÕES ===== */}
        <TabsContent value="conclusao" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Conclusão e Recomendações Estratégicas
              </CardTitle>
              <CardDescription>
                Sugestões baseadas na análise completa dos indicadores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pontos Fortes */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  Pontos Fortes
                </h3>
                <div className="space-y-3">
                  {dados.desvioReceita > 5 && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded">
                      <p className="font-semibold text-green-400 mb-1">✓ Superação de Meta de Receita</p>
                      <p className="text-sm text-muted-foreground">
                        Receita {formatarPorcentagem(dados.desvioReceita)} acima do orçado, demonstrando forte 
                        desempenho comercial e capacidade de geração de receita.
                      </p>
                    </div>
                  )}
                  
                  {dados.margemBruta > 50 && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded">
                      <p className="font-semibold text-green-400 mb-1">✓ Margem de Contribuição Saudável</p>
                      <p className="text-sm text-muted-foreground">
                        Margem de {formatarPorcentagem(dados.margemBruta)} indica boa precificação e controle 
                        de custos variáveis, garantindo capacidade de cobrir despesas fixas.
                      </p>
                    </div>
                  )}
                  
                  {dados.saldoFinal > dados.saldoInicial && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded">
                      <p className="font-semibold text-green-400 mb-1">✓ Geração Positiva de Caixa</p>
                      <p className="text-sm text-muted-foreground">
                        Aumento de {formatarMoeda(dados.saldoFinal - dados.saldoInicial)} no caixa, demonstrando 
                        capacidade de gerar recursos operacionais.
                      </p>
                    </div>
                  )}
                  
                  {(dados.ebitda / dados.receitaLiquida) * 100 > 20 && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded">
                      <p className="font-semibold text-green-400 mb-1">✓ EBITDA Robusto</p>
                      <p className="text-sm text-muted-foreground">
                        Margem EBITDA de {formatarPorcentagem((dados.ebitda / dados.receitaLiquida) * 100)} demonstra 
                        excelente geração operacional de caixa antes de efeitos financeiros e tributários.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pontos de Atenção */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-yellow-400">
                  <AlertTriangle className="h-5 w-5" />
                  Pontos de Atenção
                </h3>
                <div className="space-y-3">
                  {dados.percentualInadimplencia > 10 && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded">
                      <p className="font-semibold text-yellow-400 mb-1">⚠ Inadimplência Elevada</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Taxa de {formatarPorcentagem(dados.percentualInadimplencia)} acima do ideal (5-10%). 
                        Impacta fluxo de caixa e exige provisão de {formatarMoeda(dados.provisaoDevedoresDuvidosos)}.
                      </p>
                      <p className="text-sm font-semibold text-yellow-400">Ações Recomendadas:</p>
                      <ul className="text-sm text-muted-foreground ml-4 mt-1 space-y-1">
                        <li>• Implementar sistema de credit scoring</li>
                        <li>• Reduzir prazos de pagamento ou oferecer desconto para à vista</li>
                        <li>• Intensificar follow-up de cobranças</li>
                      </ul>
                    </div>
                  )}
                  
                  {cicloFinanceiroData[3].dias > 30 && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded">
                      <p className="font-semibold text-yellow-400 mb-1">⚠ Ciclo de Caixa Longo</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Ciclo de {cicloFinanceiroData[3].dias} dias indica tempo elevado entre desembolso e recebimento.
                      </p>
                      <p className="text-sm font-semibold text-yellow-400">Ações Recomendadas:</p>
                      <ul className="text-sm text-muted-foreground ml-4 mt-1 space-y-1">
                        <li>• Negociar aumento do PMP com fornecedores (atual: {dados.pmp} dias)</li>
                        <li>• Reduzir PMR oferecendo descontos para antecipação (atual: {dados.pmr} dias)</li>
                        <li>• Otimizar giro de estoque (atual PME: {dados.pme} dias)</li>
                      </ul>
                    </div>
                  )}
                  
                  {dados.margemLiquida < 15 && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded">
                      <p className="font-semibold text-yellow-400 mb-1">⚠ Margem Líquida Abaixo do Ideal</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Margem de {formatarPorcentagem(dados.margemLiquida)} está abaixo dos 15% recomendados.
                      </p>
                      <p className="text-sm font-semibold text-yellow-400">Ações Recomendadas:</p>
                      <ul className="text-sm text-muted-foreground ml-4 mt-1 space-y-1">
                        <li>• Revisar estrutura de custos fixos ({formatarMoeda(dados.despesasFixas)})</li>
                        <li>• Renegociar despesas financeiras ({formatarMoeda(dados.despesasFinanceiras)})</li>
                        <li>• Avaliar reajuste de preços de venda</li>
                      </ul>
                    </div>
                  )}

                  {dados.saldoFinal / dados.burnRate < 3 && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded">
                      <p className="font-semibold text-yellow-400 mb-1">⚠ Runway Crítico</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Com burn rate de {formatarMoeda(dados.burnRate)}/mês, o caixa atual suporta apenas{' '}
                        {formatarNumero(dados.saldoFinal / dados.burnRate, 1)} meses de operação.
                      </p>
                      <p className="text-sm font-semibold text-yellow-400">Ações Urgentes:</p>
                      <ul className="text-sm text-muted-foreground ml-4 mt-1 space-y-1">
                        <li>• Acelerar recebimentos (antecipação de recebíveis)</li>
                        <li>• Renegociar prazos de pagamento</li>
                        <li>• Avaliar captação de recursos (empréstimo/investimento)</li>
                        <li>• Reduzir custos não essenciais imediatamente</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Recomendações Estratégicas */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">Recomendações Estratégicas - Curto Prazo (30-90 dias)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3 list-decimal list-inside">
                    <li className="text-sm">
                      <strong>Gestão de Inadimplência:</strong> Implementar rotina semanal de cobrança, com oferta 
                      de desconto de 5-10% para quitação de títulos vencidos há mais de 60 dias.
                    </li>
                    <li className="text-sm">
                      <strong>Otimização de Capital de Giro:</strong> Negociar com fornecedores principais extensão 
                      de PMP em 15 dias, enquanto oferece 3% de desconto para clientes pagarem em 14 dias (reduzir PMR).
                    </li>
                    <li className="text-sm">
                      <strong>Revisão de Custos Fixos:</strong> Realizar análise detalhada de despesas fixas 
                      ({formatarMoeda(dados.despesasFixas)}/mês) identificando potencial de redução de 10-15%.
                    </li>
                    <li className="text-sm">
                      <strong>Monitoramento de KPIs:</strong> Estabelecer dashboard executivo com acompanhamento 
                      semanal de: Margem Bruta, EBITDA, Inadimplência e Saldo de Caixa.
                    </li>
                    <li className="text-sm">
                      <strong>Precificação:</strong> Revisar mix de produtos/serviços focando em itens com maior 
                      margem de contribuição, buscando elevar margem líquida para 18-20%.
                    </li>
                  </ol>
                </CardContent>
              </Card>

              {/* Metas Sugeridas */}
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader>
                  <CardTitle className="text-lg">Metas Recomendadas - Próximo Período</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-400">Metas Financeiras:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Receita Líquida: {formatarMoeda(dados.receitaLiquida * 1.1)} (+10%)</li>
                        <li>• Margem Líquida: 18% (vs {formatarPorcentagem(dados.margemLiquida)} atual)</li>
                        <li>• EBITDA: {formatarMoeda(dados.ebitda * 1.15)} (+15%)</li>
                        <li>• Inadimplência: {'<'}8% (vs {formatarPorcentagem(dados.percentualInadimplencia)} atual)</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-400">Metas Operacionais:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• PMR: 21 dias (vs {dados.pmr} atual) - redução de 25%</li>
                        <li>• PMP: 42 dias (vs {dados.pmp} atual) - aumento de 20%</li>
                        <li>• Ciclo de Caixa: {'<'}20 dias (vs {cicloFinanceiroData[3].dias} atual)</li>
                        <li>• Burn Rate: {'<'}{formatarMoeda(dados.burnRate * 0.9)} - redução de 10%</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conclusão Final */}
              <Alert className="border-primary/50 bg-primary/10">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <strong className="text-lg">Conclusão Geral:</strong>
                  <p className="mt-2">
                    A empresa apresenta <strong>saúde financeira {dados.margemLiquida > 15 && dados.percentualInadimplencia < 10 ? 'sólida' : 'moderada'}</strong>, 
                    com destaque para {dados.desvioReceita > 5 ? 'superação de meta de receita' : 'geração de receita'} 
                    {dados.margemBruta > 50 && ' e margem de contribuição robusta'}. 
                    {dados.percentualInadimplencia > 10 && ' No entanto, a inadimplência elevada requer atenção imediata.'}
                    {cicloFinanceiroData[3].dias > 30 && ' O ciclo de caixa longo impacta a liquidez e deve ser otimizado.'}
                  </p>
                  <p className="mt-2">
                    Com as ações recomendadas implementadas, projetamos melhoria de 
                    <strong> 20-25% no lucro líquido</strong> nos próximos 6 meses, alcançando margem líquida de 18-20% 
                    e reduzindo inadimplência para níveis aceitáveis ({'<'}8%).
                  </p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
