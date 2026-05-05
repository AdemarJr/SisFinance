import { useState, useEffect } from 'react';
import { Plus, Filter, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../lib/db';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useEmpresa } from '../contexts/EmpresaContext';

// Helper para obter data local no formato YYYY-MM-DD
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper para formatar data para exibição
const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return '-';
  // Parse a data como local, não UTC
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR');
};

export function Lancamentos() {
  const { empresaSelecionada } = useEmpresa();
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [empresas, setEmpresas] = useState<any[]>([]);
  const NONE_SELECT_VALUE = '__none__';
  
  const [formData, setFormData] = useState({
    empresa_id: '',
    data: getLocalDateString(),
    tipo: 'Receita' as 'Receita' | 'Despesa' | 'Transferência',
    valor: '',
    descricao: '',
    status: 'Previsto' as 'Previsto' | 'Realizado' | 'Pago' | 'Recebido',
    forma_pagamento: '',
    conta_origem_id: '',
    fornecedor_id: '',
  });

  const [contas, setContas] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: lancamentosData } = await db
        .from('lancamentos')
        .select('*, fornecedores(nome)')
        .order('data', { ascending: false });

      setLancamentos(lancamentosData || []);

      const { data: contasData } = await db
        .from('contas_financeiras')
        .select('*')
        .eq('ativo', true);

      setContas(contasData || []);

      const { data: receitasData } = await db
        .from('categorias_receitas')
        .select('*')
        .eq('ativo', true);

      const { data: despesasData } = await db
        .from('categorias_despesas')
        .select('*')
        .eq('ativo', true);

      setCategorias([...(receitasData || []), ...(despesasData || [])]);
      
      const { data: empresasData } = await db.from('empresas').select('*');
      setEmpresas(empresasData || []);

      const { data: fornecedoresData } = await db.from('fornecedores').select('*');
      setFornecedores(fornecedoresData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar lançamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const lancamento = {
        ...formData,
        empresa_id: formData.empresa_id || empresaSelecionada || null,
        valor: parseFloat(formData.valor),
      };

      // Validar empresa_id
      if (!lancamento.empresa_id) {
        toast.error('Por favor, selecione uma empresa');
        return;
      }

      if (editingId) {
        const { error } = await db
          .from('lancamentos')
          .update(lancamento)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Lançamento atualizado com sucesso!');
      } else {
        const { error } = await db.from('lancamentos').insert(lancamento);

        if (error) throw error;
        toast.success('Lançamento criado com sucesso!');
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
      toast.error('Erro ao salvar lançamento');
    }
  };

  const handleEdit = (lancamento: any) => {
    setEditingId(lancamento.id);
    setFormData({
      empresa_id: lancamento.empresa_id ? String(lancamento.empresa_id) : '',
      data: lancamento.data,
      tipo: lancamento.tipo,
      valor: lancamento.valor.toString(),
      descricao: lancamento.descricao || '',
      status: lancamento.status,
      forma_pagamento: lancamento.forma_pagamento || '',
      conta_origem_id: lancamento.conta_origem_id ? String(lancamento.conta_origem_id) : '',
      fornecedor_id: lancamento.fornecedor_id ? String(lancamento.fornecedor_id) : '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este lançamento?')) return;

    try {
      const { error } = await db.from('lancamentos').delete().eq('id', id);

      if (error) throw error;
      toast.success('Lançamento excluído com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir lançamento:', error);
      toast.error('Erro ao excluir lançamento');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      empresa_id: empresaSelecionada,
      data: getLocalDateString(),
      tipo: 'Receita',
      valor: '',
      descricao: '',
      status: 'Previsto',
      forma_pagamento: '',
      conta_origem_id: '',
      fornecedor_id: '',
    });
  };

  const lancamentosFiltrados = lancamentos.filter((l) => {
    if (filtroTipo !== 'todos' && l.tipo !== filtroTipo) return false;
    if (filtroStatus !== 'todos' && l.status !== filtroStatus) return false;
    if (empresaSelecionada && l.empresa_id !== empresaSelecionada) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lançamentos Financeiros</h1>
          <p className="text-muted-foreground mt-1">Gerencie todas as movimentações financeiras</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="size-4" />
          Novo Lançamento
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-lg shadow-card p-4 mb-6 border border-border">
        <div className="flex items-center gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filtros:</span>
          </div>
          
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-[200px] shrink-0">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Tipos</SelectItem>
              <SelectItem value="Receita">Receita</SelectItem>
              <SelectItem value="Despesa">Despesa</SelectItem>
              <SelectItem value="Transferência">Transferência</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[200px] shrink-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="Previsto">Previsto</SelectItem>
              <SelectItem value="Realizado">Realizado</SelectItem>
              <SelectItem value="Pago">Pago</SelectItem>
              <SelectItem value="Recebido">Recebido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-card rounded-lg shadow-card overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Fornecedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-foreground uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lancamentosFiltrados.map((lancamento) => (
                <tr key={lancamento.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {formatDateForDisplay(lancamento.data)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        lancamento.tipo === 'Receita'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : lancamento.tipo === 'Despesa'
                          ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                          : 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                      }`}
                    >
                      {lancamento.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {lancamento.descricao || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {lancamento.fornecedores?.nome || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span
                      className={
                        lancamento.tipo === 'Receita' 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-rose-600 dark:text-rose-400'
                      }
                    >
                      {lancamento.tipo === 'Receita' ? '+' : '-'} R${' '}
                      {Number(lancamento.valor).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        lancamento.status === 'Realizado' || lancamento.status === 'Recebido' || lancamento.status === 'Pago'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                      }`}
                    >
                      {lancamento.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(lancamento)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="size-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(lancamento.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {lancamentosFiltrados.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum lançamento encontrado
          </div>
        )}
      </div>

      {/* Dialog de Formulário */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
            </DialogTitle>
            <DialogDescription>
              {editingId ? 'Atualize os detalhes do lançamento' : 'Crie um novo lançamento'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {empresas.length > 1 && !editingId && (
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa *</Label>
                <Select 
                  value={formData.empresa_id} 
                  onValueChange={(value) => setFormData({ ...formData, empresa_id: value })}
                >
                  <SelectTrigger id="empresa">
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((emp) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>
                        {emp.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(value) => setFormData({ ...formData, tipo: value as 'Receita' | 'Despesa' | 'Transferência' })}
              >
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Receita">Receita</SelectItem>
                  <SelectItem value="Despesa">Despesa</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                type="text"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Digite uma descrição"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value as 'Previsto' | 'Realizado' | 'Pago' | 'Recebido' })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Previsto">Previsto</SelectItem>
                  <SelectItem value="Realizado">Realizado</SelectItem>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Recebido">Recebido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conta">Conta</Label>
              <Select 
                value={formData.conta_origem_id || NONE_SELECT_VALUE} 
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    conta_origem_id: value === NONE_SELECT_VALUE ? '' : value,
                  })
                }
              >
                <SelectTrigger id="conta">
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_SELECT_VALUE}>Nenhuma</SelectItem>
                  {contas.map((conta) => (
                    <SelectItem key={conta.id} value={String(conta.id)}>
                      {conta.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Select 
                value={formData.fornecedor_id || NONE_SELECT_VALUE} 
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    fornecedor_id: value === NONE_SELECT_VALUE ? '' : value,
                  })
                }
              >
                <SelectTrigger id="fornecedor">
                  <SelectValue placeholder="Selecione um fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_SELECT_VALUE}>Nenhum</SelectItem>
                  {fornecedores.map((fornecedor) => (
                    <SelectItem key={fornecedor.id} value={String(fornecedor.id)}>
                      {fornecedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {editingId ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
