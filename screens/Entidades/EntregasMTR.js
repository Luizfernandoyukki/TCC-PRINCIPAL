import { useEffect, useState } from 'react';
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import { databaseService } from '../../services/localDatabase'; // Adicionado para operações locais
import styles from '../../styles/EstilosdeEntidade';

export default function EntregasScreen({ navigation }) {
  const [entregas, setEntregas] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useLocalData, setUseLocalData] = useState(false); // Estado para alternar entre local/Supabase
const [filterText, setFilterText] = useState('');

  useEffect(() => {
    fetchEntregas();
  }, [useLocalData]);

  const fetchEntregas = async () => {
    setLoading(true);
    try {
      if (useLocalData) {
        // Versão local usando o mesmo padrão das outras telas
        const entregasData = await databaseService.select('entrega');
        const estoques = await databaseService.select('estoque');
        const clientes = await databaseService.select('cliente');
        const veiculos = await databaseService.select('veiculo');
        const funcionarios = await databaseService.select('funcionario');

        const data = entregasData.map(entrega => ({
          ...entrega,
          estoque: estoques.find(e => e.id === entrega.estoque_id) || {},
          cliente: clientes.find(c => c.id === entrega.cliente_id) || {},
          veiculo: veiculos.find(v => v.id === entrega.veiculo_id) || {},
          funcionario: funcionarios.find(f => f.id === entrega.funcionario_id) || {}
        }));

        setEntregas(data || []);
      } else {
        // Versão original com Supabase
        const { data, error } = await supabase
          .from('entrega')
          .select(`
            id,
            quantidade,
            quantidade_devolvida,
            status,
            nota,
            data_saida,
            data_entrega,
            motivo_devolucao,
            observacao,
            estoque:estoque_id(nome, numero_serie),
            cliente:cliente_id(nome),
            veiculo:veiculo_id(placa, modelo),
            funcionario:funcionario_id(nome)
          `)
          .order('data_saida', { ascending: false });

        if (error) throw error;
        setEntregas(data || []);
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
      // Se falhar com Supabase, tenta com dados locais
      if (!useLocalData) setUseLocalData(true);
    } finally {
      setLoading(false);
    }
  };
  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderStatus = (status) => {
    const statusStyles = {
      preparacao: { color: '#FFA500', text: 'Em preparação' },
      a_caminho: { color: '#2196F3', text: 'A caminho' },
      entregue: { color: '#4CAF50', text: 'Entregue' },
      devolucao_parcial: { color: '#9C27B0', text: 'Devolução parcial' },
      rejeitada: { color: '#F44336', text: 'Rejeitada' }
    };
    
    return (
      <Text style={[styles.itemDetail, { color: statusStyles[status].color }]}>
        Status: {statusStyles[status].text}
      </Text>
    );
  };

  const renderNotaFiscal = (nota) => {
    return nota ? (
      <Text style={[styles.itemDetail, styles.checkIcon]}>✓ Com nota fiscal</Text>
    ) : (
      <Text style={[styles.itemDetail, styles.xIcon]}>✗ Sem nota fiscal</Text>
    );
  };

  const renderEntregaItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.itemBox}
        onPress={() => toggleExpand(item.id)}
      >
        <View style={styles.itemHeader}>
          <View>
            <Text style={styles.itemTitle}>{item.estoque?.nome || 'Produto não encontrado'}</Text>
            <Text style={styles.itemSubtitle}>Cliente: {item.cliente?.nome || 'Não informado'}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.itemQuantity}>{item.quantidade} un.</Text>
            {useLocalData && ( // Mostra ícone indicando dados locais
              <Text style={styles.localDataIndicator}>📱</Text>
            )}
          </View>
        </View>
        
        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            {renderStatus(item.status)}
            {renderNotaFiscal(item.nota)}
            
            <Text style={styles.itemDetail}>N° Série: {item.estoque?.numero_serie || 'N/A'}</Text>
            <Text style={styles.itemDetail}>Saída: {new Date(item.data_saida).toLocaleString('pt-BR')}</Text>
            
            {item.data_entrega && (
              <Text style={styles.itemDetail}>Entrega: {new Date(item.data_entrega).toLocaleString('pt-BR')}</Text>
            )}
            
            <Text style={styles.itemDetail}>
              Veículo: {item.veiculo?.modelo || 'Não informado'} ({item.veiculo?.placa || '---'})
            </Text>
            
            <Text style={styles.itemDetail}>
              Responsável: {item.funcionario?.nome || 'Não informado'}
            </Text>
            
            {item.quantidade_devolvida > 0 && (
              <Text style={styles.itemDetail}>
                Devolvido: {item.quantidade_devolvida} un.
              </Text>
            )}
            
            {item.motivo_devolucao && (
              <Text style={styles.itemDetail}>Motivo: {item.motivo_devolucao}</Text>
            )}
            
            {item.observacao && (
              <Text style={styles.itemDetail}>Obs: {item.observacao}</Text>
            )}
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => navigation.navigate('DetalhesEntrega', { id: item.id })}
              >
                <Text style={styles.actionButtonText}>Detalhes</Text>
              </TouchableOpacity>
              
              {['preparacao', 'a_caminho'].includes(item.status) && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => navigation.navigate('EditarEntrega', { id: item.id })}
                >
                  <Text style={styles.actionButtonText}>Atualizar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
  

