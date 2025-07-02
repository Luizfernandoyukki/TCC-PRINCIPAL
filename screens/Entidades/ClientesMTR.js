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
const traduzirDiasEntrega = (diasArray) => {
  if (!diasArray || !Array.isArray(diasArray) || diasArray.length === 0) return '-';
  
  const diasMap = {
    0: 'Dom',
    1: 'Seg',
    2: 'Ter',
    3: 'Qua',
    4: 'Qui',
    5: 'Sex',
    6: 'Sáb'
  };
  
  
  return [...new Set(diasArray)]
    .sort((a, b) => a - b)
    .map(num => diasMap[num] || num)
    .join(', ');
};
  // Render UI
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
              {renderMapa(modalCliente.endereco)}
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
