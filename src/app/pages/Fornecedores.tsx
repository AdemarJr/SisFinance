import { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { useEmpresa } from '../contexts/EmpresaContext';

export function Fornecedores() {
  const { empresaSelecionada } = useEmpresa();
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    empresa_id: '',
    nome: '',
    categoria: '',
    contato: '',
    email: '',
    ativo: true,
  });

  useEffect(() => {
    loadFornecedores();
  }, []);

  const loadFornecedores = async () => {
    try {
      const { data } = await db
        .from('fornecedores')
        .select('*')
        .order('nome', { ascending: true });

      setFornecedores(data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      toast.error('Erro ao carregar fornecedores');
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
          .from('fornecedores')
          .update(dataToSave)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Fornecedor atualizado com sucesso!');
      } else {
        const { error } = await db.from('fornecedores').insert(dataToSave);

        if (error) throw error;
        toast.success('Fornecedor criado com sucesso!');
      }

      setDialogOpen(false);
      resetForm();
      loadFornecedores();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      toast.error('Erro ao salvar fornecedor');
    }
  };

  const handleEdit = (fornecedor: any) => {
    setEditingId(fornecedor.id);
    setFormData({
      empresa_id: fornecedor.empresa_id,
      nome: fornecedor.nome,
      categoria: fornecedor.categoria || '',
      contato: fornecedor.contato || '',
      email: fornecedor.email || '',
      ativo: fornecedor.ativo,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este fornecedor?')) return;

    try {
      const { error } = await db.from('fornecedores').delete().eq('id', id);

      if (error) throw error;
      toast.success('Fornecedor excluído com sucesso!');
      loadFornecedores();
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      toast.error('Erro ao excluir fornecedor');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      empresa_id: empresaSelecionada,
      nome: '',
      categoria: '',
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
          <h1 className="text-3xl font-bold text-slate-900">Fornecedores</h1>
          <p className="text-slate-600 mt-1">Gerencie o cadastro de fornecedores</p>
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
            Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* Cards de Fornecedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fornecedores
          .filter((f) => !empresaSelecionada || f.empresa_id === empresaSelecionada)
          .map((fornecedor) => (
            <div
              key={fornecedor.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building2 className="size-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{fornecedor.nome}</h3>
                    {fornecedor.categoria && (
                      <span className="text-xs text-slate-500">{fornecedor.categoria}</span>
                    )}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    fornecedor.ativo
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {fornecedor.contato && (
                  <div>
                    <span className="font-medium">Contato:</span> {fornecedor.contato}
                  </div>
                )}
                {fornecedor.email && (
                  <div>
                    <span className="font-medium">Email:</span> {fornecedor.email}
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEdit(fornecedor)}
                  className="flex-1 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Edit className="size-4 inline mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(fornecedor.id)}
                  className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
      </div>

      {fornecedores.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="size-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum fornecedor cadastrado</p>
        </div>
      )}

      {/* Dialog de Formulário */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </DialogTitle>
            <DialogDescription>
              {editingId ? 'Atualize os detalhes do fornecedor' : 'Adicione um novo fornecedor'}
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Categoria
              </label>
              <input
                type="text"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="Ex: Matéria Prima, Serviços, Equipamentos"
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
                Fornecedor ativo
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