{/* Botão de nova entrega */}
<TouchableOpacity
  style={styles.button}
  onPress={() => navigation.navigate('CadastroEntrega')}
>
  <Text style={styles.buttonText}>+ NOVA ENTREGA</Text>
</TouchableOpacity>

{/* Navbar de filtros */}
<View style={styles.filterNavbar}>
  <FlatList
    horizontal
    showsHorizontalScrollIndicator={false}
    data={[
  { key: 'data_saida', label: 'Data de Saída' },
  { key: 'status', label: 'Status' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'veiculo', label: 'Veículo' },
  // Adicione mais filtros conforme necessário
    ]}
    renderItem={({ item }) => (
  <TouchableOpacity
    style={[
      styles.filterButton,
      filterKey === item.key && styles.filterButtonActive
    ]}
    onPress={() => setFilterKey(item.key)}
  >
    <Text
      style={[
    styles.filterButtonText,
    filterKey === item.key && styles.filterButtonTextActive
      ]}
    >
      {item.label}
    </Text>
  </TouchableOpacity>
    )}
    keyExtractor={item => item.key}
    contentContainerStyle={styles.filterNavbarContent}
  />
  {/* Exemplo de campo de busca para o filtro selecionado */}
  {filterKey === 'data_saida' && (
    <TouchableOpacity
  style={styles.filterInput}
  onPress={() => setShowDatePicker(true)}
    >
  <Text style={styles.filterInputText}>
    {filterValue ? new Date(filterValue).toLocaleDateString('pt-BR') : 'Escolher data'}
  </Text>
    </TouchableOpacity>
  )}
  {filterKey !== 'data_saida' && (
    <View style={styles.filterInput}>
  <TextInput
    style={styles.filterInputText}
    placeholder={`Filtrar por ${filterKey === 'status' ? 'status' : filterKey}`}
    value={filterValue}
    onChangeText={setFilterValue}
  />
    </View>
  )}
  {/* DatePicker pode ser implementado conforme biblioteca usada */}
  {showDatePicker && (
    // Substitua pelo seu DatePicker preferido
    <DateTimePicker
  value={filterValue ? new Date(filterValue) : new Date()}
  mode="date"
  display="default"
  onChange={(event, date) => {
    setShowDatePicker(false);
    if (date) setFilterValue(date.toISOString());
  }}
    />
  )}
  <TouchableOpacity
    style={styles.clearFilterButton}
    onPress={() => {
  setFilterKey(null);
  setFilterValue('');
    }}
  >
    <Text style={styles.clearFilterButtonText}>Limpar Filtros</Text>
  </TouchableOpacity>
</View>

{/* Lista de entregas */}
{loading ? (
  <Text style={styles.emptyText}>Carregando entregas...</Text>
) : (
  <FlatList
    data={
  filterKey && filterValue
    ? entregas.filter(entrega => {
    if (filterKey === 'data_saida') {
      return (
        new Date(entrega.data_saida).toLocaleDateString('pt-BR') ===
        new Date(filterValue).toLocaleDateString('pt-BR')
      );
    }
    if (filterKey === 'status') {
      return entrega.status?.toLowerCase().includes(filterValue.toLowerCase());
    }
    if (filterKey === 'cliente') {
      return entrega.cliente?.nome?.toLowerCase().includes(filterValue.toLowerCase());
    }
    if (filterKey === 'veiculo') {
      return entrega.veiculo?.modelo?.toLowerCase().includes(filterValue.toLowerCase()) ||
        entrega.veiculo?.placa?.toLowerCase().includes(filterValue.toLowerCase());
    }
    return true;
      })
    : entregas
    }
    keyExtractor={item => item.id}
    renderItem={renderEntregaItem}
    ListEmptyComponent={
  <Text style={styles.emptyText}>Nenhuma entrega registrada.</Text>
    }
    contentContainerStyle={styles.listContent}
  />
)}
}