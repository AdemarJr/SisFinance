import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  const sizeMap = {
    sm: { icon: 24, text: 'text-lg' },
    md: { icon: 32, text: 'text-xl' },
    lg: { icon: 40, text: 'text-2xl' },
    xl: { icon: 56, text: 'text-4xl' },
  };

  const { icon, text } = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Círculo externo gradiente */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        
        {/* Círculo de fundo */}
        <circle cx="50" cy="50" r="48" fill="url(#logoGradient)" />
        
        {/* Símbolo $ estilizado */}
        <path
          d="M50 20 L50 25 M50 75 L50 80"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
        />
        
        {/* S superior */}
        <path
          d="M 38 35 Q 38 28 45 28 L 55 28 Q 62 28 62 35 Q 62 42 55 42 L 45 42"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* S inferior */}
        <path
          d="M 62 65 Q 62 72 55 72 L 45 72 Q 38 72 38 65 Q 38 58 45 58 L 55 58"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Gráfico de crescimento (detalhes decorativos) */}
        <path
          d="M 72 82 L 78 75 L 84 78 L 90 68"
          stroke="url(#accentGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="90" cy="68" r="2" fill="#10b981" />
      </svg>
      
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-bold ${text} bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent`}>
            SisFinance
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            Gestão Empresarial
          </span>
        </div>
      )}
    </div>
  );
}

export function LogoIcon({ className = '', size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      
      <circle cx="50" cy="50" r="48" fill="url(#logoGradient)" />
      
      <path
        d="M50 20 L50 25 M50 75 L50 80"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
      />
      
      <path
        d="M 38 35 Q 38 28 45 28 L 55 28 Q 62 28 62 35 Q 62 42 55 42 L 45 42"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      
      <path
        d="M 62 65 Q 62 72 55 72 L 45 72 Q 38 72 38 65 Q 38 58 45 58 L 55 58"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      
      <path
        d="M 72 82 L 78 75 L 84 78 L 90 68"
        stroke="url(#accentGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="90" cy="68" r="2" fill="#10b981" />
    </svg>
  );
}
