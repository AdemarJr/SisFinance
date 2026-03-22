import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Users,
  Building2,
  Wallet,
  BarChart3,
  TrendingUp,
  Menu,
  Package,
  Calculator,
  UserCog,
  LogOut,
  X,
  Crown,
  Download,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Logo, LogoIcon } from './Logo';
import { useEmpresa } from '../contexts/EmpresaContext';
import { EmpresaSelector } from './EmpresaSelector';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, isSuperAdmin, clienteSistema } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Detectar tamanho da tela
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fechar sidebar ao clicar em link no mobile
  const handleLinkClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    
    setLoggingOut(true);
    try {
      await signOut();
      toast.success('Logout realizado com sucesso!');
      navigate('/login');
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    } finally {
      setLoggingOut(false);
    }
  };

  const menuItems = [
    { path: '/app', label: 'Dashboard', icon: LayoutDashboard },
    ...(isSuperAdmin ? [{ path: '/app/admin', label: 'Administração', icon: Crown, divider: false }] : []),
    { path: '/app/empresas', label: 'Empresas', icon: Building2, divider: true },
    { path: '/app/lancamentos', label: 'Lançamentos', icon: FileText },
    { path: '/app/contas-pagar', label: 'Contas a Pagar', icon: CreditCard },
    { path: '/app/contas-receber', label: 'Contas a Receber', icon: TrendingUp },
    { path: '/app/fechamento-caixa', label: 'Fechamento de Caixa', icon: Calculator, divider: true },
    { path: '/app/clientes', label: 'Clientes', icon: Users },
    { path: '/app/fornecedores', label: 'Fornecedores', icon: Building2 },
    { path: '/app/funcionarios', label: 'Funcionários', icon: UserCog },
    { path: '/app/estoque', label: 'Estoque', icon: Package },
    { path: '/app/integracao-pyrou-stock', label: 'Integração PyrouStock', icon: Download, divider: true },
    { path: '/app/contas', label: 'Contas Financeiras', icon: Wallet },
    { path: '/app/relatorios', label: 'Relatórios', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background w-full max-w-full">
      {/* Overlay para mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isMobile ? 'w-64' : sidebarOpen ? 'w-64' : 'w-20'}
          bg-card border-r border-border
          transition-all duration-300 ease-in-out
          flex flex-col
          max-w-[80vw]
        `}
      >
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          {(sidebarOpen || isMobile) ? (
            <Link 
              to="/" 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              onClick={handleLinkClick}
            >
              <LogoIcon size={32} />
              <div className="flex flex-col leading-none">
                <span className="text-lg font-bold text-primary">SisFinance</span>
                <span className="text-xs text-muted-foreground">Multientidade</span>
              </div>
            </Link>
          ) : (
            <Link 
              to="/" 
              className="hover:opacity-80 transition-opacity mx-auto"
            >
              <LogoIcon size={28} />
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-accent rounded-lg transition-colors lg:flex hidden"
            aria-label="Toggle Sidebar"
          >
            <Menu className="size-5" />
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-accent rounded-lg transition-colors lg:hidden"
            aria-label="Fechar Menu"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <div key={item.path}>
                <Link
                  to={item.path}
                  onClick={handleLinkClick}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-lg 
                    transition-all duration-200
                    ${isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                    ${!sidebarOpen && !isMobile ? 'justify-center' : ''}
                  `}
                  title={!sidebarOpen && !isMobile ? item.label : ''}
                >
                  <Icon className="size-5 flex-shrink-0" />
                  {(sidebarOpen || isMobile) && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
                {item.divider && (sidebarOpen || isMobile) && (
                  <div className="h-px bg-border my-2" />
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border space-y-2 bg-card/50 backdrop-blur-sm">
          {/* Informações do Usuário */}
          {(sidebarOpen || isMobile) && clienteSistema && (
            <div className="px-4 py-2 bg-accent/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-sm font-medium truncate">
                  {clienteSistema.nome_completo}
                </div>
                {isSuperAdmin && <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {clienteSistema.email}
              </div>
              {clienteSistema.plano && (
                <div className="text-xs text-muted-foreground mt-1">
                  Plano: {clienteSistema.plano.nome}
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className={`
              flex items-center gap-3 px-4 py-2.5 rounded-lg 
              transition-all duration-200 w-full
              text-destructive hover:bg-destructive/10
              ${!sidebarOpen && !isMobile ? 'justify-center' : ''}
              ${loggingOut ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={!sidebarOpen && !isMobile ? 'Sair do Sistema' : ''}
          >
            <LogOut className="size-5 flex-shrink-0" />
            {(sidebarOpen || isMobile) && (
              <span className="text-sm font-medium">
                {loggingOut ? 'Saindo...' : 'Sair do Sistema'}
              </span>
            )}
          </button>
          {(sidebarOpen || isMobile) && (
            <div className="text-xs text-muted-foreground text-center py-2">
              Sistema Multientidade v2.0
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
        {/* Header Mobile */}
        <header className="h-16 bg-card border-b border-border px-4 flex items-center justify-between lg:hidden sticky top-0 z-30 backdrop-blur-sm bg-card/95 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-accent rounded-lg transition-colors flex-shrink-0"
            aria-label="Abrir Menu"
          >
            <Menu className="size-6" />
          </button>
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <LogoIcon size={28} />
            <span className="font-bold text-primary truncate">SisFinance</span>
          </Link>
          <div className="w-10 flex-shrink-0" /> {/* Spacer para centralizar logo */}
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto w-full">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full min-w-0">
            <EmpresaSelector />
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}