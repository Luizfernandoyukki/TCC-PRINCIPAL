import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import { databaseService } from '../../services/localDatabase';
import styles from '../../styles/EstilosdeEntidade';

export default function EstoqueScreen({ navigation }) {
  const [itens, setItens] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useLocalData, setUseLocalData] = useState(false);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    fetchItensEstoque();
  }, [useLocalData]);

  const fetchItensEstoque = async () => {
    setLoading(true);
    try {
      if (useLocalData) {
        const estoqueData = await databaseService.select('estoque');
        const clientes = await databaseService.select('cliente');
        const funcionarios = await databaseService.select('funcionario');

        const data = estoqueData.map(item => ({
          ...item,
          cliente: clientes.find(c => c.id === item.cliente_id) || null,
          funcionario: funcionarios.find(f => f.id === item.funcionario_id) || null
        }));

        data.sort((a, b) => a.nome.localeCompare(b.nome));
        setItens(data || []);
      } else {
        const { data, error } = await supabase
          .from('estoque')
          .select(`
            id,
            nome,
            quantidade,
            quantidade_reservada,
            numero_serie,
            tipo,
            data_validade,
            valor,
            modalidade,
            observacao,
            disponivel_geral,
            cliente:cliente_id(nome),
            funcionario:funcionario_id(nome)
          `)
          .order('nome', { ascending: true });

        if (error) throw error;
        setItens(data || []);
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
      if (!useLocalData) setUseLocalData(true);
    } finally {
      setLoading(false);
    }
  };

  const calcularDisponivel = (quantidade, reservada) => {
    return quantidade - reservada;
  };

  const renderItem = ({ item }) => {
    const disponivel = calcularDisponivel(item.quantidade, item.quantidade_reservada);
    const estaDisponivel = disponivel > 0 && item.disponivel_geral;
    const estaVencido = item.data_validade && new Date(item.data_validade) < new Date();

    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity 
          style={[
            styles.itemBox,
            !item.disponivel_geral && { backgroundColor: '#ffeeee' },
            estaVencido && { borderLeftWidth: 4, borderLeftColor: '#F44336' }
          ]}
          onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
        >
          <View style={styles.itemHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.nome}</Text>
              <Text style={styles.itemSubtitle}>
                {item.tipo || 'Sem tipo definido'}
                {useLocalData && ' 📱'}
              </Text>
            </View>
            
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[
                styles.itemQuantity,
                { color: estaDisponivel ? '#4CAF50' : '#F44336' }
              ]}>
                {disponivel} disp.
              </Text>
              {!item.disponivel_geral && (
                <Text style={styles.itemStatus}>INDISPONÍVEL</Text>
              )}
            </View>
          </View>

          {expandedId === item.id && (
            <View style={styles.expandedContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total:</Text>
                <Text style={styles.detailValue}>{item.quantidade}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reservado:</Text>
                <Text style={styles.detailValue}>{item.quantidade_reservada}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Disponível:</Text>
                <Text style={[styles.detailValue, { color: estaDisponivel ? '#4CAF50' : '#F44336' }]}>
                  {disponivel}
                </Text>
              </View>
              
              {item.valor && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Valor unitário:</Text>
                  <Text style={styles.detailValue}>R$ {item.valor.toFixed(2)}</Text>
                </View>
              )}
              
              {item.numero_serie && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>N° Série:</Text>
                  <Text style={styles.detailValue}>{item.numero_serie}</Text>
                </View>
              )}
              
              {item.data_validade && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Validade:</Text>
                  <Text style={[
                    styles.detailValue,
                    estaVencido && { color: '#F44336' }
                  ]}>
                    {new Date(item.data_validade).toLocaleDateString('pt-BR')}
                    {estaVencido && ' (VENCIDO)'}
                  </Text>
                </View>
              )}
              
              {item.cliente && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cliente:</Text>
                  <Text style={styles.detailValue}>{item.cliente.nome}</Text>
                </View>
              )}
              
              {item.funcionario && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Responsável:</Text>
                  <Text style={styles.detailValue}>{item.funcionario.nome}</Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Filtra os itens pelo nome digitado
  const itensFiltrados = itens.filter(item =>
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
            <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipalPDO')}>
              <Image 
                source={require('../../Assets/PDO.png')} 
                style={styles.alerta}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        
        <View style={styles.navbarFiltro}>
          <Text style={styles.filtroLabel}>Filtrar por nome:</Text>
          <View style={styles.filtroInputContainer}>
            <Image
              source={require('../../Assets/search.png')}
              style={styles.filtroIcon}
              resizeMode="contain"
            />
            <TextInput
              style={styles.filtroInput}
              placeholder="Digite o nome do item"
              value={filterText}
              onChangeText={setFilterText}
              placeholderTextColor="#888"
            />
          </View>
        </View>

        {loading ? (
          <Text style={styles.emptyText}>Carregando itens...</Text>
        ) : (
          <FlatList
            data={itensFiltrados}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum item cadastrado.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
};
