import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import { databaseService } from '../../services/localDatabase';
import styles from '../../styles/EstilosdeEntidade';

export default function CargosFuncoesScreen({ navigation }) {
  const [dados, setDados] = useState({
    cargos: [],
    funcoes: [],
    abaAtiva: 'cargos' // 'cargos' ou 'funcoes'
  });
  const [loading, setLoading] = useState(true);
  const [useLocalData, setUseLocalData] = useState(false);

  useEffect(() => {
    fetchDados();
  }, [useLocalData]);

  const fetchDados = async () => {
    setLoading(true);
    try {
      if (useLocalData) {
        // Versão local
        const [cargos, funcoes] = await Promise.all([
          databaseService.select('cargo'),
          databaseService.select('funcao')
        ]);

        setDados({
          cargos: cargos || [],
          funcoes: funcoes || [],
          abaAtiva: dados.abaAtiva
        });
      } else {
        // Versão Supabase
        const [cargos, funcoes] = await Promise.all([
          supabase.from('cargo').select('id, nome, descricao').order('nome'),
          supabase.from('funcao').select('id, nome, descricao').order('nome')
        ]);

        if (cargos.error || funcoes.error) throw cargos.error || funcoes.error;

        setDados({
          cargos: cargos.data || [],
          funcoes: funcoes.data || [],
          abaAtiva: dados.abaAtiva
        });
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
      // Se falhar com Supabase, tenta com dados locais
      if (!useLocalData) setUseLocalData(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, tipo) => {
    Alert.alert(
      `Excluir ${tipo === 'cargos' ? 'Cargo' : 'Função'}`,
      `Tem certeza que deseja excluir este ${tipo === 'cargos' ? 'cargo' : 'função'}?`,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Excluir", 
          onPress: async () => {
            try {
              if (useLocalData) {
                await databaseService.delete(tipo, 'id = ?', [id]);
              } else {
                const { error } = await supabase
                  .from(tipo)
                  .delete()
                  .eq('id', id);
                
                if (error) throw error;
              }
              await fetchDados();
            } catch (error) {
              Alert.alert('Erro', `Não foi possível excluir: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item, tipo }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={[
          styles.itemBox,
          useLocalData && { borderLeftWidth: 3, borderLeftColor: '#4CAF50' }
        ]}
        onPress={() => navigation.navigate('DetalhesCargoFuncao', { 
          id: item.id, 
          tipo,
          nome: item.nome,
          descricao: item.descricao 
        })}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>
            {item.nome}
            {useLocalData && ' 📱'} {/* Ícone para dados locais */}
          </Text>
          {item.descricao && (
            <Text style={styles.itemSubtitle} numberOfLines={2}>
              {item.descricao}
            </Text>
          )}
        </View>
        
        <View style={styles.itemActions}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('EditarCargoFuncao', { 
              id: item.id, 
              tipo,
              nome: item.nome,
              descricao: item.descricao 
            })}
          >
            <Text style={styles.actionText}>Editar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => handleDelete(item.id, tipo)}
            style={{ marginLeft: 15 }}
          >
            <Text style={[styles.actionText, { color: '#f44336' }]}>Excluir</Text>
          </TouchableOpacity>
        </View>
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
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              dados.abaAtiva === 'cargos' && styles.tabButtonActive
            ]}
            onPress={() => setDados({...dados, abaAtiva: 'cargos'})}
          >
            <Text style={[
              styles.tabButtonText,
              dados.abaAtiva === 'cargos' && styles.tabButtonTextActive
            ]}>
              CARGOS
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              dados.abaAtiva === 'funcoes' && styles.tabButtonActive
            ]}
            onPress={() => setDados({...dados, abaAtiva: 'funcoes'})}
          >
            <Text style={[
              styles.tabButtonText,
              dados.abaAtiva === 'funcoes' && styles.tabButtonTextActive
            ]}>
              FUNÇÕES
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate(
            'CadastroFuncoes', 
            { tipo: dados.abaAtiva }
          )}
        >
          <Text style={styles.buttonText}>
            NOVO {dados.abaAtiva === 'cargos' ? 'CARGO' : 'FUNÇÃO'}
          </Text>
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
              placeholder={`Filtrar ${dados.abaAtiva === 'cargos' ? 'cargos' : 'funções'} por nome`}
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
            data={
              (dados.abaAtiva === 'cargos' ? dados.cargos : dados.funcoes)
                .filter(item =>
                  item.nome.toLowerCase().includes((filterText || '').toLowerCase())
                )
            }
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => renderItem({ item, tipo: dados.abaAtiva })}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Nenhum {dados.abaAtiva === 'cargos' ? 'cargo' : 'função'} registrado.
              </Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}