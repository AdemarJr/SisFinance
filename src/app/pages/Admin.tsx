import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { db } from '../../lib/db';
import { supabase } from '../../lib/supabase';
import { formatarMoeda } from '../../lib/formatters';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Building2,
  Crown,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { PageHeader } from '../components/PageHeader';
import { DatabaseSetup } from '../components/DatabaseSetup';

interface Plano {
  id: string;
  nome: string;
  limite_empresas: number;
  preco_mensal: number;
  descricao?: string;
}

interface ClienteSistema {
  id: string;
  nome_completo: string;
  email: string;
  telefone?: string;
  documento?: string;
  plano_id: string;
  limite_empresas: number;
  status: 'Ativo' | 'Suspenso' | 'Cancelado';
  is_super_admin: boolean;
  data_assinatura: string;
  data_expiracao?: string;
  total_empresas?: number;
  plano?: Plano;
}

export function Admin() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<ClienteSistema[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    telefone: '',
    documento: '',
    plano_id: '',
    senha: '',
    status: 'Ativo' as 'Ativo' | 'Suspenso' | 'Cancelado',
  });

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      toast.error('Acesso negado! Apenas Super Admin pode acessar esta área.');
      navigate('/app');
    }
  }, [isSuperAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [isSuperAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar planos
      const { data: planosData, error: planosError } = await db
        .from('planos_assinatura')
        .select('*')
        .eq('ativo', true)
        .order('preco_mensal');

      if (planosError) throw planosError;
      setPlanos(planosData || []);

      // Carregar clientes com contagem de empresas
      const { data: clientesData, error: clientesError } = await db
        .from('clientes_sistema')
        .select(`
          *,
          plano:planos_assinatura(*)
        `)
        .order('created_at', { ascending: false });

      if (clientesError) throw clientesError;

      // Carregar total de empresas para cada cliente
      const clientesComTotal = await Promise.all(
        (clientesData || []).map(async (cliente) => {
          const { count } = await db
            .from('empresas')
            .select('*', { count: 'exact', head: true })
            .eq('cliente_sistema_id', cliente.id)
            .eq('ativo', true);

          return {
            ...cliente,
            total_empresas: count || 0,
          };
        })
      );

      setClientes(clientesComTotal);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do sistema');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (cliente?: ClienteSistema) => {
    if (cliente) {
      setEditingId(cliente.id);
      setFormData({
        nome_completo: cliente.nome_completo,
        email: cliente.email,
        telefone: cliente.telefone || '',
        documento: cliente.documento || '',
        plano_id: cliente.plano_id,
        senha: '',
        status: cliente.status,
      });
    } else {
      setEditingId(null);
      setFormData({
        nome_completo: '',
        email: '',
        telefone: '',
        documento: '',
        plano_id: planos[0]?.id || '',
        senha: '',
        status: 'Ativo',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const planoSelecionado = planos.find(p => p.id === formData.plano_id);
      if (!planoSelecionado) {
        toast.error('Plano inválido');
        return;
      }

      if (editingId) {
        // Atualizar cliente existente
        const { error } = await db
          .from('clientes_sistema')
          .update({
            nome_completo: formData.nome_completo,
            telefone: formData.telefone,
            documento: formData.documento,
            plano_id: formData.plano_id,
            limite_empresas: planoSelecionado.limite_empresas,
            status: formData.status,
          })
          .eq('id', editingId);

        if (error) throw error;

        // Atualizar senha se fornecida
        if (formData.senha) {
          const cliente = clientes.find(c => c.id === editingId);
          if (cliente?.email) {
            const { error: authError } = await supabase.auth.admin.updateUserById(
              cliente.id,
              { password: formData.senha }
            );
            if (authError) console.error('Erro ao atualizar senha:', authError);
          }
        }

        toast.success('Cliente atualizado com sucesso!');
      } else {
        // Criar novo cliente
        // 1. Criar usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.senha,
          email_confirm: true, // Auto-confirmar email
          user_metadata: {
            nome_completo: formData.nome_completo,
          },
        });

        if (authError) throw authError;

        // 2. Criar registro em clientes_sistema
        const { error: clienteError } = await db
          .from('clientes_sistema')
          .insert({
            auth_user_id: authData.user.id,
            nome_completo: formData.nome_completo,
            email: formData.email,
            telefone: formData.telefone,
            documento: formData.documento,
            plano_id: formData.plano_id,
            limite_empresas: planoSelecionado.limite_empresas,
            status: formData.status,
            is_super_admin: false,
          });

        if (clienteError) throw clienteError;

        toast.success('Cliente criado com sucesso!');
      }

      setDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      toast.error(error.message || 'Erro ao salvar cliente');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      // Verificar se cliente tem empresas
      const { count } = await db
        .from('empresas')
        .select('*', { count: 'exact', head: true })
        .eq('cliente_sistema_id', id);

      if (count && count > 0) {
        toast.error('Não é possível excluir cliente com empresas cadastradas');
        return;
      }

      const { error } = await db.from('clientes_sistema').delete().eq('id', id);

      if (error) throw error;

      toast.success('Cliente excluído com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      Ativo: { variant: 'success', icon: CheckCircle2 },
      Suspenso: { variant: 'warning', icon: AlertCircle },
      Cancelado: { variant: 'destructive', icon: XCircle },
    };

    const config = variants[status] || variants.Ativo;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Administração do Sistema"
          description="Gerenciamento de clientes e planos de assinatura"
          icon={Crown}
        />
        <DatabaseSetup />
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.length}</div>
            <p className="text-xs text-muted-foreground">
              {clientes.filter(c => c.status === 'Ativo').length} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientes.reduce((sum, c) => sum + (c.total_empresas || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Em todas as contas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos Disponíveis</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{planos.length}</div>
            <p className="text-xs text-muted-foreground">Gratuito a Enterprise</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatarMoeda(
                clientes
                  .filter(c => c.status === 'Ativo')
                  .reduce((sum, c) => sum + (c.plano?.preco_mensal || 0), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">Clientes ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Clientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clientes do Sistema</CardTitle>
              <CardDescription>Gerencie os clientes e seus planos de assinatura</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Cliente
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Plano
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Empresas
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Valor Mensal
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((cliente) => (
                    <tr key={cliente.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {cliente.nome_completo}
                            {cliente.is_super_admin && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{cliente.email}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{cliente.plano?.nome}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <span className="font-medium">{cliente.total_empresas}</span> /{' '}
                          {cliente.limite_empresas === 999999 ? '∞' : cliente.limite_empresas}
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(cliente.status)}</td>
                      <td className="p-4">
                        <div className="font-medium">
                          {formatarMoeda(cliente.plano?.preco_mensal || 0)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(cliente)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!cliente.is_super_admin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(cliente.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {clientes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Nenhum cliente cadastrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Criar/Editar Cliente */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Atualize as informações do cliente'
                : 'Preencha os dados para criar um novo cliente'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome_completo">Nome Completo *</Label>
                <Input
                  id="nome_completo"
                  value={formData.nome_completo}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nome_completo: e.target.value }))
                  }
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                  disabled={submitting || !!editingId}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, telefone: e.target.value }))}
                  disabled={submitting}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documento">CPF/CNPJ</Label>
                <Input
                  id="documento"
                  value={formData.documento}
                  onChange={(e) => setFormData((prev) => ({ ...prev, documento: e.target.value }))}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plano_id">Plano *</Label>
                <Select
                  value={formData.plano_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, plano_id: value }))}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {planos.map((plano) => (
                      <SelectItem key={plano.id} value={plano.id}>
                        {plano.nome} - {formatarMoeda(plano.preco_mensal)}/mês (até{' '}
                        {plano.limite_empresas === 999999 ? '∞' : plano.limite_empresas} empresas)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData((prev) => ({ ...prev, status: value }))}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Suspenso">Suspenso</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="senha">
                  Senha {editingId ? '(deixe em branco para não alterar)' : '*'}
                </Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData((prev) => ({ ...prev, senha: e.target.value }))}
                  required={!editingId}
                  disabled={submitting}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            {!editingId && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Um email de boas-vindas será enviado ao cliente com as credenciais de acesso.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : editingId ? (
                  'Atualizar'
                ) : (
                  'Criar Cliente'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}