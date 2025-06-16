import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { supabase } from '../../../contexts/supabaseClient';

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
    disponivel_geral: true,
    quantidade_reservada: 0,
    funcionario_id: supabase.auth.user()?.id
  });

  const [showDatePickerAquisicao, setShowDatePickerAquisicao] = useState(false);
  const [showDatePickerValidade, setShowDatePickerValidade] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData({...formData, [field]: value});
    if (errors[field]) setErrors({...errors, [field]: null});
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
      const produtoData = {
        nome: formData.nome.trim(),
        numero_serie: formData.numero_serie.trim() || null,
        quantidade: parseInt(formData.quantidade),
        tipo: formData.tipo.trim() || null,
        data_aquisicao: formData.data_aquisicao.toISOString(),
        data_validade: formData.data_validade ? formData.data_validade.toISOString() : null,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        valor: parseFloat(formData.valor),
        modalidade: formData.modalidade.trim() || null,
        observacao: formData.observacao.trim() || null,
        disponivel_geral: formData.disponivel_geral,
        quantidade_reservada: formData.quantidade_reservada,
        funcionario_id: formData.funcionario_id
      };

      const { data, error } = await supabase
        .from('estoque')
        .insert([produtoData])
        .single();

      if (error) throw error;

      Alert.alert('Sucesso', 'Produto cadastrado com sucesso!');
      navigation.goBack();

    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      Alert.alert('Erro', error.message || 'Falha ao cadastrar produto');
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
            label="Número de Série"
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
          {(errors.quantidade || errors.valor) && (
            <Text style={styles.errorText}>{errors.quantidade || errors.valor}</Text>
          )}

          <TextInput
            label="Peso Unitário (kg)"
            value={formData.peso}
            onChangeText={text => handleChange('peso', text)}
            style={styles.input}
            keyboardType="numeric"
            right={<TextInput.Affix text="kg" />}
          />

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

          <TextInput
            label="Tipo"
            value={formData.tipo}
            onChangeText={text => handleChange('tipo', text)}
            style={styles.input}
          />

          <TextInput
            label="Modalidade"
            value={formData.modalidade}
            onChangeText={text => handleChange('modalidade', text)}
            style={styles.input}
          />

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
});