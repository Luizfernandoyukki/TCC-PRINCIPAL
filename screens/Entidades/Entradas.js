import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import styles from '../../styles/EstilosdeEntidade';

export default function EntradasScreen({ navigation }) {
  const [entradas, setEntradas] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntradas();
  }, []);

  const fetchEntradas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('entrada')
        .select(`
          id,
          quantidade,
          data_entrada,
          fornecedor,
          nota,
          observacao,
          criado_em,
          estoque:estoque_id(nome, numero_serie),
          responsavel:responsavel_id(nome)
        `)
        .order('data_entrada', { ascending: false });

      if (error) throw error;
      setEntradas(data || []);
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const deleteEntrada = async (id) => {
    Alert.alert(
      "Excluir Entrada",
      "Tem certeza que deseja excluir este registro de entrada?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Excluir", 
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('entrada')
                .delete()
                .eq('id', id);
              
              if (error) throw error;
              await fetchEntradas();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a entrada: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const renderNotaFiscal = (nota) => {
    return nota ? (
      <Text style={[styles.itemDetail, styles.checkIcon]}>✓ Com nota fiscal</Text>
    ) : (
      <Text style={[styles.itemDetail, styles.xIcon]}>✗ Sem nota fiscal</Text>
    );
  };

  const renderEntradaItem = ({ item }) => (
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
                deleteEntrada(item.id);
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
            <Text style={styles.itemDetail}>Data: {new Date(item.data_entrada).toLocaleDateString('pt-BR')}</Text>
            {item.fornecedor && (
              <Text style={styles.itemDetail}>Fornecedor: {item.fornecedor}</Text>
            )}
            {renderNotaFiscal(item.nota)}
            <Text style={styles.itemDetail}>Responsável: {item.responsavel.nome}</Text>
            {item.observacao && (
              <Text style={styles.itemDetail}>Obs: {item.observacao}</Text>
            )}
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => navigation.navigate('DetalhesEntrada', { id: item.id })}
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
          onPress={() => navigation.navigate('CadastroEntradas')}
        >
          <Text style={styles.buttonText}>NOVA ENTRADA</Text>
        </TouchableOpacity>

        {loading ? (
          <Text style={styles.emptyText}>Carregando entradas...</Text>
        ) : (
          <FlatList
            data={entradas}
            keyExtractor={item => item.id}
            renderItem={renderEntradaItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhuma entrada registrada.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}