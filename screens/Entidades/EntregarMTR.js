import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import { databaseService } from '../../services/localDatabase';
import styles from '../../styles/EstilosdeEntidade';

const FILTER_OPTIONS = [
  { key: 'id', label: 'ID' },
  { key: 'status', label: 'Status' },
  { key: 'observacao', label: 'Observação' },
];

export default function EntregarScreen({ navigation, route }) {
  const { despachoId } = route.params;

  const [entregas, setEntregas] = useState([]);
  const [filteredEntregas, setFilteredEntregas] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEntrega, setModalEntrega] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('id');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  useEffect(() => {
    fetchEntregas();
  }, []);

  useEffect(() => {
    handleFilter();
  }, [search, filterType, entregas]);

  async function fetchEntregas() {
    setLoading(true);
    try {
      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        const { data, error } = await supabase
          .from('entrega')
          .select('*')
          .eq('despacho_id', despachoId)
          .order('data_saida', { ascending: false });

        if (error) throw error;
        setEntregas(data || []);
        setFilteredEntregas(data || []);
      } else {
        const localData = await databaseService.select('entrega');
        if (!localData.success) throw new Error('Erro ao buscar entregas locais');
        const filteredLocal = localData.data.filter((e) => e.despacho_id === despachoId);
        setEntregas(filteredLocal);
        setFilteredEntregas(filteredLocal);
      }
    } catch (e) {
      Alert.alert('Erro', 'Falha ao carregar entregas: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFilter() {
    if (!search.trim()) return setFilteredEntregas(entregas);
    const lowerSearch = search.toLowerCase();
    const filtered = entregas.filter((item) => {
      switch (filterType) {
        case 'id':
          return item.id.toString().toLowerCase().includes(lowerSearch);
        case 'status':
          return item.status?.toLowerCase().includes(lowerSearch);
        case 'observacao':
          return item.observacao?.toLowerCase().includes(lowerSearch);
        default:
          return false;
      }
    });
    setFilteredEntregas(filtered);
  }

  const openModal = (entrega) => {
    setModalEntrega(entrega);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalEntrega(null);
  };

  const renderEntregaItem = ({ item }) => {
    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity
          style={styles.itemBox}
          onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
        >
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>Entrega {item.id}</Text>
            <Text>{new Date(item.data_saida).toLocaleDateString()}</Text>
          </View>

          {expandedId === item.id && (
            <View style={styles.expandedContent}>
              <Text style={styles.itemDetail}>Status: {item.status || '-'}</Text>
              <Text style={styles.itemDetail}>Quantidade: {item.quantidade || '-'}</Text>
              <Text style={styles.itemDetail}>Observação: {item.observacao || '-'}</Text>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#808080' }]}
                  onPress={() => openModal(item)}
                >
                  <Text style={styles.actionButtonText}>Visualizar Completo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => navigation.navigate('EditarEntrega', { entregaId: item.id })}
                >
                  <Text style={styles.actionButtonText}>Editar</Text>
                </TouchableOpacity>               
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

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
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipalMTR')}>
            <Image
              source={require('../../Assets/MTR.png')}
              style={styles.alerta}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('CadastroEntrega', { despachoId })}
        >
          <Text style={styles.buttonText}>NOVA ENTREGA</Text>
        </TouchableOpacity>

        <View style={styles.navbarFiltro}>
          <Text style={styles.filtroLabel}>Filtrar por {filterType}:</Text>
          <View style={styles.filtroInputContainer}>
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
            <View
              style={{
                position: 'absolute',
                right: 20,
                top: 80,
                backgroundColor: '#fff',
                borderRadius: 8,
                elevation: 5,
                paddingVertical: 8,
                minWidth: 140,
              }}
            >
              {FILTER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                    backgroundColor: filterType === option.key ? '#043b57' : 'transparent',
                  }}
                  onPress={() => {
                    setFilterType(option.key);
                    setFilterMenuVisible(false);
                    setSearch('');
                  }}
                >
                  <Text
                    style={{
                      color: filterType === option.key ? '#fff' : '#000',
                      fontWeight: 'bold',
                    }}
                  >
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
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderEntregaItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhuma entrega registrada.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Detalhes da Entrega</Text>
          {modalEntrega && (
            <>
              <Text>ID: {modalEntrega.id}</Text>
              <Text>Status: {modalEntrega.status || '-'}</Text>
              <Text>Quantidade: {modalEntrega.quantidade || '-'}</Text>
              <Text>Observação: {modalEntrega.observacao || '-'}</Text>
              <Text>Data Saída: {new Date(modalEntrega.data_saida).toLocaleString()}</Text>

              <TouchableOpacity onPress={closeModal} style={styles.modalButtonSair}>
                <Text style={styles.buttonText}>Fechar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}
