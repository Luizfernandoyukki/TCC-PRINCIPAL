import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import { databaseService } from '../../services/localDatabase';
import styles from '../../styles/EstilosdeEntidade';

export default function EstoqueScreen({ navigation }) {
  const [itens, setItens] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useLocalData, setUseLocalData] = useState(false);
  const [filterText, setFilterText] = useState('');

  // Estados para o modal de movimentação
  const [modalVisible, setModalVisible] = useState(false);
  const [movimentacaoItem, setMovimentacaoItem] = useState(null);
  const [movimentacaoTipo, setMovimentacaoTipo] = useState('saida'); // 'entrada' ou 'saida'
  const [movimentacaoQuantidade, setMovimentacaoQuantidade] = useState('');
  const [movimentacaoMotivo, setMovimentacaoMotivo] = useState('');
  const [movimentacaoLoading, setMovimentacaoLoading] = useState(false);

  useEffect(() => {
    fetchItensEstoque();
  }, [useLocalData]);

  const fetchItensEstoque = async () => {
    setLoading(true);
    try {
      if (useLocalData) {
        const estoqueData = await databaseService.select('estoque');
        const clientes = await databaseService.select('cliente');
        const funcionarios = await databaseService.select('funcionario');

        const data = estoqueData.map(item => ({
          ...item,
          cliente: clientes.find(c => c.id === item.cliente_id) || null,
          funcionario: funcionarios.find(f => f.id === item.funcionario_id) || null
        }));

        data.sort((a, b) => a.nome.localeCompare(b.nome));
        setItens(data || []);
      } else {
        const { data, error } = await supabase
          .from('estoque')
          .select(`
            id,
            nome,
            quantidade,
            quantidade_reservada,
            numero_serie,
            tipo,
            data_validade,
            valor,
            modalidade,
            observacao,
            disponivel_geral,
            cliente:cliente_id(nome),
            funcionario:funcionario_id(nome)
          `)
          .order('nome', { ascending: true });

        if (error) throw error;
        setItens(data || []);
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
      if (!useLocalData) setUseLocalData(true);
    } finally {
      setLoading(false);
    }
  };

  const calcularDisponivel = (quantidade, reservada) => quantidade - reservada;

  const handleDeleteItem = async (id) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja remover este item do estoque?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          onPress: async () => {
            try {
              if (useLocalData) {
                await databaseService.deleteById('estoque', id);
              } else {
                const { error } = await supabase.from('estoque').delete().eq('id', id);
                if (error) throw error;
              }
              fetchItensEstoque();
            } catch (error) {
              if (
                error.message.includes('violates foreign key constraint') ||
                error.message.includes('entrada_estoque_id_fkey')
              ) {
                Alert.alert(
                  'Erro ao excluir',
                  'Este item está vinculado a entradas no sistema e não pode ser removido.'
                );
              } else {
                Alert.alert('Erro', `Não foi possível remover o item: ${error.message}`);
              }
            }
          }
        }
      ]
    );
  };

  // Abre o modal e inicializa estados
  const abrirModalMovimentacao = (item) => {
    setMovimentacaoItem(item);
    setMovimentacaoTipo('saida');
    setMovimentacaoQuantidade('');
    setMovimentacaoMotivo('');
    setModalVisible(true);
  };

  // Função para salvar movimentação (simplificada, pode ser expandida)
  const confirmarMovimentacao = async () => {
    if (!movimentacaoQuantidade || isNaN(movimentacaoQuantidade) || Number(movimentacaoQuantidade) <= 0) {
      Alert.alert('Erro', 'Informe uma quantidade válida para movimentar.');
      return;
    }

    const qtd = Number(movimentacaoQuantidade);
    const item = movimentacaoItem;
    setMovimentacaoLoading(true);

    try {
      let novaQuantidade = item.quantidade;

      if (movimentacaoTipo === 'entrada') {
        novaQuantidade += qtd;
      } else if (movimentacaoTipo === 'saida') {
        if (qtd > calcularDisponivel(item.quantidade, item.quantidade_reservada)) {
          Alert.alert('Erro', 'Quantidade de saída maior que a disponível.');
          setMovimentacaoLoading(false);
          return;
        }
        novaQuantidade -= qtd;
      }

      // Dados atualizados do estoque
      const updateData = { quantidade: novaQuantidade };

      if (useLocalData) {
        await databaseService.update('estoque', updateData, item.id);
      } else {
        const { error } = await supabase.from('estoque').update(updateData).eq('id', item.id);
        if (error) throw error;
      }

      Alert.alert('Sucesso', 'Movimentação realizada com sucesso!');
      setModalVisible(false);
      fetchItensEstoque();
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setMovimentacaoLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const disponivel = calcularDisponivel(item.quantidade, item.quantidade_reservada);
    const estaDisponivel = disponivel > 0 && item.disponivel_geral;
    const estaVencido = item.data_validade && new Date(item.data_validade) < new Date();

    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity
          style={[
            styles.itemBox,
            !item.disponivel_geral && { backgroundColor: '#ffeeee' },
            estaVencido && { borderLeftWidth: 4, borderLeftColor: '#F44336' }
          ]}
          onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
        >
          <View style={styles.itemHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.nome}</Text>
              <Text style={styles.itemSubtitle}>
                {item.tipo || 'Sem tipo definido'}
                {useLocalData && ' 📱'}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={[
                  styles.itemQuantity,
                  { color: estaDisponivel ? '#4CAF50' : '#F44336' }
                ]}
              >
                {disponivel} disp.
              </Text>
              {!item.disponivel_geral && <Text style={styles.itemStatus}>INDISPONÍVEL</Text>}
            </View>
          </View>

          {expandedId === item.id && (
            <View style={styles.expandedContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total:</Text>
                <Text style={styles.detailValue}>{item.quantidade}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reservado:</Text>
                <Text style={styles.detailValue}>{item.quantidade_reservada}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Disponível:</Text>
                <Text style={[styles.detailValue, { color: estaDisponivel ? '#4CAF50' : '#F44336' }]}>
                  {disponivel}
                </Text>
              </View>

              {item.valor && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Valor unitário:</Text>
                  <Text style={styles.detailValue}>R$ {item.valor.toFixed(2)}</Text>
                </View>
              )}

              {item.numero_serie && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>N° Série:</Text>
                  <Text style={styles.detailValue}>{item.numero_serie}</Text>
                </View>
              )}

              {item.data_validade && (
                <View style={styles.detailRow}>
                  <Text
                    style={[styles.detailValue, estaVencido && { color: '#F44336' }]}
                  >
                    {new Date(item.data_validade).toLocaleDateString('pt-BR')}
                    {estaVencido && ' (VENCIDO)'}
                  </Text>
                </View>
              )}

              {item.cliente && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cliente:</Text>
                  <Text style={styles.detailValue}>{item.cliente.nome}</Text>
                </View>
              )}

              {item.funcionario && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Responsável:</Text>
                  <Text style={styles.detailValue}>{item.funcionario.nome}</Text>
                </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.viewButton]}
                  onPress={() => abrirModalMovimentacao(item)} // Abre modal aqui
                >
                  <Text style={styles.actionButtonText}>Movimentar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => navigation.navigate('EditarEstoque', { itemId: item.id })}
                >
                  <Text style={styles.actionButtonText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteItem(item.id)}
                >
                  <Text style={styles.actionButtonText}>Remover</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const [filtroNome, setFiltroNome] = useState('');

  const itensFiltrados = itens.filter(item =>
    item.nome.toLowerCase().includes(filtroNome.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#043b57" barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={require('../../Assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={styles.headerRightActions}>
            <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipalEXP')}>
              <Image
                source={require('../../Assets/EXP.png')}
                style={styles.alerta}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('CadastroEstoque')}>
          <Text style={styles.buttonText}>CADASTRAR ITEM</Text>
        </TouchableOpacity>

        <View style={styles.navbarFiltro}>
          <Text style={styles.filtroLabel}>Filtrar por nome:</Text>
          <View style={styles.filtroInputContainer}>
            <Image
              source={require('../../Assets/search.png')}
              style={styles.filtroIcon}
              resizeMode="contain"
            />
            <TextInput
              style={styles.filtroInput}
              placeholder="Digite o nome do item"
              value={filtroNome}
              onChangeText={setFiltroNome}
              placeholderTextColor="#888"
            />
          </View>
        </View>

        {loading ? (
          <Text style={styles.emptyText}>Carregando itens...</Text>
        ) : (
          <FlatList
            data={itensFiltrados}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum item cadastrado.</Text>}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Modal de Movimentação */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          padding: 20
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 10,
            padding: 20,
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
              Movimentar Estoque: {movimentacaoItem?.nome}
            </Text>

            <View style={{ flexDirection: 'row', marginBottom: 15 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 10,
                  backgroundColor: movimentacaoTipo === 'entrada' ? '#4CAF50' : '#ddd',
                  borderRadius: 5,
                  marginRight: 5,
                }}
                onPress={() => setMovimentacaoTipo('entrada')}
              >
                <Text style={{ color: movimentacaoTipo === 'entrada' ? 'white' : 'black', textAlign: 'center' }}>
                  Entrada
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 10,
                  backgroundColor: movimentacaoTipo === 'saida' ? '#F44336' : '#ddd',
                  borderRadius: 5,
                  marginLeft: 5,
                }}
                onPress={() => setMovimentacaoTipo('saida')}
              >
                <Text style={{ color: movimentacaoTipo === 'saida' ? 'white' : 'black', textAlign: 'center' }}>
                  Saída
                </Text>
              </TouchableOpacity>
            </View>

            <Text>Quantidade:</Text>
            <TextInput
              keyboardType="numeric"
              value={movimentacaoQuantidade}
              onChangeText={setMovimentacaoQuantidade}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                padding: Platform.OS === 'ios' ? 15 : 10,
                marginBottom: 15,
                borderRadius: 5,
              }}
            />

            <Text>Motivo (opcional):</Text>
            <TextInput
              value={movimentacaoMotivo}
              onChangeText={setMovimentacaoMotivo}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                padding: Platform.OS === 'ios' ? 15 : 10,
                marginBottom: 20,
                borderRadius: 5,
              }}
              multiline
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#ccc',
                  padding: 12,
                  borderRadius: 5,
                  marginRight: 10,
                }}
                disabled={movimentacaoLoading}
              >
                <Text style={{ textAlign: 'center' }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmarMovimentacao}
                style={{
                  flex: 1,
                  backgroundColor: movimentacaoLoading ? '#999' : '#043b57',
                  padding: 12,
                  borderRadius: 5,
                }}
                disabled={movimentacaoLoading}
              >
                <Text style={{ color: 'white', textAlign: 'center' }}>
                  {movimentacaoLoading ? 'Processando...' : 'Confirmar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
