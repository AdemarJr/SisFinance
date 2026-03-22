import { ReactNode } from 'react';

interface ButtonGroupProps {
  children: ReactNode;
  className?: string;
  variant?: 'horizontal' | 'vertical' | 'responsive';
  align?: 'start' | 'center' | 'end' | 'stretch';
}

/**
 * ButtonGroup - Componente para agrupar botões com layout responsivo
 * 
 * @param variant 
 *  - 'horizontal': Sempre em linha
 *  - 'vertical': Sempre empilhado
 *  - 'responsive': Empilhado em mobile, linha em desktop (padrão)
 * 
 * @param align
 *  - 'start': Alinhamento no início
 *  - 'center': Centralizado
 *  - 'end': Alinhamento no final
 *  - 'stretch': Largura total (padrão para mobile)
 */
export function ButtonGroup({ 
  children, 
  className = '',
  variant = 'responsive',
  align = 'stretch'
}: ButtonGroupProps) {
  const variantClasses = {
    horizontal: 'flex-row flex-wrap',
    vertical: 'flex-col',
    responsive: 'flex-col sm:flex-row'
  };

  const alignClasses = {
    start: 'items-start sm:items-center justify-start',
    center: 'items-center justify-center',
    end: 'items-end sm:items-center justify-end',
    stretch: 'items-stretch sm:items-center'
  };

  return (
    <div 
      className={`
        flex gap-2 w-full
        ${variantClasses[variant]}
        ${alignClasses[align]}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
}
