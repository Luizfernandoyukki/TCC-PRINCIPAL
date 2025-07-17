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
        const [{ data: clientesSup }, { data: enderecosSup }, { data: telefonesSup }, { data: emailsSup }, { data: diasEntrega }] =
          await Promise.all([
            supabase.from('cliente').select('*'),
            supabase.from('endereco').select('*'),
            supabase.from('telefone').select('*'),
            supabase.from('email').select('*'),
            supabase.from('cliente_dias_entrega').select('*'),
          ]);

        const clientesCompletos = clientesSup.map((c) => ({
          ...c,
          endereco: enderecosSup.find((e) => e.id === c.endereco_id) || null,
          telefone: telefonesSup.find((t) => t.id === c.telefone_id) || null,
          email: emailsSup.find((em) => em.id === c.email_id) || null,
          dias_entrega: diasEntrega.filter((d) => d.cliente_id === c.id).map((d) => d.dia),
        }));

        setClientes(clientesCompletos);
      } else {
        const [clientesResult, enderecosResult, telefonesResult, emailsResult, diasEntregaResult] = await Promise.all([
          databaseService.select('cliente'),
          databaseService.select('endereco'),
          databaseService.select('telefone'),
          databaseService.select('email'),
          databaseService.select('cliente_dias_entrega'),
        ]);

        const clientesCompletos = clientesResult.data.map((c) => ({
          ...c,
          endereco: enderecosResult.data.find((e) => e.id === c.endereco_id) || null,
          telefone: telefonesResult.data.find((t) => t.id === c.telefone_id) || null,
          email: emailsResult.data.find((em) => em.id === c.email_id) || null,
          dias_entrega: diasEntregaResult.data.filter((d) => d.cliente_id === c.id).map((d) => d.dia),
        }));

        setClientes(clientesCompletos);
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
    const filtered = clientes.filter((cliente) => {
      switch (filterType) {
        case 'nome': return cliente.nome?.toLowerCase().includes(lowerSearch);
        case 'tipo': return cliente.tipo?.toLowerCase().includes(lowerSearch);
        case 'cpf': return cliente.cpf?.toLowerCase().includes(lowerSearch);
        case 'cnpj': return cliente.cnpj?.toLowerCase().includes(lowerSearch);
        case 'cidade': return cliente.endereco?.cidade?.toLowerCase().includes(lowerSearch);
        case 'telefone': return cliente.telefone?.numero?.toLowerCase().includes(lowerSearch);
        case 'email': return cliente.email?.email?.toLowerCase().includes(lowerSearch);
        default: return false;
      }
    });
    setFilteredClientes(filtered);
  };

  const openModal = (cliente) => {
    setModalCliente(cliente);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalCliente(null);
    setModalVisible(false);
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

  const traduzirDiasEntrega = (diasArray) => {
    if (!Array.isArray(diasArray) || diasArray.length === 0) return '-';
    const diasMap = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    return diasArray.sort((a, b) => a - b).map(num => diasMap[num] || num).join(', ');
  };

  const renderClienteItem = ({ item }) => {
    const enderecoFormatado = item.endereco
      ? `${item.endereco.rua}, ${item.endereco.numero} - ${item.endereco.bairro}`
      : '-';
    const cpfCnpj = item.tipo === 'física' ? item.cpf : item.cnpj;

    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity style={styles.itemBox} onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>{item.nome}</Text>
          </View>

          {expandedId === item.id && (
            <View style={styles.expandedContent}>
              <Text style={styles.itemDetail}>Tipo: {item.tipo}</Text>
              <Text style={styles.itemDetail}>CPF/CNPJ: {cpfCnpj}</Text>
              <Text style={styles.itemDetail}>Telefone: {item.telefone?.numero || '-'}</Text>
              <Text style={styles.itemDetail}>Email: {item.email?.email || '-'}</Text>
              <Text style={styles.itemDetail}>Endereço: {enderecoFormatado}</Text>
              <Text style={styles.itemDetail}>Dias de Entrega: {traduzirDiasEntrega(item.dias_entrega)}</Text>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => navigation.navigate('EditarCliente', { clienteId: item.id })}
                >
                  <Text style={styles.actionButtonText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                  onPress={() => deleteCliente(item.id)}
                >
                  <Text style={styles.actionButtonText}>Excluir</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#808080' }]}
                  onPress={() => openModal(item)}
                >
                  <Text style={styles.actionButtonText}>Ver Completo</Text>
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
              <Text>Email: {modalCliente.email?.email || '-'}</Text>
              <Text>Endereço: {modalCliente.endereco ? `${modalCliente.endereco.rua}, ${modalCliente.endereco.numero}` : '-'}</Text>
              <Text>Dias de Entrega: {traduzirDiasEntrega(modalCliente.dias_entrega)}</Text>
              <Text>Status: {modalCliente.status}</Text>
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