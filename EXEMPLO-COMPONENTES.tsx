/**
 * EXEMPLO DE PÁGINA USANDO O NOVO DESIGN SYSTEM
 * 
 * Este arquivo demonstra como usar corretamente todos os componentes
 * responsivos do SisFinance Multientidade
 */

import { useState } from 'react';
import { Users, Plus, Download, Search, Edit, Trash2 } from 'lucide-react';
import {
  PageHeader,
  StatsCard,
  DataTable,
  EmptyState,
  LoadingState,
  FormField,
  FormRow,
  ButtonGroup,
  Button,
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  Badge,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './components';

// Tipo de exemplo
interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  status: 'ativo' | 'inativo';
  valorTotal: number;
}

export function ExemploPageResponsiva() {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dados de exemplo
  const clientes: Cliente[] = [
    {
      id: '1',
      nome: 'João Silva',
      email: 'joao@email.com',
      telefone: '(11) 99999-9999',
      status: 'ativo',
      valorTotal: 15000,
    },
    {
      id: '2',
      nome: 'Maria Santos',
      email: 'maria@email.com',
      telefone: '(11) 88888-8888',
      status: 'ativo',
      valorTotal: 25000,
    },
  ];

  // Filtrar clientes
  const clientesFiltrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Colunas da tabela
  const columns = [
    {
      header: 'Nome',
      accessor: 'nome' as keyof Cliente,
    },
    {
      header: 'Email',
      accessor: 'email' as keyof Cliente,
      mobileHidden: true, // Oculta em mobile
    },
    {
      header: 'Telefone',
      accessor: 'telefone' as keyof Cliente,
      mobileHidden: true,
    },
    {
      header: 'Status',
      accessor: (row: Cliente) => (
        <Badge variant={row.status === 'ativo' ? 'success' : 'destructive'}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Valor Total',
      accessor: (row: Cliente) => (
        <span className="font-semibold">
          {row.valorTotal.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
        </span>
      ),
    },
    {
      header: 'Ações',
      accessor: (row: Cliente) => (
        <ButtonGroup variant="horizontal">
          <Button size="sm" variant="ghost">
            <Edit className="size-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </ButtonGroup>
      ),
    },
  ];

  if (loading) {
    return <LoadingState message="Carregando clientes..." />;
  }

  return (
    <div className="space-y-6 w-full">
      {/* 1. PAGEHEADER - Sempre use para cabeçalhos */}
      <PageHeader
        icon={Users}
        title="Clientes"
        description="Gerencie os clientes da sua empresa"
        actions={
          <>
            <Button variant="outline" size="default">
              <Download className="size-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Novo Cliente
            </Button>
          </>
        }
      />

      {/* 2. STATSCARDS - Use grid responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Clientes"
          value={clientes.length}
          description="Cadastrados no sistema"
          icon={Users}
          iconColor="text-primary"
        />
        <StatsCard
          title="Clientes Ativos"
          value={clientes.filter((c) => c.status === 'ativo').length}
          icon={Users}
          iconColor="text-success"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Valor Total"
          value={clientes
            .reduce((acc, c) => acc + c.valorTotal, 0)
            .toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          icon={Users}
          iconColor="text-info"
        />
        <StatsCard
          title="Ticket Médio"
          value={(
            clientes.reduce((acc, c) => acc + c.valorTotal, 0) / clientes.length
          ).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
          icon={Users}
          iconColor="text-warning"
        />
      </div>

      {/* 3. CARD COM FILTROS E TABELA */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Lista de Clientes</CardTitle>
            
            {/* Busca responsiva */}
            <div className="w-full sm:w-64">
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 4. DATATABLE - Tabela que vira cards em mobile */}
          <DataTable
            data={clientesFiltrados}
            columns={columns}
            onRowClick={(row) => console.log('Cliente clicado:', row)}
            emptyState={
              <EmptyState
                icon={Users}
                title="Nenhum cliente encontrado"
                description="Tente ajustar os filtros ou cadastre um novo cliente"
                action={{
                  label: 'Novo Cliente',
                  onClick: () => setDialogOpen(true),
                }}
              />
            }
          />
        </CardContent>
      </Card>

      {/* 5. DIALOG COM FORMULÁRIO RESPONSIVO */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* FormRow empilha em mobile */}
            <FormRow cols={2}>
              <FormField label="Nome Completo" required>
                <Input placeholder="Digite o nome" />
              </FormField>
              <FormField label="Email">
                <Input type="email" placeholder="email@exemplo.com" />
              </FormField>
            </FormRow>

            <FormRow cols={2}>
              <FormField label="Telefone">
                <Input placeholder="(00) 00000-0000" />
              </FormField>
              <FormField label="Status" required>
                <Input placeholder="Ativo" />
              </FormField>
            </FormRow>

            <FormRow cols={1}>
              <FormField label="Observações">
                <Input placeholder="Informações adicionais..." />
              </FormField>
            </FormRow>
          </div>

          <DialogFooter>
            {/* ButtonGroup empilha botões em mobile */}
            <ButtonGroup variant="responsive" align="end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setDialogOpen(false)}>
                Salvar Cliente
              </Button>
            </ButtonGroup>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * CHECKLIST DE RESPONSIVIDADE:
 * 
 * ✅ PageHeader com botões que empilham em mobile
 * ✅ Grid de StatsCards responsivo (1/2/4 colunas)
 * ✅ Input de busca com largura adaptável
 * ✅ DataTable que vira cards em mobile
 * ✅ FormRow que empilha campos em mobile
 * ✅ ButtonGroup que empilha botões em mobile
 * ✅ Sem larguras fixas - tudo usa w-full
 * ✅ Textos quebram linha automaticamente
 * ✅ Padding responsivo (p-4 sm:p-6 lg:p-8)
 * ✅ Zero scroll horizontal
 * 
 * TESTE EM:
 * - Mobile: 375px (iPhone SE)
 * - Tablet: 768px (iPad)
 * - Desktop: 1024px+
 */
