import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import styles from '../../styles/EstilosdeEntidade';

export default function CargosFuncoesScreen({ navigation }) {
  const [dados, setDados] = useState({
    cargos: [],
    funcoes: [],
    abaAtiva: 'cargos' // 'cargos' ou 'funcoes'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    setLoading(true);
    try {
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
    } catch (error) {
      Alert.alert('Erro', error.message);
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
              const { error } = await supabase
                .from(tipo)
                .delete()
                .eq('id', id);
              
              if (error) throw error;
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
        style={styles.itemBox}
        onPress={() => navigation.navigate('DetalhesCargoFuncao', { 
          id: item.id, 
          tipo,
          nome: item.nome,
          descricao: item.descricao 
        })}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{item.nome}</Text>
          {item.descricao && (
            <Text style={styles.itemSubtitle} numberOfLines={1}>
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

        {loading ? (
          <Text style={styles.emptyText}>Carregando...</Text>
        ) : (
          <FlatList
            data={dados.abaAtiva === 'cargos' ? dados.cargos : dados.funcoes}
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