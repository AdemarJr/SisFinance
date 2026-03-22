import { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { formatarMoeda, formatarNumero } from '../../lib/formatters';
import { Calculator, Plus, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useEmpresa } from '../contexts/EmpresaContext';

interface Fechamento {
  id: string;
  empresa_id: string;
  data_fechamento: string;
  conta_caixa_id: string;
  saldo_inicial: number;
  total_entradas: number;
  total_saidas: number;
  total_gorjetas: number;
  total_extras_pagos: number;
  saldo_final: number;
  saldo_esperado: number;
  diferenca: number;
  deposito_banco_id?: string;
  valor_depositado?: number;
  responsavel?: string;
  observacoes?: string;
  status: string;
}

interface Empresa {
  id: string;
  nome: string;
}

interface Conta {
  id: string;
  nome: string;
  tipo: string;
  saldo_atual: number;
}

export default function FechamentoCaixa() {
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');

  const [formData, setFormData] = useState({
    empresa_id: '',
    data_fechamento: new Date().toISOString().split('T')[0],
    conta_caixa_id: '',
    saldo_inicial: 0,
    total_entradas: 0,
    total_saidas: 0,
    total_gorjetas: 0,
    total_extras_pagos: 0,
    saldo_final: 0,
    saldo_esperado: 0,
    diferenca: 0,
    deposito_banco_id: '',
    valor_depositado: 0,
    responsavel: '',
    observacoes: '',
    status: 'Aberto',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calcularSaldos();
  }, [
    formData.saldo_inicial,
    formData.total_entradas,
    formData.total_saidas,
    formData.total_gorjetas,
    formData.total_extras_pagos,
    formData.saldo_final,
  ]);

  const loadData = async () => {
    try {
      const [fechData, empData, contasData] = await Promise.all([
        db.from('fechamentos_caixa').select('*'),
        db.from('empresas').select('*'),
        db.from('contas').select('*'),
      ]);

      setFechamentos((fechData.data || []).sort((a: Fechamento, b: Fechamento) => 
        b.data_fechamento.localeCompare(a.data_fechamento)
      ));
      setEmpresas(empData.data || []);
      setContas(contasData.data || []);

      if (empData.data && empData.data.length > 0) {
        setEmpresaSelecionada(empData.data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const calcularSaldos = () => {
    const saldoEsperado =
      formData.saldo_inicial +
      formData.total_entradas -
      formData.total_saidas -
      formData.total_gorjetas -
      formData.total_extras_pagos;

    const diferenca = formData.saldo_final - saldoEsperado;

    setFormData((prev) => ({
      ...prev,
      saldo_esperado: saldoEsperado,
      diferenca: diferenca,
    }));
  };

  const handleOpenDialog = () => {
    const contaCaixa = contas.find(
      (c) => c.empresa_id === empresaSelecionada && c.tipo === 'Caixa'
    );

    setFormData({
      empresa_id: empresaSelecionada || '',
      data_fechamento: new Date().toISOString().split('T')[0],
      conta_caixa_id: contaCaixa?.id || '',
      saldo_inicial: contaCaixa?.saldo_atual || 0,
      total_entradas: 0,
      total_saidas: 0,
      total_gorjetas: 0,
      total_extras_pagos: 0,
      saldo_final: 0,
      saldo_esperado: 0,
      diferenca: 0,
      deposito_banco_id: '',
      valor_depositado: 0,
      responsavel: '',
      observacoes: '',
      status: 'Aberto',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await db.from('fechamentos_caixa').insert(formData);
      
      if (error) throw error;
      toast.success('Fechamento registrado com sucesso!');
      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao registrar fechamento:', error);
      toast.error('Erro ao registrar fechamento');
    }
  };

  const handleFecharCaixa = async (id: string) => {
    try {
      const { error } = await db
        .from('fechamentos_caixa')
        .update({ status: 'Fechado' })
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Caixa fechado com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao fechar caixa:', error);
      toast.error('Erro ao fechar caixa');
    }
  };

  const getEmpresaNome = (id: string) => {
    return empresas.find((e) => e.id === id)?.nome || '-';
  };

  const getContaNome = (id: string) => {
    return contas.find((c) => c.id === id)?.nome || '-';
  };

  const fechamentosFiltrados = fechamentos.filter(
    (f) => !empresaSelecionada || f.empresa_id === empresaSelecionada
  );

  const totalDiferencas = fechamentosFiltrados.reduce(
    (sum, f) => sum + Math.abs(f.diferenca),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Calculator className="h-8 w-8" />
            Fechamento de Caixa
          </h1>
          <p className="text-muted-foreground">
            Controle diário de fechamento com integração de gorjetas e extras
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={empresaSelecionada} onValueChange={setEmpresaSelecionada}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Selecione a empresa" />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleOpenDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Fechamento
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Fechamentos Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {
                fechamentosFiltrados.filter(
                  (f) => f.data_fechamento === new Date().toISOString().split('T')[0]
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Realizados hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Total Diferenças</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div className="text-3xl font-bold">
                {formatarMoeda(totalDiferencas)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Soma de diferenças absolutas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Caixas Abertos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {fechamentosFiltrados.filter((f) => f.status === 'Aberto').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando fechamento
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Total Gorjetas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatarMoeda(
                fechamentosFiltrados
                  .reduce((sum, f) => sum + f.total_gorjetas, 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">No período</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Fechamentos</CardTitle>
          <CardDescription>
            Todos os fechamentos de caixa realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Saldo Inicial</TableHead>
                <TableHead>Entradas</TableHead>
                <TableHead>Saídas</TableHead>
                <TableHead>Gorjetas</TableHead>
                <TableHead>Extras</TableHead>
                <TableHead>Saldo Esperado</TableHead>
                <TableHead>Saldo Real</TableHead>
                <TableHead>Diferença</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fechamentosFiltrados.map((fech) => (
                <TableRow key={fech.id}>
                  <TableCell className="font-medium">
                    {new Date(fech.data_fechamento).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>{getEmpresaNome(fech.empresa_id)}</TableCell>
                  <TableCell>R$ {fech.saldo_inicial.toFixed(2)}</TableCell>
                  <TableCell className="text-green-600">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      R$ {fech.total_entradas.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell className="text-red-600">
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      R$ {fech.total_saidas.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>R$ {fech.total_gorjetas.toFixed(2)}</TableCell>
                  <TableCell>R$ {fech.total_extras_pagos.toFixed(2)}</TableCell>
                  <TableCell className="font-semibold">
                    R$ {fech.saldo_esperado.toFixed(2)}
                  </TableCell>
                  <TableCell className="font-semibold">
                    R$ {fech.saldo_final.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        fech.diferenca === 0
                          ? 'text-green-600 font-bold'
                          : fech.diferenca > 0
                          ? 'text-blue-600 font-bold'
                          : 'text-red-600 font-bold'
                      }
                    >
                      {fech.diferenca >= 0 ? '+' : ''}R${' '}
                      {fech.diferenca.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        fech.status === 'Fechado'
                          ? 'default'
                          : fech.status === 'Conferido'
                          ? 'outline'
                          : 'secondary'
                      }
                    >
                      {fech.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {fech.status === 'Aberto' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFecharCaixa(fech.id)}
                      >
                        Fechar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Fechamento de Caixa</DialogTitle>
            <DialogDescription>
              Preencha os dados do fechamento diário
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="data_fechamento">Data do Fechamento *</Label>
                  <Input
                    id="data_fechamento"
                    type="date"
                    value={formData.data_fechamento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        data_fechamento: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="conta_caixa_id">Caixa *</Label>
                  <Select
                    value={formData.conta_caixa_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, conta_caixa_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contas
                        .filter(
                          (c) =>
                            c.empresa_id === formData.empresa_id &&
                            c.tipo === 'Caixa'
                        )
                        .map((conta) => (
                          <SelectItem key={conta.id} value={conta.id}>
                            {conta.nome}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Movimentações do Dia</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="saldo_inicial">Saldo Inicial (R$)</Label>
                    <Input
                      id="saldo_inicial"
                      type="number"
                      step="0.01"
                      value={formData.saldo_inicial}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          saldo_inicial: parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="total_entradas">Total de Entradas (R$) *</Label>
                    <Input
                      id="total_entradas"
                      type="number"
                      step="0.01"
                      value={formData.total_entradas}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          total_entradas: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="total_saidas">Total de Saídas (R$) *</Label>
                    <Input
                      id="total_saidas"
                      type="number"
                      step="0.01"
                      value={formData.total_saidas}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          total_saidas: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="total_gorjetas">Total de Gorjetas (R$)</Label>
                    <Input
                      id="total_gorjetas"
                      type="number"
                      step="0.01"
                      value={formData.total_gorjetas}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          total_gorjetas: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="total_extras_pagos">Extras Pagos (R$)</Label>
                    <Input
                      id="total_extras_pagos"
                      type="number"
                      step="0.01"
                      value={formData.total_extras_pagos}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          total_extras_pagos: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Conferência</h3>
                <div className="grid gap-4">
                  <div className="p-4 bg-muted rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span>Saldo Esperado:</span>
                      <span className="font-bold">
                        R$ {formData.saldo_esperado.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Inicial + Entradas - Saídas - Gorjetas - Extras
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="saldo_final">Saldo Real Contado (R$) *</Label>
                    <Input
                      id="saldo_final"
                      type="number"
                      step="0.01"
                      value={formData.saldo_final}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          saldo_final: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                  <div
                    className={`p-4 rounded-md ${
                      formData.diferenca === 0
                        ? 'bg-green-50 border border-green-200'
                        : formData.diferenca > 0
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Diferença:</span>
                      <span
                        className={`text-2xl font-bold ${
                          formData.diferenca === 0
                            ? 'text-green-600'
                            : formData.diferenca > 0
                            ? 'text-blue-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formData.diferenca >= 0 ? '+' : ''}R${' '}
                        {formData.diferenca.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.diferenca === 0
                        ? 'Caixa fechado sem divergências'
                        : formData.diferenca > 0
                        ? 'Sobra de caixa'
                        : 'Falta de caixa'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Depósito em Banco (Opcional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="deposito_banco_id">Depositar em</Label>
                    <Select
                      value={formData.deposito_banco_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, deposito_banco_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o banco" />
                      </SelectTrigger>
                      <SelectContent>
                        {contas
                          .filter(
                            (c) =>
                              c.empresa_id === formData.empresa_id &&
                              c.tipo === 'Banco'
                          )
                          .map((conta) => (
                            <SelectItem key={conta.id} value={conta.id}>
                              {conta.nome}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="valor_depositado">Valor Depositado (R$)</Label>
                    <Input
                      id="valor_depositado"
                      type="number"
                      step="0.01"
                      value={formData.valor_depositado}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          valor_depositado: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="responsavel">Responsável pelo Fechamento</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) =>
                    setFormData({ ...formData, responsavel: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) =>
                    setFormData({ ...formData, observacoes: e.target.value })
                  }
                  rows={3}
                  placeholder="Adicione observações sobre o fechamento, justificativas de diferenças, etc."
                />
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
              <Button type="submit">Salvar Fechamento</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}