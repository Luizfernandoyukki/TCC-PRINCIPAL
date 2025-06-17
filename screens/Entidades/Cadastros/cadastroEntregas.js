import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { supabase } from '../../../contexts/supabaseClient';
import { cadastrarEntrega } from '../script/cadastrosService';

const handleSalvar = async () => {
  try {
    const resultado = await cadastrarEntrega({
      estoque_id,
      quantidade,
      cliente_id,
      veiculo_id,
      funcionario_id,
      status,
      motivo_devolucao,
      observacao
    });
    alert('Entrega cadastrada via: ' + resultado.origem);
  } catch (err) {
    alert('Erro no cadastro: ' + err.message);
  }
};

export default function CadastroEntregas({ navigation }) {
  const [formData, setFormData] = useState({
    estoque_id: null,
    quantidade: '',
    cliente_id: null,
    veiculo_id: null,
    funcionario_id: null,
    data_saida: new Date(),
    status: 'preparacao',
    observacao: ''
  });

  const [estoques, setEstoques] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Carrega dados necessários
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Busca estoques disponíveis
        const { data: estoquesData, error: estoquesError } = await supabase
          .from('estoque')
          .select('id, nome, quantidade')
          .gt('quantidade', 0)
          .order('nome', { ascending: true });

        // Busca clientes
        const { data: clientesData, error: clientesError } = await supabase
          .from('cliente')
          .select('id, nome')
          .order('nome', { ascending: true });

        // Busca veículos
        const { data: veiculosData, error: veiculosError } = await supabase
          .from('veiculo')
          .select('id, placa, modelo')
          .order('placa', { ascending: true });

        // Busca funcionários
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
        console.error('Erro ao carregar dados:', error);
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
    
    // Verifica se há estoque suficiente
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
        data_saida: formData.data_saida.toISOString(),
        status: formData.status,
        observacao: formData.observacao.trim() || null,
        criado_em: new Date().toISOString()
      };

      // Insere a entrega
      const { data: entrega, error } = await supabase
        .from('entrega')
        .insert([entregaData])
        .single();

      if (error) throw error;

      // Atualiza o estoque (diminui a quantidade)
      const { error: updateError } = await supabase
        .from('estoque')
        .update({ quantidade: supabase.rpc('decrement', {
          column: 'quantidade',
          value: parseInt(formData.quantidade)
        })})
        .eq('id', formData.estoque_id);

      if (updateError) throw updateError;

      Alert.alert('Sucesso', 'Entrega registrada com sucesso!');
      navigation.goBack();

    } catch (error) {
      console.error('Erro ao registrar entrega:', error);
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
            onPress={() => setFormData({...formData, [fieldName]: item.id})}
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
          
          {/* Seletor de Item do Estoque */}
          {renderPicker(estoques, formData.estoque_id, 'estoque_id', 'Item do Estoque')}

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
          {renderPicker(clientes, formData.cliente_id, 'cliente_id', 'Cliente')}

          {/* Seletor de Veículo */}
          {renderPicker(veiculos, formData.veiculo_id, 'veiculo_id', 'Veículo')}

          {/* Seletor de Funcionário */}
          {renderPicker(funcionarios, formData.funcionario_id, 'funcionario_id', 'Funcionário Responsável')}

          {/* Data */}
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
                if (selectedDate) {
                  setFormData({...formData, data_saida: selectedDate});
                }
              }}
            />
          )}

          {/* Observações */}
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
});