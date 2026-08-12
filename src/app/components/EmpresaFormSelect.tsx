import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface EmpresaFormSelectProps {
  value: string;
  onChange: (id: string) => void;
  empresas: { id: string; nome: string }[];
  id?: string;
}

export function EmpresaFormSelect({
  value,
  onChange,
  empresas,
  id = 'empresa_id',
}: EmpresaFormSelectProps) {
  if (empresas.length === 0) return null;

  if (empresas.length === 1) {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>Empresa</Label>
        <p
          id={id}
          className="text-sm text-muted-foreground px-3 py-2 border border-input rounded-lg bg-muted/30"
        >
          {empresas[0].nome}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Empresa *</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Selecione uma empresa" />
        </SelectTrigger>
        <SelectContent>
          {empresas.map((emp) => (
            <SelectItem key={emp.id} value={String(emp.id)}>
              {emp.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
