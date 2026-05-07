import { ReactNode, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireSuperAdmin?: boolean;
}

export function ProtectedRoute({ children, requireSuperAdmin = false }: ProtectedRouteProps) {
  const { user, loading, isSuperAdmin } = useAuth();
  const location = useLocation();

  const loginRedirect = useMemo(() => {
    const path = `${location.pathname}${location.search}${location.hash}`;
    const q = path ? `?returnTo=${encodeURIComponent(path)}` : '';
    return `/login${q}`;
  }, [location.pathname, location.search, location.hash]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={loginRedirect} replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
