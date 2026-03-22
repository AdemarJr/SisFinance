import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { formatarMoeda, formatarData } from '../../lib/formatters';
import { RefreshCw, Settings, Download, CheckCircle, AlertCircle, Package, ShoppingCart, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { useEmpresa } from '../contexts/EmpresaContext';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b1600651`;

interface Config {
  empresa_id: string;
  api_key: string;
  project_id: string;
  company_id?: string;
  nome_integracao: string;
  sincronizacao_ativa: boolean;
  ultima_sincronizacao: string | null;
}

export default function IntegracaoPyrouStock() {
  const { empresaSelecionada } = useEmpresa();
  const [config, setConfig] = useState<Config | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);

  const [produtos, setProdutos] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [caixas, setCaixas] = useState([]);

  const [formData, setFormData] = useState({
    api_key: '',
    project_id: '',
    company_id: '',
    nome_integracao: 'PyrouStock',
  });

  const [syncPeriod, setSyncPeriod] = useState({
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    if (empresaSelecionada) {
      loadConfig();
    }
  }, [empresaSelecionada]);

  const loadConfig = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/pyroustock/config/${empresaSelecionada}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });

      const resultado = await response.json();

      if (resultado.success) {
        setConfig(resultado.data);
        // Se configurado, carregar dados
        loadDados();
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDados = async () => {
    try {
      const [prodRes, vendRes, caixaRes] = await Promise.all([
        fetch(`${API_BASE}/pyroustock/produtos/${empresaSelecionada}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }),
        fetch(`${API_BASE}/pyroustock/vendas/${empresaSelecionada}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }),
        fetch(`${API_BASE}/pyroustock/caixas/${empresaSelecionada}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }),
      ]);

      const [prodData, vendData, caixaData] = await Promise.all([
        prodRes.json(),
        vendRes.json(),
        caixaRes.json(),
      ]);

      if (prodData.success) setProdutos(prodData.data);
      if (vendData.success) setVendas(vendData.data);
      if (caixaData.success) setCaixas(caixaData.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE}/pyroustock/config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa_id: empresaSelecionada,
          ...formData,
        }),
      });

      const resultado = await response.json();

      if (resultado.success) {
        toast.success('Configuração salva com sucesso!');
        setConfigDialogOpen(false);
        loadConfig();
      } else {
        toast.error(resultado.error);
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    }
  };

  const handleSync = async () => {
    if (!config) {
      toast.error('Configure a integração primeiro');
      return;
    }

    try {
      setSyncing(true);

      const response = await fetch(`${API_BASE}/pyroustock/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa_id: empresaSelecionada,
          start_date: syncPeriod.start_date || undefined,
          end_date: syncPeriod.end_date || undefined,
        }),
      });

      const resultado = await response.json();

      if (resultado.success) {
        toast.success(resultado.message);
        loadConfig();
        loadDados();
      } else {
        toast.error(resultado.error);
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar dados');
    } finally {
      setSyncing(false);
    }
  };

  const handleImport = async (tipo: 'vendas' | 'caixas') => {
    try {
      setImporting(true);

      const response = await fetch(`${API_BASE}/pyroustock/importar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa_id: empresaSelecionada,
          tipo,
        }),
      });

      const resultado = await response.json();

      if (resultado.success) {
        toast.success(resultado.message);
      } else {
        toast.error(resultado.error);
      }
    } catch (error) {
      console.error('Erro ao importar:', error);
      toast.error('Erro ao importar dados');
    } finally {
      setImporting(false);
    }
  };

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Package className="h-8 w-8" />
            Integração PyrouStock
          </h1>
          <p className="text-muted-foreground mt-1">
            Sincronize vendas, estoque e caixa do PyrouStock
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setConfigDialogOpen(true)} variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Configurar
          </Button>
          {config && (
            <Button onClick={handleSync} disabled={syncing}>
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sincronizar
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Status da Configuração */}
      <Card>
        <CardHeader>
          <CardTitle>Status da Integração</CardTitle>
        </CardHeader>
        <CardContent>
          {config ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-medium">Configuração Ativa</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome da Integração</p>
                  <p className="font-medium">{config.nome_integracao}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">API Key</p>
                  <p className="font-medium">{config.api_key}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Project ID</p>
                  <p className="font-medium">{config.project_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última Sincronização</p>
                  <p className="font-medium">
                    {config.ultima_sincronizacao
                      ? new Date(config.ultima_sincronizacao).toLocaleString('pt-BR')
                      : 'Nunca'}
                  </p>
                </div>
              </div>

              {/* Período de Sincronização */}
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium mb-2">Período de Sincronização (Opcional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Data Inicial</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={syncPeriod.start_date}
                      onChange={(e) => setSyncPeriod({ ...syncPeriod, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">Data Final</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={syncPeriod.end_date}
                      onChange={(e) => setSyncPeriod({ ...syncPeriod, end_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-orange-600 dark:text-orange-400 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma configuração encontrada</p>
              <Button onClick={() => setConfigDialogOpen(true)} className="mt-4">
                Configurar Integração
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dados Sincronizados */}
      {config && (
        <Tabs defaultValue="produtos">
          <TabsList>
            <TabsTrigger value="produtos">
              <Package className="mr-2 h-4 w-4" />
              Produtos ({produtos.length})
            </TabsTrigger>
            <TabsTrigger value="vendas">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Vendas ({vendas.length})
            </TabsTrigger>
            <TabsTrigger value="caixas">
              <CreditCard className="mr-2 h-4 w-4" />
              Caixas ({caixas.length})
            </TabsTrigger>
          </TabsList>

          {/* Produtos */}
          <TabsContent value="produtos">
            <Card>
              <CardHeader>
                <CardTitle>Produtos do PyrouStock</CardTitle>
                <CardDescription>
                  Produtos sincronizados do PyrouStock (somente visualização)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {produtos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p>Nenhum produto sincronizado</p>
                    <p className="text-sm">Clique em "Sincronizar" para importar dados</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Estoque</TableHead>
                        <TableHead>Custo Médio</TableHead>
                        <TableHead>Valor Estoque</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtos.map((prod: any) => (
                        <TableRow key={prod.id}>
                          <TableCell className="font-medium">{prod.codigo}</TableCell>
                          <TableCell>{prod.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{prod.categoria}</Badge>
                          </TableCell>
                          <TableCell>
                            {prod.estoque_atual} {prod.unidade_medida}
                          </TableCell>
                          <TableCell>{formatarMoeda(prod.preco_custo_medio)}</TableCell>
                          <TableCell className="font-bold">
                            {formatarMoeda(prod.valor_estoque)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendas */}
          <TabsContent value="vendas">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Vendas do PyrouStock</CardTitle>
                    <CardDescription>
                      Vendas sincronizadas - pronto para importar
                    </CardDescription>
                  </div>
                  {vendas.length > 0 && (
                    <Button
                      onClick={() => handleImport('vendas')}
                      disabled={importing}
                      variant="outline"
                    >
                      {importing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Importar para Contas a Receber
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {vendas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p>Nenhuma venda sincronizada</p>
                    <p className="text-sm">Clique em "Sincronizar" para importar dados</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Recibo</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Lucro</TableHead>
                        <TableHead>Pagamento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendas.map((venda: any) => (
                        <TableRow key={venda.id}>
                          <TableCell>
                            {new Date(venda.data).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell className="font-medium">
                            #{venda.numero_recibo || venda.id.slice(-8)}
                          </TableCell>
                          <TableCell>{venda.usuario_nome || '-'}</TableCell>
                          <TableCell className="font-bold">
                            {formatarMoeda(venda.total)}
                          </TableCell>
                          <TableCell className="text-green-600 dark:text-green-400 font-medium">
                            {formatarMoeda(venda.lucro_total)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{venda.forma_pagamento}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Caixas */}
          <TabsContent value="caixas">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Fechamentos de Caixa</CardTitle>
                    <CardDescription>
                      Fechamentos sincronizados - pronto para importar
                    </CardDescription>
                  </div>
                  {caixas.length > 0 && (
                    <Button
                      onClick={() => handleImport('caixas')}
                      disabled={importing}
                      variant="outline"
                    >
                      {importing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Importar para Lançamentos
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {caixas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p>Nenhum fechamento sincronizado</p>
                    <p className="text-sm">Clique em "Sincronizar" para importar dados</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data Fechamento</TableHead>
                        <TableHead>Duração</TableHead>
                        <TableHead>Saldo Abertura</TableHead>
                        <TableHead>Total Vendas</TableHead>
                        <TableHead>Saldo Fechamento</TableHead>
                        <TableHead>Diferença</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {caixas.map((caixa: any) => (
                        <TableRow key={caixa.id}>
                          <TableCell>
                            {new Date(caixa.data_fechamento).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell>{caixa.duracao}</TableCell>
                          <TableCell>{formatarMoeda(caixa.saldo_abertura)}</TableCell>
                          <TableCell className="font-bold">
                            {formatarMoeda(caixa.total_vendas)}
                          </TableCell>
                          <TableCell>{formatarMoeda(caixa.saldo_fechamento)}</TableCell>
                          <TableCell>
                            <span
                              className={
                                caixa.diferenca === 0
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }
                            >
                              {formatarMoeda(caixa.diferenca)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Dialog de Configuração */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Integração PyrouStock</DialogTitle>
            <DialogDescription>
              Configure a API Key do PyrouStock para sincronizar dados
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveConfig}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome_integracao">Nome da Integração</Label>
                <Input
                  id="nome_integracao"
                  value={formData.nome_integracao}
                  onChange={(e) =>
                    setFormData({ ...formData, nome_integracao: e.target.value })
                  }
                  placeholder="Ex: PyrouStock Matriz"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="api_key">API Key *</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="pyroustock_integration_xxxxxxxxxxxxx"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Gere uma API Key no PyrouStock → Integrações
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project_id">Project ID do PyrouStock *</Label>
                <Input
                  id="project_id"
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  placeholder="xxxxx"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Encontre em: https://[PROJECT_ID].supabase.co
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company_id">Company ID (Opcional)</Label>
                <Input
                  id="company_id"
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  placeholder="UUID da empresa no PyrouStock"
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco se a API Key já está vinculada a uma empresa
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfigDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar Configuração</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
