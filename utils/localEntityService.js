import { databaseService } from '../services/localDatabase';

/**
 * Busca todos os registros de uma entidade localmente.
 * @param {string} entidade Nome da tabela (ex: 'estoque', 'pedido', 'cliente', etc)
 * @param {object} [filtros] Filtros opcionais (ex: { status: 'ativo' })
 * @returns {Promise<Array>}
 */
export async function getAllLocal(entidade, filtros = {}) {
  let data = await databaseService.getAll(entidade);
  // Aplica filtros simples (igualdade)
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== '' && valor !== undefined && valor !== null) {
      data = data.filter(item => item[chave] === valor);
    }
  });
  return data;
}

/**
 * Busca um registro pelo ID localmente.
 * @param {string} entidade Nome da tabela
 * @param {string|number} id
 * @returns {Promise<Object|null>}
 */
export async function getByIdLocal(entidade, id) {
  const data = await databaseService.getAll(entidade);
  return data.find(item => item.id === id) || null;
}