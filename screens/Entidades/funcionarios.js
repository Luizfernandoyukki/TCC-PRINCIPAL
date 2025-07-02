import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Modal, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import { databaseService } from '../../services/localDatabase';
import styles from '../../styles/EstilosdeEntidade';

export default function FuncionariosScreen({ navigation }) {
  const [funcionarios, setFuncionarios] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalFuncionario, setModalFuncionario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useLocalData, setUseLocalData] = useState(false);
  const [filtroNome, setFiltroNome] = useState('');

  useEffect(() => {
    fetchFuncionarios();
  }, [useLocalData]);

  const fetchFuncionarios = async () => {
    setLoading(true);
    try {
      if (useLocalData) {
        const funcionariosDataRes = await databaseService.select('funcionario');
        if (!funcionariosDataRes.success) throw new Error('Erro ao buscar funcionários locais');
        const funcionariosData = funcionariosDataRes.data;

        const enderecos = (await databaseService.select('endereco')).data || [];
        const funcoes = (await databaseService.select('funcao')).data || [];
        const generos = (await databaseService.select('genero')).data || [];
        const superiores = funcionariosData;

        const data = funcionariosData.map(func => ({
          ...func,
          endereco: enderecos.find(e => e.id === func.endereco_id) || null,
          funcao: funcoes.find(f => f.id === func.funcao_id) || null,
          genero: generos.find(g => g.id === func.genero_id) || null,
          superior: superiores.find(s => s.id === func.superior_id) || null
        }));

        data.sort((a, b) => a.nome.localeCompare(b.nome));
        setFuncionarios(data);
      } else {
        const { data, error } = await supabase
          .from('funcionario')
          .select(`
            id, nome, data_nascimento, cpf, ctps, rg, data_admissao, data_demissao,
            carga_horaria, numero_dependentes, is_admin, is_superior, foto_url,
            endereco:endereco_id(rua, numero, bairro, cidade, uf),
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
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir", onPress: async () => {
            try {
              if (useLocalData) {
                await databaseService.update('funcionario',
                  { data_demissao: new Date().toISOString() },
                  'id = ?', [id]
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

  const openModal = (funcionario) => {
    setModalFuncionario(funcionario);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalFuncionario(null);
    setModalVisible(false);
  };

  const funcionariosFiltrados = funcionarios.filter(func =>
    func.nome.toLowerCase().includes(filtroNome.toLowerCase())
  );

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
              <Image source={{ uri: item.foto_url }} style={styles.funcionarioFoto} />
            )}
            <View>
              <Text style={styles.itemTitle}>{item.nome}</Text>
              <Text style={styles.itemSubtitle}>{item.funcao?.nome || 'Sem função'} {useLocalData && '📱'}</Text>
            </View>
          </View>
          <Text style={[
            styles.itemStatus,
            item.data_demissao ? styles.inactiveStatus : styles.activeStatus
          ]}>
            {item.data_demissao ? 'INATIVO' : 'ATIVO'}
          </Text>
        </View>

        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            <Text style={styles.itemDetail}>CPF: {item.cpf || 'N/A'}</Text>
            <Text style={styles.itemDetail}>RG: {item.rg || 'N/A'}</Text>
            <Text style={styles.itemDetail}>Nascimento: {formatDate(item.data_nascimento)}</Text>
            <Text style={styles.itemDetail}>Admissão: {formatDate(item.data_admissao)}</Text>
            {item.data_demissao && <Text style={styles.itemDetail}>Demissão: {formatDate(item.data_demissao)}</Text>}
            <Text style={styles.itemDetail}>Função: {item.funcao?.nome || 'N/A'}</Text>
            <Text style={styles.itemDetail}>Gênero: {item.genero?.nome || 'N/A'}</Text>
            <Text style={styles.itemDetail}>Superior: {item.superior?.nome || 'N/A'}</Text>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => openModal(item)}
              >
                <Text style={styles.actionButtonText}>Visualizar</Text>
              </TouchableOpacity>

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
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#043b57" barStyle="light-content" />

      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={require('../../Assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipalADM')}>
            <Image source={require('../../Assets/ADM.png')} style={styles.alerta} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conteúdo principal */}
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('CadastroFuncionarios')}
        >
          <Text style={styles.buttonText}>NOVO FUNCIONÁRIO</Text>
        </TouchableOpacity>

        {/* Filtro por nome */}
        <View style={styles.navbarFiltro}>
          <Text style={styles.filtroLabel}>Filtrar por nome:</Text>
          <View style={styles.filtroInputContainer}>
            <Image source={require('../../Assets/search.png')} style={styles.filtroIcon} resizeMode="contain" />
            <TextInput
              style={styles.filtroInput}
              placeholder="Digite o nome do funcionário"
              value={filtroNome}
              onChangeText={setFiltroNome}
              placeholderTextColor="#888"
            />
          </View>
        </View>

        {loading ? (
          <Text style={styles.emptyText}>Carregando funcionários...</Text>
        ) : (
          <FlatList
            data={funcionariosFiltrados}
            keyExtractor={item => item.id}
            renderItem={renderFuncionarioItem}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum funcionário registrado.</Text>}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Modal de visualização completa */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Dados do Funcionário</Text>
          {modalFuncionario && (
            <>
              <Text>Nome: {modalFuncionario.nome}</Text>
              <Text>CPF: {modalFuncionario.cpf}</Text>
              <Text>RG: {modalFuncionario.rg || '-'}</Text>
              <Text>Nascimento: {formatDate(modalFuncionario.data_nascimento)}</Text>
              <Text>Admissão: {formatDate(modalFuncionario.data_admissao)}</Text>
              <Text>Função: {modalFuncionario.funcao?.nome || '-'}</Text>
              <Text>Gênero: {modalFuncionario.genero?.nome || '-'}</Text>
              <Text>Superior: {modalFuncionario.superior?.nome || '-'}</Text>
              {modalFuncionario.endereco && (
                <>
                  <Text>Endereço: {modalFuncionario.endereco.rua}, {modalFuncionario.endereco.numero}</Text>
                  <Text>Bairro: {modalFuncionario.endereco.bairro}</Text>
                  <Text>Cidade: {modalFuncionario.endereco.cidade}/{modalFuncionario.endereco.uf}</Text>
                </>
              )}
              <TouchableOpacity style={styles.modalButtonSair} onPress={closeModal}>
                <Text style={styles.buttonText}>Fechar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}
