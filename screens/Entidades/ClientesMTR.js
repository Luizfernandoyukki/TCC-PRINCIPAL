import { useEffect, useState } from 'react';
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import styles from '../../styles/EstilosdeEntidade';
import { getAllLocal } from '../../utils/localEntityService';

export default function ClientesScreen({ navigation }) {
  const [clientes, setClientes] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Adicione estes estados:
  const [filterText, setFilterText] = useState('');
  const [filteredClientes, setFilteredClientes] = useState([]);

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    // Atualiza a lista filtrada sempre que filterText ou clientes mudar
    if (!filterText) {
      setFilteredClientes(clientes);
    } else {
      setFilteredClientes(
        clientes.filter(c =>
          (c.nome || '').toLowerCase().includes(filterText.toLowerCase()) ||
          (c.cpf || '').includes(filterText) ||
          (c.cnpj || '').includes(filterText)
        )
      );
    }
  }, [filterText, clientes]);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      // Busca clientes e endereços para montar os relacionamentos
      const clientesData = await getAllLocal('cliente');
      const enderecos = await getAllLocal('endereco');
      
      // Monta os relacionamentos manualmente
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

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Funções para os botões de filtro
  const handleFilter = () => {
    // O filtro já é aplicado automaticamente pelo useEffect acima
  };

  const handleClearFilter = () => {
    setFilterText('');
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
            
            {/* Mostrando os dados de endereço se existirem */}
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

  // Render UI
  return (
    <>
      {/* Navbar de Filtro */}
      <View style={styles.filterBar}>
        <TextInput
          style={styles.filterInput}
          placeholder="Filtrar por nome, CPF, CNPJ..."
          value={filterText}
          onChangeText={setFilterText}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={handleFilter}
        >
          <Text style={styles.filterButtonText}>Filtrar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.clearFilterButton}
          onPress={handleClearFilter}
        >
          <Text style={styles.clearFilterButtonText}>Limpar</Text>
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
    </>
  );
}