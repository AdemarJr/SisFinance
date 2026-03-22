import { ReactNode } from 'react';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * ResponsiveContainer - Container que garante que o conteúdo não cause scroll horizontal
 * e se adapta bem a todos os tamanhos de tela
 */
export function ResponsiveContainer({ children, className = '' }: ResponsiveContainerProps) {
  return (
    <div className={`w-full max-w-full overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 2 | 3 | 4 | 6 | 8;
  className?: string;
}

/**
 * ResponsiveGrid - Grid responsivo que se adapta a diferentes tamanhos de tela
 */
export function ResponsiveGrid({ 
  children, 
  cols = { default: 1, sm: 2, lg: 3, xl: 4 },
  gap = 4,
  className = '' 
}: ResponsiveGridProps) {
  const getColClass = () => {
    const classes: string[] = [`grid-cols-${cols.default || 1}`];
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    return classes.join(' ');
  };

  return (
    <div className={`grid ${getColClass()} gap-${gap} w-full ${className}`}>
      {children}
    </div>
  );
}
