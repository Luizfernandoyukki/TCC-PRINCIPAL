import { useEffect, useState } from 'react';
import { FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import styles from '../../styles/EstilosdeEntidade';

export default function EntregasScreenMTR({ navigation }) {
  const [entregas, setEntregas] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntregas();
  }, []);

  const fetchEntregas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('entrega')
        .select(`
          id,
          quantidade,
          status,
          data_saida,
          data_entrega,
          estoque:estoque_id(nome),
          cliente:cliente_id(nome),
          veiculo:veiculo_id(placa)
        `)
        .order('data_saida', { ascending: false });

      if (error) throw error;
      setEntregas(data || []);
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderStatus = (status) => {
    const statusMap = {
      preparacao: { text: 'Preparação', color: '#FFA500' },
      a_caminho: { text: 'A Caminho', color: '#2196F3' },
      entregue: { text: 'Entregue', color: '#4CAF50' },
      devolucao_parcial: { text: 'Devolução Parcial', color: '#9C27B0' },
      rejeitada: { text: 'Rejeitada', color: '#F44336' }
    };
    
    return (
      <Text style={[styles.itemDetail, { color: statusMap[status].color }]}>
        Status: {statusMap[status].text}
      </Text>
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.itemBox}
        onPress={() => toggleExpand(item.id)}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.estoque.nome}</Text>
          <Text style={styles.itemSubtitle}>{item.quantidade} un.</Text>
        </View>
        
        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            {renderStatus(item.status)}
            <Text style={styles.itemDetail}>Cliente: {item.cliente.nome}</Text>
            <Text style={styles.itemDetail}>Veículo: {item.veiculo.placa}</Text>
            <Text style={styles.itemDetail}>Saída: {new Date(item.data_saida).toLocaleString('pt-BR')}</Text>
            
            {item.data_entrega && (
              <Text style={styles.itemDetail}>Entrega: {new Date(item.data_entrega).toLocaleString('pt-BR')}</Text>
            )}
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
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipalMTR')}>
            <Image 
              source={require('../../Assets/MTR.png')} 
              style={styles.alerta}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <Text style={styles.emptyText}>Carregando entregas...</Text>
      ) : (
        <FlatList
          data={entregas}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhuma entrega registrada.</Text>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}