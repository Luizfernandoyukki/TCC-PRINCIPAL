import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../contexts/supabaseClient';
import { databaseService } from '../../../services/localDatabase';

export default function CadastroDevolucoes({ navigation }) {
  const [formData, setFormData] = useState({
    estoque_id: null,
    quantidade: '',
    motivo: '',
    data_devolucao: new Date(),
    observacao: '',
    responsavel_id: supabase.auth.user()?.id
  });
  const [estoques, setEstoques] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('pendente');
  const [valorUnitario, setValorUnitario] = useState('');

  useEffect(() => {
    const fetchEstoques = async () => {
      try {
        const { data, error } = await supabase
          .from('estoque')
          .select('id, nome, quantidade')
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
    if (!formData.quantidade || isNaN(formData.quantidade)) newErrors.quantidade = 'Quantidade inválida';
    if (!formData.motivo) newErrors.motivo = 'Motivo obrigatório';
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
      const devolucaoData = {
        estoque_id: formData.estoque_id,
        quantidade: parseInt(formData.quantidade),
        motivo: formData.motivo.trim(),
        data_devolucao: formData.data_devolucao.toISOString().split('T')[0],
        observacao: formData.observacao.trim() || null,
        responsavel_id: formData.responsavel_id,
        status,
        valor_unitario: valorUnitario || null
      };

      const state = await NetInfo.fetch();
      if (state.isConnected) {
        const { error } = await supabase.from('devolucao').insert([devolucaoData]);
        if (error) throw error;
      } else {
        await databaseService.insertWithUUID('devolucao', devolucaoData);
      }

      Alert.alert('Sucesso', 'Devolução registrada com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao registrar devolução');
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
          <Text style={styles.sectionTitle}>REGISTRO DE DEVOLUÇÕES</Text>
          <TouchableOpacity onPress={() => setFormData({ ...formData, estoque_id: item.id })}>
            {/* Seletor de Item */}
            <Text style={formData.estoque_id === item.id ? styles.pickerTextSelected : styles.pickerText}>
              <Text style={styles.label}>Item do Estoque*</Text>
              <View style={styles.pickerContainer}>
                {estoques.map(item => (
                  <TouchableOpacity key={item.id} onPress={() => setFormData({ ...formData, estoque_id: item.id })}>
                    <Text style={formData.estoque_id === item.id ? styles.pickerTextSelected : styles.pickerText}>
                      {item.nome} (Disponível: {item.quantidade})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Text>
            {errors.estoque_id && <Text style={styles.errorText}>{errors.estoque_id}</Text>}
          </TouchableOpacity>

          {/* Data */}
          <Text style={styles.label}>Data*</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {formData.data_devolucao.toLocaleDateString('pt-BR')}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={formData.data_devolucao}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setFormData({ ...formData, data_devolucao: selectedDate });
                }
              }}
            />
          )}

          {/* Quantidade */}
          <Text style={styles.label}>Quantidade*</Text>
          <TextInput
            value={formData.quantidade}
            onChangeText={text => setFormData({ ...formData, quantidade: text })}
            style={styles.input}
            keyboardType="numeric"
            error={!!errors.quantidade}
          />
          {errors.quantidade && <Text style={styles.errorText}>{errors.quantidade}</Text>}

          {/* Motivo */}
          <Text style={styles.label}>Motivo*</Text>
          <TextInput
            value={formData.motivo}
            onChangeText={text => setFormData({ ...formData, motivo: text })}
            style={styles.input}
            error={!!errors.motivo}
          />
          {errors.motivo && <Text style={styles.errorText}>{errors.motivo}</Text>}

          {/* Valor Unitário (Opcional) */}
          <Text style={styles.label}>Valor Unitário (Opcional)</Text>
          <TextInput
            value={valorUnitario}
            onChangeText={setValorUnitario}
            style={styles.input}
            keyboardType="numeric"
          />

          {/* Status */}
          <Text style={styles.label}>Status *</Text>
          <View style={styles.radioGroup}>
            {['pendente', 'processada', 'cancelada'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.radioButton, status === item && styles.radioButtonSelected]}
                onPress={() => setStatus(item)}
              >
                <Text style={status === item ? styles.radioTextSelected : styles.radioText}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Observações (Opcional) */}
          <Text style={styles.label}>Observações (Opcional)</Text>
          <TextInput
            value={formData.observacao}
            onChangeText={text => setFormData({ ...formData, observacao: text })}
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
            {loading ? 'REGISTRANDO...' : 'REGISTRAR DEVOLUÇÃO'}
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
    height: 40,
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
  },
  label: {
    marginBottom: 8,
    color: '#043b57',
  },
  input: {
    backgroundColor: 'white',
    marginBottom: 15,
    borderRadius: 5,
    padding: 10,
  },
  dateInput: {
    backgroundColor: 'white',
    borderRadius: 5,
    marginBottom: 15,
    padding: 10,
  },
  dateText: {
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
    marginBottom: 15,
  },
  pickerText: {
    padding: 12,
    fontSize: 16,
  },
  pickerTextSelected: {
    color: 'white',
  },
  pickerOption: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
  },
  pickerOptionSelected: {
    backgroundColor: '#043b57',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  radioButton: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#043b57',
  },
  radioText: {
    color: '#333',
  },
  radioTextSelected: {
    color: 'white',
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
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 15,
  },
});