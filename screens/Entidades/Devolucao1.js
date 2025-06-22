import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { databaseService } from '../../services/localDatabase';
import styles from '../../styles/EstilosdeEntidade';
import { getAllLocal } from '../../utils/localEntityService';

export default function DevolucaoScreen({ navigation }) {
  const [devolucoes, setDevolucoes] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevolucoes();
  }, []);

  const fetchDevolucoes = async () => {
    setLoading(true);
    try {
      let data = await getAllLocal('devolucao');
      const estoques = await getAllLocal('estoque');
      const funcionarios = await getAllLocal('funcionario');
      // Monta os relacionamentos manualmente
      data = data.map(dev => ({
        ...dev,
        estoque: estoques.find(e => e.id === dev.estoque_id) || {},
        responsavel: funcionarios.find(f => f.id === dev.responsavel_id) || {}
      }));
      // Ordena por data_devolucao decrescente
      data = data.sort((a, b) => new Date(b.data_devolucao) - new Date(a.data_devolucao));
      setDevolucoes(data || []);
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const deleteDevolucao = async (id) => {
    Alert.alert(
      "Excluir Devolução",
      "Tem certeza que deseja excluir este registro de devolução?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Excluir", 
          onPress: async () => {
            try {
              await databaseService.deleteById('devolucao', id);
              await fetchDevolucoes();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a devolução: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const renderDevolucaoItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.itemBox}
        onPress={() => toggleExpand(item.id)}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.estoque.nome}</Text>
          <View style={styles.headerRight}>
            <Text style={styles.itemSubtitle}>{item.quantidade} un.</Text>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                deleteDevolucao(item.id);
              }}
              style={styles.deleteIconButton}
            >
              <Text style={styles.deleteIconText}>X</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            <Text style={styles.itemDetail}>N° Série: {item.estoque.numero_serie || 'N/A'}</Text>
            <Text style={styles.itemDetail}>Motivo: {item.motivo}</Text>
            <Text style={styles.itemDetail}>Data: {new Date(item.data_devolucao).toLocaleDateString('pt-BR')}</Text>
            <Text style={styles.itemDetail}>Responsável: {item.responsavel.nome}</Text>
            {item.observacao && (
              <Text style={styles.itemDetail}>Obs: {item.observacao}</Text>
            )}
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => navigation.navigate('DetalhesDevolucao', { id: item.id })}
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
          onPress={() => navigation.navigate('CadastroDevolucao')}
        >
          <Text style={styles.buttonText}>NOVA DEVOLUÇÃO</Text>
        </TouchableOpacity>

        {loading ? (
          <Text style={styles.emptyText}>Carregando devoluções...</Text>
        ) : (
          <FlatList
            data={devolucoes}
            keyExtractor={item => item.id}
            renderItem={renderDevolucaoItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhuma devolução registrada.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}