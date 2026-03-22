import { ReactNode } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface FormFieldProps {
  label: string;
  id?: string;
  error?: string;
  required?: boolean;
  children?: ReactNode;
  className?: string;
}

/**
 * FormField - Componente de campo de formulário com label e erro
 */
export function FormField({ 
  label, 
  id, 
  error, 
  required, 
  children, 
  className = '' 
}: FormFieldProps) {
  return (
    <div className={`space-y-2 w-full ${className}`}>
      <Label htmlFor={id} className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

interface FormRowProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

/**
 * FormRow - Linha de formulário responsiva
 * Em mobile sempre empilha, em desktop divide em colunas
 */
export function FormRow({ children, cols = 2, className = '' }: FormRowProps) {
  const colsClass = cols === 1 ? 'sm:grid-cols-1' 
    : cols === 2 ? 'sm:grid-cols-2'
    : cols === 3 ? 'sm:grid-cols-3'
    : 'sm:grid-cols-4';

  return (
    <div className={`grid grid-cols-1 ${colsClass} gap-4 w-full ${className}`}>
      {children}
    </div>
  );
}
