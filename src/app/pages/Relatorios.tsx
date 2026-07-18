import { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Printer,
  Building2,
  Calendar,
  Loader2,
  AlertCircle,
  Download,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { useEmpresa } from '../contexts/EmpresaContext';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { formatarMoeda, formatarPorcentagem } from '../../lib/formatters';
import {
  gerarRelatorioCompleto,
  calcularIntervaloPeriodo,
  formatarDataBR,
  listarFornecedoresRelatorio,
  type RelatorioCompleto,
} from '../../lib/relatorios-helpers';

const ALL = 'todos';

const STATUS_OPCOES = [
  ALL,
  'Previsto',
  'Realizado',
  'Recebido',
  'Pago',
  'Atrasado',
  'Parcial',
  'Em Aberto',
];

const FORMAS_OPCOES = [
  ALL,
  'Dinheiro',
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Boleto',
  'Transferência',
  'Cheque',
];

type TipoRelatorio =
  | 'dre'
  | 'fluxo'
  | 'lancamentos'
  | 'por-empresa'
  | 'aging';

const TIPOS: { id: TipoRelatorio; titulo: string; descricao: string }[] = [
  {
    id: 'dre',
    titulo: 'DRE',
    descricao: 'Demonstrativo de Resultado do Exercício',
  },
  {
    id: 'fluxo',
    titulo: 'Fluxo de Caixa',
    descricao: 'Entradas, saídas e saldo (regime de caixa)',
  },
  {
    id: 'lancamentos',
    titulo: 'Extrato de Lançamentos',
    descricao: 'Listagem detalhada de todos os lançamentos',
  },
  {
    id: 'por-empresa',
    titulo: 'Por Empresa',
    descricao: 'Receitas e despesas por empresa cadastrada',
  },
  {
    id: 'aging',
    titulo: 'Contas a Receber (Aging)',
    descricao: 'Envelhecimento de títulos em aberto',
  },
];

function pctAv(valor: number, base: number): number {
  if (!base) return 0;
  return (valor / base) * 100;
}

function linhaDre(
  label: string,
  valor: number,
  base: number,
  opts?: { bold?: boolean; indent?: boolean; negativo?: boolean; nota?: string }
) {
  const exibir = opts?.negativo ? -Math.abs(valor) : valor;
  return (
    <TableRow key={label} className={opts?.bold ? 'font-semibold bg-muted/40' : ''}>
      <TableCell className={opts?.indent ? 'pl-8' : ''}>
        {label}
        {opts?.nota && (
          <span className="ml-2 text-[10px] uppercase tracking-wide text-amber-700">
            ({opts.nota})
          </span>
        )}
      </TableCell>
      <TableCell
        className={`text-right tabular-nums ${
          exibir < 0 ? 'text-red-700' : opts?.bold ? 'text-foreground' : ''
        }`}
      >
        {formatarMoeda(exibir)}
      </TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">
        {formatarPorcentagem(pctAv(Math.abs(valor), base || 1))}
      </TableCell>
    </TableRow>
  );
}

export function Relatorios() {
  const { empresaSelecionada, empresaAtual, empresas } = useEmpresa();
  const mesPadrao = useMemo(() => calcularIntervaloPeriodo('mes-atual'), []);

  const [tipo, setTipo] = useState<TipoRelatorio>('dre');
  const [dataInicio, setDataInicio] = useState(mesPadrao.dataInicio);
  const [dataFim, setDataFim] = useState(mesPadrao.dataFim);
  const [escopo, setEscopo] = useState<'selecionada' | 'todas'>(
    empresaSelecionada ? 'selecionada' : 'todas'
  );
  const [filtroTipoMov, setFiltroTipoMov] = useState<string>(ALL);
  const [filtroStatus, setFiltroStatus] = useState<string>(ALL);
  const [filtroFornecedor, setFiltroFornecedor] = useState<string>(ALL);
  const [filtroForma, setFiltroForma] = useState<string>(ALL);
  const [filtroBusca, setFiltroBusca] = useState('');
  const [fornecedores, setFornecedores] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [relatorio, setRelatorio] = useState<RelatorioCompleto | null>(null);
  const [geradoEm, setGeradoEm] = useState<Date | null>(null);
  const [meta, setMeta] = useState<{
    tipo: TipoRelatorio;
    dataInicio: string;
    dataFim: string;
    escopoLabel: string;
    empresaNome: string;
    empresaCnpj: string;
  } | null>(null);

  useEffect(() => {
    void listarFornecedoresRelatorio()
      .then(setFornecedores)
      .catch(() => setFornecedores([]));
  }, []);

  const tipoInfo = TIPOS.find((t) => t.id === tipo)!;

  const limparFiltros = () => {
    setFiltroTipoMov(ALL);
    setFiltroStatus(ALL);
    setFiltroFornecedor(ALL);
    setFiltroForma(ALL);
    setFiltroBusca('');
  };

  const gerar = async () => {
    if (!dataInicio || !dataFim) {
      toast.error('Informe o período (data início e fim).');
      return;
    }
    if (dataInicio > dataFim) {
      toast.error('A data início não pode ser maior que a data fim.');
      return;
    }

    const usarTodas = escopo === 'todas' || !empresaSelecionada;
    if (!usarTodas && !empresaSelecionada) {
      toast.error('Selecione uma empresa ou use “Todas as empresas”.');
      return;
    }

    setLoading(true);
    try {
      const dados = await gerarRelatorioCompleto({
        empresaId: usarTodas ? undefined : empresaSelecionada,
        dataInicio,
        dataFim,
        tipo: filtroTipoMov as 'todos' | 'Receita' | 'Despesa' | 'Transferência',
        status: filtroStatus,
        fornecedorId: filtroFornecedor,
        formaPagamento: filtroForma,
        busca: filtroBusca,
      });
      setRelatorio(dados);
      setGeradoEm(new Date());
      setMeta({
        tipo,
        dataInicio,
        dataFim,
        escopoLabel: usarTodas
          ? `Todas as empresas (${empresas.length})`
          : empresaAtual?.nome || 'Empresa selecionada',
        empresaNome: usarTodas
          ? 'Consolidado — Todas as empresas'
          : empresaAtual?.nome || 'Empresa',
        empresaCnpj: usarTodas ? '—' : empresaAtual?.cnpj || '—',
      });
      toast.success('Relatório gerado');
    } catch (error) {
      console.error(error);
      toast.error('Falha ao gerar relatório. Verifique a API.');
    } finally {
      setLoading(false);
    }
  };

  const aplicarAtalho = (periodo: string) => {
    const p = calcularIntervaloPeriodo(periodo);
    setDataInicio(p.dataInicio);
    setDataFim(p.dataFim);
  };

  const imprimir = () => {
    if (!relatorio || !meta) {
      toast.error('Gere o relatório antes de imprimir.');
      return;
    }
    window.print();
  };

  const exportarCsv = () => {
    if (!relatorio || !meta) {
      toast.error('Gere o relatório antes de exportar.');
      return;
    }

    let rows: string[][] = [];
    if (meta.tipo === 'lancamentos') {
      rows = [
        ['Data', 'Empresa', 'Tipo', 'Descrição', 'Status', 'Valor'],
        ...relatorio.lancamentosDetalhe.map((l) => [
          l.data,
          l.empresaNome,
          l.tipo,
          l.descricao,
          l.status,
          String(l.valor),
        ]),
      ];
    } else if (meta.tipo === 'por-empresa') {
      rows = [
        ['Empresa', 'Receitas', 'Despesas', 'Resultado'],
        ...relatorio.porEmpresa.map((e) => [
          e.empresaNome,
          String(e.receitas),
          String(e.despesas),
          String(e.resultado),
        ]),
      ];
    } else if (meta.tipo === 'aging') {
      rows = [
        ['Faixa', 'Valor', '%', 'Qtd'],
        ...relatorio.agingData.map((a) => [
          a.periodo,
          String(a.valor),
          String(a.percentual),
          String(a.quantidade),
        ]),
      ];
    } else if (meta.tipo === 'dre') {
      rows = [
        ['Descrição', 'Valor', 'AV%'],
        ['Receita Bruta', String(relatorio.receitaBruta), ''],
        ['(-) Impostos', String(relatorio.impostos), ''],
        ['Receita Líquida', String(relatorio.receitaLiquida), '100'],
        ['(-) Custos Variáveis', String(relatorio.custosVariaveis), ''],
        ['Margem de Contribuição', String(relatorio.margemContribuicao), ''],
        ['(-) Despesas Fixas', String(relatorio.despesasFixas), ''],
        ['EBITDA', String(relatorio.ebitda), ''],
        ['(-) Depreciação/Amortização', String(relatorio.depreciacaoAmortizacao), ''],
        ['EBIT', String(relatorio.ebit), ''],
        ['(+/-) Resultado Financeiro', String(relatorio.receitasFinanceiras - relatorio.despesasFinanceiras), ''],
        ['LAIR', String(relatorio.lair), ''],
        ['(-) IR/CSLL', String(relatorio.impostoRenda), ''],
        ['Lucro Líquido', String(relatorio.lucroLiquido), ''],
      ];
    } else {
      rows = [
        ['Item', 'Valor'],
        ['Saldo Inicial', String(relatorio.saldoInicial)],
        ['Entradas', String(relatorio.entradas)],
        ['Saídas', String(relatorio.saidas)],
        ['Saldo Final', String(relatorio.saldoFinal)],
      ];
    }

    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sisfinance-${meta.tipo}-${meta.dataInicio}-${meta.dataFim}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const base = relatorio?.receitaLiquida || 0;

  return (
    <div className="space-y-6">
      {/* Controles — não imprimem */}
      <div className="no-print space-y-6">
        <PageHeader
          title="Relatórios Financeiros"
          description="Gere documentos formais (DRE, fluxo, extrato, aging) para impressão ou exportação."
          icon={FileText}
        />

        <div className="rounded-xl border bg-card p-4 sm:p-6 space-y-5 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de relatório</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoRelatorio)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.titulo} — {t.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Escopo</Label>
              <Select
                value={escopo}
                onValueChange={(v) => setEscopo(v as 'selecionada' | 'todas')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as empresas</SelectItem>
                  <SelectItem value="selecionada" disabled={!empresaSelecionada}>
                    {empresaSelecionada
                      ? `Somente: ${empresaAtual?.nome || 'selecionada'}`
                      : 'Selecione uma empresa no menu'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="data-inicio">Data início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-fim">Data fim</Label>
              <Input
                id="data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => aplicarAtalho('semana')}>
                Semana
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => aplicarAtalho('mes-atual')}>
                Mês
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => aplicarAtalho('trimestre')}>
                Trimestre
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => aplicarAtalho('ano')}>
                Ano
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => aplicarAtalho('tudo')}>
                Todo período
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros do demonstrativo
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo (Receita / Despesa)</Label>
                <Select value={filtroTipoMov} onValueChange={setFiltroTipoMov}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos</SelectItem>
                    <SelectItem value="Receita">Receita</SelectItem>
                    <SelectItem value="Despesa">Despesa</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPCOES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s === ALL ? 'Todos' : s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select value={filtroFornecedor} onValueChange={setFiltroFornecedor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos</SelectItem>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Forma de pagamento</Label>
                <Select value={filtroForma} onValueChange={setFiltroForma}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAS_OPCOES.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f === ALL ? 'Todas' : f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="filtro-busca">Busca na descrição</Label>
                <Input
                  id="filtro-busca"
                  placeholder="Ex.: aluguel, energia, fornecedor..."
                  value={filtroBusca}
                  onChange={(e) => setFiltroBusca(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button onClick={() => void gerar()} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Gerar relatório
            </Button>
            <Button variant="outline" onClick={imprimir} disabled={!relatorio} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir / PDF
            </Button>
            <Button variant="outline" onClick={exportarCsv} disabled={!relatorio} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Documento do relatório */}
      {!relatorio || !meta ? (
        <div className="no-print rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="font-medium text-foreground">Nenhum relatório gerado</p>
          <p className="text-sm mt-1">
            Selecione o tipo, o período e clique em <strong>Gerar relatório</strong>.
          </p>
        </div>
      ) : (
        <article id="relatorio-print-area" className="relatorio-documento bg-white text-slate-900 rounded-xl border shadow-sm overflow-hidden">
          {/* Cabeçalho formal */}
          <header className="border-b px-6 py-5 sm:px-8 bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">
                  SisFinance
                </p>
                <h1 className="text-xl sm:text-2xl font-bold mt-1 text-slate-900">
                  {TIPOS.find((t) => t.id === meta.tipo)?.titulo}
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  {TIPOS.find((t) => t.id === meta.tipo)?.descricao}
                </p>
              </div>
              <div className="text-sm text-slate-600 sm:text-right space-y-1">
                <p className="flex items-center gap-1.5 sm:justify-end">
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="font-medium text-slate-900">{meta.empresaNome}</span>
                </p>
                <p>CNPJ: {meta.empresaCnpj}</p>
                <p>
                  Período: {formatarDataBR(meta.dataInicio)} a {formatarDataBR(meta.dataFim)}
                </p>
                <p>
                  Emitido em:{' '}
                  {geradoEm?.toLocaleString('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-slate-300 text-slate-700">
                Escopo: {meta.escopoLabel}
              </Badge>
              <Badge variant="outline" className="border-slate-300 text-slate-700">
                {relatorio.qtdLancamentos} lançamentos
              </Badge>
              {meta.tipo === 'dre' && (
                <Badge variant="outline" className="border-slate-300 text-slate-700">
                  Regime: Competência
                </Badge>
              )}
              {meta.tipo === 'fluxo' && (
                <Badge variant="outline" className="border-slate-300 text-slate-700">
                  Regime: Caixa
                </Badge>
              )}
              {relatorio.filtrosAplicados?.tipo && (
                <Badge variant="outline" className="border-blue-300 text-blue-800">
                  Tipo: {relatorio.filtrosAplicados.tipo}
                </Badge>
              )}
              {relatorio.filtrosAplicados?.status && (
                <Badge variant="outline" className="border-blue-300 text-blue-800">
                  Status: {relatorio.filtrosAplicados.status}
                </Badge>
              )}
              {relatorio.filtrosAplicados?.fornecedor && (
                <Badge variant="outline" className="border-blue-300 text-blue-800">
                  Fornecedor: {relatorio.filtrosAplicados.fornecedor}
                </Badge>
              )}
              {relatorio.filtrosAplicados?.formaPagamento && (
                <Badge variant="outline" className="border-blue-300 text-blue-800">
                  Forma: {relatorio.filtrosAplicados.formaPagamento}
                </Badge>
              )}
              {relatorio.filtrosAplicados?.busca && (
                <Badge variant="outline" className="border-blue-300 text-blue-800">
                  Busca: {relatorio.filtrosAplicados.busca}
                </Badge>
              )}
            </div>
          </header>

          <div className="px-6 py-6 sm:px-8 space-y-8">
            {/* DRE */}
            {meta.tipo === 'dre' && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
                  Demonstrativo de Resultado
                </h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[55%]">Descrição</TableHead>
                      <TableHead className="text-right">Valor (R$)</TableHead>
                      <TableHead className="text-right">AV %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linhaDre('RECEITA BRUTA', relatorio.receitaBruta, base || relatorio.receitaBruta || 1, {
                      bold: true,
                    })}
                    {linhaDre('(-) Impostos / deduções sobre vendas', relatorio.impostos, base || 1, {
                      indent: true,
                      negativo: true,
                      nota: relatorio.impostosEstimados ? 'estimado' : undefined,
                    })}
                    {linhaDre('= RECEITA LÍQUIDA', relatorio.receitaLiquida, base || 1, { bold: true })}
                    {linhaDre('(-) Custos variáveis (CMV/CPV/comissões)', relatorio.custosVariaveis, base || 1, {
                      indent: true,
                      negativo: true,
                    })}
                    {linhaDre('= MARGEM DE CONTRIBUIÇÃO', relatorio.margemContribuicao, base || 1, {
                      bold: true,
                    })}
                    {linhaDre('(-) Despesas operacionais / fixas', relatorio.despesasFixas, base || 1, {
                      indent: true,
                      negativo: true,
                    })}
                    {linhaDre('= EBITDA', relatorio.ebitda, base || 1, { bold: true })}
                    {linhaDre('(-) Depreciação / amortização', relatorio.depreciacaoAmortizacao, base || 1, {
                      indent: true,
                      negativo: true,
                    })}
                    {linhaDre('= EBIT (resultado operacional)', relatorio.ebit, base || 1, { bold: true })}
                    {linhaDre('(+) Receitas financeiras', relatorio.receitasFinanceiras, base || 1, {
                      indent: true,
                    })}
                    {linhaDre('(-) Despesas financeiras', relatorio.despesasFinanceiras, base || 1, {
                      indent: true,
                      negativo: true,
                    })}
                    {linhaDre('= LAIR', relatorio.lair, base || 1, { bold: true })}
                    {linhaDre('(-) IR / CSLL', relatorio.impostoRenda, base || 1, {
                      indent: true,
                      negativo: true,
                      nota: relatorio.irEstimado ? 'estimado' : undefined,
                    })}
                    {linhaDre('= LUCRO LÍQUIDO', relatorio.lucroLiquido, base || 1, { bold: true })}
                  </TableBody>
                </Table>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="rounded border p-3">
                    <p className="text-xs text-slate-500">Margem bruta</p>
                    <p className="font-semibold">{formatarPorcentagem(relatorio.margemBruta)}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-xs text-slate-500">Margem líquida</p>
                    <p className="font-semibold">{formatarPorcentagem(relatorio.margemLiquida)}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-xs text-slate-500">EBITDA</p>
                    <p className="font-semibold">{formatarMoeda(relatorio.ebitda)}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-xs text-slate-500">Lucro líquido</p>
                    <p className="font-semibold">{formatarMoeda(relatorio.lucroLiquido)}</p>
                  </div>
                </div>
              </section>
            )}

            {/* Fluxo */}
            {meta.tipo === 'fluxo' && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
                  Demonstrativo de Fluxo de Caixa
                </h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor (R$)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Saldo inicial</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatarMoeda(relatorio.saldoInicial)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>(+) Entradas no período</TableCell>
                      <TableCell className="text-right tabular-nums text-green-700">
                        {formatarMoeda(relatorio.entradas)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>(−) Saídas no período</TableCell>
                      <TableCell className="text-right tabular-nums text-red-700">
                        {formatarMoeda(relatorio.saidas)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-semibold bg-muted/40">
                      <TableCell>= Saldo final</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatarMoeda(relatorio.saldoFinal)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Variação líquida do período</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatarMoeda(relatorio.entradas - relatorio.saidas)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Burn rate (média mensal de saídas)</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatarMoeda(relatorio.burnRate)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </section>
            )}

            {/* Lançamentos */}
            {meta.tipo === 'lancamentos' && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
                  Extrato de Lançamentos ({relatorio.qtdLancamentos})
                </h2>
                {relatorio.qtdLancamentos === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhum lançamento no período selecionado.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">#</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relatorio.lancamentosDetalhe.map((l, i) => (
                          <TableRow key={l.id}>
                            <TableCell className="text-xs text-slate-500">{i + 1}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {formatarDataBR(l.data)}
                            </TableCell>
                            <TableCell>{l.empresaNome}</TableCell>
                            <TableCell>{l.tipo}</TableCell>
                            <TableCell className="max-w-[280px]">{l.descricao}</TableCell>
                            <TableCell>{l.status}</TableCell>
                            <TableCell
                              className={`text-right tabular-nums font-medium ${
                                l.tipo === 'Receita'
                                  ? 'text-green-700'
                                  : l.tipo === 'Despesa'
                                    ? 'text-red-700'
                                    : ''
                              }`}
                            >
                              {l.tipo === 'Despesa' ? '−' : l.tipo === 'Receita' ? '+' : ''}
                              {formatarMoeda(l.valor)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold bg-muted/40 border-t-2">
                          <TableCell colSpan={6}>
                            Total (Receitas − Despesas)
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatarMoeda(
                              relatorio.lancamentosDetalhe
                                .filter((l) => l.tipo === 'Receita')
                                .reduce((s, l) => s + l.valor, 0) -
                                relatorio.lancamentosDetalhe
                                  .filter((l) => l.tipo === 'Despesa')
                                  .reduce((s, l) => s + l.valor, 0)
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>
            )}

            {/* Por empresa */}
            {meta.tipo === 'por-empresa' && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
                  Resultado por Empresa
                </h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead className="text-right">Receitas</TableHead>
                      <TableHead className="text-right">% Rec.</TableHead>
                      <TableHead className="text-right">Despesas</TableHead>
                      <TableHead className="text-right">% Desp.</TableHead>
                      <TableHead className="text-right">Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatorio.porEmpresa.map((e) => (
                      <TableRow key={e.empresaId}>
                        <TableCell className="font-medium">{e.empresaNome}</TableCell>
                        <TableCell className="text-right tabular-nums text-green-700">
                          {formatarMoeda(e.receitas)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-slate-500">
                          {formatarPorcentagem(e.percentualReceitas)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-red-700">
                          {formatarMoeda(e.despesas)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-slate-500">
                          {formatarPorcentagem(e.percentualDespesas)}
                        </TableCell>
                        <TableCell
                          className={`text-right tabular-nums font-semibold ${
                            e.resultado >= 0 ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {formatarMoeda(e.resultado)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>
            )}

            {/* Aging */}
            {meta.tipo === 'aging' && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
                  Aging — Contas a Receber em Aberto
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
                  <div className="rounded border p-3">
                    <p className="text-xs text-slate-500">Total a receber</p>
                    <p className="font-semibold">{formatarMoeda(relatorio.totalReceber)}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-xs text-slate-500">Total vencido</p>
                    <p className="font-semibold">{formatarMoeda(relatorio.totalVencido)}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-xs text-slate-500">% Inadimplência</p>
                    <p className="font-semibold">
                      {formatarPorcentagem(relatorio.percentualInadimplencia)}
                    </p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-xs text-slate-500">Provisão (30% vencido)</p>
                    <p className="font-semibold">
                      {formatarMoeda(relatorio.provisaoDevedoresDuvidosos)}
                    </p>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Faixa</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">%</TableHead>
                      <TableHead className="text-right">Qtd.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatorio.agingData.map((a) => (
                      <TableRow key={a.periodo}>
                        <TableCell>{a.periodo}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatarMoeda(a.valor)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatarPorcentagem(a.percentual)}
                        </TableCell>
                        <TableCell className="text-right">{a.quantidade}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>
            )}

            {/* Notas */}
            {relatorio.notas.length > 0 && (
              <section className="border-t pt-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Notas explicativas
                </h2>
                <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600">
                  {relatorio.notas.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          <footer className="border-t px-6 py-4 sm:px-8 text-xs text-slate-500 flex flex-col sm:flex-row sm:justify-between gap-2 bg-slate-50">
            <span>Documento gerado automaticamente pelo SisFinance</span>
            <span>
              {tipoInfo.titulo} · {formatarDataBR(meta.dataInicio)} a{' '}
              {formatarDataBR(meta.dataFim)}
            </span>
          </footer>
        </article>
      )}
    </div>
  );
}
