import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import styles from '../../styles/EstilosdeEntidade';

export default function VeiculosScreen({ navigation }) {
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
          observacao,
          funcionario:funcionario_id(nome),
          funcao:funcao_veiculo_id(nome)
        `)
        .order('modelo', { ascending: true });

      if (error) throw error;
      setVeiculos(data || []);
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteVeiculo = async (id) => {
    Alert.alert(
      "Excluir Veículo",
      "Tem certeza que deseja excluir este veículo?",
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
                .from('veiculo')
                .delete()
                .eq('id', id);
              
              if (!error) fetchVeiculos();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o veículo');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.itemBox}
        onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.modelo}</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.itemSubtitle}>{item.placa}</Text>
            {item.capacidade_kg && (
              <Text style={styles.itemDetail}>{item.capacidade_kg} kg</Text>
            )}
          </View>
        </View>
        
        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            <Text style={styles.itemDetail}>Função: {item.funcao?.nome || 'Não definida'}</Text>
            
            {item.funcionario?.nome && (
              <Text style={styles.itemDetail}>Responsável: {item.funcionario.nome}</Text>
            )}
            
            {item.capacidade_kg && (
              <Text style={styles.itemDetail}>Capacidade: {item.capacidade_kg} kg</Text>
            )}
            
            {item.observacao && (
              <Text style={styles.itemDetail}>Obs: {item.observacao}</Text>
            )}
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.editButton]}
                onPress={() => navigation.navigate('EditarVeiculo', { veiculoId: item.id })}
              >
                <Text style={styles.actionButtonText}>Editar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => deleteVeiculo(item.id)}
              >
                <Text style={styles.actionButtonText}>Excluir</Text>
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
          onPress={() => navigation.navigate('CadastroVeiculo')}
        >
          <Text style={styles.buttonText}>NOVO VEÍCULO</Text>
        </TouchableOpacity>

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