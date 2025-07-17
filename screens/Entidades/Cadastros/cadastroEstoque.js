import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { supabase } from '../../../contexts/supabaseClient';
import { databaseService } from '../../../services/localDatabase';

export default function CadastroEstoque({ navigation }) {
  const [formData, setFormData] = useState({
    nome: '',
    numero_serie: '',
    quantidade: '',
    tipo: '',
    data_aquisicao: new Date(),
    data_validade: null,
    peso: '',
    valor: '',
    modalidade: '',
    observacao: '',
    funcionario_id: '',
    cliente_id: '',
    disponivel_geral: true,
    quantidade_reservada: 0
  });

  useEffect(() => {
    const fetchUserId = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setFormData(prev => ({ ...prev, funcionario_id: data.user.id }));
      } else {
        console.log('Erro ao buscar usuário logado:', error);
      }
    };
    fetchUserId();
  }, []);

  const [showDatePickerAquisicao, setShowDatePickerAquisicao] = useState(false);
  const [showDatePickerValidade, setShowDatePickerValidade] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: null });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome.trim()) newErrors.nome = 'Campo obrigatório';
    if (!formData.quantidade || isNaN(formData.quantidade)) newErrors.quantidade = 'Quantidade inválida';
    if (!formData.valor || isNaN(formData.valor)) newErrors.valor = 'Valor inválido';
    if (!formData.data_aquisicao) newErrors.data_aquisicao = 'Data obrigatória';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const estoqueData = {
        nome: formData.nome.trim(),
        quantidade: parseInt(formData.quantidade),
        numero_serie: formData.numero_serie?.trim() || null,
        tipo: formData.tipo || null,
        data_aquisicao: formData.data_aquisicao?.toISOString().split('T')[0] || null,
        data_validade: formData.data_validade?.toISOString().split('T')[0] || null,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        valor: formData.valor ? parseFloat(formData.valor) : null,
        modalidade: formData.modalidade || null,
        observacao: formData.observacao?.trim() || null,
        funcionario_id: formData.funcionario_id,
        cliente_id: formData.cliente_id ? Number(formData.cliente_id) : null,
        quantidade_reservada: formData.quantidade_reservada || 0,
      };

      const state = await NetInfo.fetch();
      if (state.isConnected) {
        const { error } = await supabase.from('estoque').insert([estoqueData]);
        if (error) throw error;
      } else {
        await databaseService.insertWithUUID('estoque', estoqueData);
      }

      Alert.alert('Sucesso', 'Item de estoque cadastrado com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao cadastrar estoque');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
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
          <Text style={styles.sectionTitle}>CADASTRO DE PRODUTO</Text>

          <TextInput
            label="Nome do Produto*"
            value={formData.nome}
            onChangeText={text => handleChange('nome', text)}
            style={styles.input}
            error={!!errors.nome}
          />
          {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}

          <TextInput
            label="Lote"
            value={formData.numero_serie}
            onChangeText={text => handleChange('numero_serie', text)}
            style={styles.input}
          />

          <View style={styles.row}>
            <TextInput
              label="Quantidade*"
              value={formData.quantidade}
              onChangeText={text => handleChange('quantidade', text)}
              style={[styles.input, styles.halfInput]}
              keyboardType="numeric"
              error={!!errors.quantidade}
            />
            <TextInput
              label="Valor Unitário*"
              value={formData.valor}
              onChangeText={text => handleChange('valor', text)}
              style={[styles.input, styles.halfInput]}
              keyboardType="numeric"
              error={!!errors.valor}
            />
          </View>

          <TextInput
            label="Peso Unitário (kg)"
            value={formData.peso}
            onChangeText={text => handleChange('peso', text)}
            style={styles.input}
            keyboardType="numeric"
            right={<TextInput.Affix text="kg" />}
          />

          {/* Date Pickers */}
          <Text style={styles.label}>Data de Aquisição*</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePickerAquisicao(true)}
          >
            <Text style={styles.dateText}>
              {formData.data_aquisicao.toLocaleDateString('pt-BR')}
            </Text>
          </TouchableOpacity>
          {showDatePickerAquisicao && (
            <DateTimePicker
              value={formData.data_aquisicao}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePickerAquisicao(false);
                if (selectedDate) handleChange('data_aquisicao', selectedDate);
              }}
            />
          )}
          {errors.data_aquisicao && <Text style={styles.errorText}>{errors.data_aquisicao}</Text>}

          <Text style={styles.label}>Data de Validade</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePickerValidade(true)}
          >
            <Text style={styles.dateText}>
              {formData.data_validade ? formData.data_validade.toLocaleDateString('pt-BR') : 'Selecione'}
            </Text>
          </TouchableOpacity>
          {showDatePickerValidade && (
            <DateTimePicker
              value={formData.data_validade || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePickerValidade(false);
                if (selectedDate) handleChange('data_validade', selectedDate);
              }}
            />
          )}

          {/* Picker de Tipo */}
          <Text style={styles.label}>Tipo</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.tipo}
              onValueChange={(value) => handleChange('tipo', value)}
              style={styles.picker}
            >
              <Picker.Item label="Selecione o tipo" value="" />
              <Picker.Item label="Unidade" value="unidade" />
              <Picker.Item label="Quilo" value="quilo" />
              <Picker.Item label="Caixa" value="caixa" />
            </Picker>
          </View>

          {/* Picker de Modalidade */}
          <Text style={styles.label}>Modalidade</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.modalidade}
              onValueChange={(value) => handleChange('modalidade', value)}
              style={styles.picker}
            >
              <Picker.Item label="Selecione a modalidade" value="" />
              <Picker.Item label="Produção Própria" value="producao" />
              <Picker.Item label="Venda Terceirizada" value="terceirizada" />
            </Picker>
          </View>

          <TextInput
            label="Observações"
            value={formData.observacao}
            onChangeText={text => handleChange('observacao', text)}
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
            {loading ? 'CADASTRANDO...' : 'CADASTRAR PRODUTO'}
          </Button>
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
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  picker: {
    height: 50,
    width: '100%',
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
  halfInput: {
    flex: 1,
    marginRight: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
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