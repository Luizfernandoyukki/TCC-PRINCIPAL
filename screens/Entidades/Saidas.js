import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import { databaseService } from '../../services/localDatabase';
import styles from '../../styles/EstilosdeEntidade';

export default function SaidasScreen({ navigation }) {
  const [saidas, setSaidas] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useLocalData, setUseLocalData] = useState(false);
const [filterText, setFilterText] = useState('');

  useEffect(() => {
    fetchSaidas();
  }, [useLocalData]);

  const fetchSaidas = async () => {
    setLoading(true);
    try {
      if (useLocalData) {
        // Versão local com relacionamentos padrão
        const saidasData = await databaseService.select('saida');
        const estoques = await databaseService.select('estoque');
        const clientes = await databaseService.select('cliente');
        const veiculos = await databaseService.select('veiculo');
        const funcionarios = await databaseService.select('funcionario');

        const data = saidasData.map(saida => ({
          ...saida,
          estoque: estoques.find(e => e.id === saida.estoque_id) || {},
          cliente: clientes.find(c => c.id === saida.cliente_id) || null,
          veiculo: veiculos.find(v => v.id === saida.veiculo_id) || null,
          funcionario: funcionarios.find(f => f.id === saida.funcionario_id) || {}
        }));

        // Ordenar por data decrescente
        data.sort((a, b) => new Date(b.data_saida) - new Date(a.data_saida));
        setSaidas(data || []);
      } else {
        // Versão original com Supabase
        const { data, error } = await supabase
          .from('saida')
          .select(`
            id,
            tipo,
            quantidade,
            data_saida,
            motivo,
            observacao,
            nota,
            estoque:estoque_id(nome),
            cliente:cliente_id(nome),
            veiculo:veiculo_id(placa),
            funcionario:funcionario_id(nome)
          `)
          .order('data_saida', { ascending: false });

        if (error) throw error;
        setSaidas(data || []);
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
      // Se falhar com Supabase, tenta com dados locais
      if (!useLocalData) setUseLocalData(true);
    } finally {
      setLoading(false);
    }
  };

  const deleteSaida = async (id) => {
    Alert.alert(
      "Excluir Saída",
      "Tem certeza que deseja excluir este registro de saída?",
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
                await databaseService.deleteById('saida', id);
              } else {
                const { error } = await supabase
                  .from('saida')
                  .delete()
                  .eq('id', id);
                
                if (error) throw error;
              }
              await fetchSaidas();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a saída: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const renderTipo = (tipo) => {
    const tipos = {
      pedido: { text: 'Pedido', color: '#4CAF50' },
      entrega: { text: 'Entrega', color: '#2196F3' },
      manual: { text: 'Manual', color: '#FF9800' }
    };
    return (
      <Text style={{ color: tipos[tipo].color, fontWeight: 'bold' }}>
        {tipos[tipo].text}
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
          <View style={styles.headerRight}>
            <Text style={styles.itemQuantity}>{item.quantidade} un.</Text>
            {renderTipo(item.tipo)}
          </View>
        </View>
        
        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tipo:</Text>
              <View style={{ flex: 1 }}>
                {renderTipo(item.tipo)}
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Data:</Text>
              <Text style={styles.detailValue}>
                {new Date(item.data_saida).toLocaleString('pt-BR')}
              </Text>
            </View>
            
            {item.cliente && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cliente:</Text>
                <Text style={styles.detailValue}>{item.cliente.nome}</Text>
              </View>
            )}
            
            {item.veiculo && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Veículo:</Text>
                <Text style={styles.detailValue}>{item.veiculo.placa}</Text>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Responsável:</Text>
              <Text style={styles.detailValue}>{item.funcionario?.nome || 'Não informado'}</Text>
            </View>
            
            {renderNotaFiscal(item.nota)}
            
            {item.motivo && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Motivo:</Text>
                <Text style={styles.detailValue}>{item.motivo}</Text>
              </View>
            )}
            
            {item.observacao && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Observação:</Text>
                <Text style={styles.detailValue}>{item.observacao}</Text>
              </View>
            )}
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => navigation.navigate('DetalhesSaida', { saidaId: item.id })}
              >
                <Text style={styles.actionButtonText}>Detalhes</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => deleteSaida(item.id)}
              >
                <Text style={styles.actionButtonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  // Estados para filtro
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  // Função para filtrar as saídas
  const filtrarSaidas = () => {
    return saidas.filter(item => {
      // Filtro por nome (estoque)
      const nomeMatch = filtroNome.trim() === '' || (item.estoque?.nome || '').toLowerCase().includes(filtroNome.trim().toLowerCase());
      // Filtro por data
      let dataMatch = true;
      if (filtroDataInicio) {
        dataMatch = dataMatch && new Date(item.data_saida) >= new Date(filtroDataInicio);
      }
      if (filtroDataFim) {
        // Considera o fim do dia
        const dataFim = new Date(filtroDataFim);
        dataFim.setHours(23, 59, 59, 999);
        dataMatch = dataMatch && new Date(item.data_saida) <= dataFim;
      }
      return nomeMatch && dataMatch;
    });
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
          onPress={() => navigation.navigate('CadastroSaida')}
        >
          <Text style={styles.buttonText}>CRIAR BAIXA</Text>
        </TouchableOpacity>

        {/* Navbar de filtro */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: 10,
          justifyContent: 'space-between',
        }}>
          <View style={{ flex: 1, marginRight: 5 }}>
            <Text style={{ fontSize: 12, color: '#555' }}>Nome</Text>
            <View style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 6,
              paddingHorizontal: 8,
              backgroundColor: '#fff',
            }}>
              <TextInput
                placeholder="Filtrar por nome"
                value={filtroNome}
                onChangeText={setFiltroNome}
                style={{ height: 36 }}
              />
            </View>
          </View>
          <View style={{ flex: 1, marginHorizontal: 5 }}>
            <Text style={{ fontSize: 12, color: '#555' }}>Data início</Text>
            <View style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 6,
              paddingHorizontal: 8,
              backgroundColor: '#fff',
            }}>
              <TextInput
                placeholder="AAAA-MM-DD"
                value={filtroDataInicio}
                onChangeText={setFiltroDataInicio}
                style={{ height: 36 }}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={{ flex: 1, marginLeft: 5 }}>
            <Text style={{ fontSize: 12, color: '#555' }}>Data fim</Text>
            <View style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 6,
              paddingHorizontal: 8,
              backgroundColor: '#fff',
            }}>
              <TextInput
                placeholder="AAAA-MM-DD"
                value={filtroDataFim}
                onChangeText={setFiltroDataFim}
                style={{ height: 36 }}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {loading ? (
          <Text style={styles.emptyText}>Carregando saídas...</Text>
        ) : (
          <FlatList
            data={filtrarSaidas()}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhuma saída registrada.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}