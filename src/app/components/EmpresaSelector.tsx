import { Building2 } from 'lucide-react';
import { useEmpresa } from '../contexts/EmpresaContext';

export function EmpresaSelector() {
  const { empresaSelecionada, setEmpresaSelecionada, empresas, empresaAtual, loading } = useEmpresa();

  if (loading || empresas.length <= 1) {
    return null;
  }

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-6 flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 flex-shrink-0">
        <Building2 className="size-5 text-primary" />
        <span className="text-sm font-medium text-foreground">Empresa:</span>
      </div>
      <select
        value={empresaSelecionada}
        onChange={(e) => setEmpresaSelecionada(e.target.value)}
        className="flex-1 min-w-[200px] px-3 py-2 bg-card border border-input rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">🏢 Todas as Empresas</option>
        {empresas.map((empresa) => (
          <option key={empresa.id} value={empresa.id}>
            {empresa.nome}
          </option>
        ))}
      </select>
      {empresaAtual && (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          CNPJ: {empresaAtual.cnpj}
        </span>
      )}
    </div>
  );
}
