/**
 * Formata número no padrão brasileiro (1.234,56)
 * @param value - Valor numérico a ser formatado
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns String formatada no padrão brasileiro
 */
export function formatarNumero(value: number, decimals: number = 2): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formata valor monetário no padrão brasileiro (R$ 1.234,56)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada com símbolo de moeda
 */
export function formatarMoeda(value: number): string {
  return value.toLocaleString('pt-BR', {
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
export function formatarPorcentagem(value: number, decimals: number = 2): string {
  return `${formatarNumero(value, decimals)}%`;
}

/**
 * Formata números inteiros no padrão brasileiro (1.234)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada sem casas decimais
 */
export function formatarInteiro(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
