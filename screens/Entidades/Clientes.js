import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../../contexts/supabaseClient';
import { databaseService } from '../../services/localDatabase';
import styles from '../../styles/EstilosdeEntidade';

const FILTER_OPTIONS = [
  { key: 'nome', label: 'Nome' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'cpf', label: 'CPF' },
  { key: 'cnpj', label: 'CNPJ' },
  { key: 'cidade', label: 'Cidade' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'email', label: 'Email' },
];

export default function ClientesScreen({ navigation }) {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalCliente, setModalCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('nome');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    handleFilter();
  }, [search, filterType, clientes]);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const netState = await NetInfo.fetch();

      if (netState.isConnected) {
        // ONLINE: buscar do Supabase as 4 tabelas
        const [{ data: clientesSup, error: errClientes },
          { data: enderecosSup, error: errEnderecos },
          { data: telefonesSup, error: errTelefones },
          { data: emailsSup, error: errEmails }] = await Promise.all([
            supabase.from('cliente').select('*'),
            supabase.from('endereco').select('*'),
            supabase.from('telefone').select('*'),
            supabase.from('email').select('*'),
          ]);
        if (errClientes || errEnderecos || errTelefones || errEmails) {
          throw errClientes || errEnderecos || errTelefones || errEmails;
        }

        // Montar clientes completos relacionando pelos ids
        const clientesCompletos = clientesSup.map(c => ({
          ...c,
          endereco: enderecosSup.find(e => e.id === c.endereco_id) || null,
          telefone: telefonesSup.find(t => t.id === c.telefone_id) || null,
          email: emailsSup.find(em => em.id === c.email_id) || null,
        }));

        setClientes(clientesCompletos);
        setFilteredClientes(clientesCompletos);

      } else {
        // OFFLINE: buscar do banco local
        const clientesResult = await databaseService.select('cliente');
        if (!clientesResult.success) throw new Error('Erro ao buscar clientes locais');

        const enderecosResult = await databaseService.select('endereco');
        const telefonesResult = await databaseService.select('telefone');
        const emailsResult = await databaseService.select('email');

        const enderecos = enderecosResult.success ? enderecosResult.data : [];
        const telefones = telefonesResult.success ? telefonesResult.data : [];
        const emails = emailsResult.success ? emailsResult.data : [];

        const clientesCompletos = clientesResult.data.map(c => ({
          ...c,
          endereco: enderecos.find(e => e.id === c.endereco_id) || null,
          telefone: telefones.find(t => t.id === c.telefone_id) || null,
          email: emails.find(em => em.id === c.email_id) || null,
        }));

        setClientes(clientesCompletos);
        setFilteredClientes(clientesCompletos);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar clientes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    if (!search.trim()) return setFilteredClientes(clientes);
    const lowerSearch = search.toLowerCase();
    const filtered = clientes.filter(cliente => {
      switch (filterType) {
        case 'nome': return cliente.nome?.toLowerCase().includes(lowerSearch);
        case 'tipo': return cliente.tipo?.toLowerCase().includes(lowerSearch);
        case 'cpf': return cliente.cpf?.toLowerCase().includes(lowerSearch);
        case 'cnpj': return cliente.cnpj?.toLowerCase().includes(lowerSearch);
        case 'cidade': return cliente.endereco?.cidade?.toLowerCase().includes(lowerSearch);
        case 'telefone': return cliente.telefone?.numero?.toLowerCase().includes(lowerSearch);
        case 'email': return cliente.email?.endereco?.toLowerCase().includes(lowerSearch);
        default: return false;
      }
    });
    setFilteredClientes(filtered);
  };

  const renderMapa = (endereco) => {
    if (endereco?.latitude && endereco?.longitude) {
      return (
        <MapView
          style={{ height: 200, marginVertical: 10 }}
          initialRegion={{
            latitude: parseFloat(endereco.latitude),
            longitude: parseFloat(endereco.longitude),
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: parseFloat(endereco.latitude),
              longitude: parseFloat(endereco.longitude),
            }}
            title={endereco.rua}
            description={endereco.cidade}
          />
        </MapView>
      );
    }
    return <Text style={{ marginVertical: 10, fontStyle: 'italic' }}>Endereço não disponível no mapa.</Text>;
  };

  const renderClienteItem = ({ item }) => {
  const cpfCnpj = item.tipo === 'jurídica' ? item.cnpj?.toUpperCase() || '-' : item.cpf?.toUpperCase() || '-';
  const enderecoFormatado = item.endereco
    ? `${item.endereco.rua}, ${item.endereco.numero} - ${item.endereco.bairro}, ${item.endereco.cidade}/${item.endereco.uf}`
    : '-';

  return (
    <View style={styles.itemContainer}>
      <TouchableOpacity style={styles.itemBox} onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.nome}</Text>
          {/* Removi o botão Excluir daqui */}
        </View>

        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            <Text style={styles.itemDetail}>Tipo: {item.tipo}</Text>
            <Text style={styles.itemDetail}>CPF/CNPJ: {cpfCnpj}</Text>
            <Text style={styles.itemDetail}>Telefone: {item.telefone?.numero || '-'}</Text>
            <Text style={styles.itemDetail}>Email: {item.email?.endereco || '-'}</Text>
            <Text style={styles.itemDetail}>Endereço: {enderecoFormatado}</Text>
            {renderMapa(item.endereco)}

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#2345AF' }]}
                onPress={() => navigation.navigate('Entregas')}
              >
                <Text style={styles.actionButtonText}>Entregas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                onPress={() => navigation.navigate('Pedidos')}
              >
                <Text style={styles.actionButtonText}>Pedidos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#808080' }]}
                onPress={() => openModal(item)}
              >
                <Text style={styles.actionButtonText}>Visualizar Completo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#ef4444' }]} // vermelho para excluir
                onPress={() => deleteCliente(item.id)}
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

  const openModal = (cliente) => {
    setModalCliente(cliente);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalCliente(null);
  };

  const deleteCliente = async (id) => {
    Alert.alert('Excluir Cliente', 'Tem certeza que deseja excluir este cliente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', onPress: async () => {
          await databaseService.delete('cliente', 'id = ?', [id]);
          await fetchClientes();
        }
      }
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
          onPress={() => navigation.navigate('CadastroClientes')}
        >
          <Text style={styles.buttonText}>NOVO CLIENTE</Text>
        </TouchableOpacity>

        {/* Campo de busca */}
        <View style={styles.navbarFiltro}>
          <Text style={styles.filtroLabel}>Filtrar por {filterType}:</Text>
          <View style={styles.filtroInputContainer}>
            <Image
              source={require('../../Assets/search.png')}
              style={styles.filtroIcon}
              resizeMode="contain"
            />
            <TextInput
              style={styles.filtroInput}
              placeholder={`Digite o ${filterType}`}
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#888"
              autoCapitalize="none"
            />
            {/* Botão dos 3 pontinhos */}
            <TouchableOpacity
              onPress={() => setFilterMenuVisible(true)}
              style={{ paddingHorizontal: 12, justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 24, fontWeight: 'bold' }}>⋮</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal para escolher filtro */}
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
          <Text style={styles.emptyText}>Carregando clientes...</Text>
        ) : (
          <FlatList
            data={filteredClientes}
            keyExtractor={item => item.id.toString()}
            renderItem={renderClienteItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum cliente registrado.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Modal de visualização completa */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Dados do Cliente</Text>
          {modalCliente && (
            <>
              <Text>Nome: {modalCliente.nome}</Text>
              <Text>Tipo: {modalCliente.tipo}</Text>
              <Text>CPF: {modalCliente.cpf || '-'}</Text>
              <Text>CNPJ: {modalCliente.cnpj || '-'}</Text>
              <Text>Telefone: {modalCliente.telefone?.numero || '-'}</Text>
              <Text>Email: {modalCliente.email?.endereco || '-'}</Text>
              <Text>Endereço: {modalCliente.endereco ? `${modalCliente.endereco.rua}, ${modalCliente.endereco.numero}` : '-'}</Text>
              {renderMapa(modalCliente.endereco)}
              <TouchableOpacity onPress={closeModal} style={styles.button}>
                <Text style={styles.buttonText}>Fechar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}
