import { apiFetch, parseApiResponse } from './api-config';

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

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
  message?: string;
}

const LEGACY_BASE = `${API_BASE}/make-server-b1600651`;

class PyrouStockClient {
  private async request(endpoint: string, options: RequestInit = {}): Promise<ApiResponse> {
    const response = await apiFetch(`/make-server-b1600651${endpoint}`, options);
    const data = await parseApiResponse(response);

    if (!response.ok) {
      throw new Error(data.error || `HTTP Error: ${response.status}`);
    }

    return data;
  }

  async saveConfig(config: PyrouStockConfig): Promise<ApiResponse> {
    return this.request('/pyroustock/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getConfig(empresaId: string): Promise<ApiResponse> {
    return this.request(`/pyroustock/config/${empresaId}`);
  }

  async sync(params: SyncParams): Promise<ApiResponse> {
    return this.request('/pyroustock/sync', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getProducts(empresaId: string): Promise<ApiResponse> {
    return this.request(`/pyroustock/produtos/${empresaId}`);
  }

  async getSales(empresaId: string): Promise<ApiResponse> {
    return this.request(`/pyroustock/vendas/${empresaId}`);
  }

  async getCashiers(empresaId: string): Promise<ApiResponse> {
    return this.request(`/pyroustock/caixas/${empresaId}`);
  }

  async importData(params: ImportParams): Promise<ApiResponse> {
    return this.request('/pyroustock/importar', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

export const pyrouStockClient = new PyrouStockClient();
export { LEGACY_BASE };
