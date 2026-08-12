/** Empresa padrão para formulários: filtro global ou única empresa cadastrada. */
export function defaultEmpresaId(
  empresaSelecionada: string,
  empresas: { id: string }[]
): string {
  if (empresaSelecionada) return empresaSelecionada;
  if (empresas.length === 1) return String(empresas[0].id);
  return '';
}

/** Resolve empresa_id no submit (form → global → única empresa). */
export function resolveEmpresaIdForSave(
  formEmpresaId: string,
  empresaSelecionada: string,
  empresas: { id: string }[]
): string {
  return formEmpresaId || defaultEmpresaId(empresaSelecionada, empresas);
}
