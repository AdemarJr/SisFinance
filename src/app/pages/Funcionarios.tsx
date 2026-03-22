import { useState, useEffect } from 'react';
import { formatarMoeda } from '../../lib/formatters';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Users, Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { db } from '../../lib/db';
import { toast } from 'sonner';

interface Funcionario {
  id: string;
  empresa_id: string;
  nome: string;
  cargo: string;
  tipo_contrato: string;
  documento?: string;
  contato?: string;
  salario_base: number;
  data_admissao?: string;
  ativo: boolean;
}

interface PagamentoExtra {
  id: string;
  empresa_id: string;
  funcionario_id: string;
  conta_origem_id: string;
  tipo_extra: string;
  valor: number;
  data_pagamento: string;
  descricao?: string;
  status: string;
}

interface Empresa {
  id: string;
  nome: string;
}

interface Conta {
  id: string;
  nome: string;
  empresa_id: string;
}

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoExtra[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pagamentoDialogOpen, setPagamentoDialogOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  
  const [formData, setFormData] = useState({
    empresa_id: '',
    nome: '',
    cargo: 'Garçom',
    tipo_contrato: 'CLT',
    documento: '',
    contato: '',
    salario_base: 0,
    data_admissao: new Date().toISOString().split('T')[0],
    ativo: true,
  });

  const [pagamentoFormData, setPagamentoFormData] = useState({
    empresa_id: '',
    funcionario_id: '',
    conta_origem_id: '',
    tipo_extra: 'Gorjeta',
    valor: 0,
    data_pagamento: new Date().toISOString().split('T')[0],
    descricao: '',
    status: 'Pago',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [funcData, pagData, empData, contasData] = await Promise.all([
        db.from('funcionarios').select('*'),
        db.from('pagamentos_extras').select('*'),
        db.from('empresas').select('*'),
        db.from('contas').select('*'),
      ]);
      
      setFuncionarios(funcData.data || []);
      setPagamentos(pagData.data || []);
      setEmpresas(empData.data || []);
      setContas(contasData.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const handleOpenDialog = (funcionario?: Funcionario) => {
    if (funcionario) {
      setEditingFuncionario(funcionario);
      setFormData({
        empresa_id: funcionario.empresa_id,
        nome: funcionario.nome,
        cargo: funcionario.cargo,
        tipo_contrato: funcionario.tipo_contrato,
        documento: funcionario.documento || '',
        contato: funcionario.contato || '',
        salario_base: funcionario.salario_base,
        data_admissao: funcionario.data_admissao || '',
        ativo: funcionario.ativo,
      });
    } else {
      setEditingFuncionario(null);
      setFormData({
        empresa_id: empresas[0]?.id || '',
        nome: '',
        cargo: 'Garçom',
        tipo_contrato: 'CLT',
        documento: '',
        contato: '',
        salario_base: 0,
        data_admissao: new Date().toISOString().split('T')[0],
        ativo: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingFuncionario) {
        const { error } = await db
          .from('funcionarios')
          .update(formData)
          .eq('id', editingFuncionario.id);
        
        if (error) throw error;
        toast.success('Funcionário atualizado com sucesso!');
      } else {
        const { error } = await db.from('funcionarios').insert(formData);
        
        if (error) throw error;
        toast.success('Funcionário criado com sucesso!');
      }

      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
      toast.error('Erro ao salvar funcionário');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este funcionário?')) {
      try {
        const { error } = await db.from('funcionarios').delete().eq('id', id);
        
        if (error) throw error;
        toast.success('Funcionário excluído com sucesso!');
        loadData();
      } catch (error) {
        console.error('Erro ao excluir funcionário:', error);
        toast.error('Erro ao excluir funcionário');
      }
    }
  };

  const handleOpenPagamentoDialog = () => {
    setPagamentoFormData({
      empresa_id: empresas[0]?.id || '',
      funcionario_id: funcionarios[0]?.id || '',
      conta_origem_id: contas[0]?.id || '',
      tipo_extra: 'Gorjeta',
      valor: 0,
      data_pagamento: new Date().toISOString().split('T')[0],
      descricao: '',
      status: 'Pago',
    });
    setPagamentoDialogOpen(true);
  };

  const handlePagamentoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await db.from('pagamentos_extras').insert(pagamentoFormData);
      
      if (error) throw error;
      toast.success('Pagamento registrado com sucesso!');
      setPagamentoDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
    }
  };

  const getEmpresaNome = (id: string) => {
    return empresas.find((e) => e.id === id)?.nome || '-';
  };

  const getFuncionarioNome = (id: string) => {
    return funcionarios.find((f) => f.id === id)?.nome || '-';
  };

  const getContaNome = (id: string) => {
    return contas.find((c) => c.id === id)?.nome || '-';
  };

  const totalPagamentosHoje = pagamentos
    .filter((p) => p.data_pagamento === new Date().toISOString().split('T')[0])
    .reduce((sum, p) => sum + p.valor, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Users className="h-8 w-8" />
            Funcionários & Staff
          </h1>
          <p className="text-muted-foreground">
            Gerencie funcionários e pagamentos extras (gorjetas, diárias, comissões)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleOpenPagamentoDialog} variant="outline">
            <DollarSign className="mr-2 h-4 w-4" />
            Pagar Extra
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Funcionário
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Total de Funcionários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {funcionarios.filter((f) => f.ativo).length}
            </div>
            <p className="text-xs text-muted-foreground">Ativos no sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Pagamentos Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatarMoeda(totalPagamentosHoje)}
            </div>
            <p className="text-xs text-muted-foreground">
              Em extras e gorjetas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Total de Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pagamentos.length}</div>
            <p className="text-xs text-muted-foreground">Registros no mês</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="funcionarios">
        <TabsList>
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos Extras</TabsTrigger>
        </TabsList>

        <TabsContent value="funcionarios">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Funcionários</CardTitle>
              <CardDescription>
                Todos os funcionários cadastrados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Salário Base</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funcionarios.map((func) => (
                    <TableRow key={func.id}>
                      <TableCell className="font-medium">{func.nome}</TableCell>
                      <TableCell>{getEmpresaNome(func.empresa_id)}</TableCell>
                      <TableCell>{func.cargo}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{func.tipo_contrato}</Badge>
                      </TableCell>
                      <TableCell>
                        {formatarMoeda(func.salario_base)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={func.ativo ? 'default' : 'secondary'}>
                          {func.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(func)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(func.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagamentos">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos Extras</CardTitle>
              <CardDescription>
                Gorjetas, diárias, comissões e bonificações pagas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Conta Origem</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagamentos.map((pag) => (
                    <TableRow key={pag.id}>
                      <TableCell>
                        {new Date(pag.data_pagamento).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {getFuncionarioNome(pag.funcionario_id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{pag.tipo_extra}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatarMoeda(pag.valor)}
                      </TableCell>
                      <TableCell>{getContaNome(pag.conta_origem_id)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            pag.status === 'Pago' ? 'default' : 'secondary'
                          }
                        >
                          {pag.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Funcionário */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFuncionario ? 'Editar Funcionário' : 'Novo Funcionário'}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do funcionário
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="empresa_id">Empresa *</Label>
                  <Select
                    value={formData.empresa_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, empresa_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cargo">Cargo *</Label>
                  <Select
                    value={formData.cargo}
                    onValueChange={(value) =>
                      setFormData({ ...formData, cargo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Garçom">Garçom</SelectItem>
                      <SelectItem value="Atendente">Atendente</SelectItem>
                      <SelectItem value="Freelancer">Freelancer</SelectItem>
                      <SelectItem value="Cozinheiro">Cozinheiro</SelectItem>
                      <SelectItem value="Gerente">Gerente</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tipo_contrato">Tipo de Contrato *</Label>
                  <Select
                    value={formData.tipo_contrato}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tipo_contrato: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLT">CLT</SelectItem>
                      <SelectItem value="Freelancer">Freelancer</SelectItem>
                      <SelectItem value="Diária">Diária</SelectItem>
                      <SelectItem value="Temporário">Temporário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="documento">CPF</Label>
                  <Input
                    id="documento"
                    value={formData.documento}
                    onChange={(e) =>
                      setFormData({ ...formData, documento: e.target.value })
                    }
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contato">Contato</Label>
                  <Input
                    id="contato"
                    value={formData.contato}
                    onChange={(e) =>
                      setFormData({ ...formData, contato: e.target.value })
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="salario_base">Salário Base</Label>
                  <Input
                    id="salario_base"
                    type="number"
                    step="0.01"
                    value={formData.salario_base}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salario_base: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="data_admissao">Data de Admissão</Label>
                  <Input
                    id="data_admissao"
                    type="date"
                    value={formData.data_admissao}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        data_admissao: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Pagamento Extra */}
      <Dialog open={pagamentoDialogOpen} onOpenChange={setPagamentoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento Extra</DialogTitle>
            <DialogDescription>
              Registre gorjetas, diárias, comissões e bonificações
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePagamentoSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="pag_empresa_id">Empresa *</Label>
                <Select
                  value={pagamentoFormData.empresa_id}
                  onValueChange={(value) => {
                    setPagamentoFormData({
                      ...pagamentoFormData,
                      empresa_id: value,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="funcionario_id">Funcionário *</Label>
                <Select
                  value={pagamentoFormData.funcionario_id}
                  onValueChange={(value) =>
                    setPagamentoFormData({
                      ...pagamentoFormData,
                      funcionario_id: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionarios
                      .filter(
                        (f) =>
                          f.empresa_id === pagamentoFormData.empresa_id &&
                          f.ativo
                      )
                      .map((func) => (
                        <SelectItem key={func.id} value={func.id}>
                          {func.nome} - {func.cargo}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tipo_extra">Tipo de Pagamento *</Label>
                <Select
                  value={pagamentoFormData.tipo_extra}
                  onValueChange={(value) =>
                    setPagamentoFormData({
                      ...pagamentoFormData,
                      tipo_extra: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gorjeta">Gorjeta</SelectItem>
                    <SelectItem value="Diária">Diária</SelectItem>
                    <SelectItem value="Comissão">Comissão</SelectItem>
                    <SelectItem value="Bonificação">Bonificação</SelectItem>
                    <SelectItem value="Adiantamento">Adiantamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="conta_origem_id">Pagar de (Conta) *</Label>
                <Select
                  value={pagamentoFormData.conta_origem_id}
                  onValueChange={(value) =>
                    setPagamentoFormData({
                      ...pagamentoFormData,
                      conta_origem_id: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contas
                      .filter((c) => c.empresa_id === pagamentoFormData.empresa_id)
                      .map((conta) => (
                        <SelectItem key={conta.id} value={conta.id}>
                          {conta.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="valor">Valor (R$) *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={pagamentoFormData.valor}
                  onChange={(e) =>
                    setPagamentoFormData({
                      ...pagamentoFormData,
                      valor: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="data_pagamento">Data do Pagamento *</Label>
                <Input
                  id="data_pagamento"
                  type="date"
                  value={pagamentoFormData.data_pagamento}
                  onChange={(e) =>
                    setPagamentoFormData({
                      ...pagamentoFormData,
                      data_pagamento: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={pagamentoFormData.descricao}
                  onChange={(e) =>
                    setPagamentoFormData({
                      ...pagamentoFormData,
                      descricao: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPagamentoDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Registrar Pagamento</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}