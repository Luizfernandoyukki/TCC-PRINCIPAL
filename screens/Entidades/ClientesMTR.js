import { useEffect, useState } from 'react';
import { FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../contexts/supabaseClient';
import styles from '../../styles/EstilosdeEntidade';

export default function ClientesMTRScreen({ navigation }) {
  const [clientes, setClientes] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cliente')
        .select(`
          id,
          nome,
          cpf,
          cnpj,
          rg,
          tipo,
          observacao,
          created_at,
          endereco:endereco_id(
            cep,
            uf,
            cidade,
            bairro,
            rua,
            numero,
            complemento
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDocumento = (cliente) => {
    if (cliente.tipo === 'PJ') return `CNPJ: ${cliente.cnpj || 'Não informado'}`;
    return `CPF: ${cliente.cpf || 'Não informado'} | RG: ${cliente.rg || 'Não informado'}`;
  };

  const formatEndereco = (endereco) => {
    if (!endereco) return 'Endereço não cadastrado';
    return `${endereco.rua}, ${endereco.numero} - ${endereco.bairro}, ${endereco.cidade}/${endereco.uf}`;
  };

  const renderClienteItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.itemBox}
        onPress={() => toggleExpand(item.id)}
      >
        {/* Cabeçalho sempre visível - apenas o nome */}
        <Text style={styles.itemTitle}>{item.nome}</Text>
        
        {/* Conteúdo expandível */}
        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            <Text style={styles.itemDetail}>Tipo: {item.tipo}</Text>
            <Text style={styles.itemDetail}>{formatDocumento(item)}</Text>
            <Text style={styles.itemDetail}>
              Cadastrado em: {new Date(item.created_at).toLocaleDateString('pt-BR')}
            </Text>
            <Text style={styles.itemDetail}>
              Endereço: {formatEndereco(item.endereco)}
            </Text>
            {item.observacao && (
              <Text style={styles.itemDetail}>Observações: {item.observacao}</Text>
            )}
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
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipalMTR')}>
            <Image 
              source={require('../../Assets/MTR.png')} 
              style={styles.alerta}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <Text style={styles.emptyText}>Carregando clientes...</Text>
      ) : (
        <FlatList
          data={clientes}
          keyExtractor={item => item.id.toString()}
          renderItem={renderClienteItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum cliente registrado.</Text>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}