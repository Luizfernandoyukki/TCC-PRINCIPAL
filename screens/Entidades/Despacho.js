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
  { key: 'responsavel', label: 'Responsável' },
  { key: 'observacao', label: 'Observação' },
];

export default function DespachoScreen({ navigation }) {
  const [despachos, setDespachos] = useState([]);
  const [filteredDespachos, setFilteredDespachos] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDespacho, setModalDespacho] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('id');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  useEffect(() => {
    fetchDespachos();
  }, []);

  useEffect(() => {
    handleFilter();
  }, [search, filterType, despachos]);

  async function fetchDespachos() {
    setLoading(true);
    try {
      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        const { data, error } = await supabase
          .from('despacho_reserva')
          .select(`
            id,
            data_criacao,
            observacao,
            responsavel_id
          `)
          .order('data_criacao', { ascending: false });

        if (error) throw error;

        // Se quiser buscar o nome do responsável, terá que fazer join ou mapear depois (aqui simplifico)
        setDespachos(data || []);
        setFilteredDespachos(data || []);
      } else {
        const localData = await databaseService.select('despacho_reserva');
        if (!localData.success) throw new Error('Erro ao buscar despachos locais');
        setDespachos(localData.data);
        setFilteredDespachos(localData.data);
      }
    } catch (e) {
      Alert.alert('Erro', 'Falha ao carregar despachos: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFilter() {
    if (!search.trim()) return setFilteredDespachos(despachos);
    const lowerSearch = search.toLowerCase();
    const filtered = despachos.filter((item) => {
      switch (filterType) {
        case 'id':
          return item.id.toString().toLowerCase().includes(lowerSearch);
        case 'observacao':
          return item.observacao?.toLowerCase().includes(lowerSearch);
        case 'responsavel':
          return item.responsavel_id?.toString().toLowerCase().includes(lowerSearch);
        default:
          return false;
      }
    });
    setFilteredDespachos(filtered);
  }

  const openModal = (despacho) => {
    setModalDespacho(despacho);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalDespacho(null);
  };

  const renderDespachoItem = ({ item }) => {
    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity
          style={styles.itemBox}
          onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
        >
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>Despacho {item.id}</Text>
            <Text>{new Date(item.data_criacao).toLocaleDateString()}</Text>
          </View>

          {expandedId === item.id && (
            <View style={styles.expandedContent}>
              <Text style={styles.itemDetail}>Observação: {item.observacao || '-'}</Text>
              <Text style={styles.itemDetail}>Responsável: {item.responsavel_id || '-'}</Text>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => navigation.navigate('EditarDespacho', { despachoId: item.id })}
                >
                  <Text style={styles.actionButtonText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#047857' }]}
                  onPress={() => navigation.navigate('EntregarScreen', { despachoId: item.id })}
                >
                  <Text style={styles.actionButtonText}>Ver Entregas</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#808080' }]}
                  onPress={() => openModal(item)}
                >
                  <Text style={styles.actionButtonText}>Visualizar Completo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                  onPress={() => deleteDespacho(item.id)}
                >
                  <Text style={styles.actionButtonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const deleteDespacho = (id) => {
    Alert.alert('Excluir Despacho', 'Tem certeza que deseja excluir este despacho?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        onPress: async () => {
          await databaseService.delete('despacho_reserva', 'id = ?', [id]);
          fetchDespachos();
        },
      },
    ]);
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
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipalADM')}>
            <Image
              source={require('../../Assets/ADM.png')}
              style={styles.alerta}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('CadastroDespacho')}
        >
          <Text style={styles.buttonText}>NOVO DESPACHO</Text>
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
          <Text style={styles.emptyText}>Carregando despachos...</Text>
        ) : (
          <FlatList
            data={filteredDespachos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderDespachoItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum despacho registrado.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Detalhes do Despacho</Text>
          {modalDespacho && (
            <>
              <Text>ID: {modalDespacho.id}</Text>
              <Text>Data Criação: {new Date(modalDespacho.data_criacao).toLocaleString()}</Text>
              <Text>Observação: {modalDespacho.observacao || '-'}</Text>
              <Text>Responsável: {modalDespacho.responsavel_id || '-'}</Text>

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
