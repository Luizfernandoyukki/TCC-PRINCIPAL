import { useEffect, useState } from 'react';
import { FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import styles from '../../styles/EstilosdeEntidade';

export default function VeiculosMTRScreen({ navigation }) {
  const [veiculos, setVeiculos] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVeiculos();
  }, []);

  const fetchVeiculos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('veiculo')
        .select(`
          id,
          placa,
          modelo,
          capacidade_kg,
          funcao:funcao_veiculo_id(nome)
        `)
        .order('modelo', { ascending: true });

      if (error) throw error;
      setVeiculos(data || []);
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.itemBox}
        onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.modelo}</Text>
          <Text style={styles.itemSubtitle}>{item.placa}</Text>
        </View>
        
        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            <Text style={styles.itemDetail}>Função: {item.funcao?.nome || 'Não definida'}</Text>
            {item.capacidade_kg && (
              <Text style={styles.itemDetail}>Capacidade: {item.capacidade_kg} kg</Text>
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

      <View style={styles.content}>
        {loading ? (
          <Text style={styles.emptyText}>Carregando veículos...</Text>
        ) : (
          <FlatList
            data={veiculos}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum veículo registrado.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}