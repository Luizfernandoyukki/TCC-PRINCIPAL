import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Checkbox, Text, TextInput } from 'react-native-paper';
import { supabase } from '../../../contexts/supabaseClient';
import { databaseService } from '../../../services/localDatabase';

export default function CadastroPedidos({ navigation }) {
  const [formData, setFormData] = useState({
    estoque_id: null,
    cliente_id: null,
    quantidade: '',
    data_pedido: new Date(),
    status: 'pendente',
    observacao: '',
    nota: false,
    criado_por: supabase.auth.user()?.id,
    valor_unitario: '',
    valor_total: '',
    tipo_pagamento: 'dinheiro'
  });

  const [estoques, setEstoques] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [prazoEntrega, setPrazoEntrega] = useState('');

  // Carrega dados necessários
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: estoquesData, error: estoquesError } = await supabase
          .from('estoque')
          .select('id, nome, quantidade')
          .gt('quantidade', 0)
          .order('nome', { ascending: true });

        const { data: clientesData, error: clientesError } = await supabase
          .from('cliente')
          .select('id, nome')
          .order('nome', { ascending: true });

        if (estoquesError || clientesError) {
          throw estoquesError || clientesError;
        }

        setEstoques(estoquesData || []);
        setClientes(clientesData || []);
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
    if (!formData.estoque_id) newErrors.estoque = 'Selecione um item';
    if (!formData.cliente_id) newErrors.cliente = 'Selecione um cliente';
    if (!formData.quantidade || isNaN(formData.quantidade)) newErrors.quantidade = 'Quantidade inválida';
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
      const pedidoData = {
        estoque_id: formData.estoque_id,
        cliente_id: formData.cliente_id,
        quantidade: parseInt(formData.quantidade),
        data_pedido: formData.data_pedido.toISOString(),
        status: formData.status,
        observacao: formData.observacao.trim() || null,
        nota: formData.nota ? 1 : 0,
        criado_por: formData.criado_por,
        valor_unitario: formData.valor_unitario ? parseFloat(formData.valor_unitario) : null,
        valor_total: formData.valor_total ? parseFloat(formData.valor_total) : null,
        tipo_pagamento: formData.tipo_pagamento,
        prazo_entrega: prazoEntrega || null
      };

      const state = await NetInfo.fetch();
      if (state.isConnected) {
        const { error } = await supabase.from('pedido').insert([pedidoData]);
        if (error) throw error;
      } else {
        await databaseService.insertWithUUID('pedido', pedidoData);
      }

      Alert.alert('Sucesso', 'Pedido registrado com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao registrar pedido');
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
            onPress={() => setFormData({...formData, [fieldName]: item.id})}
          >
            <Text style={selectedId === item.id ? styles.pickerTextSelected : styles.pickerText}>
              {item.nome} {fieldName === 'estoque_id' ? `(Disponível: ${item.quantidade})` : ''}
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
          <Text style={styles.sectionTitle}>REGISTRO DE PEDIDOS</Text>
          {renderPicker(clientes, formData.cliente_id, 'cliente_id', 'Cliente')}
          {renderPicker(estoques, formData.estoque_id, 'estoque_id', 'Item do Estoque')}
          <TextInput
            label="Quantidade*"
            value={formData.quantidade}
            onChangeText={text => setFormData({...formData, quantidade: text})}
            style={styles.input}
            keyboardType="numeric"
            error={!!errors.quantidade}
          />
          {errors.quantidade && <Text style={styles.errorText}>{errors.quantidade}</Text>}
          <TextInput
            label="Valor Unitário"
            value={formData.valor_unitario}
            onChangeText={text => setFormData({...formData, valor_unitario: text})}
            style={styles.input}
            keyboardType="numeric"
          />
          <TextInput
            label="Valor Total"
            value={formData.valor_total}
            onChangeText={text => setFormData({...formData, valor_total: text})}
            style={styles.input}
            keyboardType="numeric"
          />
          <TextInput
            label="Prazo de Entrega (Opcional)"
            value={prazoEntrega}
            onChangeText={setPrazoEntrega}
            style={styles.input}
            placeholder="Ex: 5 dias úteis"
          />
          <Text style={styles.label}>Data do Pedido*</Text>
          <TouchableOpacity 
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {formData.data_pedido.toLocaleString('pt-BR')}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={formData.data_pedido}
              mode="datetime"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setFormData({...formData, data_pedido: selectedDate});
                }
              }}
            />
          )}
          <Text style={styles.label}>Tipo de Pagamento</Text>
          <View style={styles.radioGroup}>
            {['dinheiro','boleto','cheque','vale','pix','cartao'].map(tipo => (
              <TouchableOpacity
                key={tipo}
                style={[
                  styles.radioButton,
                  formData.tipo_pagamento === tipo && styles.radioButtonSelected
                ]}
                onPress={() => setFormData({...formData, tipo_pagamento: tipo})}
              >
                <Text style={formData.tipo_pagamento === tipo ? styles.radioTextSelected : styles.radioText}>
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.checkboxContainer}>
            <Checkbox
              status={formData.nota ? 'checked' : 'unchecked'}
              onPress={() => setFormData({...formData, nota: !formData.nota})}
              color="#043b57"
            />
            <Text style={styles.checkboxLabel}>Possui Nota Fiscal</Text>
          </View>
          <TextInput
            label="Observações (Opcional)"
            value={formData.observacao}
            onChangeText={text => setFormData({...formData, observacao: text})}
            style={styles.input}
            multiline
            numberOfLines={3}
          />
          <Button 
            mode="contained" 
            onPress={handleSubmit}
            style={styles.registerButton}
            labelStyle={styles.buttonLabel}
            loading={loading}
            disabled={loading}
          >
            {loading ? 'REGISTRANDO...' : 'REGISTRAR PEDIDO'}
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
  dateInput: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
  },
  dateText: {
    fontSize: 16,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxLabel: {
    marginLeft: 8,
    color: '#043b57',
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
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  radioButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginRight: 10,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#043b57',
    borderColor: '#043b57',
  },
  radioText: {
    color: '#333',
  },
  radioTextSelected: {
    color: 'white',
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxLabel: {
    marginLeft: 8,
    color: '#043b57',
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
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  radioButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginRight: 10,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#043b57',
    borderColor: '#043b57',
  },
  radioText: {
    color: '#333',
  },
  radioTextSelected: {
    color: 'white',
  },
});