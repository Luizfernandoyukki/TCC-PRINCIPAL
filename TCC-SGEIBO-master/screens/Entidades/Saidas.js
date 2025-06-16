import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import styles from '../../styles/EstilosdeEntidade';

export default function SaidasScreen({ navigation }) {
  const [saidas, setSaidas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaidas();
  }, []);

  const fetchSaidas = async () => {
    setLoading(true);
    try {
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
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
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

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemBox}
      onPress={() => navigation.navigate('DetalhesSaida', { saidaId: item.id })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.itemText}>
          {item.quantidade}x {item.estoque.nome}
        </Text>
        {renderTipo(item.tipo)}
      </View>
      
      {item.cliente && (
        <Text style={styles.itemDetail}>Cliente: {item.cliente.nome}</Text>
      )}
      
      {item.veiculo && (
        <Text style={styles.itemDetail}>Veículo: {item.veiculo.placa}</Text>
      )}
      
      <Text style={styles.itemDetail}>
        Data: {new Date(item.data_saida).toLocaleDateString('pt-BR')}
      </Text>
      
      {item.nota && (
        <Text style={[styles.itemDetail, { color: 'green' }]}>Com nota fiscal</Text>
      )}
    </TouchableOpacity>
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
          onPress={() => navigation.navigate('CadastroSaida')}
        >
          <Text style={styles.buttonText}>CRIAR BAIXA</Text>
        </TouchableOpacity>

        {loading ? (
          <Text style={styles.emptyText}>Carregando saídas...</Text>
        ) : (
          <FlatList
            data={saidas}
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