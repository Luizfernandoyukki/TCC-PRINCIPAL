import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import styles from '../../styles/EstilosdeEntidade';

export default function BalancoScreen({ navigation }) {
  const [balancos, setBalancos] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalancos();
  }, []);

  const fetchBalancos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('balanco')
        .select(`
          id,
          nome,
          data,
          motivo,
          periodo,
          tipo,
          criado_em,
          usuario_id
        `)
        .order('data', { ascending: false });
      
      if (error) throw error;
      setBalancos(data || []);
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const deleteBalanco = async (id) => {
    Alert.alert(
      "Excluir Balanço",
      "Tem certeza que deseja excluir este balanço?",
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
                .from('balanco')
                .delete()
                .eq('id', id);
              
              if (error) throw error;
              await fetchBalancos();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o balanço: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const renderBalancoItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.itemBox}
        onPress={() => toggleExpand(item.id)}
      >
        {/* Cabeçalho sempre visível */}
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.nome}</Text>
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              deleteBalanco(item.id);
            }}
            style={styles.deleteIconButton}
          >
            <Text style={styles.deleteIconText}>X</Text>
          </TouchableOpacity>
        </View>
        
        {/* Conteúdo expandível */}
        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            <Text style={styles.itemDetail}>Data: {new Date(item.data).toLocaleDateString('pt-BR')}</Text>
            <Text style={styles.itemDetail}>Período: {item.periodo}</Text>
            <Text style={styles.itemDetail}>Tipo: {item.tipo}</Text>
            {item.motivo && (
              <Text style={styles.itemDetail}>Motivo: {item.motivo}</Text>
            )}
            <Text style={styles.itemDetail}>
              Criado em: {new Date(item.criado_em).toLocaleDateString('pt-BR')}
            </Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => navigation.navigate('DetalhesBalanco', { id: item.id })}
              >
                <Text style={styles.actionButtonText}>Visualizar Completo</Text>
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
          onPress={() => navigation.navigate('CadastroBalanco')}
        >
          <Text style={styles.buttonText}>EMITIR BALANÇO</Text>
        </TouchableOpacity>

        {loading ? (
          <Text style={styles.emptyText}>Carregando balanços...</Text>
        ) : (
          <FlatList
            data={balancos}
            keyExtractor={item => item.id}
            renderItem={renderBalancoItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum balanço registrado.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}