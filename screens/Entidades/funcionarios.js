import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import { databaseService } from '../../services/localDatabase';
import styles from '../../styles/EstilosdeEntidade';

export default function FuncionariosScreen({ navigation }) {
  const [funcionarios, setFuncionarios] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useLocalData, setUseLocalData] = useState(false);

  useEffect(() => {
    fetchFuncionarios();
  }, [useLocalData]);

  const fetchFuncionarios = async () => {
    setLoading(true);
    try {
      if (useLocalData) {
        // Versão local com relacionamentos padrão
        const funcionariosData = await databaseService.select('funcionario');
        const enderecos = await databaseService.select('endereco');
        const cargos = await databaseService.select('cargo');
        const funcoes = await databaseService.select('funcao');
        const generos = await databaseService.select('genero');
        
        // Busca os superiores separadamente
        const superiores = await databaseService.select('funcionario');

        const data = funcionariosData.map(func => ({
          ...func,
          endereco: enderecos.find(e => e.id === func.endereco_id) || null,
          cargo: cargos.find(c => c.id === func.cargo_id) || null,
          funcao: funcoes.find(f => f.id === func.funcao_id) || null,
          genero: generos.find(g => g.id === func.genero_id) || null,
          superior: superiores.find(s => s.id === func.superior_id) || null
        }));

        // Ordenar por nome
        data.sort((a, b) => a.nome.localeCompare(b.nome));
        setFuncionarios(data || []);
      } else {
        // Versão original com Supabase
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
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
      // Se falhar com Supabase, tenta com dados locais
      if (!useLocalData) setUseLocalData(true);
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
              if (useLocalData) {
                // No local, podemos deletar ou marcar como inativo
                await databaseService.update('funcionario', 
                  { data_demissao: new Date().toISOString() }, 
                  'id = ?', 
                  [id]
                );
              } else {
                const { error } = await supabase
                  .from('funcionario')
                  .update({ data_demissao: new Date().toISOString() })
                  .eq('id', id);
                
                if (error) throw error;
              }
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
          item.data_demissao && { backgroundColor: '#ffeeee' },
          useLocalData && { borderLeftWidth: 3, borderLeftColor: '#4CAF50' }
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
              <Text style={styles.itemSubtitle}>
                {item.cargo?.nome || 'Sem cargo'}
                {useLocalData && ' 📱'} {/* Ícone para dados locais */}
              </Text>
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
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Informações Pessoais</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>CPF:</Text>
                <Text style={styles.detailValue}>{item.cpf || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>RG:</Text>
                <Text style={styles.detailValue}>{item.rg || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Gênero:</Text>
                <Text style={styles.detailValue}>{item.genero?.nome || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nascimento:</Text>
                <Text style={styles.detailValue}>{formatDate(item.data_nascimento)}</Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Informações Profissionais</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>CTPS:</Text>
                <Text style={styles.detailValue}>{item.ctps || 'N/A'}</Text>
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
                <Text style={styles.detailLabel}>Dependentes:</Text>
                <Text style={styles.detailValue}>{item.numero_dependentes || 0}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Função:</Text>
                <Text style={styles.detailValue}>{item.funcao?.nome || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cargo:</Text>
                <Text style={styles.detailValue}>{item.cargo?.nome || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Superior:</Text>
                <Text style={styles.detailValue}>{item.superior?.nome || 'N/A'}</Text>
              </View>
            </View>

            {item.endereco && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Endereço</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Rua:</Text>
                  <Text style={styles.detailValue}>{item.endereco.rua}, {item.endereco.numero}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bairro:</Text>
                  <Text style={styles.detailValue}>{item.endereco.bairro}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cidade:</Text>
                  <Text style={styles.detailValue}>{item.endereco.cidade}/{item.endereco.uf}</Text>
                </View>
              </View>
            )}

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