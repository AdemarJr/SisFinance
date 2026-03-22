import { Link } from 'react-router';
import { Home, AlertCircle } from 'lucide-react';

export function NotFound() {
  return (
    <div className="flex items-center justify-center h-full bg-slate-50">
      <div className="text-center">
        <AlertCircle className="size-20 text-slate-300 mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-xl text-slate-600 mb-8">Página não encontrada</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Home className="size-4" />
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
