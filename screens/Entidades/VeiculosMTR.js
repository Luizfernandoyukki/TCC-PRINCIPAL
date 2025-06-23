import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import { databaseService } from '../../services/localDatabase'; // Adicionado para operações locais
import styles from '../../styles/EstilosdeEntidade';

export default function VeiculosScreen({ navigation }) {
  const [veiculos, setVeiculos] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useLocalData, setUseLocalData] = useState(false); // Estado para alternar entre local/Supabase

  useEffect(() => {
    fetchVeiculos();
  }, [useLocalData]);

  const fetchVeiculos = async () => {
    setLoading(true);
    try {
      if (useLocalData) {
        // Versão local usando o mesmo padrão das outras telas
        const veiculosData = await databaseService.select('veiculo');
        const funcionarios = await databaseService.select('funcionario');
        const data = veiculosData.map(veiculo => ({
          ...veiculo,
          funcionario: funcionarios.find(f => f.id === veiculo.funcionario_id) || null
        }));

        // Ordenar por modelo
        data.sort((a, b) => a.modelo.localeCompare(b.modelo));
        setVeiculos(data || []);
      } else {
        // Versão original com Supabase
        const { data, error } = await supabase
          .from('veiculo')
          .select(`
            id,
            placa,
            modelo,
            capacidade_kg,
            observacao,
            funcionario:funcionario_id(nome)
          `)
          .order('modelo', { ascending: true });

        if (error) throw error;
        setVeiculos(data || []);
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
      // Se falhar com Supabase, tenta com dados locais
      if (!useLocalData) setUseLocalData(true);
    } finally {
      setLoading(false);
    }
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
            {item.modelo}
            {useLocalData && ' 📱'} {/* Ícone para dados locais */}
          </Text>
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
          <View style={styles.headerRightActions}>
            <TouchableOpacity 
              onPress={() => setUseLocalData(!useLocalData)}
              style={styles.dataSourceToggle}
            >
              <Text style={styles.dataSourceText}>
                {useLocalData ? 'Usar Nuvem' : 'Usar Local'}
              </Text>
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