import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import styles from '../../styles/EstilosdeEntidade';

export default function EntregasScreen({ navigation }) {
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
    } catch (error) {
      Alert.alert('Erro', error.message);
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
            <Text style={styles.itemTitle}>{item.estoque.nome}</Text>
            <Text style={styles.itemSubtitle}>Cliente: {item.cliente.nome}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.itemQuantity}>{item.quantidade} un.</Text>
          </View>
        </View>
        
        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            {renderStatus(item.status)}
            {renderNotaFiscal(item.nota)}
            
            <Text style={styles.itemDetail}>N° Série: {item.estoque.numero_serie || 'N/A'}</Text>
            <Text style={styles.itemDetail}>Saída: {new Date(item.data_saida).toLocaleString('pt-BR')}</Text>
            
            {item.data_entrega && (
              <Text style={styles.itemDetail}>Entrega: {new Date(item.data_entrega).toLocaleString('pt-BR')}</Text>
            )}
            
            <Text style={styles.itemDetail}>Veículo: {item.veiculo.modelo} ({item.veiculo.placa})</Text>
            <Text style={styles.itemDetail}>Responsável: {item.funcionario.nome}</Text>
            
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
              source={require('../../Assets/EXP.png')} 
              style={styles.alerta}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('CadastroEntrega')}
        >
          <Text style={styles.buttonText}>+ NOVA ENTREGA</Text>
        </TouchableOpacity>

        {loading ? (
          <Text style={styles.emptyText}>Carregando entregas...</Text>
        ) : (
          <FlatList
            data={entregas}
            keyExtractor={item => item.id}
            renderItem={renderEntregaItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhuma entrega registrada.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}