import { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { Plus, Edit, Trash2, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useEmpresa } from '../contexts/EmpresaContext';
import { useSupabaseRealtimeRefresh } from '../../lib/useSupabaseRealtimeRefresh';

export function ContasPagar() {
  const { empresaSelecionada } = useEmpresa();
  const [contas, setContas] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detalhesDialogOpen, setDetalhesDialogOpen] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tipoContaSelecionado, setTipoContaSelecionado] = useState<'normal' | 'folha-pagamento'>('normal');
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    empresa_id: '',
    descricao: '',
    valor_total: '',
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: new Date().toISOString().split('T')[0],
    fornecedor_id: '',
    status: 'Em Aberto' as 'Em Aberto' | 'Pago' | 'Atrasado' | 'Parcial',
    tipo_folha: 'mensal' as 'mensal' | 'semanal' | 'quinzenal',
    observacoes: '',
  });

  const loadData = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const { data: contasData } = await db
        .from('contas_pagar')
        .select('*, fornecedores(nome)')
        .order('data_vencimento', { ascending: true });

      setContas(contasData || []);

      const { data: fornecedoresData } = await db
        .from('fornecedores')
        .select('*')
        .eq('ativo', true);

      setFornecedores(fornecedoresData || []);

      // Carregar funcionários
      const { data: funcionariosData } = await db
        .from('funcionarios')
        .select('*')
        .eq('ativo', true);

      setFuncionarios(funcionariosData || []);
      
      // Atualizar status de contas atrasadas
      await db.rpc('atualizar_status_atrasados');
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar contas a pagar');
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useSupabaseRealtimeRefresh(
    ['contas_pagar', 'fornecedores', 'funcionarios'],
    () => {
      void loadData({ silent: true });
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validar folha de pagamento
      if (tipoContaSelecionado === 'folha-pagamento' && funcionariosSelecionados.length === 0) {
        toast.error('Adicione pelo menos um funcionário à folha de pagamento');
        return;
      }

      // Preparar observações para folha de pagamento
      let observacoes = '';
      if (tipoContaSelecionado === 'folha-pagamento') {
        const detalhes = await Promise.all(
          funcionariosSelecionados.map(async (func) => {
            const funcionario = funcionarios.find(f => f.id === func.funcionario_id);
            return `${funcionario?.nome}: R$ ${parseFloat(func.valor).toFixed(2)}`;
          })
        );
        observacoes = `FOLHA DE PAGAMENTO (${formData.tipo_folha.toUpperCase()})\n\n` + detalhes.join('\n');
      }

      const conta = {
        ...formData,
        empresa_id: formData.empresa_id || empresaSelecionada || null,
        valor_total: parseFloat(formData.valor_total),
        valor_pago: 0,
        observacoes: observacoes || formData.observacoes || null,
      };

      // Validar empresa_id
      if (!conta.empresa_id) {
        toast.error('Por favor, selecione uma empresa');
        return;
      }

      if (editingId) {
        const { error } = await db
          .from('contas_pagar')
          .update(conta)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Conta atualizada com sucesso!');
      } else {
        const { error } = await db.from('contas_pagar').insert(conta);

        if (error) throw error;
        toast.success(tipoContaSelecionado === 'folha-pagamento' 
          ? 'Folha de pagamento criada com sucesso!' 
          : 'Conta criada com sucesso!');
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      toast.error('Erro ao salvar conta');
    }
  };

  const handlePagar = async (id: string, valorTotal: number) => {
    if (!confirm('Deseja marcar esta conta como paga?')) return;

    try {
      const { error } = await db
        .from('contas_pagar')
        .update({
          status: 'Pago',
          valor_pago: valorTotal,
          data_pagamento: new Date().toISOString().split('T')[0],
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Conta marcada como paga!');
      loadData();
    } catch (error) {
      console.error('Erro ao pagar conta:', error);
      toast.error('Erro ao processar pagamento');
    }
  };

  const handleEdit = (conta: any) => {
    setEditingId(conta.id);
    
    // Verificar se é folha de pagamento
    const isFolhaPagamento = conta.observacoes?.includes('FOLHA DE PAGAMENTO');
    if (isFolhaPagamento) {
      setTipoContaSelecionado('folha-pagamento');
      
      // Extrair tipo de folha
      const tipoMatch = conta.observacoes.match(/FOLHA DE PAGAMENTO \((\w+)\)/);
      const tipo = tipoMatch ? tipoMatch[1].toLowerCase() : 'mensal';
      
      // Extrair funcionários e valores
      const linhas = conta.observacoes.split('\n').slice(2);
      const funcionariosExtraidos = linhas
        .filter((linha: string) => linha.includes(':'))
        .map((linha: string) => {
          const [nomeFuncionario, valorStr] = linha.split(':');
          const valor = valorStr.replace('R$', '').trim();
          
          // Encontrar o ID do funcionário pelo nome
          const funcionario = funcionarios.find(f => 
            f.nome.trim().toLowerCase() === nomeFuncionario.trim().toLowerCase()
          );
          
          return {
            funcionario_id: funcionario?.id || '',
            valor: valor.replace(',', '.'),
          };
        });
      
      setFuncionariosSelecionados(funcionariosExtraidos);
      
      setFormData({
        empresa_id: conta.empresa_id,
        descricao: conta.descricao,
        valor_total: conta.valor_total.toString(),
        data_emissao: conta.data_emissao,
        data_vencimento: conta.data_vencimento,
        fornecedor_id: '',
        status: conta.status,
        tipo_folha: tipo as any,
        observacoes: conta.observacoes || '',
      });
    } else {
      setTipoContaSelecionado('normal');
      setFormData({
        empresa_id: conta.empresa_id,
        descricao: conta.descricao,
        valor_total: conta.valor_total.toString(),
        data_emissao: conta.data_emissao,
        data_vencimento: conta.data_vencimento,
        fornecedor_id: conta.fornecedor_id || '',
        status: conta.status,
        tipo_folha: 'mensal',
        observacoes: conta.observacoes || '',
      });
    }
    
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta conta?')) return;

    try {
      const { error } = await db.from('contas_pagar').delete().eq('id', id);

      if (error) throw error;
      toast.success('Conta excluída com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast.error('Erro ao excluir conta');
    }
  };

  const handleVerDetalhes = (conta: any) => {
    setContaSelecionada(conta);
    setDetalhesDialogOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setTipoContaSelecionado('normal');
    setFuncionariosSelecionados([]);
    setFormData({
      empresa_id: empresaSelecionada,
      descricao: '',
      valor_total: '',
      data_emissao: new Date().toISOString().split('T')[0],
      data_vencimento: new Date().toISOString().split('T')[0],
      fornecedor_id: '',
      status: 'Em Aberto',
      tipo_folha: 'mensal',
      observacoes: '',
    });
  };

  const adicionarFuncionario = () => {
    setFuncionariosSelecionados([
      ...funcionariosSelecionados,
      { funcionario_id: '', valor: '' }
    ]);
  };

  const removerFuncionario = (index: number) => {
    setFuncionariosSelecionados(funcionariosSelecionados.filter((_, i) => i !== index));
  };

  const atualizarFuncionario = (index: number, campo: string, valor: any) => {
    const novosFunc = [...funcionariosSelecionados];
    novosFunc[index] = { ...novosFunc[index], [campo]: valor };
    setFuncionariosSelecionados(novosFunc);
    
    // Atualizar valor total automaticamente
    if (campo === 'valor') {
      const total = novosFunc.reduce((sum, f) => sum + (parseFloat(f.valor) || 0), 0);
      setFormData({ ...formData, valor_total: total.toString() });
    }
  };

  const totalAPagar = contas
    .filter((c) => c.status !== 'Pago' && (!empresaSelecionada || c.empresa_id === empresaSelecionada))
    .reduce((sum, c) => sum + Number(c.valor_total - c.valor_pago), 0);

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
          <h1 className="text-3xl font-bold text-foreground">Contas a Pagar</h1>
          <p className="text-muted-foreground mt-1">Gerencie as obrigações financeiras da empresa</p>
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
          <p className="text-sm text-muted-foreground">Total a Pagar</p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            R$ {totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  Fornecedor
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
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-col">
                        <span className="text-foreground">{conta.descricao}</span>
                        {conta.observacoes?.includes('FOLHA DE PAGAMENTO') && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 w-fit">
                            💼 Folha de Pagamento
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {conta.observacoes?.includes('FOLHA DE PAGAMENTO') 
                        ? 'Múltiplos Funcionários' 
                        : (conta.fornecedores?.nome || '-')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-rose-600 dark:text-rose-400">
                      R${' '}
                      {Number(conta.valor_total).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                          conta.status === 'Pago'
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
                        {conta.status !== 'Pago' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePagar(conta.id, conta.valor_total)}
                            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-400"
                            title="Marcar como pago"
                          >
                            <CheckCircle className="size-4" />
                            <span className="sr-only">Marcar como pago</span>
                          </Button>
                        )}
                        {conta.observacoes?.includes('FOLHA DE PAGAMENTO') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVerDetalhes(conta)}
                            className="h-8 w-8 p-0 text-purple-600 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-400"
                            title="Ver detalhes da folha"
                          >
                            <Info className="size-4" />
                            <span className="sr-only">Ver detalhes</span>
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
            Nenhuma conta a pagar cadastrada
          </div>
        )}
      </div>

      {/* Dialog de Formulário */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Conta' : 'Nova Conta a Pagar'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Atualize os detalhes da conta' : 'Adicione uma nova conta a pagar'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo de Conta */}
            {!editingId && (
              <div className="space-y-2">
                <Label>Tipo de Conta</Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipo_conta"
                      value="normal"
                      checked={tipoContaSelecionado === 'normal'}
                      onChange={(e) => setTipoContaSelecionado(e.target.value as any)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">Conta Normal</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipo_conta"
                      value="folha-pagamento"
                      checked={tipoContaSelecionado === 'folha-pagamento'}
                      onChange={(e) => setTipoContaSelecionado(e.target.value as any)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">Folha de Pagamento</span>
                  </label>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                type="text"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder={tipoContaSelecionado === 'folha-pagamento' ? 'Ex: Folha de Pagamento - Janeiro/2026' : 'Digite a descrição'}
                required
              />
            </div>

            {tipoContaSelecionado === 'normal' ? (
              <div className="space-y-2">
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <Select 
                  value={formData.fornecedor_id} 
                  onValueChange={(value) => setFormData({ ...formData, fornecedor_id: value })}
                >
                  <SelectTrigger id="fornecedor">
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Funcionários e Valores</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={adicionarFuncionario}
                  >
                    <Plus className="size-4 mr-1" />
                    Adicionar Funcionário
                  </Button>
                </div>
                
                {funcionariosSelecionados.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                    Clique em "Adicionar Funcionário" para começar
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-border rounded-lg p-3">
                    {funcionariosSelecionados.map((func, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Select
                          value={func.funcionario_id}
                          onValueChange={(value) => atualizarFuncionario(index, 'funcionario_id', value)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione o funcionário" />
                          </SelectTrigger>
                          <SelectContent>
                            {funcionarios.map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.nome} - {f.cargo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step="0.01"
                          value={func.valor}
                          onChange={(e) => atualizarFuncionario(index, 'valor', e.target.value)}
                          placeholder="Valor"
                          className="w-32"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerFuncionario(index)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Remover</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="tipo_folha">Tipo de Folha</Label>
                  <Select 
                    value={formData.tipo_folha} 
                    onValueChange={(value) => setFormData({ ...formData, tipo_folha: value as any })}
                  >
                    <SelectTrigger id="tipo_folha">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="quinzenal">Quinzenal</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

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
              <Label htmlFor="valor_total">
                {tipoContaSelecionado === 'folha-pagamento' ? 'Valor Total (Calculado)' : 'Valor *'}
              </Label>
              <Input
                id="valor_total"
                type="number"
                step="0.01"
                value={formData.valor_total}
                onChange={(e) => setFormData({ ...formData, valor_total: e.target.value })}
                placeholder="0.00"
                required
                readOnly={tipoContaSelecionado === 'folha-pagamento'}
              />
              {tipoContaSelecionado === 'folha-pagamento' && (
                <p className="text-xs text-muted-foreground">
                  O valor total é calculado automaticamente com base nos funcionários
                </p>
              )}
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

      {/* Dialog de Detalhes da Folha */}
      <Dialog open={detalhesDialogOpen} onOpenChange={setDetalhesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              💼 Detalhes da Folha de Pagamento
            </DialogTitle>
            <DialogDescription>
              Informações detalhadas dos pagamentos incluídos nesta folha
            </DialogDescription>
          </DialogHeader>
          {contaSelecionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="font-semibold text-foreground">{contaSelecionada.descricao}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="font-semibold text-lg text-rose-600 dark:text-rose-400">
                    R$ {Number(contaSelecionada.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Vencimento</p>
                  <p className="font-semibold text-foreground">
                    {new Date(contaSelecionada.data_vencimento).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                      contaSelecionada.status === 'Pago'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : contaSelecionada.status === 'Atrasado'
                        ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                        : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                    }`}
                  >
                    {contaSelecionada.status}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-3">Funcionários e Valores</h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase">
                          Funcionário
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground uppercase">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {contaSelecionada.observacoes?.split('\n').slice(2).map((linha: string, index: number) => {
                        if (!linha.trim()) return null;
                        const [nome, valor] = linha.split(':');
                        if (!nome || !valor) return null;
                        
                        return (
                          <tr key={index} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 text-sm text-foreground">{nome.trim()}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-right text-foreground">
                              {valor.trim()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setDetalhesDialogOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
