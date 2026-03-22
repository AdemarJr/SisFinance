import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b1600651`;

export interface PyrouStockConfig {
  empresa_id: string;
  api_key: string;
  project_id: string;
  company_id?: string;
  nome_integracao: string;
}

export interface SyncParams {
  empresa_id: string;
  start_date?: string;
  end_date?: string;
}

export interface ImportParams {
  empresa_id: string;
  tipo: 'vendas' | 'caixas';
  ids?: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
  message?: string;
}

class PyrouStockClient {
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`Erro na requisição ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Salvar configuração da API Key do PyrouStock
   */
  async saveConfig(config: PyrouStockConfig): Promise<ApiResponse> {
    return this.request('/pyroustock/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  /**
   * Buscar configuração existente
   */
  async getConfig(empresaId: string): Promise<ApiResponse> {
    return this.request(`/pyroustock/config/${empresaId}`);
  }

  /**
   * Sincronizar dados do PyrouStock
   * @param params - Parâmetros de sincronização (empresa_id, datas opcionais)
   */
  async sync(params: SyncParams): Promise<ApiResponse> {
    return this.request('/pyroustock/sync', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Listar produtos sincronizados
   */
  async getProducts(empresaId: string): Promise<ApiResponse> {
    return this.request(`/pyroustock/produtos/${empresaId}`);
  }

  /**
   * Listar vendas sincronizadas
   */
  async getSales(empresaId: string): Promise<ApiResponse> {
    return this.request(`/pyroustock/vendas/${empresaId}`);
  }

  /**
   * Listar fechamentos de caixa sincronizados
   */
  async getCashiers(empresaId: string): Promise<ApiResponse> {
    return this.request(`/pyroustock/caixas/${empresaId}`);
  }

  /**
   * Importar dados sincronizados para o sistema financeiro
   * @param params - Tipo (vendas/caixas) e IDs opcionais
   */
  async import(params: ImportParams): Promise<ApiResponse> {
    return this.request('/pyroustock/importar', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

// Exportar singleton
export const pyrouStockClient = new PyrouStockClient();
