import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { databaseService } from '../../services/localDatabase';
import styles from '../../styles/EstilosdeEntidade';
import { getAllLocal } from '../../utils/localEntityService';

export default function ClientesScreen({ navigation }) {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('nome');
const [filterText, setFilterText] = useState('');

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    handleFilter();
  }, [search, filterType, clientes]);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const clientesData = await getAllLocal('cliente');
      const enderecos = await getAllLocal('endereco');
      const data = clientesData.map(cliente => ({
        ...cliente,
        endereco: enderecos.find(e => e.id === cliente.endereco_id) || null
      }));
      setClientes(data || []);
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    if (!search.trim()) {
      setFilteredClientes(clientes);
      return;
    }
    const lowerSearch = search.toLowerCase();
    const filtered = clientes.filter(cliente => {
      if (filterType === 'nome') {
        return cliente.nome?.toLowerCase().includes(lowerSearch);
      }
      if (filterType === 'tipo') {
        return cliente.tipo?.toLowerCase().includes(lowerSearch);
      }
      if (filterType === 'cpf' && cliente.cpf) {
        return cliente.cpf.includes(lowerSearch);
      }
      if (filterType === 'cnpj' && cliente.cnpj) {
        return cliente.cnpj.includes(lowerSearch);
      }
      if (filterType === 'cidade' && cliente.endereco) {
        return cliente.endereco.cidade?.toLowerCase().includes(lowerSearch);
      }
      return false;
    });
    setFilteredClientes(filtered);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const deleteCliente = async (id) => {
    Alert.alert(
      "Excluir Cliente",
      "Tem certeza que deseja excluir este cliente permanentemente?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Excluir", 
          onPress: async () => {
            try {
              await databaseService.deleteById('cliente', id);
              await fetchClientes();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o cliente: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const renderClienteItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.itemBox}
        onPress={() => toggleExpand(item.id)}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.nome}</Text>
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              deleteCliente(item.id);
            }}
            style={styles.deleteIconButton}
          >
            <Text style={styles.deleteIconText}>X</Text>
          </TouchableOpacity>
        </View>
        
        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            <Text style={styles.itemDetail}>Tipo: {item.tipo}</Text>
            <Text style={styles.itemDetail}>
              {item.tipo === 'PJ' ? `CNPJ: ${item.cnpj}` : `CPF: ${item.cpf} | RG: ${item.rg}`}
            </Text>
            <Text style={styles.itemDetail}>
              Cadastrado em: {new Date(item.created_at).toLocaleDateString('pt-BR')}
            </Text>
            {item.endereco && (
              <>
                <Text style={styles.itemDetail}>
                  Endereço: {item.endereco.rua}, {item.endereco.numero} - {item.endereco.bairro}
                </Text>
                <Text style={styles.itemDetail}>
                  Cidade: {item.endereco.cidade}/{item.endereco.uf}
                </Text>
                <Text style={styles.itemDetail}>
                  CEP: {item.endereco.cep}
                </Text>
                {item.endereco.complemento && (
                  <Text style={styles.itemDetail}>Complemento: {item.endereco.complemento}</Text>
                )}
              </>
            )}
            {item.observacao && (
              <Text style={styles.itemDetail}>Observações: {item.observacao}</Text>
            )}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => navigation.navigate('DetalhesCliente', { clienteId: item.id })}
              >
                <Text style={styles.actionButtonText}>Visualizar Completo</Text>
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

        {/* Navbar de filtro */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder={`Filtrar por ${filterType}`}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === 'nome' && styles.filterButtonActive
            ]}
            onPress={() => setFilterType('nome')}
          >
            <Text style={styles.filterButtonText}>Nome</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === 'tipo' && styles.filterButtonActive
            ]}
            onPress={() => setFilterType('tipo')}
          >
            <Text style={styles.filterButtonText}>Tipo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === 'cpf' && styles.filterButtonActive
            ]}
            onPress={() => setFilterType('cpf')}
          >
            <Text style={styles.filterButtonText}>CPF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === 'cnpj' && styles.filterButtonActive
            ]}
            onPress={() => setFilterType('cnpj')}
          >
            <Text style={styles.filterButtonText}>CNPJ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === 'cidade' && styles.filterButtonActive
            ]}
            onPress={() => setFilterType('cidade')}
          >
            <Text style={styles.filterButtonText}>Cidade</Text>
          </TouchableOpacity>
        </View>

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
    </View>
  );
}