import { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { Plus, Edit, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { useEmpresa } from '../contexts/EmpresaContext';

export function Contas() {
  const { empresaSelecionada } = useEmpresa();
  const [contas, setContas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    empresa_id: '',
    nome: '',
    tipo: 'Banco' as 'Caixa' | 'Banco' | 'Cartão',
    saldo_inicial: '',
    data_inicio: new Date().toISOString().split('T')[0],
    ativo: true,
  });

  useEffect(() => {
    loadContas();
  }, []);

  const loadContas = async () => {
    try {
      const { data } = await db
        .from('contas_financeiras')
        .select('*')
        .order('nome', { ascending: true });

      setContas(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      toast.error('Erro ao carregar contas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const conta = {
        ...formData,
        empresa_id: formData.empresa_id || empresaSelecionada || null,
        saldo_inicial: parseFloat(formData.saldo_inicial),
        saldo_atual: parseFloat(formData.saldo_inicial),
      };

      // Validar empresa_id
      if (!conta.empresa_id) {
        toast.error('Por favor, selecione uma empresa');
        return;
      }

      if (editingId) {
        const { error } = await db
          .from('contas_financeiras')
          .update({
            nome: conta.nome,
            tipo: conta.tipo,
            ativo: conta.ativo,
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Conta atualizada com sucesso!');
      } else {
        const { error } = await db.from('contas_financeiras').insert(conta);

        if (error) throw error;
        toast.success('Conta criada com sucesso!');
      }

      setDialogOpen(false);
      resetForm();
      loadContas();
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      toast.error('Erro ao salvar conta');
    }
  };

  const handleEdit = (conta: any) => {
    setEditingId(conta.id);
    setFormData({
      empresa_id: conta.empresa_id,
      nome: conta.nome,
      tipo: conta.tipo,
      saldo_inicial: conta.saldo_inicial.toString(),
      data_inicio: conta.data_inicio,
      ativo: conta.ativo,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta conta?')) return;

    try {
      const { error } = await db.from('contas_financeiras').delete().eq('id', id);

      if (error) throw error;
      toast.success('Conta excluída com sucesso!');
      loadContas();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast.error('Erro ao excluir conta');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      empresa_id: empresaSelecionada,
      nome: '',
      tipo: 'Banco',
      saldo_inicial: '',
      data_inicio: new Date().toISOString().split('T')[0],
      ativo: true,
    });
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'Caixa':
        return <Wallet className="size-5 text-green-600" />;
      case 'Banco':
        return <Wallet className="size-5 text-blue-600" />;
      case 'Cartão':
        return <Wallet className="size-5 text-purple-600" />;
      default:
        return <Wallet className="size-5 text-slate-600" />;
    }
  };

  const getTipoBgColor = (tipo: string) => {
    switch (tipo) {
      case 'Caixa':
        return 'bg-green-100';
      case 'Banco':
        return 'bg-blue-100';
      case 'Cartão':
        return 'bg-purple-100';
      default:
        return 'bg-slate-100';
    }
  };

  const saldoTotal = contas
    .filter((c) => c.ativo && (!empresaSelecionada || c.empresa_id === empresaSelecionada))
    .reduce((sum, c) => sum + Number(c.saldo_atual), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Contas Financeiras</h1>
          <p className="text-slate-600 mt-1">
            Gerencie suas contas, bancos e formas de pagamento
          </p>
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

      {/* Saldo Total */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 mb-8 text-white">
        <p className="text-sm opacity-90">Saldo Total Consolidado</p>
        <p className="text-4xl font-bold mt-2">
          R$ {saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-sm opacity-75 mt-2">
          {contas.filter((c) => c.ativo && (!empresaSelecionada || c.empresa_id === empresaSelecionada)).length} conta(s) ativa(s)
        </p>
      </div>

      {/* Cards de Contas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contas
          .filter((c) => !empresaSelecionada || c.empresa_id === empresaSelecionada)
          .map((conta) => (
            <div
              key={conta.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${getTipoBgColor(conta.tipo)} rounded-lg`}>
                    {getTipoIcon(conta.tipo)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{conta.nome}</h3>
                    <span className="text-xs text-slate-500">{conta.tipo}</span>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    conta.ativo
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {conta.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="mt-6">
                <p className="text-sm text-slate-600">Saldo Atual</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  R${' '}
                  {Number(conta.saldo_atual).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-600">
                  <span className="font-medium">Saldo Inicial:</span> R${' '}
                  {Number(conta.saldo_inicial).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  <span className="font-medium">Início:</span>{' '}
                  {new Date(conta.data_inicio).toLocaleDateString('pt-BR')}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEdit(conta)}
                  className="flex-1 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Edit className="size-4 inline mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(conta.id)}
                  className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
      </div>

      {contas.length === 0 && (
        <div className="text-center py-12">
          <Wallet className="size-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhuma conta cadastrada</p>
        </div>
      )}

      {/* Dialog de Formulário */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Conta' : 'Nova Conta Financeira'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Atualize os detalhes da conta' : 'Crie uma nova conta financeira'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="Ex: Banco Itaú, Caixa Principal"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
              <select
                value={formData.tipo}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tipo: e.target.value as 'Caixa' | 'Banco' | 'Cartão',
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              >
                <option value="Caixa">Caixa</option>
                <option value="Banco">Banco</option>
                <option value="Cartão">Cartão</option>
              </select>
            </div>

            {!editingId && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Saldo Inicial
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.saldo_inicial}
                    onChange={(e) =>
                      setFormData({ ...formData, saldo_inicial: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) =>
                      setFormData({ ...formData, data_inicio: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded"
              />
              <label htmlFor="ativo" className="text-sm font-medium text-slate-700">
                Conta ativa
              </label>
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