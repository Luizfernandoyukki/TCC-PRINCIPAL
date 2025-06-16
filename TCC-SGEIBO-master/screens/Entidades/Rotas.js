import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import styles from '../../styles/EstilosdeEntidade';

export default function RotasScreen({ navigation }) {
  const [rotas, setRotas] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRotas();
  }, []);

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
          funcionario:funcionario_id(nome),
          clientes_id
        `)
        .order('data_rota', { ascending: true });

      if (error) throw error;
      setRotas(data || []);
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const iniciarRota = async (id) => {
    const { error } = await supabase
      .from('rota')
      .update({ status: 'em_andamento' })
      .eq('id', id);
    
    if (!error) fetchRotas();
  };

  const concluirRota = async (id) => {
    const { error } = await supabase
      .from('rota')
      .update({ status: 'concluida' })
      .eq('id', id);
    
    if (!error) fetchRotas();
  };

  const cancelarRota = async (id) => {
    Alert.alert(
      "Cancelar Rota",
      "Tem certeza que deseja cancelar esta rota?",
      [
        {
          text: "Não",
          style: "cancel"
        },
        { 
          text: "Sim", 
          onPress: async () => {
            const { error } = await supabase
              .from('rota')
              .update({ status: 'cancelada' })
              .eq('id', id);
            
            if (!error) fetchRotas();
          }
        }
      ]
    );
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

  const formatTime = (timeString) => {
    return timeString?.substring(0, 5) || '';
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
            <Text style={styles.itemDetail}>Motorista: {item.funcionario.nome}</Text>
            <Text style={styles.itemDetail}>Clientes: {item.clientes_id?.length || 0}</Text>
            
            {item.observacao && (
              <Text style={styles.itemDetail}>Obs: {item.observacao}</Text>
            )}
            
            <View style={styles.actionButtons}>
              {item.status === 'pendente' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.startButton]}
                  onPress={() => iniciarRota(item.id)}
                >
                  <Text style={styles.actionButtonText}>Iniciar</Text>
                </TouchableOpacity>
              )}
              
              {item.status === 'em_andamento' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.completeButton]}
                  onPress={() => concluirRota(item.id)}
                >
                  <Text style={styles.actionButtonText}>Concluir</Text>
                </TouchableOpacity>
              )}
              
              {['pendente', 'em_andamento'].includes(item.status) && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => cancelarRota(item.id)}
                >
                  <Text style={styles.actionButtonText}>Cancelar</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => navigation.navigate('DetalhesRota', { rotaId: item.id })}
              >
                <Text style={styles.actionButtonText}>Detalhes</Text>
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
          onPress={() => navigation.navigate('CadastroRotas')}
        >
          <Text style={styles.buttonText}>NOVA ROTA</Text>
        </TouchableOpacity>

        {loading ? (
          <Text style={styles.emptyText}>Carregando rotas...</Text>
        ) : (
          <FlatList
            data={rotas}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhuma rota registrada.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}