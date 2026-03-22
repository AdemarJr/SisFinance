import { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { formatarMoeda, formatarNumero } from '../../lib/formatters';
import { Package, Plus, Edit, Trash2, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { useEmpresa } from '../contexts/EmpresaContext';

interface Produto {
  id: string;
  empresa_id: string;
  categoria_id: string;
  codigo: string;
  nome: string;
  unidade_medida: string;
  estoque_minimo: number;
  estoque_atual: number;
  preco_custo_medio: number;
  preco_venda: number;
  ativo: boolean;
}

interface Empresa {
  id: string;
  nome: string;
}

interface Categoria {
  id: string;
  nome: string;
}

interface Projecao {
  produto_id: string;
  produto_nome: string;
  estoque_atual: number;
  estoque_minimo: number;
  consumo_medio_diario: number;
  quantidade_necessaria: number;
  valor_projetado: number;
}

export default function Estoque() {
  const { empresaSelecionada } = useEmpresa();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [projecoes, setProjecoes] = useState<Projecao[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [movimentacaoDialogOpen, setMovimentacaoDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    empresa_id: '',
    categoria_id: '',
    codigo: '',
    nome: '',
    unidade_medida: 'UN',
    estoque_minimo: 0,
    estoque_atual: 0,
    preco_custo_medio: 0,
    preco_venda: 0,
    ativo: true,
  });

  const [movimentacaoFormData, setMovimentacaoFormData] = useState({
    empresa_id: '',
    produto_id: '',
    tipo_movimentacao: 'Entrada',
    quantidade: 0,
    preco_unitario: 0,
    data_movimentacao: new Date().toISOString().split('T')[0],
    documento: '',
    observacao: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (empresaSelecionada) {
      loadProjecoes();
    }
  }, [empresaSelecionada]);

  const loadData = async () => {
    try {
      const [prodData, empData, catData] = await Promise.all([
        db.from('produtos').select('*'),
        db.from('empresas').select('*'),
        db.from('categorias_produtos').select('*'),
      ]);

      setProdutos(prodData.data || []);
      setEmpresas(empData.data || []);
      setCategorias(catData.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const loadProjecoes = async () => {
    if (!empresaSelecionada) return;
    
    try {
      const { data } = await db.rpc('calcular_projecao_compra', {
        p_empresa_id: empresaSelecionada,
      });
      
      setProjecoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar projeções:', error);
      // Se a função não existir, apenas ignora o erro
      setProjecoes([]);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      empresa_id: empresaSelecionada || empresas[0]?.id || '',
      categoria_id: categorias[0]?.id || '',
      codigo: '',
      nome: '',
      unidade_medida: 'UN',
      estoque_minimo: 0,
      estoque_atual: 0,
      preco_custo_medio: 0,
      preco_venda: 0,
      ativo: true,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await db.from('produtos').insert(formData);
      
      if (error) throw error;
      toast.success('Produto cadastrado com sucesso!');
      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      toast.error('Erro ao cadastrar produto');
    }
  };

  const handleOpenMovimentacaoDialog = () => {
    setMovimentacaoFormData({
      empresa_id: empresaSelecionada || '',
      produto_id: produtosFiltrados[0]?.id || '',
      tipo_movimentacao: 'Entrada',
      quantidade: 0,
      preco_unitario: 0,
      data_movimentacao: new Date().toISOString().split('T')[0],
      documento: '',
      observacao: '',
    });
    setMovimentacaoDialogOpen(true);
  };

  const handleMovimentacaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await db.from('movimentacoes_estoque').insert({
        ...movimentacaoFormData,
        valor_total: movimentacaoFormData.quantidade * movimentacaoFormData.preco_unitario,
      });
      
      if (error) throw error;
      toast.success('Movimentação registrada com sucesso!');
      setMovimentacaoDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
      toast.error('Erro ao registrar movimentação');
    }
  };

  const produtosFiltrados = produtos.filter(
    (p) => !empresaSelecionada || p.empresa_id === empresaSelecionada
  );

  const valorTotalEstoque = produtosFiltrados.reduce(
    (sum, p) => sum + p.estoque_atual * p.preco_custo_medio,
    0
  );

  const produtosAbaixoMinimo = produtosFiltrados.filter(
    (p) => p.estoque_atual < p.estoque_minimo
  );

  const valorProjecaoCompra = projecoes.reduce(
    (sum, p) => sum + p.valor_projetado,
    0
  );

  const getCategoriaNome = (id: string) => {
    return categorias.find((c) => c.id === id)?.nome || '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Package className="h-8 w-8" />
            Gestão de Estoque
          </h1>
          <p className="text-muted-foreground">
            Controle financeiro de estoque com projeções de compra
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleOpenMovimentacaoDialog} variant="outline">
            <TrendingUp className="mr-2 h-4 w-4" />
            Movimentar
          </Button>
          <Button onClick={handleOpenDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Valor Total do Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div className="text-3xl font-bold">
                {formatarMoeda(valorTotalEstoque)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor imobilizado em estoque
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Total de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{produtosFiltrados.length}</div>
            <p className="text-xs text-muted-foreground">Itens cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Abaixo do Mínimo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div className="text-3xl font-bold">
                {produtosAbaixoMinimo.length}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Produtos críticos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Projeção de Compra</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatarMoeda(valorProjecaoCompra)}
            </div>
            <p className="text-xs text-muted-foreground">
              Próximos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="produtos">
        <TabsList>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="projecao">
            Projeção de Compra
            {projecoes.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {projecoes.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="produtos">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Produtos</CardTitle>
              <CardDescription>
                Todos os produtos em estoque com valores financeiros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estoque Atual</TableHead>
                    <TableHead>Estoque Mín.</TableHead>
                    <TableHead>Custo Médio</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosFiltrados.map((prod) => {
                    const valorTotal = prod.estoque_atual * prod.preco_custo_medio;
                    const abaixoMinimo = prod.estoque_atual < prod.estoque_minimo;
                    
                    return (
                      <TableRow key={prod.id}>
                        <TableCell className="font-medium">{prod.codigo}</TableCell>
                        <TableCell>{prod.nome}</TableCell>
                        <TableCell>{getCategoriaNome(prod.categoria_id)}</TableCell>
                        <TableCell>
                          {prod.estoque_atual} {prod.unidade_medida}
                        </TableCell>
                        <TableCell>
                          {prod.estoque_minimo} {prod.unidade_medida}
                        </TableCell>
                        <TableCell>{formatarMoeda(prod.preco_custo_medio)}</TableCell>
                        <TableCell className="font-bold">
                          {formatarMoeda(valorTotal)}
                        </TableCell>
                        <TableCell>
                          {abaixoMinimo ? (
                            <Badge variant="destructive">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Crítico
                            </Badge>
                          ) : (
                            <Badge variant="default">Normal</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projecao">
          <Card>
            <CardHeader>
              <CardTitle>Projeção de Necessidade de Compra (30 dias)</CardTitle>
              <CardDescription>
                Produtos abaixo do estoque mínimo com projeção de investimento necessário
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projecoes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>Nenhum produto abaixo do estoque mínimo</p>
                  <p className="text-sm">Todos os produtos estão com estoque adequado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Estoque Atual</TableHead>
                      <TableHead>Estoque Mín.</TableHead>
                      <TableHead>Consumo Médio/Dia</TableHead>
                      <TableHead>Qtd. Necessária</TableHead>
                      <TableHead>Valor Projetado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projecoes.map((proj) => (
                      <TableRow key={proj.produto_id}>
                        <TableCell className="font-medium">
                          {proj.produto_nome}
                        </TableCell>
                        <TableCell>{formatarNumero(proj.estoque_atual)}</TableCell>
                        <TableCell>{formatarNumero(proj.estoque_minimo)}</TableCell>
                        <TableCell>{formatarNumero(proj.consumo_medio_diario)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatarNumero(proj.quantidade_necessaria)}
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          {formatarMoeda(proj.valor_projetado)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={5} className="text-right font-bold">
                        Total Projetado:
                      </TableCell>
                      <TableCell className="font-bold text-green-600 text-lg">
                        {formatarMoeda(valorProjecaoCompra)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Produto */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Produto</DialogTitle>
            <DialogDescription>Cadastre um novo produto no estoque</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="codigo">Código *</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) =>
                      setFormData({ ...formData, codigo: e.target.value })
                    }
                    required
                  />
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
                  <Label htmlFor="categoria_id">Categoria</Label>
                  <Select
                    value={formData.categoria_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoria_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unidade_medida">Unidade de Medida *</Label>
                  <Select
                    value={formData.unidade_medida}
                    onValueChange={(value) =>
                      setFormData({ ...formData, unidade_medida: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UN">Unidade (UN)</SelectItem>
                      <SelectItem value="KG">Quilograma (KG)</SelectItem>
                      <SelectItem value="L">Litro (L)</SelectItem>
                      <SelectItem value="CX">Caixa (CX)</SelectItem>
                      <SelectItem value="PC">Peça (PC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
                  <Input
                    id="estoque_minimo"
                    type="number"
                    step="0.01"
                    value={formData.estoque_minimo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estoque_minimo: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="estoque_atual">Estoque Atual</Label>
                  <Input
                    id="estoque_atual"
                    type="number"
                    step="0.01"
                    value={formData.estoque_atual}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estoque_atual: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="preco_custo_medio">Preço de Custo (R$)</Label>
                  <Input
                    id="preco_custo_medio"
                    type="number"
                    step="0.01"
                    value={formData.preco_custo_medio}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preco_custo_medio: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="preco_venda">Preço de Venda (R$)</Label>
                  <Input
                    id="preco_venda"
                    type="number"
                    step="0.01"
                    value={formData.preco_venda}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preco_venda: parseFloat(e.target.value) || 0,
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

      {/* Dialog Movimentação */}
      <Dialog open={movimentacaoDialogOpen} onOpenChange={setMovimentacaoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentar Estoque</DialogTitle>
            <DialogDescription>
              Registre entradas, saídas ou ajustes de estoque
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMovimentacaoSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="mov_produto_id">Produto *</Label>
                <Select
                  value={movimentacaoFormData.produto_id}
                  onValueChange={(value) =>
                    setMovimentacaoFormData({
                      ...movimentacaoFormData,
                      produto_id: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {produtosFiltrados.map((prod) => (
                      <SelectItem key={prod.id} value={prod.id}>
                        {prod.codigo} - {prod.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tipo_movimentacao">Tipo de Movimentação *</Label>
                <Select
                  value={movimentacaoFormData.tipo_movimentacao}
                  onValueChange={(value) =>
                    setMovimentacaoFormData({
                      ...movimentacaoFormData,
                      tipo_movimentacao: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrada">Entrada</SelectItem>
                    <SelectItem value="Saída">Saída</SelectItem>
                    <SelectItem value="Ajuste">Ajuste</SelectItem>
                    <SelectItem value="Perda">Perda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantidade">Quantidade *</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    step="0.01"
                    value={movimentacaoFormData.quantidade}
                    onChange={(e) =>
                      setMovimentacaoFormData({
                        ...movimentacaoFormData,
                        quantidade: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="preco_unitario">Preço Unitário (R$)</Label>
                  <Input
                    id="preco_unitario"
                    type="number"
                    step="0.01"
                    value={movimentacaoFormData.preco_unitario}
                    onChange={(e) =>
                      setMovimentacaoFormData({
                        ...movimentacaoFormData,
                        preco_unitario: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="data_movimentacao">Data *</Label>
                <Input
                  id="data_movimentacao"
                  type="date"
                  value={movimentacaoFormData.data_movimentacao}
                  onChange={(e) =>
                    setMovimentacaoFormData({
                      ...movimentacaoFormData,
                      data_movimentacao: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="documento">Documento (NF, etc)</Label>
                <Input
                  id="documento"
                  value={movimentacaoFormData.documento}
                  onChange={(e) =>
                    setMovimentacaoFormData({
                      ...movimentacaoFormData,
                      documento: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="observacao">Observação</Label>
                <Input
                  id="observacao"
                  value={movimentacaoFormData.observacao}
                  onChange={(e) =>
                    setMovimentacaoFormData({
                      ...movimentacaoFormData,
                      observacao: e.target.value,
                    })
                  }
                />
              </div>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">Valor Total da Movimentação:</p>
                <p className="text-2xl font-bold">
                  {formatarMoeda(
                    movimentacaoFormData.quantidade *
                    movimentacaoFormData.preco_unitario
                  )}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMovimentacaoDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Registrar Movimentação</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}