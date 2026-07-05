import { apiFetch } from './api-config';

export type FilterOp = 'eq' | 'gte' | 'lte' | 'in';

export interface DbFilter {
  op: FilterOp;
  column: string;
  value: unknown;
}

export interface DbQueryPayload {
  table: string;
  type: 'select' | 'insert' | 'update' | 'delete';
  select?: string;
  data?: unknown;
  filters?: DbFilter[];
  order?: { column: string; ascending?: boolean };
  single?: boolean;
}

type DbResult = { data: unknown; error: unknown };

async function runQuery(payload: DbQueryPayload): Promise<DbResult> {
  const response = await apiFetch('/db/query', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.json();
}

async function runRpc(functionName: string, params?: Record<string, unknown>): Promise<DbResult> {
  const response = await apiFetch('/db/rpc', {
    method: 'POST',
    body: JSON.stringify({ function: functionName, params }),
  });
  return response.json();
}

class SelectBuilder implements PromiseLike<DbResult> {
  private payload: DbQueryPayload;

  constructor(table: string, select: string) {
    this.payload = { table, type: 'select', select, filters: [] };
  }

  eq(column: string, value: unknown) {
    this.payload.filters!.push({ op: 'eq', column, value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.payload.filters!.push({ op: 'gte', column, value });
    return this;
  }

  lte(column: string, value: unknown) {
    this.payload.filters!.push({ op: 'lte', column, value });
    return this;
  }

  in(column: string, values: unknown[]) {
    this.payload.filters!.push({ op: 'in', column, value: values });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.payload.order = { column, ascending: options?.ascending ?? true };
    return this;
  }

  single() {
    this.payload.single = true;
    return this;
  }

  then<TResult1 = DbResult, TResult2 = never>(
    onfulfilled?: ((value: DbResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return runQuery(this.payload).then(onfulfilled, onrejected);
  }
}

class MutateBuilder implements PromiseLike<DbResult> {
  private payload: DbQueryPayload;

  constructor(table: string, type: 'update' | 'delete', data?: unknown) {
    this.payload = { table, type, data, filters: [] };
  }

  eq(column: string, value: unknown) {
    this.payload.filters!.push({ op: 'eq', column, value });
    return this;
  }

  then<TResult1 = DbResult, TResult2 = never>(
    onfulfilled?: ((value: DbResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return runQuery(this.payload).then(onfulfilled, onrejected);
  }
}

class InsertBuilder implements PromiseLike<DbResult> {
  constructor(private payload: DbQueryPayload) {}

  then<TResult1 = DbResult, TResult2 = never>(
    onfulfilled?: ((value: DbResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return runQuery(this.payload).then(onfulfilled, onrejected);
  }
}

export function createApiDbClient() {
  return {
    from: (table: string) => ({
      select: (columns = '*') => new SelectBuilder(table, columns),
      insert: (data: unknown) =>
        new InsertBuilder({ table, type: 'insert', data }),
      update: (data: unknown) => ({
        eq: (column: string, value: unknown) => new MutateBuilder(table, 'update', data).eq(column, value),
      }),
      delete: () => ({
        eq: (column: string, value: unknown) => new MutateBuilder(table, 'delete').eq(column, value),
      }),
    }),
    rpc: (functionName: string, params?: Record<string, unknown>) => runRpc(functionName, params),
  };
}

export type ApiDbClient = ReturnType<typeof createApiDbClient>;
