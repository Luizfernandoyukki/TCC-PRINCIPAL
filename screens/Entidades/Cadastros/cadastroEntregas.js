import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../../contexts/supabaseClient';
import { databaseService } from '../../../services/localDatabase';

const TIPOS_PAGAMENTO = [
  { id: 'dinheiro', nome: 'Dinheiro' },
  { id: 'cheque', nome: 'Cheque' },
  { id: 'vale', nome: 'Vale' },
  { id: 'pix', nome: 'PIX' },
  { id: 'cartao', nome: 'Cartão' },
  { id: 'boleto', nome: 'Boleto' }
];

export default function CadastroEntregas({ navigation, route }) {
  const funcionarioLogadoId = route?.params?.funcionario_id;
  const [funcionarios, setFuncionarios] = useState([]);
  const [formData, setFormData] = useState({
    estoque_id: null,
    quantidade: '',
    cliente_id: null,
    veiculo_id: null,
    data_saida: new Date(),
    status: 'preparacao',
    observacao: '',
    valor_unitario: '',
    valor_total: '',
    nota: 0, // Inicializa como 0 (false)
    tipo_pagamento: 'dinheiro',
    funcionario_id: funcionarioLogadoId || null,
  });
  const [loading, setLoading] = useState(false);
  const [estoques, setEstoques] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [estoquesData, clientesData, veiculosData, funcionariosData] = await Promise.all([
          supabase.from('estoque').select('id, nome, quantidade, peso').gt('quantidade', 0).order('nome'),
          supabase.from('cliente').select('id, nome').order('nome'),
          supabase.from('veiculo').select('id, placa, modelo, capacidade_kg').order('placa'),
          supabase.from('funcionario').select('id, nome').order('nome'),
        ]);

        if (estoquesData.error || clientesData.error || veiculosData.error || funcionariosData.error)
          throw estoquesData.error || clientesData.error || veiculosData.error || funcionariosData.error;

        setEstoques(estoquesData.data || []);
        setClientes(clientesData.data || []);
        setVeiculos(veiculosData.data || []);
        setFuncionarios(funcionariosData.data || []);
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar dados para seleção');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function validateForm() {
    const newErrors = {};
    if (!formData.estoque_id) newErrors.estoque_id = 'Selecione um item do estoque';
    if (!formData.quantidade || isNaN(formData.quantidade) || parseInt(formData.quantidade) <= 0) newErrors.quantidade = 'Quantidade inválida';
    if (!formData.cliente_id) newErrors.cliente_id = 'Selecione um cliente';
    if (!formData.valor_unitario || isNaN(formData.valor_unitario) || parseFloat(formData.valor_unitario) <= 0) newErrors.valor_unitario = 'Informe um valor unitário válido';
    if (!formData.funcionario_id) newErrors.funcionario_id = 'Selecione um responsável';

    const estoqueSelecionado = estoques.find(e => e.id === formData.estoque_id);
    if (estoqueSelecionado && parseInt(formData.quantidade) > estoqueSelecionado.quantidade) {
      newErrors.quantidade = `Quantidade maior que estoque disponível (${estoqueSelecionado.quantidade})`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  useEffect(() => {
    const qtd = parseInt(formData.quantidade);
    const valor = parseFloat(formData.valor_unitario);
    if (!isNaN(qtd) && !isNaN(valor)) {
      setFormData(f => ({ ...f, valor_total: (qtd * valor).toFixed(2) }));
    } else {
      setFormData(f => ({ ...f, valor_total: '' }));
    }
  }, [formData.quantidade, formData.valor_unitario]);

  function renderStyledPicker(items, selectedId, fieldName, label) {
    return (
      <>
        <Text style={styles.label}>{label}*</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedId}
            onValueChange={(value) => setFormData({ ...formData, [fieldName]: value })}
            style={styles.picker}
          >
            <Picker.Item label={`Selecione ${label.toLowerCase()}`} value={null} />
            {items.map(item => (
              <Picker.Item 
                key={item.id} 
                label={item.nome || `${item.placa} - ${item.modelo}`} 
                value={item.id} 
              />
            ))}
          </Picker>
        </View>
        {errors[fieldName] && <Text style={styles.errorText}>{errors[fieldName]}</Text>}
      </>
    );
  }

  function renderRadioGroup(items, selectedValue, fieldName, label) {
    return (
      <>
        <Text style={styles.label}>{label}*</Text>
        <View style={styles.radioGroup}>
          {items.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.radioButton,
                selectedValue === item.id && styles.radioButtonSelected
              ]}
              onPress={() => setFormData({ ...formData, [fieldName]: item.id })}
            >
              <Text style={selectedValue === item.id ? styles.radioTextSelected : styles.radioText}>
                {item.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </>
    );
  }

  function renderNotaCheckbox() {
    return (
      <>
        <Text style={styles.label}>Nota Fiscal</Text>
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={[styles.checkbox, formData.nota === 1 && styles.checkboxSelected]}
            onPress={() => setFormData({ 
              ...formData, 
              nota: formData.nota === 1 ? 0 : 1 
            })}
          >
            {formData.nota === 1 && <Text style={styles.checkboxIcon}>✓</Text>}
          </TouchableOpacity>
          <Text style={styles.checkboxLabel}>Esta entrega possui nota fiscal</Text>
        </View>
      </>
    );
  }

  async function handleSubmit() {
    if (!validateForm()) return;
    const estoqueSelecionado = estoques.find(e => e.id === formData.estoque_id);
    const veiculoSelecionado = veiculos.find(v => v.id === formData.veiculo_id);

    const pesoTotal = estoqueSelecionado?.peso * parseInt(formData.quantidade);

    if (veiculoSelecionado && pesoTotal > veiculoSelecionado.capacidade_kg) {
      const continuar = await new Promise(resolve => {
        Alert.alert('Aviso', `Peso total (${pesoTotal.toFixed(2)}kg) excede a capacidade do veículo (${veiculoSelecionado.capacidade_kg}kg). Deseja continuar?`, [
          { text: 'Cancelar', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Continuar', onPress: () => resolve(true) },
        ]);
      });
      if (!continuar) return;
    }

    const dataEntregaGerada = new Date(formData.data_saida);
    dataEntregaGerada.setDate(dataEntregaGerada.getDate() + 1);
    dataEntregaGerada.setHours(0, 0, 0, 0);

    const entregaData = {
      estoque_id: formData.estoque_id,
      quantidade: parseInt(formData.quantidade),
      cliente_id: formData.cliente_id,
      veiculo_id: formData.veiculo_id || null,
      funcionario_id: formData.funcionario_id,
      data_saida: formData.data_saida.toISOString().split('T')[0],
      data_entrega: dataEntregaGerada.toISOString().split('T')[0],
      status: formData.status,
      observacao: formData.observacao || null,
      valor_unitario: parseFloat(formData.valor_unitario),
      valor_total: parseFloat(formData.valor_total),
      tipo_pagamento: formData.tipo_pagamento,
      nota: formData.nota, // 0 ou 1 conforme schema
    };

    setLoading(true);
    try {
      const networkState = await NetInfo.fetch();
      if (networkState.isConnected) {
        const { error } = await supabase.from('entrega').insert([entregaData]);
        if (error) throw error;
      } else {
        await databaseService.insertWithUUID('entrega', entregaData);
      }
      Alert.alert('Sucesso', 'Entrega registrada com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Erro ao registrar entrega');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding" keyboardVerticalOffset={100}>
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REGISTRO DE ENTREGAS</Text>

          {renderStyledPicker(estoques, formData.estoque_id, 'estoque_id', 'Item do Estoque')}

          <TextInput
            placeholder="Quantidade*"
            value={formData.quantidade}
            onChangeText={text => setFormData({ ...formData, quantidade: text })}
            style={styles.input}
            keyboardType="numeric"
          />
          {errors.quantidade && <Text style={styles.errorText}>{errors.quantidade}</Text>}

          {renderStyledPicker(clientes, formData.cliente_id, 'cliente_id', 'Cliente')}
          {renderStyledPicker(veiculos, formData.veiculo_id, 'veiculo_id', 'Veículo')}
          {renderStyledPicker(funcionarios, formData.funcionario_id, 'funcionario_id', 'Responsável')}

          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
            <Text style={styles.dateText}>Data de Saída: {formData.data_saida.toLocaleDateString()}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={formData.data_saida}
              mode="date"
              display="default"
              onChange={(e, selectedDate) => {
                if (e.type !== 'dismissed' && selectedDate) {
                  const onlyDate = new Date(selectedDate);
                  onlyDate.setHours(0, 0, 0, 0);
                  setFormData(f => ({ ...f, data_saida: onlyDate }));
                }
                setShowDatePicker(false);
              }}
            />
          )}

          <TextInput
            placeholder="Valor Unitário*"
            value={formData.valor_unitario}
            onChangeText={text => setFormData({ ...formData, valor_unitario: text })}
            style={styles.input}
            keyboardType="numeric"
          />
          {errors.valor_unitario && <Text style={styles.errorText}>{errors.valor_unitario}</Text>}

          <TextInput
            placeholder="Valor Total"
            value={formData.valor_total}
            editable={false}
            style={styles.input}
          />

          {renderRadioGroup(TIPOS_PAGAMENTO, formData.tipo_pagamento, 'tipo_pagamento', 'Tipo de Pagamento')}
          
          {renderNotaCheckbox()}

          <TextInput
            placeholder="Observações"
            value={formData.observacao}
            onChangeText={text => setFormData({ ...formData, observacao: text })}
            style={styles.input}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonLabel}>{loading ? 'REGISTRANDO...' : 'REGISTRAR ENTREGA'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#844a05',
  },
  header: {
    height: 120,
    backgroundColor: '#043b57',
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
    marginBottom: 8,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fadb53',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#043b57',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    marginBottom: 15,
    color: '#043b57',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 5,
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    fontSize: 12,
  },
  label: {
    marginBottom: 8,
    color: '#043b57',
    fontWeight: 'bold',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#043b57',
  },
  dateInput: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
  },
  dateText: {
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: '#043b57',
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  radioButton: {
    flexDirection: 'row',
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
    marginLeft: 8,
    color: '#043b57',
  },
  radioTextSelected: {
    color: 'white',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#043b57',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: '#043b57',
  },
  checkboxIcon: {
    color: 'white',
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#043b57',
  },
});