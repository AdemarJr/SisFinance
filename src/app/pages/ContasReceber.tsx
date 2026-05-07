import { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { Plus, Edit, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useEmpresa } from '../contexts/EmpresaContext';
import { useSupabaseRealtimeRefresh } from '../../lib/useSupabaseRealtimeRefresh';

export function ContasReceber() {
  const { empresaSelecionada } = useEmpresa();
  const [contas, setContas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    empresa_id: '',
    descricao: '',
    valor_total: '',
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: new Date().toISOString().split('T')[0],
    cliente_id: '',
    status: 'Previsto' as 'Previsto' | 'Recebido' | 'Atrasado' | 'Parcial',
  });

  const loadData = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const { data: contasData } = await db
        .from('contas_receber')
        .select('*, clientes(nome)')
        .order('data_vencimento', { ascending: true });

      setContas(contasData || []);

      const { data: clientesData } = await db
        .from('clientes')
        .select('*')
        .eq('ativo', true);

      setClientes(clientesData || []);
      
      const { data: empresasData } = await db.from('empresas').select('*');
      if (empresasData && empresasData.length > 0) {
        setFormData({ ...formData, empresa_id: empresaSelecionada });
      }

      // Atualizar status de contas atrasadas
      await db.rpc('atualizar_status_atrasados');
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar contas a receber');
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useSupabaseRealtimeRefresh(['contas_receber', 'clientes'], () => {
    void loadData({ silent: true });
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const conta = {
        ...formData,
        empresa_id: formData.empresa_id || empresaSelecionada || null,
        valor_total: parseFloat(formData.valor_total),
        valor_recebido: 0,
      };

      // Validar empresa_id
      if (!conta.empresa_id) {
        toast.error('Por favor, selecione uma empresa');
        return;
      }

      if (editingId) {
        const { error } = await db
          .from('contas_receber')
          .update(conta)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Conta atualizada com sucesso!');
      } else {
        const { error } = await db.from('contas_receber').insert(conta);

        if (error) throw error;
        toast.success('Conta criada com sucesso!');
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      toast.error('Erro ao salvar conta');
    }
  };

  const handleReceber = async (id: string, valorTotal: number) => {
    if (!confirm('Deseja marcar esta conta como recebida?')) return;

    try {
      const { error } = await db
        .from('contas_receber')
        .update({
          status: 'Recebido',
          valor_recebido: valorTotal,
          data_recebimento: new Date().toISOString().split('T')[0],
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Conta marcada como recebida!');
      loadData();
    } catch (error) {
      console.error('Erro ao receber conta:', error);
      toast.error('Erro ao processar recebimento');
    }
  };

  const handleEdit = (conta: any) => {
    setEditingId(conta.id);
    setFormData({
      empresa_id: conta.empresa_id,
      descricao: conta.descricao,
      valor_total: conta.valor_total.toString(),
      data_emissao: conta.data_emissao,
      data_vencimento: conta.data_vencimento,
      cliente_id: conta.cliente_id || '',
      status: conta.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta conta?')) return;

    try {
      const { error } = await db.from('contas_receber').delete().eq('id', id);

      if (error) throw error;
      toast.success('Conta excluída com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast.error('Erro ao excluir conta');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      empresa_id: empresaSelecionada,
      descricao: '',
      valor_total: '',
      data_emissao: new Date().toISOString().split('T')[0],
      data_vencimento: new Date().toISOString().split('T')[0],
      cliente_id: '',
      status: 'Previsto',
    });
  };

  const totalAReceber = contas
    .filter((c) => c.status !== 'Recebido' && (!empresaSelecionada || c.empresa_id === empresaSelecionada))
    .reduce((sum, c) => sum + Number(c.valor_total - c.valor_recebido), 0);

  const contasAtrasadas = contas.filter((c) => c.status === 'Atrasado' && (!empresaSelecionada || c.empresa_id === empresaSelecionada)).length;

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
          <h1 className="text-3xl font-bold text-foreground">Contas a Receber</h1>
          <p className="text-muted-foreground mt-1">Gerencie as receitas previstas da empresa</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="size-4" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-lg shadow-card p-6 border border-border">
          <p className="text-sm text-muted-foreground">Total a Receber</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            R$ {totalAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-card p-6 border border-border">
          <p className="text-sm text-muted-foreground">Contas Atrasadas</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{contasAtrasadas}</p>
        </div>

        <div className="bg-card rounded-lg shadow-card p-6 border border-border">
          <p className="text-sm text-muted-foreground">Total de Contas</p>
          <p className="text-2xl font-bold text-foreground mt-1">{contas.length}</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-card rounded-lg shadow-card overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Vencimento
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
              {contas
                .filter((c) => !empresaSelecionada || c.empresa_id === empresaSelecionada)
                .map((conta) => (
                  <tr key={conta.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground">{conta.descricao}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {conta.clientes?.nome || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      R${' '}
                      {Number(conta.valor_total).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                          conta.status === 'Recebido'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                            : conta.status === 'Atrasado'
                            ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                            : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                        }`}
                      >
                        {conta.status === 'Atrasado' && <AlertCircle className="size-3" />}
                        {conta.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {conta.status !== 'Recebido' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReceber(conta.id, conta.valor_total)}
                            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-400"
                            title="Marcar como recebido"
                          >
                            <CheckCircle className="size-4" />
                            <span className="sr-only">Marcar como recebido</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(conta)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="size-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(conta.id)}
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
        {contas.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma conta a receber cadastrada
          </div>
        )}
      </div>

      {/* Dialog de Formulário */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Conta' : 'Nova Conta a Receber'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Atualize os detalhes da conta' : 'Crie uma nova conta a receber'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                type="text"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Digite a descrição"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Select 
                value={formData.cliente_id} 
                onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
              >
                <SelectTrigger id="cliente">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_emissao">Data Emissão *</Label>
                <Input
                  id="data_emissao"
                  type="date"
                  value={formData.data_emissao}
                  onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_vencimento">Vencimento *</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_total">Valor *</Label>
              <Input
                id="valor_total"
                type="number"
                step="0.01"
                value={formData.valor_total}
                onChange={(e) => setFormData({ ...formData, valor_total: e.target.value })}
                placeholder="0.00"
                required
              />
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
