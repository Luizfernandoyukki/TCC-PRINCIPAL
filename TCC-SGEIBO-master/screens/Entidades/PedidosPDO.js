import { useEffect, useState } from 'react';
import { FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import styles from '../../styles/EstilosdeEntidade';

export default function PedidosPDOScreen({ navigation }) {
  const [pedidos, setPedidos] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pedido')
        .select(`
          id,
          quantidade,
          nota,
          status,
          data_pedido,
          estoque:estoque_id(nome),
          cliente:cliente_id(nome),
          funcionario:criado_por(nome)
        `)
        .order('data_pedido', { ascending: false });

      if (error) throw error;
      setPedidos(data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (status) => {
    const statusMap = {
      pendente: { text: 'Pendente', color: '#FFA500' },
      preparacao: { text: 'Em Preparação', color: '#2196F3' },
      despachado: { text: 'Despachado', color: '#4CAF50' },
      cancelado: { text: 'Cancelado', color: '#F44336' }
    };
    
    return (
      <Text style={[styles.itemDetail, { color: statusMap[status].color }]}>
        Status: {statusMap[status].text}
      </Text>
    );
  };

  const renderNotaFiscal = (nota) => {
    return nota ? (
      <Text style={[styles.itemDetail, styles.checkIcon]}>✓ Com nota fiscal</Text>
    ) : (
      <Text style={[styles.itemDetail, styles.xIcon]}>✗ Sem nota fiscal</Text>
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.itemBox}
        onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.estoque.nome}</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.itemQuantity}>{item.quantidade} un.</Text>
            {renderStatus(item.status)}
          </View>
        </View>
        
        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            <Text style={styles.itemDetail}>Cliente: {item.cliente.nome}</Text>
            <Text style={styles.itemDetail}>Data: {new Date(item.data_pedido).toLocaleString('pt-BR')}</Text>
            {renderNotaFiscal(item.nota)}
            <Text style={styles.itemDetail}>Responsável: {item.funcionario.nome}</Text>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.viewButton]}
              onPress={() => navigation.navigate('DetalhesPedido', { pedidoId: item.id })}
            >
              <Text style={styles.actionButtonText}>Ver Detalhes</Text>
            </TouchableOpacity>
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
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipalPDO')}>
            <Image 
              source={require('../../Assets/PDO.png')} 
              style={styles.alerta}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <Text style={styles.emptyText}>Carregando pedidos...</Text>
        ) : (
          <FlatList
            data={pedidos}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum pedido registrado.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}