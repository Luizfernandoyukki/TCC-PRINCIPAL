import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Image, Modal, Platform, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from 'react-native-paper';
import ViewShot from 'react-native-view-shot';
import { databaseService } from '../../services/localDatabase';
import styles from '../../styles/EstilosdeEntidade';
import { getAllLocal } from '../../utils/localEntityService';

export default function BalancoScreen({ navigation }) {
  const [balancos, setBalancos] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filtros avançados
  const [filtros, setFiltros] = useState({
    periodo: '',
    tipo: '',
    cliente: '',
    status: '',
    tipo_pagamento: '',
    item: '',
    busca: ''
  });

  // Modal de detalhes
  const [modalDetalhe, setModalDetalhe] = useState({ visible: false, balanco: null });

  // Referência para o ViewShot do modal
  const viewShotRef = useRef();

  // Exemplo de usuário logado (ajuste conforme seu contexto)
  const usuarioLogado = { nome: 'Usuário Exemplo' };

  // Caminho do logo (ajuste conforme seu projeto)
  const logoPath = Platform.OS === 'android'
    ? 'file:///android_asset/logo.png'
    : FileSystem.documentDirectory + 'logo.png';

  useEffect(() => {
    fetchBalancos();
  }, [filtros]);

  const fetchBalancos = async () => {
    setLoading(true);
    try {
      let data = await getAllLocal('balanco', {
        periodo: filtros.periodo,
        tipo: filtros.tipo,
        cliente_id: filtros.cliente,
        status: filtros.status,
        tipo_pagamento: filtros.tipo_pagamento,
        item_id: filtros.item
      });
      if (filtros.busca) {
        data = data.filter(b => b.nome?.toLowerCase().includes(filtros.busca.toLowerCase()));
      }
      data = data.sort((a, b) => new Date(b.data) - new Date(a.data));
      setBalancos(data);
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const deleteBalanco = async (id) => {
    Alert.alert(
      "Excluir Balanço",
      "Tem certeza que deseja excluir este balanço?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          onPress: async () => {
            try {
              await databaseService.deleteById('balanco', id);
              await fetchBalancos();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o balanço: ' + error.message);
            }
          }
        }
      ]
    );
  };

  // Exportar PDF usando expo-print
  const exportarPDF = async (balanco) => {
    try {
      const dataGeracao = new Date().toLocaleString('pt-BR');
      let html = `
        <div style="text-align:center;">
          <h1 style="color:#043b57;">Relatório de Estoque</h1>
          <h2>Emitido por: ${usuarioLogado.nome}</h2>
          <p>Data: ${dataGeracao}</p>
        </div>
        <div style="page-break-after: always;"></div>
        <div style="text-align:center;">
          <h2>${balanco.nome}</h2>
          <p><b>Tipo:</b> ${balanco.tipo}</p>
          <p><b>Período:</b> ${balanco.periodo}</p>
          <p><b>Data:</b> ${new Date(balanco.data).toLocaleDateString('pt-BR')}</p>
          <p><b>Valor Total:</b> R$ ${balanco.valor_total?.toFixed(2) || '0,00'}</p>
          <p><b>Tipo Pagamento:</b> ${balanco.tipo_pagamento || '-'}</p>
          <p><b>Status:</b> ${balanco.status || '-'}</p>
          <p><b>Emitido por:</b> ${balanco.usuario_id}</p>
          <p><b>Criado em:</b> ${new Date(balanco.criado_em).toLocaleDateString('pt-BR')}</p>
          ${balanco.motivo ? `<p><b>Motivo:</b> ${balanco.motivo}</p>` : ''}
        </div>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao exportar PDF');
    }
  };

  // Resumo financeiro
  const totalGeral = balancos.reduce((sum, b) => sum + (b.valor_total || 0), 0);

  const renderBalancoItem = ({ item }) => (
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
              deleteBalanco(item.id);
            }}
            style={styles.deleteIconButton}
          >
            <Text style={styles.deleteIconText}>X</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.itemDetail}>Data: {new Date(item.data).toLocaleDateString('pt-BR')}</Text>
        <Text style={styles.itemDetail}>Valor Total: R$ {item.valor_total?.toFixed(2) || '0,00'}</Text>
        <Text style={styles.itemDetail}>Tipo Pagamento: {item.tipo_pagamento || '-'}</Text>
        {/* Conteúdo expandível */}
        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            <Text style={styles.itemDetail}>Período: {item.periodo}</Text>
            <Text style={styles.itemDetail}>Tipo: {item.tipo}</Text>
            {item.motivo && (
              <Text style={styles.itemDetail}>Motivo: {item.motivo}</Text>
            )}
            <Text style={styles.itemDetail}>
              Criado em: {new Date(item.criado_em).toLocaleDateString('pt-BR')}
            </Text>
            <Text style={styles.itemDetail}>Status: {item.status || '-'}</Text>
            <Text style={styles.itemDetail}>Emitido por: {item.usuario_id}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => setModalDetalhe({ visible: true, balanco: item })}
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

      {/* Filtros avançados */}
      <View style={{ padding: 10 }}>
        <TextInput
          placeholder="Buscar por nome"
          value={filtros.busca}
          onChangeText={text => setFiltros({ ...filtros, busca: text })}
          style={{ backgroundColor: 'white', marginBottom: 8, borderRadius: 8, padding: 8 }}
        />
        {/* Adicione aqui outros filtros conforme necessário */}
      </View>

      {/* Resumo financeiro */}
      <View style={{ paddingHorizontal: 10, marginBottom: 10 }}>
        <Text style={{ fontWeight: 'bold', color: '#043b57' }}>
          Total Geral: R$ {totalGeral.toFixed(2)}
        </Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('CadastroBalanco')}
        >
          <Text style={styles.buttonText}>EMITIR BALANÇO</Text>
        </TouchableOpacity>

        {loading ? (
          <Text style={styles.emptyText}>Carregando balanços...</Text>
        ) : (
          <FlatList
            data={balancos}
            keyExtractor={item => item.id}
            renderItem={renderBalancoItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum balanço registrado.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Modal de detalhes do relatório */}
      <Modal
        visible={modalDetalhe.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalDetalhe({ visible: false, balanco: null })}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 20,
            width: '90%'
          }}>
            {modalDetalhe.balanco && (
              <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
                <>
                  <Text style={[styles.itemTitle, { textAlign: 'center', marginBottom: 10 }]}>
                    {modalDetalhe.balanco.nome}
                  </Text>
                  <Text style={styles.itemDetail}>Data: {new Date(modalDetalhe.balanco.data).toLocaleDateString('pt-BR')}</Text>
                  <Text style={styles.itemDetail}>Período: {modalDetalhe.balanco.periodo}</Text>
                  <Text style={styles.itemDetail}>Tipo: {modalDetalhe.balanco.tipo}</Text>
                  <Text style={styles.itemDetail}>Valor Total: R$ {modalDetalhe.balanco.valor_total?.toFixed(2) || '0,00'}</Text>
                  <Text style={styles.itemDetail}>Tipo Pagamento: {modalDetalhe.balanco.tipo_pagamento || '-'}</Text>
                  <Text style={styles.itemDetail}>Status: {modalDetalhe.balanco.status || '-'}</Text>
                  <Text style={styles.itemDetail}>Emitido por: {modalDetalhe.balanco.usuario_id}</Text>
                  <Text style={styles.itemDetail}>Criado em: {new Date(modalDetalhe.balanco.criado_em).toLocaleDateString('pt-BR')}</Text>
                  {modalDetalhe.balanco.motivo && (
                    <Text style={styles.itemDetail}>Motivo: {modalDetalhe.balanco.motivo}</Text>
                  )}
                </>
              </ViewShot>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 }}>
              <Button mode="contained" onPress={() => exportarPDF(modalDetalhe.balanco)}>Exportar PDF</Button>
              <Button onPress={() => setModalDetalhe({ visible: false, balanco: null })}>Fechar</Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}