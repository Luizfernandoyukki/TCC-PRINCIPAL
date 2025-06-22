import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { databaseService } from '../../services/localDatabase';
import styles from '../../styles/EstilosdeEntidade';
import { getAllLocal } from '../../utils/localEntityService';

export default function ClientesScreen({ navigation }) {
  const [clientes, setClientes] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const data = await getAllLocal('cliente');
      setClientes(data || []);
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const deleteCliente = async (id) => {
    Alert.alert(
      "Excluir Cliente",
      "Tem certeza que deseja excluir este cliente permanentemente?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Excluir", 
          onPress: async () => {
            try {
              await databaseService.deleteById('cliente', id); // <-- Troquei aqui!
              await fetchClientes();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o cliente: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const renderClienteItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.itemBox}
        onPress={() => toggleExpand(item.id)}
      >
        {/* Cabeçalho sempre visível */}
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.nome}</Text>
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              deleteCliente(item.id);
            }}
            style={styles.deleteIconButton}
          >
            <Text style={styles.deleteIconText}>X</Text>
          </TouchableOpacity>
        </View>
        
        {/* Conteúdo expandível */}
        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            <Text style={styles.itemDetail}>Tipo: {item.tipo}</Text>
            <Text style={styles.itemDetail}>
              {item.tipo === 'PJ' ? `CNPJ: ${item.cnpj}` : `CPF: ${item.cpf} | RG: ${item.rg}`}
            </Text>
            <Text style={styles.itemDetail}>
              Cadastrado em: {new Date(item.created_at).toLocaleDateString('pt-BR')}
            </Text>
            <Text style={styles.itemDetail}>
              Endereço: {item.endereco 
                ? `${item.endereco.rua}, ${item.endereco.numero} - ${item.endereco.bairro}`
                : 'Não cadastrado'}
            </Text>
            {item.observacao && (
              <Text style={styles.itemDetail}>Observações: {item.observacao}</Text>
            )}
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => navigation.navigate('DetalhesCliente', { clienteId: item.id })}
              >
                <Text style={styles.actionButtonText}>Visualizar Completo</Text>
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
          onPress={() => navigation.navigate('CadastroClientes')}
        >
          <Text style={styles.buttonText}>NOVO CLIENTE</Text>
        </TouchableOpacity>

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
    </View>
  );
}