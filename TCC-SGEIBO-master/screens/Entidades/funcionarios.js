import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import styles from '../../styles/EstilosdeEntidade';

export default function FuncionariosScreen({ navigation }) {
  const [funcionarios, setFuncionarios] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFuncionarios();
  }, []);

  const fetchFuncionarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('funcionario')
        .select(`
          id,
          nome,
          data_nascimento,
          cpf,
          ctps,
          rg,
          data_admissao,
          data_demissao,
          carga_horaria,
          numero_dependentes,
          is_admin,
          is_superior,
          foto_url,
          endereco:endereco_id(
            rua,
            numero,
            bairro,
            cidade,
            uf
          ),
          cargo:cargo_id(nome),
          funcao:funcao_id(nome),
          genero:genero_id(nome),
          superior:superior_id(nome)
        `)
        .order('nome', { ascending: true });

      if (error) throw error;
      setFuncionarios(data || []);
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const deleteFuncionario = async (id) => {
    Alert.alert(
      "Excluir Funcionário",
      "Tem certeza que deseja excluir este funcionário?",
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
                .from('funcionario')
                .update({ data_demissao: new Date().toISOString() })
                .eq('id', id);
              
              if (error) throw error;
              await fetchFuncionarios();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível desativar o funcionário: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const renderFuncionarioItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={[
          styles.itemBox,
          item.data_demissao && { backgroundColor: '#f5f5f5' }
        ]}
        onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
      >
        <View style={styles.itemHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {item.foto_url && (
              <Image 
                source={{ uri: item.foto_url }}
                style={styles.funcionarioFoto}
              />
            )}
            <View>
              <Text style={styles.itemTitle}>{item.nome}</Text>
              <Text style={styles.itemSubtitle}>{item.cargo?.nome || 'Sem cargo'}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[
              styles.itemStatus,
              item.data_demissao ? styles.inactiveStatus : styles.activeStatus
            ]}>
              {item.data_demissao ? 'INATIVO' : 'ATIVO'}
            </Text>
            {item.is_admin && (
              <Text style={styles.adminBadge}>ADMIN</Text>
            )}
          </View>
        </View>
        
        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>CPF:</Text>
              <Text style={styles.detailValue}>{item.cpf}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nascimento:</Text>
              <Text style={styles.detailValue}>{formatDate(item.data_nascimento)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Admissão:</Text>
              <Text style={styles.detailValue}>{formatDate(item.data_admissao)}</Text>
            </View>
            
            {item.data_demissao && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Demissão:</Text>
                <Text style={styles.detailValue}>{formatDate(item.data_demissao)}</Text>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Carga Horária:</Text>
              <Text style={styles.detailValue}>{item.carga_horaria}h semanais</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Função:</Text>
              <Text style={styles.detailValue}>{item.funcao?.nome || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Superior:</Text>
              <Text style={styles.detailValue}>{item.superior?.nome || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Endereço:</Text>
              <Text style={styles.detailValue}>
                {item.endereco ? `${item.endereco.rua}, ${item.endereco.numero} - ${item.endereco.bairro}` : 'N/A'}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => navigation.navigate('DetalhesFuncionario', { id: item.id })}
              >
                <Text style={styles.actionButtonText}>Detalhes</Text>
              </TouchableOpacity>
              
              {!item.data_demissao && (
                <>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => navigation.navigate('EditarFuncionario', { id: item.id })}
                  >
                    <Text style={styles.actionButtonText}>Editar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => deleteFuncionario(item.id)}
                  >
                    <Text style={styles.actionButtonText}>Desativar</Text>
                  </TouchableOpacity>
                </>
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
          onPress={() => navigation.navigate('CadastroFuncionario')}
        >
          <Text style={styles.buttonText}>NOVO FUNCIONÁRIO</Text>
        </TouchableOpacity>

        {loading ? (
          <Text style={styles.emptyText}>Carregando funcionários...</Text>
        ) : (
          <FlatList
            data={funcionarios}
            keyExtractor={item => item.id}
            renderItem={renderFuncionarioItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum funcionário registrado.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}