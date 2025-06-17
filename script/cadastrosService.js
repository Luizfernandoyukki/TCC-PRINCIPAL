import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../config/supabaseClient';
import { insertLocalData } from '../services/localDatabase';

/** Função auxiliar para verificar conexão */
const isOnline = async () => {
  const status = await NetInfo.fetch();
  return status.isConnected;
};

/** Validação genérica */
const validar = (dados, camposObrigatorios) => {
  for (const campo of camposObrigatorios) {
    if (!dados[campo]) {
      throw new Error(`O campo obrigatório "${campo}" não foi preenchido.`);
    }
  }
};

/** Template de cadastro */
const cadastrar = async (tabela, dados, camposObrigatorios) => {
  validar(dados, camposObrigatorios);
  const online = await isOnline();

  if (online) {
    const { data, error } = await supabase.from(tabela).insert([dados]);
    if (error) throw new Error(error.message);
    return { origem: 'supabase', data };
  } else {
    await insertLocalData(tabela, dados);
    return { origem: 'local', data: dados };
  }
};

// ==== ENTIDADES INDIVIDUAIS ====

export const cadastrarCliente = async (dados) =>
  cadastrar('cliente', dados, ['nome', 'tipo']);

export const cadastrarVeiculo = async (dados) =>
  cadastrar('veiculo', dados, ['placa', 'modelo']);

export const cadastrarEstoque = async (dados) =>
  cadastrar('estoque', dados, ['nome', 'quantidade', 'valor', 'data_aquisicao', 'funcionario_id']);

export const cadastrarPedido = async (dados) =>
  cadastrar('pedido', dados, ['estoque_id', 'quantidade', 'cliente_id', 'criado_por']);

export const cadastrarEntrega = async (dados) =>
  cadastrar('entrega', dados, ['estoque_id', 'quantidade', 'cliente_id', 'veiculo_id', 'funcionario_id']);

export const cadastrarEntrada = async (dados) =>
  cadastrar('entrada', dados, ['estoque_id', 'quantidade', 'responsavel_id']);

export const cadastrarSaida = async (dados) =>
  cadastrar('saida', dados, ['tipo', 'estoque_id', 'quantidade', 'funcionario_id']);

export const cadastrarDevolucao = async (dados) =>
  cadastrar('devolucao', dados, ['estoque_id', 'quantidade', 'motivo', 'responsavel_id']);

export const cadastrarRota = async (dados) =>
  cadastrar('rota', dados, ['nome', 'destino', 'horario_partida', 'veiculo_id', 'funcionario_id']);

export const cadastrarBalanco = async (dados) =>
  cadastrar('balanco', dados, ['nome', 'data', 'periodo', 'tipo']);
