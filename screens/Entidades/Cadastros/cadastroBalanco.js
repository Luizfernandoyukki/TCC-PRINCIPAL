import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Image, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from 'react-native-paper';
import ViewShot from 'react-native-view-shot';
import { supabase } from '../../../contexts/supabaseClient';
import { databaseService } from '../../../services/localDatabase';

const opcoesRelatorio = [
  { label: 'Entradas', value: 'entrada' },
  { label: 'Saídas', value: 'saida' },
  { label: 'Saldo (Entradas - Saídas)', value: 'saldo' },
  { label: 'Tudo (Entradas, Saídas e Saldo)', value: 'tudo' }
];

const periodosValidos = ['diário', 'semanal', 'mensal', 'anual', 'customizado'];

export default function RelatoriosEstoqueScreen({ navigation }) {
  const [tipoRelatorio, setTipoRelatorio] = useState('entrada');
  const [periodo, setPeriodo] = useState('mensal');
  const [dataInicio, setDataInicio] = useState(new Date());
  const [dataFim, setDataFim] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState({ inicio: false, fim: false });
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [exportando, setExportando] = useState(false);
  const [itensEstoque, setItensEstoque] = useState([]);
  const [estoqueSelecionado, setEstoqueSelecionado] = useState(null);
  const viewShotRef = useRef();

  // Exemplo de usuário logado (ajuste conforme seu contexto)
  const usuarioLogado = { nome: 'Usuário Exemplo' };

  // Caminho do logo (ajuste conforme seu projeto)
  const logoPath = Platform.OS === 'android'
    ? 'file:///android_asset/logo.png'
    : FileSystem.documentDirectory + 'logo.png';

  useEffect(() => {
    const fetchItens = async () => {
      try {
        const itens = await databaseService.select('estoque');
        setItensEstoque(itens);
        if (itens.length > 0) setEstoqueSelecionado(itens[0].id);
      } catch (e) {
        setItensEstoque([]);
      }
    };
    fetchItens();
  }, []);

  // Calcula datas padrão conforme período
  const getPeriodoDatas = () => {
    const hoje = new Date();
    let inicio, fim = new Date(hoje);
    switch (periodo) {
      case 'diário':
        inicio = new Date(hoje);
        break;
      case 'semanal':
        inicio = new Date(hoje);
        inicio.setDate(hoje.getDate() - 7);
        break;
      case 'mensal':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        break;
      case 'anual':
        inicio = new Date(hoje.getFullYear(), 0, 1);
        break;
      case 'customizado':
        inicio = dataInicio;
        fim = dataFim;
        break;
      default:
        inicio = new Date(hoje);
    }
    return { inicio, fim };
  };

  const handleGerar = async () => {
    if (!estoqueSelecionado) {
      Alert.alert('Selecione um item de estoque!');
      return;
    }
    setLoading(true);
    setResultado(null);
    try {
      const { inicio, fim } = getPeriodoDatas();
      const dataIniStr = inicio.toISOString().split('T')[0];
      const dataFimStr = fim.toISOString().split('T')[0];

      let entradas = [];
      let saidas = [];
      let saldo = [];

      const state = await NetInfo.fetch();
      if (state.isConnected) {
        // Busca online (Supabase)
        if (tipoRelatorio === 'entrada' || tipoRelatorio === 'tudo' || tipoRelatorio === 'saldo') {
          const { data, error } = await supabase
            .from('entrada')
            .select('*')
            .eq('estoque_id', estoqueSelecionado)
            .gte('data_entrada', dataIniStr)
            .lte('data_entrada', dataFimStr);
          if (error) throw error;
          entradas = data || [];
        }
        if (tipoRelatorio === 'saida' || tipoRelatorio === 'tudo' || tipoRelatorio === 'saldo') {
          const { data, error } = await supabase
            .from('saida')
            .select('*')
            .eq('estoque_id', estoqueSelecionado)
            .gte('data_saida', dataIniStr)
            .lte('data_saida', dataFimStr);
          if (error) throw error;
          saidas = data || [];
        }
      } else {
        // Busca offline (local)
        if (tipoRelatorio === 'entrada' || tipoRelatorio === 'tudo' || tipoRelatorio === 'saldo') {
          entradas = await databaseService.select(
            'entrada',
            'estoque_id = ? AND date(data_entrada) BETWEEN ? AND ?',
            [estoqueSelecionado, dataIniStr, dataFimStr]
          );
        }
        if (tipoRelatorio === 'saida' || tipoRelatorio === 'tudo' || tipoRelatorio === 'saldo') {
          saidas = await databaseService.select(
            'saida',
            'estoque_id = ? AND date(data_saida) BETWEEN ? AND ?',
            [estoqueSelecionado, dataIniStr, dataFimStr]
          );
        }
      }

      if (tipoRelatorio === 'saldo' || tipoRelatorio === 'tudo') {
        const totalEntradas = entradas.reduce((sum, e) => sum + (e.quantidade || 0), 0);
        const totalSaidas = saidas.reduce((sum, s) => sum + (s.quantidade || 0), 0);
        saldo = [{
          estoque_id: estoqueSelecionado,
          entradas: totalEntradas,
          saidas: totalSaidas,
          saldo: totalEntradas - totalSaidas
        }];
      }

      setResultado({ entradas, saidas, saldo });
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  // Exportar como PNG
  const exportarPNG = async () => {
    setExportando(true);
    try {
      const uri = await viewShotRef.current.capture();
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('PNG gerado', `Arquivo salvo em: ${uri}`);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao exportar PNG');
    } finally {
      setExportando(false);
    }
  };

  // Exportar como PDF com capa
  const exportarPDF = async () => {
    setExportando(true);
    try {
      const dataGeracao = new Date().toLocaleString('pt-BR');
      const item = itensEstoque.find(i => i.id === estoqueSelecionado);
      let html = `
        <div style="text-align:center;">
          <h1 style="color:#043b57;">Relatório de Estoque</h1>
          <h2>Emitido por: ${usuarioLogado.nome}</h2>
          <p>Data: ${dataGeracao}</p>
        </div>
        <div style="page-break-after: always;"></div>
        <div style="text-align:center;">
          <h2>Item: ${item ? item.nome : estoqueSelecionado}</h2>
          <p><b>Tipo de Relatório:</b> ${opcoesRelatorio.find(o => o.value === tipoRelatorio)?.label}</p>
          <p><b>Período:</b> ${periodo.charAt(0).toUpperCase() + periodo.slice(1)}</p>
          <p><b>Data Inicial:</b> ${dataInicio.toLocaleDateString('pt-BR')} &nbsp; <b>Data Final:</b> ${dataFim.toLocaleDateString('pt-BR')}</p>
        </div>
      `;

      if (resultado?.entradas?.length) {
        html += `<h3 style="color:#043b57;">Entradas</h3><ul>`;
        resultado.entradas.forEach(e => {
          html += `<li>Qtd: ${e.quantidade} | Data: ${e.data_entrada}</li>`;
        });
        html += `</ul>`;
      }
      if (resultado?.saidas?.length) {
        html += `<h3 style="color:#043b57;">Saídas</h3><ul>`;
        resultado.saidas.forEach(s => {
          html += `<li>Qtd: ${s.quantidade} | Data: ${s.data_saida}</li>`;
        });
        html += `</ul>`;
      }
      if (resultado?.saldo?.length) {
        html += `<h3 style="color:#043b57;">Saldo</h3><ul>`;
        resultado.saldo.forEach(s => {
          html += `<li>Entradas: ${s.entradas} | Saídas: ${s.saidas} | Saldo: ${s.saldo}</li>`;
        });
        html += `</ul>`;
      }

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao exportar PDF');
    } finally {
      setExportando(false);
    }
  };

  // Exportar como CSV
  const exportarCSV = async () => {
    setExportando(true);
    try {
      let csv = 'Tipo,Quantidade,Data\n';
      if (resultado?.entradas?.length) {
        resultado.entradas.forEach(e => {
          csv += `Entrada,${e.quantidade},${e.data_entrada}\n`;
        });
      }
      if (resultado?.saidas?.length) {
        resultado.saidas.forEach(s => {
          csv += `Saída,${s.quantidade},${s.data_saida}\n`;
        });
      }
      if (resultado?.saldo?.length) {
        resultado.saldo.forEach(s => {
          csv += `Saldo,${s.saldo},-\n`;
        });
      }
      const fileUri = FileSystem.documentDirectory + `relatorio_estoque_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('CSV gerado', `Arquivo salvo em: ${fileUri}`);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao exportar CSV');
    } finally {
      setExportando(false);
    }
  };

  // Renderização dos resultados
  const renderResumo = () => {
    if (!resultado) return null;
    if (
      (!resultado.entradas || resultado.entradas.length === 0) &&
      (!resultado.saidas || resultado.saidas.length === 0) &&
      (!resultado.saldo || resultado.saldo.length === 0)
    ) {
      return <Text style={styles.label}>Nenhum dado encontrado.</Text>;
    }
    return (
      <View>
        {resultado.entradas && resultado.entradas.length > 0 && (
          <>
            <Text style={styles.sectionSubtitle}>Entradas</Text>
            <FlatList
              data={resultado.entradas}
              keyExtractor={item => item.id?.toString()}
              renderItem={({ item }) => (
                <Text>- Qtd: {item.quantidade} | Data: {item.data_entrada}</Text>
              )}
            />
          </>
        )}
        {resultado.saidas && resultado.saidas.length > 0 && (
          <>
            <Text style={styles.sectionSubtitle}>Saídas</Text>
            <FlatList
              data={resultado.saidas}
              keyExtractor={item => item.id?.toString()}
              renderItem={({ item }) => (
                <Text>- Qtd: {item.quantidade} | Data: {item.data_saida}</Text>
              )}
            />
          </>
        )}
        {resultado.saldo && resultado.saldo.length > 0 && (
          <>
            <Text style={styles.sectionSubtitle}>Saldo</Text>
            <FlatList
              data={resultado.saldo}
              keyExtractor={item => item.estoque_id?.toString()}
              renderItem={({ item }) => (
                <Text>
                  Entradas: {item.entradas} | Saídas: {item.saidas} | Saldo: {item.saldo}
                </Text>
              )}
            />
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#043b57" barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image 
              source={require('../../../Assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Error')}>
            <Image 
              source={require('../../../Assets/alerta.png')} 
              style={styles.alerta}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Tipo de Relatório *</Text>
        <View style={styles.radioGroup}>
          {opcoesRelatorio.map(item => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.radioButton,
                tipoRelatorio === item.value && styles.radioButtonSelected
              ]}
              onPress={() => setTipoRelatorio(item.value)}
            >
              <Text style={tipoRelatorio === item.value ? styles.radioTextSelected : styles.radioText}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Item de Estoque *</Text>
        <View style={styles.radioGroup}>
          {itensEstoque.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.radioButton,
                estoqueSelecionado === item.id && styles.radioButtonSelected
              ]}
              onPress={() => setEstoqueSelecionado(item.id)}
            >
              <Text style={estoqueSelecionado === item.id ? styles.radioTextSelected : styles.radioText}>
                {item.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Período *</Text>
        <View style={styles.radioGroup}>
          {periodosValidos.map(item => (
            <TouchableOpacity
              key={item}
              style={[
                styles.radioButton,
                periodo === item && styles.radioButtonSelected
              ]}
              onPress={() => setPeriodo(item)}
            >
              <Text style={periodo === item ? styles.radioTextSelected : styles.radioText}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {periodo === 'customizado' && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker({ ...showDatePicker, inicio: true })}
            >
              <Text style={styles.dateText}>Início: {dataInicio.toLocaleDateString('pt-BR')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker({ ...showDatePicker, fim: true })}
            >
              <Text style={styles.dateText}>Fim: {dataFim.toLocaleDateString('pt-BR')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {showDatePicker.inicio && (
          <DateTimePicker
            value={dataInicio}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker({ ...showDatePicker, inicio: false });
              if (selectedDate) setDataInicio(selectedDate);
            }}
          />
        )}
        {showDatePicker.fim && (
          <DateTimePicker
            value={dataFim}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker({ ...showDatePicker, fim: false });
              if (selectedDate) setDataFim(selectedDate);
            }}
          />
        )}

        <Button
          mode="contained"
          onPress={handleGerar}
          style={styles.saveButton}
          loading={loading}
          disabled={loading}
        >
          {loading ? 'GERANDO...' : 'GERAR RELATÓRIO'}
        </Button>

        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
          <View style={{ marginTop: 30 }}>
            {renderResumo()}
          </View>
        </ViewShot>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 }}>
          <Button
            mode="outlined"
            onPress={exportarPNG}
            disabled={exportando || !resultado}
          >
            Exportar PNG
          </Button>
          <Button
            mode="outlined"
            onPress={exportarPDF}
            disabled={exportando || !resultado}
          >
            Exportar PDF
          </Button>
          <Button
            mode="outlined"
            onPress={exportarCSV}
            disabled={exportando || !resultado}
          >
            Exportar CSV
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'white',
  },
  dateInput: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    marginRight: 10,
    flex: 1,
  },
  dateText: {
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#043b57',
    fontWeight: 'bold',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  radioButton: {
    borderWidth: 1,
    borderColor: '#043b57',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  radioButtonSelected: {
    backgroundColor: '#043b57',
  },
  radioText: {
    color: '#043b57',
  },
  radioTextSelected: {
    color: 'white',
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#043b57',
    padding: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#844a05',
  },
  header: {
    height: 120,
    backgroundColor: '#043b57',
    width: '100%',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 150,
    height: 100,
  },
  alerta: {
    width: 80,
    height: 70,
    marginRight: 20,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#043b57',
    marginTop: 10,
    marginBottom: 15,
  },
});