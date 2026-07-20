/**
 * Formata número no padrão brasileiro (1.234,56)
 * @param value - Valor numérico a ser formatado
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns String formatada no padrão brasileiro
 */
function toFiniteNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function formatarNumero(value: number | string, decimals: number = 2): string {
  return toFiniteNumber(value).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formata valor monetário no padrão brasileiro (R$ 1.234,56)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada com símbolo de moeda
 */
export function formatarMoeda(value: number | string | null | undefined): string {
  return toFiniteNumber(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Formata porcentagem no padrão brasileiro (12,34%)
 * @param value - Valor numérico (0-100)
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns String formatada com símbolo de porcentagem
 */
export function formatarPorcentagem(value: number | string, decimals: number = 2): string {
  return `${formatarNumero(toFiniteNumber(value), decimals)}%`;
}

/**
 * Formata números inteiros no padrão brasileiro (1.234)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada sem casas decimais
 */
export function formatarInteiro(value: number | string): string {
  return toFiniteNumber(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/** Converte valor do Postgres (string/number) para número finito. */
export function asNumber(value: unknown): number {
  return toFiniteNumber(value);
}

/**
 * Formata data (YYYY-MM-DD ou ISO) para exibição pt-BR (dd/mm/aaaa).
 * Evita Invalid Date quando o Postgres/API devolve timestamp ISO.
 */
export function formatarData(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const raw = value instanceof Date ? value.toISOString() : String(value);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '-';
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR');
}

/** Normaliza para input type="date" (YYYY-MM-DD). */
export function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return '';
  const raw = value instanceof Date ? value.toISOString() : String(value);
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}
