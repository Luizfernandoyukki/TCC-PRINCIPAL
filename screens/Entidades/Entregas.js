// EntregasScreen.js
import { useEffect, useState } from 'react';
import {
  Alert, FlatList, Image, Modal, Pressable,
  StatusBar, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import { databaseService } from '../../services/localDatabase';
import styles from '../../styles/EstilosdeEntidade';

const FILTER_OPTIONS = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'estoque', label: 'Produto' },
  { key: 'data_saida', label: 'Data de Saída' },
  { key: 'status', label: 'Status' },
  { key: 'veiculo', label: 'Veículo' },
  { key: 'funcionario', label: 'Responsável' }
];

const STATUS_OPTIONS = [
  { key: 'preparacao', label: 'Em preparação' },
  { key: 'a_caminho', label: 'A caminho' },
  { key: 'entregue', label: 'Entregue' },
  { key: 'devolucao_parcial', label: 'Devolução parcial' },
  { key: 'rejeitada', label: 'Rejeitada' }
];

export default function EntregasScreen({ navigation }) {
  const [entregas, setEntregas] = useState([]);
  const [filteredEntregas, setFilteredEntregas] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEntrega, setModalEntrega] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('cliente');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedEntrega, setSelectedEntrega] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [observacaoStatus, setObservacaoStatus] = useState('');

  useEffect(() => {
    fetchEntregas();
  }, []);

  useEffect(() => {
    handleFilter();
  }, [search, filterType, entregas]);

  const fetchEntregas = async () => {
    setLoading(true);
    try {
      const netState = await NetInfo.fetch();

      if (netState.isConnected) {
        const { data, error } = await supabase
          .from('entrega')
          .select(`
            *,
            estoque:estoque_id(*),
            cliente:cliente_id(*),
            veiculo:veiculo_id(*),
            funcionario:funcionario_id(*)
          `)
          .order('data_saida', { ascending: false });

        if (error) throw error;
        setEntregas(data);
        setFilteredEntregas(data);
      } else {
        const entregasResult = await databaseService.select('entrega');
        const estoquesResult = await databaseService.select('estoque');
        const clientesResult = await databaseService.select('cliente');
        const veiculosResult = await databaseService.select('veiculo');
        const funcionariosResult = await databaseService.select('funcionario');

        const entregasCompletas = entregasResult.data.map(entrega => ({
          ...entrega,
          estoque: estoquesResult.data.find(e => e.id === entrega.estoque_id) || {},
          cliente: clientesResult.data.find(c => c.id === entrega.cliente_id) || {},
          veiculo: veiculosResult.data.find(v => v.id === entrega.veiculo_id) || {},
          funcionario: funcionariosResult.data.find(f => f.id === entrega.funcionario_id) || {}
        }));

        setEntregas(entregasCompletas);
        setFilteredEntregas(entregasCompletas);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar entregas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    if (!search.trim()) return setFilteredEntregas(entregas);
    const lowerSearch = search.toLowerCase();
    const filtered = entregas.filter(entrega => {
      switch (filterType) {
        case 'cliente': 
          return entrega.cliente?.nome?.toLowerCase().includes(lowerSearch);
        case 'estoque': 
          return entrega.estoque?.nome?.toLowerCase().includes(lowerSearch);
        case 'data_saida': 
          return entrega.data_saida?.toLowerCase().includes(lowerSearch);
        case 'status': 
          return entrega.status?.toLowerCase().includes(lowerSearch);
        case 'veiculo': 
          return entrega.veiculo?.modelo?.toLowerCase().includes(lowerSearch) || 
                 entrega.veiculo?.placa?.toLowerCase().includes(lowerSearch);
        case 'funcionario': 
          return entrega.funcionario?.nome?.toLowerCase().includes(lowerSearch);
        default: 
          return true;
      }
    });
    setFilteredEntregas(filtered);
  };

  const renderStatus = (status) => {
    const statusMap = {
      preparacao: 'Em preparação',
      a_caminho: 'A caminho',
      entregue: 'Entregue',
      devolucao_parcial: 'Devolução parcial',
      rejeitada: 'Rejeitada'
    };
    return <Text style={styles.itemDetail}>Status: {statusMap[status] || status}</Text>;
  };

  const openModal = (entrega) => {
    setModalEntrega(entrega);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalEntrega(null);
  };

  const deleteEntrega = async (id) => {
    Alert.alert('Excluir Entrega', 'Tem certeza que deseja excluir esta entrega?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', 
        onPress: async () => {
          try {
            await databaseService.delete('entrega', 'id = ?', [id]);
            await fetchEntregas();
          } catch (error) {
            Alert.alert('Erro', 'Falha ao excluir entrega: ' + error.message);
          }
        }
      }
    ]);
  };

  const openStatusModal = (entrega) => {
    setSelectedEntrega(entrega);
    setNewStatus(entrega.status);
    setObservacaoStatus('');
    setStatusModalVisible(true);
  };

  const updateStatus = async () => {
    if (!newStatus) {
      Alert.alert('Erro', 'Selecione um status válido');
      return;
    }

    setStatusLoading(true);
    try {
      const updateData = { 
        status: newStatus,
        observacao: observacaoStatus || null
      };

      if (newStatus === 'entregue') {
        updateData.data_entrega = new Date().toISOString();
      }

      const netState = await NetInfo.fetch();
      
      if (netState.isConnected) {
        const { error } = await supabase
          .from('entrega')
          .update(updateData)
          .eq('id', selectedEntrega.id);
        
        if (error) throw error;
      } else {
        await databaseService.update('entrega', updateData, selectedEntrega.id);
      }

      Alert.alert('Sucesso', 'Status atualizado com sucesso!');
      setStatusModalVisible(false);
      fetchEntregas();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar status: ' + error.message);
    } finally {
      setStatusLoading(false);
    }
  };

  const renderEntregaItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.itemBox} 
        onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.estoque?.nome || 'Produto'}</Text>
          <Text style={styles.itemSubtitle}>Cliente: {item.cliente?.nome || '---'}</Text>
        </View>

        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            {renderStatus(item.status)}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantidade:</Text>
              <Text style={styles.detailValue}>{item.quantidade}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nº Série:</Text>
              <Text style={styles.detailValue}>{item.estoque?.numero_serie || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Data Saída:</Text>
              <Text style={styles.detailValue}>{item.data_saida}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Data Entrega:</Text>
              <Text style={styles.detailValue}>{item.data_entrega || '---'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Veículo:</Text>
              <Text style={styles.detailValue}>
                {item.veiculo?.modelo || ''} - {item.veiculo?.placa || ''}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Responsável:</Text>
              <Text style={styles.detailValue}>{item.funcionario?.nome || ''}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Obs:</Text>
              <Text style={styles.detailValue}>{item.observacao || '---'}</Text>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => openModal(item)}
              >
                <Text style={styles.actionButtonText}>Visualizar Completo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#000000' }]}
                onPress={() => openStatusModal(item)}
              >
                <Text style={styles.actionButtonText}>Alterar Status</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.editButton]}
                onPress={() => navigation.navigate('EditarEntrega', { entregaId: item.id })}
              >
                <Text style={styles.actionButtonText}>Editar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => deleteEntrega(item.id)}
              >
                <Text style={styles.actionButtonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#043b57" barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={require('../../Assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipalADM')}>
            <Image source={require('../../Assets/ADM.png')} style={styles.alerta} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('CadastroEntrega')}>
          <Text style={styles.buttonText}>+ NOVA ENTREGA</Text>
        </TouchableOpacity>

        <View style={styles.navbarFiltro}>
          <Text style={styles.filtroLabel}>Filtrar por {filterType}:</Text>
          <View style={styles.filtroInputContainer}>
            <Image source={require('../../Assets/search.png')} style={styles.filtroIcon} resizeMode="contain" />
            <TextInput
              style={styles.filtroInput}
              placeholder={`Digite o ${filterType}`}
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#888"
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setFilterMenuVisible(true)}
              style={{ paddingHorizontal: 12, justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 24, fontWeight: 'bold' }}>⋮</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          transparent
          animationType="fade"
          visible={filterMenuVisible}
          onRequestClose={() => setFilterMenuVisible(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}
            onPress={() => setFilterMenuVisible(false)}
          >
            <View style={{
              position: 'absolute',
              right: 20,
              top: 80,
              backgroundColor: '#fff',
              borderRadius: 8,
              elevation: 5,
              paddingVertical: 8,
              minWidth: 140,
            }}>
              {FILTER_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                    backgroundColor: filterType === option.key ? '#043b57' : 'transparent'
                  }}
                  onPress={() => {
                    setFilterType(option.key);
                    setFilterMenuVisible(false);
                    setSearch('');
                  }}
                >
                  <Text style={{
                    color: filterType === option.key ? '#fff' : '#000',
                    fontWeight: 'bold'
                  }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {loading ? (
          <Text style={styles.emptyText}>Carregando entregas...</Text>
        ) : (
          <FlatList
            data={filteredEntregas}
            keyExtractor={item => item.id.toString()}
            renderItem={renderEntregaItem}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma entrega encontrada.</Text>}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Modal de visualização completa */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Dados da Entrega</Text>
          {modalEntrega && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Produto:</Text>
                <Text style={styles.detailValue}>{modalEntrega.estoque?.nome || '-'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantidade:</Text>
                <Text style={styles.detailValue}>{modalEntrega.quantidade}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nº Série:</Text>
                <Text style={styles.detailValue}>{modalEntrega.estoque?.numero_serie || '-'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cliente:</Text>
                <Text style={styles.detailValue}>{modalEntrega.cliente?.nome || '-'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={styles.detailValue}>{renderStatus(modalEntrega.status)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Data Saída:</Text>
                <Text style={styles.detailValue}>{modalEntrega.data_saida}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Data Entrega:</Text>
                <Text style={styles.detailValue}>{modalEntrega.data_entrega || '-'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Veículo:</Text>
                <Text style={styles.detailValue}>
                  {modalEntrega.veiculo?.modelo || ''} - {modalEntrega.veiculo?.placa || ''}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Responsável:</Text>
                <Text style={styles.detailValue}>{modalEntrega.funcionario?.nome || ''}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Observações:</Text>
                <Text style={styles.detailValue}>{modalEntrega.observacao || '-'}</Text>
              </View>
              
              <TouchableOpacity onPress={closeModal} style={[styles.button, { marginTop: 20 }]}>
                <Text style={styles.buttonText}>Fechar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>

      {/* Modal de alteração de status */}
      <Modal
        visible={statusModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.content}>
            <Text style={styles.modalTitle}>Alterar Status da Entrega</Text>
            
            <Text style={styles.label}>Selecione o novo status:</Text>
            <View style={styles.radioGroup}>
              {STATUS_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.radioButton,
                    newStatus === option.key && styles.radioButtonSelected
                  ]}
                  onPress={() => setNewStatus(option.key)}
                >
                  <Text style={[
                    styles.radioText,
                    newStatus === option.key && styles.radioTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Observações:</Text>
            <TextInput
              style={styles.input}
              value={observacaoStatus}
              onChangeText={setObservacaoStatus}
              placeholder="Adicione observações (opcional)"
              multiline
            />

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#ccc' }]}
                onPress={() => setStatusModalVisible(false)}
                disabled={statusLoading}
              >
                <Text style={styles.actionButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#043b57' }]}
                onPress={updateStatus}
                disabled={statusLoading}
              >
                <Text style={styles.actionButtonText}>
                  {statusLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}