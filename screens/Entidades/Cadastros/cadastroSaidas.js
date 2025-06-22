import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Checkbox, Text, TextInput } from 'react-native-paper';
import { supabase } from '../../../contexts/supabaseClient';
import { databaseService } from '../../../services/localDatabase';

export default function CadastroSaidas({ navigation }) {
  const [formData, setFormData] = useState({
    tipo: 'manual',
    estoque_id: null,
    quantidade: '',
    cliente_id: null,
    veiculo_id: null,
    funcionario_id: null,
    data_saida: new Date(),
    motivo: '',
    observacao: '',
    nota: false,
    valor_unitario: '',
    valor_total: '',
    tipo_pagamento: ''
  });

  const [estoques, setEstoques] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [tipoSaida, setTipoSaida] = useState('manual');
  const [origemId, setOrigemId] = useState('');
  const [numeroNota, setNumeroNota] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          { data: estoquesData, error: estoquesError },
          { data: clientesData, error: clientesError },
          { data: veiculosData, error: veiculosError },
          { data: funcionariosData, error: funcionariosError }
        ] = await Promise.all([
          supabase.from('estoque').select('id, nome, quantidade').gt('quantidade', 0).order('nome'),
          supabase.from('cliente').select('id, nome').order('nome'),
          supabase.from('veiculo').select('id, placa, modelo').order('placa'),
          supabase.from('funcionario').select('id, nome').order('nome')
        ]);

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
    if (!formData.estoque_id) newErrors.estoque = 'Selecione um item';
    if (!formData.quantidade || isNaN(formData.quantidade)) newErrors.quantidade = 'Quantidade inválida';
    if (!formData.funcionario_id) newErrors.funcionario = 'Selecione um responsável';
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
      const saidaData = {
        tipo: tipoSaida,
        origem_id: tipoSaida !== 'manual' ? origemId : null,
        estoque_id: formData.estoque_id,
        quantidade: parseInt(formData.quantidade),
        cliente_id: formData.cliente_id,
        veiculo_id: formData.veiculo_id,
        funcionario_id: formData.funcionario_id,
        data_saida: formData.data_saida.toISOString(),
        motivo: formData.motivo.trim() || null,
        observacao: formData.observacao.trim() || null,
        nota: formData.nota ? 1 : 0,
        numero_nota: numeroNota || null,
        valor_unitario: formData.valor_unitario ? parseFloat(formData.valor_unitario) : null,
        valor_total: formData.valor_total ? parseFloat(formData.valor_total) : null,
        tipo_pagamento: formData.tipo_pagamento || null
      };

      const state = await NetInfo.fetch();
      if (state.isConnected) {
        const { error } = await supabase.from('saida').insert([saidaData]);
        if (error) throw error;
      } else {
        await databaseService.insertWithUUID('saida', saidaData);
      }

      Alert.alert('Sucesso', 'Saída registrada com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao registrar saída');
    } finally {
      setLoading(false);
    }
  };

  const renderPicker = (items, selectedId, fieldName, label) => (
    <>
      <Text style={styles.label}>{label}</Text>
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
              {item.nome || `${item.placa} - ${item.modelo}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipalADM')}>
            <Image 
              source={require('../../../Assets/ADM.png')} 
              style={styles.alerta}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REGISTRO DE SAÍDA</Text>
          {/* Seletor de Item do Estoque */}
          <Text style={styles.label}>Item do Estoque*</Text>
          <View style={styles.pickerContainer}>
            {estoques.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.pickerOption,
                  formData.estoque_id === item.id && styles.pickerOptionSelected
                ]}
                onPress={() => setFormData({...formData, estoque_id: item.id})}
              >
                <Text style={formData.estoque_id === item.id ? styles.pickerTextSelected : styles.pickerText}>
                  {item.nome} (Disponível: {item.quantidade})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.estoque && <Text style={styles.errorText}>{errors.estoque}</Text>}

          {/* Quantidade */}
          <TextInput
            label="Quantidade*"
            value={formData.quantidade}
            onChangeText={text => setFormData({...formData, quantidade: text})}
            style={styles.input}
            keyboardType="numeric"
            error={!!errors.quantidade}
          />
          {errors.quantidade && <Text style={styles.errorText}>{errors.quantidade}</Text>}

          {/* Seletor de Cliente */}
          {renderPicker(clientes, formData.cliente_id, 'cliente_id', 'Cliente (Opcional)')}

          {/* Seletor de Veículo */}
          {renderPicker(veiculos, formData.veiculo_id, 'veiculo_id', 'Veículo (Opcional)')}

          {/* Seletor de Funcionário */}
          <Text style={styles.label}>Responsável*</Text>
          <View style={styles.pickerContainer}>
            {funcionarios.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.pickerOption,
                  formData.funcionario_id === item.id && styles.pickerOptionSelected
                ]}
                onPress={() => setFormData({...formData, funcionario_id: item.id})}
              >
                <Text style={formData.funcionario_id === item.id ? styles.pickerTextSelected : styles.pickerText}>
                  {item.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.funcionario && <Text style={styles.errorText}>{errors.funcionario}</Text>}

          {/* Data */}
          <Text style={styles.label}>Data e Hora*</Text>
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
                if (selectedDate) {
                  setFormData({...formData, data_saida: selectedDate});
                }
              }}
            />
          )}

          {/* Motivo */}
          <TextInput
            label="Motivo"
            value={formData.motivo}
            onChangeText={text => setFormData({...formData, motivo: text})}
            style={styles.input}
          />

          {/* Nota Fiscal */}
          <View style={styles.checkboxContainer}>
            <Checkbox
              status={formData.nota ? 'checked' : 'unchecked'}
              onPress={() => setFormData({...formData, nota: !formData.nota})}
              color="#043b57"
            />
            <Text style={styles.checkboxLabel}>Possui Nota Fiscal</Text>
          </View>
          <Text style={styles.label}>Tipo de Saída *</Text>
          <View style={styles.pickerContainer}>
            {[
              { value: 'pedido', label: 'Pedido' },
              { value: 'entrega', label: 'Entrega' },
              { value: 'manual', label: 'Manual' }
            ].map(item => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.pickerOption,
                  tipoSaida === item.value && styles.pickerOptionSelected
                ]}
                onPress={() => setTipoSaida(item.value)}
              >
                <Text style={tipoSaida === item.value ? styles.pickerTextSelected : styles.pickerText}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tipoSaida !== 'manual' && (
            <TextInput
              label={`ID de ${tipoSaida === 'pedido' ? 'Pedido' : 'Entrega'}*`}
              value={origemId}
              onChangeText={setOrigemId}
              style={styles.input}
            />
          )}

          <TextInput
            label="Número da Nota Fiscal"
            value={numeroNota}
            onChangeText={setNumeroNota}
            style={styles.input}
            keyboardType="numeric"
          />

          {/* Valor Unitário e Valor Total */}
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

          {/* Tipo de Pagamento */}
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

          {/* Observações */}
          <TextInput
            label="Observações"
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
            {loading ? 'REGISTRANDO...' : 'REGISTRAR SAÍDA'}
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxLabel: {
    marginLeft: 8,
    color: '#043b57',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  radioButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#f9f9f9',
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