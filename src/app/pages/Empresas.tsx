import { useState, useEffect } from 'react';
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
import { Building2, Plus, Edit, Trash2 } from 'lucide-react';
import { db } from '../../lib/db';
import { toast } from 'sonner';

interface Empresa {
  id: string;
  nome: string;
  tipo: string;
  cnpj?: string;
  endereco?: string;
  responsavel?: string;
  ativo: boolean;
}

export default function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'Unidade Operacional',
    cnpj: '',
    endereco: '',
    responsavel: '',
    ativo: true,
  });

  useEffect(() => {
    loadEmpresas();
  }, []);

  const loadEmpresas = async () => {
    try {
      const { data } = await db.from('empresas').select('*');
      setEmpresas(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast.error('Erro ao carregar empresas');
    }
  };

  const handleOpenDialog = (empresa?: Empresa) => {
    if (empresa) {
      setEditingEmpresa(empresa);
      setFormData({
        nome: empresa.nome,
        tipo: empresa.tipo,
        cnpj: empresa.cnpj || '',
        endereco: empresa.endereco || '',
        responsavel: empresa.responsavel || '',
        ativo: empresa.ativo,
      });
    } else {
      setEditingEmpresa(null);
      setFormData({
        nome: '',
        tipo: 'Unidade Operacional',
        cnpj: '',
        endereco: '',
        responsavel: '',
        ativo: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingEmpresa) {
        const { error } = await db
          .from('empresas')
          .update(formData)
          .eq('id', editingEmpresa.id);
        
        if (error) throw error;
        toast.success('Empresa atualizada com sucesso!');
      } else {
        const { error } = await db.from('empresas').insert(formData);
        
        if (error) throw error;
        toast.success('Empresa criada com sucesso!');
      }

      setDialogOpen(false);
      loadEmpresas();
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      toast.error('Erro ao salvar empresa');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta empresa?')) {
      try {
        const { error } = await db.from('empresas').delete().eq('id', id);
        
        if (error) throw error;
        toast.success('Empresa excluída com sucesso!');
        loadEmpresas();
      } catch (error) {
        console.error('Erro ao excluir empresa:', error);
        toast.error('Erro ao excluir empresa');
      }
    }
  };

  const getTipoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      'Unidade Operacional': 'bg-blue-100 text-blue-800',
      Holding: 'bg-purple-100 text-purple-800',
      Franquia: 'bg-green-100 text-green-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Empresas / Unidades
          </h1>
          <p className="text-muted-foreground">
            Gerencie as unidades operacionais, holdings e franquias
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Empresa
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Empresas</CardTitle>
          <CardDescription>
            Todas as empresas e unidades cadastradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.map((empresa) => (
                <TableRow key={empresa.id}>
                  <TableCell className="font-medium">{empresa.nome}</TableCell>
                  <TableCell>
                    <Badge className={getTipoBadge(empresa.tipo)}>
                      {empresa.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>{empresa.cnpj || '-'}</TableCell>
                  <TableCell>{empresa.responsavel || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={empresa.ativo ? 'default' : 'secondary'}>
                      {empresa.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(empresa)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(empresa.id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEmpresa ? 'Editar Empresa' : 'Nova Empresa'}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações da empresa/unidade
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
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
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unidade Operacional">
                      Unidade Operacional
                    </SelectItem>
                    <SelectItem value="Holding">Holding</SelectItem>
                    <SelectItem value="Franquia">Franquia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) =>
                    setFormData({ ...formData, cnpj: e.target.value })
                  }
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) =>
                    setFormData({ ...formData, endereco: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) =>
                    setFormData({ ...formData, responsavel: e.target.value })
                  }
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
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}