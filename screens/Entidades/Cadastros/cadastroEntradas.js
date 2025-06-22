import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { supabase } from '../../../contexts/supabaseClient';
import { databaseService } from '../../../services/localDatabase';

export default function CadastroEntradas({ navigation }) {
  const [formData, setFormData] = useState({
    estoque_id: null,
    quantidade: '',
    data_entrada: new Date(),
    fornecedor: '',
    observacao: '',
    nota: false,
    responsavel_id: supabase.auth.user()?.id,
    valor_unitario: '',
    valor_total: '',
    tipo_pagamento: ''
  });

  const [estoques, setEstoques] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [numeroNota, setNumeroNota] = useState('');

  useEffect(() => {
    const fetchEstoques = async () => {
      try {
        const { data, error } = await supabase
          .from('estoque')
          .select('id, nome, tipo')
          .order('nome', { ascending: true });
        if (error) throw error;
        setEstoques(data || []);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar os itens do estoque');
      }
    };
    fetchEstoques();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.estoque_id) newErrors.estoque_id = 'Selecione um item';
    if (!formData.quantidade || isNaN(formData.quantidade) || parseInt(formData.quantidade) <= 0) {
      newErrors.quantidade = 'Quantidade inválida';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const entradaData = {
        estoque_id: formData.estoque_id,
        quantidade: parseInt(formData.quantidade),
        data_entrada: formData.data_entrada.toISOString().split('T')[0],
        fornecedor: formData.fornecedor?.trim() || null,
        observacao: formData.observacao?.trim() || null,
        nota: formData.nota ? 1 : 0,
        responsavel_id: formData.responsavel_id,
        valor_unitario: formData.valor_unitario || null,
        valor_total: formData.valor_total || null,
        tipo_pagamento: formData.tipo_pagamento || null,
        numero_nota: numeroNota || null
      };
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        const { error } = await supabase.from('entrada').insert([entradaData]);
        if (error) throw error;
      } else {
        await databaseService.insertWithUUID('entrada', entradaData);
      }
      Alert.alert('Sucesso', 'Entrada registrada com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao registrar entrada');
    } finally {
      setLoading(false);
    }
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REGISTRO DE ENTRADA</Text>
          <Text style={styles.label}>Item do Estoque*</Text>
          <View style={styles.pickerContainer}>
            {estoques.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.pickerOption,
                  formData.estoque_id === item.id && styles.pickerOptionSelected
                ]}
                onPress={() => setFormData({ ...formData, estoque_id: item.id })}
              >
                <Text style={formData.estoque_id === item.id ? styles.pickerTextSelected : styles.pickerText}>
                  {item.nome} ({item.tipo || 'Sem tipo'})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.estoque_id && <Text style={styles.errorText}>{errors.estoque_id}</Text>}

          <Text style={styles.label}>Data*</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {formData.data_entrada.toLocaleDateString('pt-BR')}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={formData.data_entrada}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setFormData({ ...formData, data_entrada: selectedDate });
              }}
            />
          )}

          <TextInput
            label="Quantidade*"
            value={formData.quantidade}
            onChangeText={text => setFormData({ ...formData, quantidade: text })}
            style={styles.input}
            keyboardType="numeric"
            error={!!errors.quantidade}
          />
          {errors.quantidade && <Text style={styles.errorText}>{errors.quantidade}</Text>}

          <TextInput
            label="Fornecedor (Opcional)"
            value={formData.fornecedor}
            onChangeText={text => setFormData({ ...formData, fornecedor: text })}
            style={styles.input}
          />

          <TextInput
            label="Observações (Opcional)"
            value={formData.observacao}
            onChangeText={text => setFormData({ ...formData, observacao: text })}
            style={styles.input}
            multiline
            numberOfLines={3}
          />

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setFormData({ ...formData, nota: !formData.nota })}
            >
              <View style={[styles.checkboxBox, formData.nota && styles.checkboxChecked]}>
                {formData.nota && <Text style={styles.checkboxCheckmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Possui Nota Fiscal</Text>
            </TouchableOpacity>
          </View>

          {formData.nota && (
            <TextInput
              label="Número da Nota Fiscal"
              value={numeroNota}
              onChangeText={setNumeroNota}
              style={styles.input}
            />
          )}

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
        </View>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        >
          Registrar Entrada
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  header: {
    backgroundColor: '#043b57',
    paddingTop: StatusBar.currentHeight,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  logo: {
    width: 120,
    height: 40,
  },
  alerta: {
    width: 24,
    height: 24,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: 'medium',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  pickerOption: {
    padding: 12,
  },
  pickerOptionSelected: {
    backgroundColor: '#e0f7fa',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  pickerTextSelected: {
    fontWeight: 'bold',
    color: '#00796b',
  },
  dateInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 16,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    fontSize: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 16,
    padding: 12,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#00796b',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#00796b',
  },
  checkboxCheckmark: {
    color: '#fff',
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  radioButton: {
    flex: 1,
    backgroundColor: '#00796b',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#e0f7fa',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
  radioTextSelected: {
    fontWeight: 'bold',
    color: '#00796b',
  },
  submitButton: {
    backgroundColor: '#00796b',
    borderRadius: 4,
    padding: 12,
    margin: 16,
  },
});