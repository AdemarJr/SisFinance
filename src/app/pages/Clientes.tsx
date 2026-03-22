import { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { Plus, Edit, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { useEmpresa } from '../contexts/EmpresaContext';

export function Clientes() {
  const { empresaSelecionada } = useEmpresa();
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    empresa_id: '',
    nome: '',
    tipo: 'Pessoa Física' as 'Pessoa Física' | 'Pessoa Jurídica',
    documento: '',
    contato: '',
    email: '',
    ativo: true,
  });

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      const { data } = await db
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });

      setClientes(data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataToSave = {
        ...formData,
        empresa_id: formData.empresa_id || empresaSelecionada || null,
      };

      // Validar empresa_id
      if (!dataToSave.empresa_id) {
        toast.error('Por favor, selecione uma empresa');
        return;
      }

      if (editingId) {
        const { error } = await db
          .from('clientes')
          .update(dataToSave)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Cliente atualizado com sucesso!');
      } else {
        const { error } = await db.from('clientes').insert(dataToSave);

        if (error) throw error;
        toast.success('Cliente criado com sucesso!');
      }

      setDialogOpen(false);
      resetForm();
      loadClientes();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente');
    }
  };

  const handleEdit = (cliente: any) => {
    setEditingId(cliente.id);
    setFormData({
      empresa_id: cliente.empresa_id,
      nome: cliente.nome,
      tipo: cliente.tipo,
      documento: cliente.documento || '',
      contato: cliente.contato || '',
      email: cliente.email || '',
      ativo: cliente.ativo,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este cliente?')) return;

    try {
      const { error } = await db.from('clientes').delete().eq('id', id);

      if (error) throw error;
      toast.success('Cliente excluído com sucesso!');
      loadClientes();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      empresa_id: empresaSelecionada,
      nome: '',
      tipo: 'Pessoa Física',
      documento: '',
      contato: '',
      email: '',
      ativo: true,
    });
  };

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
          <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-600 mt-1">Gerencie o cadastro de clientes</p>
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
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Cards de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientes
          .filter((c) => !empresaSelecionada || c.empresa_id === empresaSelecionada)
          .map((cliente) => (
            <div
              key={cliente.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{cliente.nome}</h3>
                    <span className="text-xs text-slate-500">{cliente.tipo}</span>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    cliente.ativo
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {cliente.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {cliente.documento && (
                  <div>
                    <span className="font-medium">Documento:</span> {cliente.documento}
                  </div>
                )}
                {cliente.contato && (
                  <div>
                    <span className="font-medium">Contato:</span> {cliente.contato}
                  </div>
                )}
                {cliente.email && (
                  <div>
                    <span className="font-medium">Email:</span> {cliente.email}
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEdit(cliente)}
                  className="flex-1 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Edit className="size-4 inline mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(cliente.id)}
                  className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
      </div>

      {clientes.length === 0 && (
        <div className="text-center py-12">
          <User className="size-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum cliente cadastrado</p>
        </div>
      )}

      {/* Dialog de Formulário */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Atualize as informações do cliente' : 'Adicione um novo cliente'}
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
                    tipo: e.target.value as 'Pessoa Física' | 'Pessoa Jurídica',
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              >
                <option value="Pessoa Física">Pessoa Física</option>
                <option value="Pessoa Jurídica">Pessoa Jurídica</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Documento (CPF/CNPJ)
              </label>
              <input
                type="text"
                value={formData.documento}
                onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contato</label>
              <input
                type="text"
                value={formData.contato}
                onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded"
              />
              <label htmlFor="ativo" className="text-sm font-medium text-slate-700">
                Cliente ativo
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