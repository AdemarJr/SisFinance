import { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { toast } from 'sonner';

interface DatabaseStatus {
  planos_assinatura: boolean;
  clientes_sistema: boolean;
  empresas: boolean;
  admin_exists: boolean;
}

export function DatabaseSetup() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b1600651/db-status`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.success && data.status) {
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      toast.error('Erro ao verificar status do banco de dados');
    } finally {
      setChecking(false);
    }
  };

  const initializeDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b1600651/init-db`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      
      if (data.success) {
        toast.success('Banco de dados inicializado com sucesso!');
        await checkStatus();
      } else {
        if (data.sql_file) {
          toast.error(
            'Tabelas não encontradas. Execute o SQL manualmente no Supabase Dashboard.',
            { duration: 8000 }
          );
        } else {
          toast.error(data.message || 'Erro ao inicializar banco de dados');
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar:', error);
      toast.error('Erro ao inicializar banco de dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      checkStatus();
    }
  }, [open]);

  const allGood = status && 
    status.planos_assinatura && 
    status.clientes_sistema && 
    status.empresas;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Database className="size-4" />
        Configuração do BD
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="size-5" />
              Configuração do Banco de Dados
            </DialogTitle>
            <DialogDescription>
              Verifique o status das tabelas do sistema e inicialize se necessário
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground mb-3">Status das Tabelas</h3>
              
              {checking ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : status ? (
                <div className="space-y-2">
                  <StatusItem 
                    label="Planos de Assinatura" 
                    status={status.planos_assinatura} 
                  />
                  <StatusItem 
                    label="Clientes do Sistema" 
                    status={status.clientes_sistema} 
                  />
                  <StatusItem 
                    label="Empresas" 
                    status={status.empresas} 
                  />
                  <StatusItem 
                    label="Super Admin" 
                    status={status.admin_exists}
                    optional 
                  />
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Clique em "Verificar Status" para começar
                </div>
              )}
            </div>

            {/* Status Geral */}
            {status && (
              <div className={`p-4 rounded-lg border ${
                allGood 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}>
                <div className="flex items-start gap-3">
                  {allGood ? (
                    <CheckCircle className="size-5 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="size-5 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {allGood 
                        ? 'Sistema configurado corretamente!' 
                        : 'Algumas tabelas estão faltando'}
                    </p>
                    {!allGood && (
                      <p className="text-xs mt-1 opacity-90">
                        Execute a inicialização automática ou o SQL manualmente no Supabase Dashboard
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Instruções Manuais */}
            {status && !allGood && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Configuração Manual
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Se a inicialização automática não funcionar, execute o SQL manualmente:
                </p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Abra o Supabase Dashboard</li>
                  <li>Vá para SQL Editor</li>
                  <li>Abra o arquivo <code className="text-foreground bg-muted px-1 py-0.5 rounded">/supabase-auth-saas-setup.sql</code></li>
                  <li>Execute o SQL completo</li>
                </ol>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={checkStatus}
                disabled={checking}
                className="flex-1"
              >
                {checking ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-4 mr-2" />
                    Verificar Status
                  </>
                )}
              </Button>

              <Button
                onClick={initializeDatabase}
                disabled={loading || checking || allGood}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Inicializando...
                  </>
                ) : (
                  <>
                    <Database className="size-4 mr-2" />
                    Inicializar Banco
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatusItem({ 
  label, 
  status, 
  optional = false 
}: { 
  label: string; 
  status: boolean; 
  optional?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
      <span className="text-sm text-foreground">
        {label}
        {optional && <span className="text-xs text-muted-foreground ml-2">(opcional)</span>}
      </span>
      {status ? (
        <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
      )}
    </div>
  );
}
