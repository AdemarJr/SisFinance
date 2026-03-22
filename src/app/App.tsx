import { BrowserRouter } from 'react-router';
import { AppRoutes } from './routes.tsx';
import { Toaster } from 'sonner';
import { useEffect } from 'react';
import { EmpresaProvider } from './contexts/EmpresaContext';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  useEffect(() => {
    // Atualiza o título da página
    document.title = 'SisFinance - Sistema de Gestão Financeira Multientidade';
    
    // Atualiza o favicon
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement || document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = '/favicon.svg';
    if (!document.querySelector("link[rel~='icon']")) {
      document.head.appendChild(link);
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <EmpresaProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </EmpresaProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}