import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import styles from '../../styles/EstilosdeEntidade';

export default function EstoqueScreen({ navigation }) {
  const [itens, setItens] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItensEstoque();
  }, []);

  const fetchItensEstoque = async () => {
    setLoading(true);
    try {
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
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const calcularDisponivel = (quantidade, reservada) => {
    return quantidade - reservada;
  };

  const handleDeleteItem = async (id) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja remover este item do estoque?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Remover',
          onPress: async () => {
            const { error } = await supabase
              .from('estoque')
              .delete()
              .eq('id', id);
            
            if (!error) {
              fetchItensEstoque();
            } else {
              Alert.alert('Erro', 'Não foi possível remover o item');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const disponivel = calcularDisponivel(item.quantidade, item.quantidade_reservada);
    const estaDisponivel = disponivel > 0 && item.disponivel_geral;

    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity 
          style={[
            styles.itemBox,
            !item.disponivel_geral && { backgroundColor: '#f5f5f5' }
          ]}
          onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
        >
          <View style={styles.itemHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.nome}</Text>
              <Text style={styles.itemSubtitle}>{item.tipo || 'Sem tipo definido'}</Text>
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
              <Text style={styles.itemDetail}>Total em estoque: {item.quantidade}</Text>
              <Text style={styles.itemDetail}>Reservado: {item.quantidade_reservada}</Text>
              <Text style={styles.itemDetail}>Valor unitário: R$ {item.valor?.toFixed(2)}</Text>
              
              {item.numero_serie && (
                <Text style={styles.itemDetail}>N° Série: {item.numero_serie}</Text>
              )}
              
              {item.data_validade && (
                <Text style={[
                  styles.itemDetail,
                  new Date(item.data_validade) < new Date() && { color: '#F44336' }
                ]}>
                  Validade: {new Date(item.data_validade).toLocaleDateString('pt-BR')}
                  {new Date(item.data_validade) < new Date() && ' (VENCIDO)'}
                </Text>
              )}
              
              {item.cliente && (
                <Text style={styles.itemDetail}>Cliente: {item.cliente.nome}</Text>
              )}
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.viewButton]}
                  onPress={() => navigation.navigate('MovimentarEstoque', { itemId: item.id })}
                >
                  <Text style={styles.actionButtonText}>Movimentar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => navigation.navigate('EditarEstoque', { itemId: item.id })}
                >
                  <Text style={styles.actionButtonText}>Editar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteItem(item.id)}
                >
                  <Text style={styles.actionButtonText}>Remover</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

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
              source={require('../../Assets/EXP.png')} 
              style={styles.alerta}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('CadastroEstoque')}
        >
          <Text style={styles.buttonText}>CADASTRAR ITEM</Text>
        </TouchableOpacity>

        {loading ? (
          <Text style={styles.emptyText}>Carregando itens...</Text>
        ) : (
          <FlatList
            data={itens}
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
}