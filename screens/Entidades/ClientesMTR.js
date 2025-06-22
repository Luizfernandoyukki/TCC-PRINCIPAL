import { useEffect, useState } from 'react';
import { FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import styles from '../../styles/EstilosdeEntidade';
import { getAllLocal } from '../../utils/localEntityService';
import { databaseService } from '../../services/localDatabase';

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
      // Busca todos os clientes do banco local
      let data = await getAllLocal('cliente');
      // Se quiser buscar o endereço junto, faça o join manualmente:
      for (let cliente of data) {
        if (cliente.endereco_id) {
          const enderecos = await getAllLocal('endereco');
          cliente.endereco = enderecos.find(e => e.id === cliente.endereco_id) || null;
        } else {
          cliente.endereco = null;
        }
      }
      // Ordena por data de criação (decrescente)
      data = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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