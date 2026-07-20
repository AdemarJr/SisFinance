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
