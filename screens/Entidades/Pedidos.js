import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import { databaseService } from '../../services/localDatabase';
import styles from '../../styles/EstilosdeEntidade';

export default function PedidosScreen({ navigation }) {
  const [pedidos, setPedidos] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useLocalData, setUseLocalData] = useState(false);

  useEffect(() => {
    fetchPedidos();
  }, [useLocalData]);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      if (useLocalData) {
        // Versão local com relacionamentos padrão
        const pedidosData = await databaseService.select('pedido');
        const estoques = await databaseService.select('estoque');
        const clientes = await databaseService.select('cliente');
        const funcionarios = await databaseService.select('funcionario');

        const data = pedidosData.map(pedido => ({
          ...pedido,
          estoque: estoques.find(e => e.id === pedido.estoque_id) || {},
          cliente: clientes.find(c => c.id === pedido.cliente_id) || {},
          funcionario: funcionarios.find(f => f.id === pedido.criado_por) || {}
        }));

        // Ordenar por data decrescente
        data.sort((a, b) => new Date(b.data_pedido) - new Date(a.data_pedido));
        setPedidos(data || []);
      } else {
        // Versão original com Supabase
        const { data, error } = await supabase
          .from('pedido')
          .select(`
            id,
            quantidade,
            nota,
            status,
            data_pedido,
            observacao,
            estoque:estoque_id(nome, quantidade, quantidade_reservada),
            cliente:cliente_id(nome),
            funcionario:criado_por(nome)
          `)
          .order('data_pedido', { ascending: false });

        if (error) throw error;
        setPedidos(data || []);
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
      // Se falhar com Supabase, tenta com dados locais
      if (!useLocalData) setUseLocalData(true);
    } finally {
      setLoading(false);
    }
  };

  const despacharPedido = async (id) => {
    Alert.alert(
      "Despachar Pedido",
      "Confirmar despacho deste pedido? Esta ação não pode ser desfeita.",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Despachar", 
          onPress: async () => {
            try {
              const pedido = pedidos.find(p => p.id === id);
              if (!pedido) throw new Error('Pedido não encontrado');

              if (useLocalData) {
                // Atualiza localmente
                await databaseService.update('pedido', 
                  { status: 'despachado' }, 
                  'id = ?', 
                  [id]
                );

                // Atualiza estoque local
                const novaQuantidade = pedido.estoque.quantidade - pedido.quantidade;
                const novaQuantidadeReservada = pedido.estoque.quantidade_reservada - pedido.quantidade;
                
                await databaseService.update('estoque',
                  {
                    quantidade: novaQuantidade,
                    quantidade_reservada: novaQuantidadeReservada
                  },
                  'id = ?',
                  [pedido.estoque_id]
                );
              } else {
                // Versão Supabase
                await supabase
                  .from('pedido')
                  .update({ status: 'despachado' })
                  .eq('id', id);
                
                const novaQuantidadeReservada = pedido.estoque.quantidade_reservada - pedido.quantidade;
                
                await supabase
                  .from('estoque')
                  .update({ 
                    quantidade_reservada: novaQuantidadeReservada,
                    quantidade: pedido.estoque.quantidade - pedido.quantidade
                  })
                  .eq('id', pedido.estoque_id);
              }

              await fetchPedidos();
              Alert.alert("Sucesso", "Pedido despachado com sucesso!");
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível despachar o pedido: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const cancelarPedido = async (id) => {
    Alert.alert(
      "Cancelar Pedido",
      "Confirmar cancelamento deste pedido?",
      [
        {
          text: "Voltar",
          style: "cancel"
        },
        { 
          text: "Cancelar Pedido", 
          onPress: async () => {
            try {
              const pedido = pedidos.find(p => p.id === id);
              if (!pedido) throw new Error('Pedido não encontrado');

              if (useLocalData) {
                // Atualiza localmente
                await databaseService.update('pedido', 
                  { status: 'cancelado' }, 
                  'id = ?', 
                  [id]
                );

                // Atualiza estoque local
                const novaQuantidadeReservada = pedido.estoque.quantidade_reservada - pedido.quantidade;
                
                await databaseService.update('estoque',
                  { quantidade_reservada: novaQuantidadeReservada },
                  'id = ?',
                  [pedido.estoque_id]
                );
              } else {
                // Versão Supabase
                await supabase
                  .from('pedido')
                  .update({ status: 'cancelado' })
                  .eq('id', id);
                
                const novaQuantidadeReservada = pedido.estoque.quantidade_reservada - pedido.quantidade;
                
                await supabase
                  .from('estoque')
                  .update({ quantidade_reservada: novaQuantidadeReservada })
                  .eq('id', pedido.estoque_id);
              }

              await fetchPedidos();
              Alert.alert("Sucesso", "Pedido cancelado com sucesso!");
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível cancelar o pedido: ' + error.message);
            }
          }
        }
      ]
    );
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
        style={[
          styles.itemBox,
          useLocalData && { borderLeftWidth: 3, borderLeftColor: '#4CAF50' }
        ]}
        onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>
            {item.estoque?.nome || 'Produto não encontrado'}
            {useLocalData && ' 📱'} {/* Ícone para dados locais */}
          </Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.itemQuantity}>{item.quantidade} un.</Text>
            {renderStatus(item.status)}
          </View>
        </View>
        
        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cliente:</Text>
              <Text style={styles.detailValue}>{item.cliente?.nome || 'Não informado'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Data:</Text>
              <Text style={styles.detailValue}>{new Date(item.data_pedido).toLocaleString('pt-BR')}</Text>
            </View>
            
            {renderNotaFiscal(item.nota)}
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estoque:</Text>
              <Text style={styles.detailValue}>
                {item.estoque?.quantidade || 0} ({item.estoque?.quantidade_reservada || 0} reservado)
              </Text>
            </View>
            
            {item.observacao && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Obs:</Text>
                <Text style={styles.detailValue}>{item.observacao}</Text>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Criado por:</Text>
              <Text style={styles.detailValue}>{item.funcionario?.nome || 'Não informado'}</Text>
            </View>
            
            <View style={styles.actionButtons}>
              {item.status === 'pendente' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.prepareButton]}
                  onPress={() => navigation.navigate('EditarPedido', { pedidoId: item.id })}
                >
                  <Text style={styles.actionButtonText}>Editar</Text>
                </TouchableOpacity>
              )}
              
              {item.status === 'preparacao' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.dispatchButton]}
                  onPress={() => despacharPedido(item.id)}
                >
                  <Text style={styles.actionButtonText}>Despachar</Text>
                </TouchableOpacity>
              )}
              
              {['pendente', 'preparacao'].includes(item.status) && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => cancelarPedido(item.id)}
                >
                  <Text style={styles.actionButtonText}>Cancelar</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => navigation.navigate('DetalhesPedido', { pedidoId: item.id })}
              >
                <Text style={styles.actionButtonText}>Detalhes</Text>
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
          onPress={() => navigation.navigate('CadastroPedidos')}
        >
          <Text style={styles.buttonText}>NOVO PEDIDO</Text>
        </TouchableOpacity>

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