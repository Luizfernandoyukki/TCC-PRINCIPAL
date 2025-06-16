import { useEffect, useState } from 'react';
import { FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import styles from '../../styles/EstilosdeEntidade';

export default function RotasMTRScreen({ navigation }) {
  const [rotas, setRotas] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) fetchRotas();
  }, [userId]);

  const fetchUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id);
  };

  const fetchRotas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rota')
        .select(`
          id,
          nome,
          destino,
          distancia,
          tempo_medio_minutos,
          horario_partida,
          data_rota,
          status,
          observacao,
          veiculo:veiculo_id(placa, modelo),
          clientes_id
        `)
        .eq('funcionario_id', userId)
        .order('data_rota', { ascending: true });

      if (error) throw error;
      setRotas(data || []);
    } catch (error) {
      console.error('Erro ao carregar rotas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    return timeString?.substring(0, 5) || '';
  };

  const renderStatus = (status) => {
    const statusMap = {
      pendente: { text: 'Pendente', color: '#FFA500' },
      em_andamento: { text: 'Em Andamento', color: '#2196F3' },
      concluida: { text: 'Concluída', color: '#4CAF50' },
      cancelada: { text: 'Cancelada', color: '#F44336' }
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
        onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.nome}</Text>
          <Text style={styles.itemSubtitle}>{item.destino}</Text>
        </View>
        
        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            {renderStatus(item.status)}
            <Text style={styles.itemDetail}>Data: {new Date(item.data_rota).toLocaleDateString('pt-BR')}</Text>
            <Text style={styles.itemDetail}>Horário: {formatTime(item.horario_partida)}</Text>
            <Text style={styles.itemDetail}>Distância: {item.distancia} km</Text>
            <Text style={styles.itemDetail}>Tempo estimado: {item.tempo_medio_minutos} min</Text>
            <Text style={styles.itemDetail}>Veículo: {item.veiculo.modelo} ({item.veiculo.placa})</Text>
            <Text style={styles.itemDetail}>Clientes: {item.clientes_id?.length || 0}</Text>
            
            {item.observacao && (
              <Text style={styles.itemDetail}>Obs: {item.observacao}</Text>
            )}
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.viewButton]}
              onPress={() => navigation.navigate('DetalhesRotaMTR', { rotaId: item.id })}
            >
              <Text style={styles.actionButtonText}>Ver Detalhes</Text>
            </TouchableOpacity>
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

      <View style={styles.content}>
        {loading ? (
          <Text style={styles.emptyText}>Carregando suas rotas...</Text>
        ) : (
          <FlatList
            data={rotas}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhuma rota atribuída a você.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}