import { useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { supabase } from '../../../contexts/supabaseClient';

export default function CadastroVeiculos({ navigation }) {
  const [formData, setFormData] = useState({
    placa: '',
    modelo: '',
    funcao_veiculo_id: null,
    capacidade_kg: '',
    observacao: ''
  });

  const [funcoesVeiculo, setFuncoesVeiculo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchFuncoes = async () => {
      try {
        const { data, error } = await supabase
          .from('funcao_veiculo')
          .select('id, nome')
          .order('nome');

        if (error) throw error;
        setFuncoesVeiculo(data || []);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar as funções de veículo');
        console.error(error);
      }
    };

    fetchFuncoes();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.placa.trim()) newErrors.placa = 'Campo obrigatório';
    if (!formData.modelo.trim()) newErrors.modelo = 'Campo obrigatório';
    if (formData.placa.trim().length < 7) newErrors.placa = 'Placa inválida';
    if (formData.capacidade_kg && isNaN(formData.capacidade_kg)) newErrors.capacidade = 'Valor inválido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const veiculoData = {
        placa: formData.placa.trim().toUpperCase(),
        modelo: formData.modelo.trim(),
        funcao_veiculo_id: formData.funcao_veiculo_id,
        capacidade_kg: formData.capacidade_kg ? parseFloat(formData.capacidade_kg) : null,
        observacao: formData.observacao.trim() || null
      };

      const { data, error } = await supabase
        .from('veiculo')
        .insert([veiculoData])
        .single();

      if (error) throw error;

      Alert.alert('Sucesso', 'Veículo cadastrado com sucesso!');
      navigation.goBack();

    } catch (error) {
      console.error('Erro ao cadastrar veículo:', error);
      Alert.alert('Erro', error.message || 'Falha ao cadastrar veículo');
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
          <Text style={styles.sectionTitle}>CADASTRO DE VEÍCULO</Text>
          
          <TextInput
            label="Placa*"
            value={formData.placa}
            onChangeText={text => {
              setFormData({...formData, placa: text.toUpperCase()});
              if (errors.placa) setErrors({...errors, placa: null});
            }}
            style={styles.input}
            error={!!errors.placa}
            maxLength={7}
          />
          {errors.placa && <Text style={styles.errorText}>{errors.placa}</Text>}

          <TextInput
            label="Modelo*"
            value={formData.modelo}
            onChangeText={text => {
              setFormData({...formData, modelo: text});
              if (errors.modelo) setErrors({...errors, modelo: null});
            }}
            style={styles.input}
            error={!!errors.modelo}
          />
          {errors.modelo && <Text style={styles.errorText}>{errors.modelo}</Text>}

          {/* Seletor de Função */}
          <Text style={styles.label}>Função</Text>
          <View style={styles.pickerContainer}>
            {funcoesVeiculo.map(funcao => (
              <TouchableOpacity
                key={funcao.id}
                style={[
                  styles.pickerOption,
                  formData.funcao_veiculo_id === funcao.id && styles.pickerOptionSelected
                ]}
                onPress={() => setFormData({...formData, funcao_veiculo_id: funcao.id})}
              >
                <Text style={formData.funcao_veiculo_id === funcao.id ? styles.pickerTextSelected : styles.pickerText}>
                  {funcao.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            label="Capacidade (kg)"
            value={formData.capacidade_kg}
            onChangeText={text => {
              setFormData({...formData, capacidade_kg: text});
              if (errors.capacidade) setErrors({...errors, capacidade: null});
            }}
            style={styles.input}
            keyboardType="numeric"
            error={!!errors.capacidade}
          />
          {errors.capacidade && <Text style={styles.errorText}>{errors.capacidade}</Text>}

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
            {loading ? 'CADASTRANDO...' : 'CADASTRAR VEÍCULO'}
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
});