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
  { key: 'data_saida', label: 'Data de Saída' }
];

export default function EntregasScreen({ navigation }) {
  const [entregas, setEntregas] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useLocalData, setUseLocalData] = useState(false);

  const [filterType, setFilterType] = useState('cliente');
  const [search, setSearch] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  useEffect(() => {
    fetchEntregas();
  }, [useLocalData]);

  const fetchEntregas = async () => {
    setLoading(true);
    try {
      let data = [];

      if (useLocalData) {
        const entregasData = await databaseService.select('entrega');
        const estoques = await databaseService.select('estoque');
        const clientes = await databaseService.select('cliente');
        const veiculos = await databaseService.select('veiculo');
        const funcionarios = await databaseService.select('funcionario');

        data = entregasData.map(entrega => ({
          ...entrega,
          estoque: estoques.find(e => e.id === entrega.estoque_id) || {},
          cliente: clientes.find(c => c.id === entrega.cliente_id) || {},
          veiculo: veiculos.find(v => v.id === entrega.veiculo_id) || {},
          funcionario: funcionarios.find(f => f.id === entrega.funcionario_id) || {}
        }));
      } else {
        const { data: fetched, error } = await supabase
          .from('entrega')
          .select(`
            *,
            estoque:estoque_id(id, nome, numero_serie),
            cliente:cliente_id(id, nome),
            veiculo:veiculo_id(id, modelo, placa),
            funcionario:funcionario_id(id, nome)
          `)
          .order('data_saida', { ascending: true });

        if (error) throw error;
        data = fetched;
      }
      setEntregas(data);
    } catch (error) {
      Alert.alert('Erro', error.message);
      if (!useLocalData) setUseLocalData(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderStatus = (status) => {
    const statusMap = {
      preparacao: 'Em preparação',
      a_caminho: 'A caminho',
      entregue: 'Entregue',
      devolucao_parcial: 'Devolução parcial',
      rejeitada: 'Rejeitada'
    };
    return <Text style={styles.itemDetail}>Status: {statusMap[status] || 'Desconhecido'}</Text>;
  };

  const filteredData = entregas.filter(entrega => {
    if (filterType === 'cliente') {
      return entrega.cliente?.nome?.toLowerCase().includes(search.toLowerCase());
    } else if (filterType === 'data_saida') {
      return entrega.data_saida?.includes(search);
    }
    return true;
  });

  const renderEntregaItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity style={styles.itemBox} onPress={() => toggleExpand(item.id)}>
        <Text style={styles.itemTitle}>{item.estoque?.nome || 'Produto'}</Text>
        <Text style={styles.itemSubtitle}>Cliente: {item.cliente?.nome || '---'}</Text>
        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            {renderStatus(item.status)}
            <Text style={styles.itemDetail}>Nº Série: {item.estoque?.numero_serie || 'N/A'}</Text>
            <Text style={styles.itemDetail}>Saída: {item.data_saida}</Text>
            <Text style={styles.itemDetail}>Veículo: {item.veiculo?.modelo || ''} - {item.veiculo?.placa || ''}</Text>
            <Text style={styles.itemDetail}>Responsável: {item.funcionario?.nome || ''}</Text>
            <Text style={styles.itemDetail}>Obs: {item.observacao || '---'}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'green' }]}> <Text style={styles.actionButtonText}>Visualizar</Text> </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'yellow' }]}> <Text style={styles.actionButtonText}>Realizar Ação</Text> </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'gray' }]} onPress={() => navigation.navigate('EditarEntrega', { id: item.id })}> <Text style={styles.actionButtonText}>Editar</Text> </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'red' }]}> <Text style={styles.actionButtonText}>Excluir</Text> </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#043b57" barStyle="light-content" />

      {/* Header */}
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

      {/* Botão de nova entrega */}
      <View style={styles.content}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('CadastroEntrega')}>
          <Text style={styles.buttonText}>+ NOVA ENTREGA</Text>
        </TouchableOpacity>

        {/* Navbar de filtro */}
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
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setFilterMenuVisible(false)}>
            <View style={{ position: 'absolute', right: 20, top: 80, backgroundColor: '#fff', borderRadius: 8, elevation: 5, paddingVertical: 8, minWidth: 140 }}>
              {FILTER_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={{ paddingVertical: 10, paddingHorizontal: 15, backgroundColor: filterType === option.key ? '#043b57' : 'transparent' }}
                  onPress={() => {
                    setFilterType(option.key);
                    setFilterMenuVisible(false);
                    setSearch('');
                  }}
                >
                  <Text style={{ color: filterType === option.key ? '#fff' : '#000', fontWeight: 'bold' }}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {loading ? (
          <Text style={styles.emptyText}>Carregando entregas...</Text>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={item => item.id}
            renderItem={renderEntregaItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma entrega encontrada.</Text>}
          />
        )}
      </View>
    </View>
  );
}
