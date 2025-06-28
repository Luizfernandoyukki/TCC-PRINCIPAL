import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import { databaseService } from '../../services/localDatabase';
import styles from '../../styles/EstilosdeEntidade';

export default function RotasScreen({ navigation }) {
  const [rotas, setRotas] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useLocalData, setUseLocalData] = useState(false);
const [filterText, setFilterText] = useState('');

  useEffect(() => {
    fetchRotas();
  }, [useLocalData]);

  const fetchRotas = async () => {
    setLoading(true);
    try {
      if (useLocalData) {
        // Versão local com relacionamentos padrão
        const rotasData = await databaseService.select('rota');
        const veiculos = await databaseService.select('veiculo');
        const funcionarios = await databaseService.select('funcionario');
        const clientes = await databaseService.select('cliente');

        const data = rotasData.map(rota => ({
          ...rota,
          veiculo: veiculos.find(v => v.id === rota.veiculo_id) || {},
          funcionario: funcionarios.find(f => f.id === rota.funcionario_id) || {},
          // Transforma clientes_id (string) em array e busca os clientes
          clientes_id: rota.clientes_id ? JSON.parse(rota.clientes_id) : [],
          clientes: rota.clientes_id 
            ? JSON.parse(rota.clientes_id).map(id => 
                clientes.find(c => c.id === id) || { nome: 'Cliente não encontrado' }
              )
            : []
        }));

        // Ordenar por data
        data.sort((a, b) => new Date(a.data_rota) - new Date(b.data_rota));
        setRotas(data || []);
      } else {
        // Versão original com Supabase
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
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
      // Se falhar com Supabase, tenta com dados locais
      if (!useLocalData) setUseLocalData(true);
    } finally {
      setLoading(false);
    }
  };

  const updateRotaStatus = async (id, status) => {
    try {
      if (useLocalData) {
        await databaseService.update('rota', { status }, 'id = ?', [id]);
      } else {
        const { error } = await supabase
          .from('rota')
          .update({ status })
          .eq('id', id);
        
        if (error) throw error;
      }
      await fetchRotas();
    } catch (error) {
      Alert.alert('Erro', `Não foi possível atualizar a rota: ${error.message}`);
    }
  };

  const iniciarRota = async (id) => {
    await updateRotaStatus(id, 'em_andamento');
  };

  const concluirRota = async (id) => {
    await updateRotaStatus(id, 'concluida');
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
            await updateRotaStatus(id, 'cancelada');
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
        style={[
          styles.itemBox,
          useLocalData && { borderLeftWidth: 3, borderLeftColor: '#4CAF50' }
        ]}
        onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>
            {item.nome}
            {useLocalData && ' 📱'} {/* Ícone para dados locais */}
          </Text>
          <Text style={styles.itemSubtitle}>{item.destino}</Text>
        </View>
        
        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            {renderStatus(item.status)}
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Data:</Text>
              <Text style={styles.detailValue}>{new Date(item.data_rota).toLocaleDateString('pt-BR')}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Horário:</Text>
              <Text style={styles.detailValue}>{formatTime(item.horario_partida)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Distância:</Text>
              <Text style={styles.detailValue}>{item.distancia} km</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tempo estimado:</Text>
              <Text style={styles.detailValue}>{item.tempo_medio_minutos} min</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Veículo:</Text>
              <Text style={styles.detailValue}>{item.veiculo?.modelo || 'N/A'} ({item.veiculo?.placa || '---'})</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Motorista:</Text>
              <Text style={styles.detailValue}>{item.funcionario?.nome || 'Não informado'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Clientes:</Text>
              <Text style={styles.detailValue}>
                {item.clientes?.length || 0} cliente(s)
              </Text>
            </View>
            
            {item.observacao && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Obs:</Text>
                <Text style={styles.detailValue}>{item.observacao}</Text>
              </View>
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
          <View style={styles.headerRightActions}>
            <TouchableOpacity 
              onPress={() => setUseLocalData(!useLocalData)}
              style={styles.dataSourceToggle}
            >
              <Text style={styles.dataSourceText}>
                {useLocalData ? 'Usar Nuvem' : 'Usar Local'}
              </Text>
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
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('CadastroRotas')}
        >
          <Text style={styles.buttonText}>NOVA ROTA</Text>
        </TouchableOpacity>

        {/* Navbar de filtro por nome */}
        <View style={{ marginVertical: 10 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#fff',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#ccc',
            paddingHorizontal: 10,
            marginHorizontal: 5
          }}>
            <Image
              source={require('../../Assets/search.png')}
              style={{ width: 20, height: 20, marginRight: 8 }}
              resizeMode="contain"
            />
            <TextInput
              style={{ flex: 1, height: 40 }}
              placeholder="Filtrar por nome da rota..."
              value={filterText}
              onChangeText={setFilterText}
              placeholderTextColor="#888"
            />
            {filterText.length > 0 && (
              <TouchableOpacity onPress={() => setFilterText('')}>
                <Text style={{ color: '#2196F3', fontWeight: 'bold', marginLeft: 8 }}>Limpar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <Text style={styles.emptyText}>Carregando rotas...</Text>
        ) : (
          <FlatList
            data={rotas.filter(r => r.nome?.toLowerCase().includes(filterText.toLowerCase()))}
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