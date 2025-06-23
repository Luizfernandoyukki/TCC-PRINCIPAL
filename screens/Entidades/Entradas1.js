import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import styles from '../../styles/EstilosdeEntidade';
import { getAllLocal } from '../../utils/localEntityService';

export default function EntradasScreen({ navigation }) {
  const [entradas, setEntradas] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntradas();
  }, []);

  const fetchEntradas = async () => {
    setLoading(true);
    try {
      // Busca entradas, estoques e funcionários para montar os relacionamentos
      const entradasData = await getAllLocal('entrada');
      const estoques = await getAllLocal('estoque');
      const funcionarios = await getAllLocal('funcionario');
      
      // Monta os relacionamentos manualmente
      const data = entradasData.map(entrada => ({
        ...entrada,
        estoque: estoques.find(e => e.id === entrada.estoque_id) || {},
        responsavel: funcionarios.find(f => f.id === entrada.responsavel_id) || {}
      }));
      
      // Ordena por data_entrada decrescente
      data.sort((a, b) => new Date(b.data_entrada) - new Date(a.data_entrada));
      setEntradas(data || []);
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };
  };

  const renderNotaFiscal = (nota) => {
    return nota ? (
      <Text style={[styles.itemDetail, styles.checkIcon]}>✓ Com nota fiscal</Text>
    ) : (
      <Text style={[styles.itemDetail, styles.xIcon]}>✗ Sem nota fiscal</Text>
    );
  };

  const renderEntradaItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.itemBox}
        onPress={() => toggleExpand(item.id)}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.estoque.nome}</Text>
          <View style={styles.headerRight}>
            <Text style={styles.itemSubtitle}>{item.quantidade} un.</Text>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                deleteEntrada(item.id);
              }}
              style={styles.deleteIconButton}
            >
              <Text style={styles.deleteIconText}>X</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            <Text style={styles.itemDetail}>N° Série: {item.estoque.numero_serie || 'N/A'}</Text>
            <Text style={styles.itemDetail}>Data: {new Date(item.data_entrada).toLocaleDateString('pt-BR')}</Text>
            
            {/* Mostra informações adicionais do estoque se disponíveis */}
            {item.estoque.data_validade && (
              <Text style={styles.itemDetail}>
                Validade: {new Date(item.estoque.data_validade).toLocaleDateString('pt-BR')}
              </Text>
            )}
            
            {item.estoque.valor && (
              <Text style={styles.itemDetail}>
                Valor unitário: R$ {item.estoque.valor.toFixed(2)}
              </Text>
            )}
            
            {item.fornecedor && (
              <Text style={styles.itemDetail}>Fornecedor: {item.fornecedor}</Text>
            )}
            
            {renderNotaFiscal(item.nota)}
            
            <Text style={styles.itemDetail}>
              Responsável: {item.responsavel.nome || 'Não informado'}
            </Text>
            
            {item.observacao && (
              <Text style={styles.itemDetail}>Obs: {item.observacao}</Text>
            )}
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => navigation.navigate('DetalhesEntrada', { id: item.id })}
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
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipalEXP')}>
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
          onPress={() => navigation.navigate('CadastroEntradas')}
        >
          <Text style={styles.buttonText}>NOVA ENTRADA</Text>
        </TouchableOpacity>

        {loading ? (
          <Text style={styles.emptyText}>Carregando entradas...</Text>
        ) : (
          <FlatList
            data={entradas}
            keyExtractor={item => item.id}
            renderItem={renderEntradaItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhuma entrada registrada.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
