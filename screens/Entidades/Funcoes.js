import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import { databaseService } from '../../services/localDatabase';
import styles from '../../styles/EstilosdeEntidade';

export default function FuncoesScreen({ navigation }) {
  const [funcoes, setFuncoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useLocalData, setUseLocalData] = useState(false);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    fetchFuncoes();
  }, [useLocalData]);

  const fetchFuncoes = async () => {
    setLoading(true);
    try {
      if (useLocalData) {
        const funcoesData = await databaseService.select('funcao');
        setFuncoes(funcoesData || []);
      } else {
        const { data, error } = await supabase
          .from('funcao')
          .select('id, nome, descricao')
          .order('nome');
        if (error) throw error;
        setFuncoes(data || []);
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
      if (!useLocalData) setUseLocalData(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Excluir Função',
      'Tem certeza que deseja excluir esta função?',
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          onPress: async () => {
            try {
              if (useLocalData) {
                await databaseService.delete('funcao', 'id = ?', [id]);
              } else {
                const { error } = await supabase
                  .from('funcao')
                  .delete()
                  .eq('id', id);
                if (error) throw error;
              }
              await fetchFuncoes();
            } catch (error) {
              Alert.alert('Erro', `Não foi possível excluir: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={[
          styles.itemBox,
          useLocalData && { borderLeftWidth: 3, borderLeftColor: '#4CAF50' }
        ]}
      
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>
            {item.nome}
            {useLocalData && ' 📱'}
          </Text>
          {item.descricao && (
            <Text style={styles.itemSubtitle} numberOfLines={2}>
              {item.descricao}
            </Text>
          )}
        </View>
        
        <View style={styles.itemActions}>
          <TouchableOpacity 
            onPress={() => handleDelete(item.id)}
            style={{ marginLeft: 15 }}
          >
            <Text style={[styles.actionText, { color: '#f44336' }]}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );

  // Filtrar funções pelo nome
  const funcoesFiltradas = funcoes.filter(item =>
    item.nome.toLowerCase().includes(filterText.toLowerCase())
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
          onPress={() => navigation.navigate('CadastroFuncoes', { tipo: 'funcoes' })}
        >
          <Text style={styles.buttonText}>NOVA FUNÇÃO</Text>
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
            height: 40
          }}>
            <Image
              source={require('../../Assets/search.png')}
              style={{ width: 20, height: 20, marginRight: 8 }}
              resizeMode="contain"
            />
            <TextInput
              style={{ flex: 1, fontSize: 16 }}
              placeholder="Filtrar funções por nome"
              value={filterText}
              onChangeText={setFilterText}
              placeholderTextColor="#888"
            />
          </View>
        </View>

        {loading ? (
          <Text style={styles.emptyText}>Carregando...</Text>
        ) : (
          <FlatList
            data={funcoesFiltradas}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhuma função registrada.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}
