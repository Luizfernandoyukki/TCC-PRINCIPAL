import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { databaseService } from '../../services/localDatabase';
import styles from '../../styles/EstilosdeEntidade';
import { getAllLocal } from '../../utils/localEntityService';

export default function EntradasScreen({ navigation }) {
  const [entradas, setEntradas] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
const [filterText, setFilterText] = useState('');

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

  const deleteEntrada = async (id) => {
    Alert.alert(
      "Excluir Entrada",
      "Tem certeza que deseja excluir este registro de entrada?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Excluir", 
          onPress: async () => {
            try {
              await databaseService.deleteById('entrada', id);
              await fetchEntradas();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a entrada: ' + error.message);
            }
          }
        }
      ]
    );
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
          onPress={() => navigation.navigate('CadastroEntradas')}
        >
          <Text style={styles.buttonText}>NOVA ENTRADA</Text>
        </TouchableOpacity>

        {/* Navbar de filtros */}
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'data' && styles.filterButtonActive
            ]}
            onPress={() => setFilter('data')}
          >
            <Text style={styles.filterButtonText}>Data</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'estoque' && styles.filterButtonActive
            ]}
            onPress={() => setFilter('estoque')}
          >
            <Text style={styles.filterButtonText}>Estoque</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'responsavel' && styles.filterButtonActive
            ]}
            onPress={() => setFilter('responsavel')}
          >
            <Text style={styles.filterButtonText}>Responsável</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'nota' && styles.filterButtonActive
            ]}
            onPress={() => setFilter('nota')}
          >
            <Text style={styles.filterButtonText}>Nota Fiscal</Text>
          </TouchableOpacity>
        </View>

        {/* Campo de busca para o filtro selecionado */}
        <View style={styles.filterInputContainer}>
          <TextInput
            style={styles.filterInput}
            placeholder={`Filtrar por ${filter === 'data' ? 'data (dd/mm/aaaa)' : filter}`}
            value={filterValue}
            onChangeText={setFilterValue}
          />
          <TouchableOpacity
            style={styles.filterApplyButton}
            onPress={applyFilter}
          >
            <Text style={styles.filterApplyButtonText}>Filtrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterClearButton}
            onPress={clearFilter}
          >
            <Text style={styles.filterClearButtonText}>Limpar</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.emptyText}>Carregando entradas...</Text>
        ) : (
          <FlatList
            data={filteredEntradas}
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
}