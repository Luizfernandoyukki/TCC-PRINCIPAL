import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { supabase } from '../../../contexts/supabaseClient';
import { databaseService } from '../../../services/localDatabase';

export default function CadastroEntregas({ navigation }) {
  const [formData, setFormData] = useState({
    estoque_id: null,
    quantidade: '',
    cliente_id: null,
    veiculo_id: null,
    funcionario_id: null,
    data_saida: new Date(),
    status: 'preparacao',
    observacao: '',
    valor_unitario: '',
    valor_total: '',
    tipo_pagamento: 'dinheiro'
  });
  const [dataEntrega, setDataEntrega] = useState(null);
  const [quantidadeDevolvida, setQuantidadeDevolvida] = useState('');
  const [motivoDevolucao, setMotivoDevolucao] = useState('');
  const [estoques, setEstoques] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDatePickerEntrega, setShowDatePickerEntrega] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Carrega dados necessários
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: estoquesData, error: estoquesError } = await supabase
          .from('estoque')
          .select('id, nome, quantidade')
          .gt('quantidade', 0)
          .order('nome', { ascending: true });
        const { data: clientesData, error: clientesError } = await supabase
          .from('cliente')
          .select('id, nome')
          .order('nome', { ascending: true });
        const { data: veiculosData, error: veiculosError } = await supabase
          .from('veiculo')
          .select('id, placa, modelo')
          .order('placa', { ascending: true });
        const { data: funcionariosData, error: funcionariosError } = await supabase
          .from('funcionario')
          .select('id, nome')
          .order('nome', { ascending: true });

        if (estoquesError || clientesError || veiculosError || funcionariosError) {
          throw estoquesError || clientesError || veiculosError || funcionariosError;
        }
        setEstoques(estoquesData || []);
        setClientes(clientesData || []);
        setVeiculos(veiculosData || []);
        setFuncionarios(funcionariosData || []);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar os dados necessários');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.estoque_id) newErrors.estoque = 'Selecione um item do estoque';
    if (!formData.quantidade || isNaN(formData.quantidade)) newErrors.quantidade = 'Quantidade inválida';
    if (!formData.cliente_id) newErrors.cliente = 'Selecione um cliente';
    if (!formData.veiculo_id) newErrors.veiculo = 'Selecione um veículo';
    if (!formData.funcionario_id) newErrors.funcionario = 'Selecione um funcionário';
    if (formData.estoque_id && formData.quantidade) {
      const estoque = estoques.find(e => e.id === formData.estoque_id);
      if (parseInt(formData.quantidade) > (estoque?.quantidade || 0)) {
        newErrors.quantidade = `Quantidade excede o disponível (${estoque?.quantidade})`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const entregaData = {
        estoque_id: formData.estoque_id,
        quantidade: parseInt(formData.quantidade),
        cliente_id: formData.cliente_id,
        veiculo_id: formData.veiculo_id,
        funcionario_id: formData.funcionario_id,
        data_saida: formData.data_saida ? formData.data_saida.toISOString() : null,
        data_entrega: dataEntrega ? dataEntrega.toISOString() : null,
        status: formData.status,
        quantidade_devolvida: quantidadeDevolvida ? parseInt(quantidadeDevolvida) : null,
        motivo_devolucao: motivoDevolucao || null,
        observacao: formData.observacao || null,
        valor_unitario: formData.valor_unitario || null,
        valor_total: formData.valor_total || null,
        tipo_pagamento: formData.tipo_pagamento || null
      };

      const state = await NetInfo.fetch();
      if (state.isConnected) {
        const { error } = await supabase.from('entrega').insert([entregaData]);
        if (error) throw error;
      } else {
        await databaseService.insertWithUUID('entrega', entregaData);
      }

      Alert.alert('Sucesso', 'Entrega registrada com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao registrar entrega');
    } finally {
      setLoading(false);
    }
  };

  const renderPicker = (items, selectedId, fieldName, label) => (
    <>
      <Text style={styles.label}>{label}*</Text>
      <View style={styles.pickerContainer}>
        {items.map(item => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.pickerOption,
              selectedId === item.id && styles.pickerOptionSelected
            ]}
            onPress={() => setFormData({ ...formData, [fieldName]: item.id })}
          >
            <Text style={selectedId === item.id ? styles.pickerTextSelected : styles.pickerText}>
              {item.nome || `${item.placa} - ${item.modelo}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors[fieldName.split('_')[0]] && (
        <Text style={styles.errorText}>{errors[fieldName.split('_')[0]]}</Text>
      )}
    </>
  );

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REGISTRO DE ENTREGAS</Text>
          {renderPicker(estoques, formData.estoque_id, 'estoque_id', 'Item do Estoque')}
          <TextInput
            label="Quantidade*"
            value={formData.quantidade}
            onChangeText={text => setFormData({ ...formData, quantidade: text })}
            style={styles.input}
            keyboardType="numeric"
            error={!!errors.quantidade}
          />
          {errors.quantidade && <Text style={styles.errorText}>{errors.quantidade}</Text>}
          {renderPicker(clientes, formData.cliente_id, 'cliente_id', 'Cliente')}
          {renderPicker(veiculos, formData.veiculo_id, 'veiculo_id', 'Veículo')}
          {renderPicker(funcionarios, formData.funcionario_id, 'funcionario_id', 'Funcionário Responsável')}
          <Text style={styles.label}>Data e Hora de Saída*</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {formData.data_saida.toLocaleString('pt-BR')}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={formData.data_saida}
              mode="datetime"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setFormData({ ...formData, data_saida: selectedDate });
              }}
            />
          )}
          <TextInput
            label="Observações (Opcional)"
            value={formData.observacao}
            onChangeText={text => setFormData({ ...formData, observacao: text })}
            style={styles.input}
            multiline
            numberOfLines={3}
          />
          <Text style={styles.label}>Data de Entrega (Opcional)</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePickerEntrega(true)}
          >
            <Text style={styles.dateText}>
              {dataEntrega ? dataEntrega.toLocaleString('pt-BR') : 'Selecione'}
            </Text>
          </TouchableOpacity>
          {showDatePickerEntrega && (
            <DateTimePicker
              value={dataEntrega || new Date()}
              mode="datetime"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePickerEntrega(false);
                if (selectedDate) setDataEntrega(selectedDate);
              }}
            />
          )}
          <TextInput
            label="Quantidade Devolvida (Opcional)"
            value={quantidadeDevolvida}
            onChangeText={setQuantidadeDevolvida}
            style={styles.input}
            keyboardType="numeric"
          />
          <TextInput
            label="Motivo da Devolução (Opcional)"
            value={motivoDevolucao}
            onChangeText={setMotivoDevolucao}
            style={styles.input}
            multiline
          />
          <TextInput
            label="Valor Unitário"
            value={formData.valor_unitario}
            onChangeText={text => setFormData({ ...formData, valor_unitario: text })}
            style={styles.input}
            keyboardType="numeric"
          />
          <TextInput
            label="Valor Total"
            value={formData.valor_total}
            onChangeText={text => setFormData({ ...formData, valor_total: text })}
            style={styles.input}
            keyboardType="numeric"
          />
          <Text style={styles.label}>Tipo de Pagamento</Text>
          <View style={styles.radioGroup}>
            {['dinheiro', 'boleto', 'cheque', 'vale', 'pix', 'cartao'].map(tipo => (
              <TouchableOpacity
                key={tipo}
                style={[
                  styles.radioButton,
                  formData.tipo_pagamento === tipo && styles.radioButtonSelected
                ]}
                onPress={() => setFormData({ ...formData, tipo_pagamento: tipo })}
              >
                <Text style={formData.tipo_pagamento === tipo ? styles.radioTextSelected : styles.radioText}>
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.registerButton}
            labelStyle={styles.buttonLabel}
            loading={loading}
            disabled={loading}
          >
            {loading ? 'REGISTRANDO...' : 'REGISTRAR ENTREGA'}
          </Button>
        </View>
      </ScrollView>
    </View>
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
    marginBottom: 15,
  },
  pickerOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  pickerOptionSelected: {
    backgroundColor: '#043b57',
    borderColor: '#043b57',
  },
  pickerText: {
    color: '#333',
  },
  pickerTextSelected: {
    color: 'white',
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
    paddingVertical: 5,
    borderRadius: 25,
  },
  buttonLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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
});