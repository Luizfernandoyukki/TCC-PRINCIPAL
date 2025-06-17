import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { supabase } from '../../../contexts/supabaseClient';
import { cadastrarRota } from '../script/cadastrosService';

const handleSalvar = async () => {
  try {
    const resultado = await cadastrarRota({
      nome,
      destino,
      distancia,
      horario_partida,
      veiculo_id,
      funcionario_id,
      clientes_id,
      observacao,
      status,
      tempo_medio_minutos
    });
    alert('Rota cadastrada via: ' + resultado.origem);
  } catch (err) {
    alert('Erro no cadastro: ' + err.message);
  }
};

export default function CadastroRotas({ navigation }) {
  const [formData, setFormData] = useState({
    nome: '',
    destino: '',
    distancia: '',
    horario_partida: new Date(),
    veiculo_id: null,
    funcionario_id: null,
    clientes_id: [],
    data_rota: new Date(),
    observacao: '',
    status: 'pendente',
    tempo_medio_minutos: ''
  });

  const [veiculos, setVeiculos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [
          { data: veiculosData, error: veiculosError },
          { data: funcionariosData, error: funcionariosError },
          { data: clientesData, error: clientesError }
        ] = await Promise.all([
          supabase.from('veiculo').select('id, placa, modelo').order('placa'),
          supabase.from('funcionario').select('id, nome').order('nome'),
          supabase.from('cliente').select('id, nome').order('nome')
        ]);

        if (veiculosError || funcionariosError || clientesError) {
          throw veiculosError || funcionariosError || clientesError;
        }

        setVeiculos(veiculosData || []);
        setFuncionarios(funcionariosData || []);
        setClientes(clientesData || []);

      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar os dados necessários');
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleCliente = (clienteId) => {
    setFormData(prev => ({
      ...prev,
      clientes_id: prev.clientes_id.includes(clienteId)
        ? prev.clientes_id.filter(id => id !== clienteId)
        : [...prev.clientes_id, clienteId]
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome.trim()) newErrors.nome = 'Campo obrigatório';
    if (!formData.destino.trim()) newErrors.destino = 'Campo obrigatório';
    if (!formData.distancia || isNaN(formData.distancia)) newErrors.distancia = 'Valor inválido';
    if (!formData.veiculo_id) newErrors.veiculo = 'Selecione um veículo';
    if (!formData.funcionario_id) newErrors.funcionario = 'Selecione um motorista';
    if (formData.clientes_id.length === 0) newErrors.clientes = 'Selecione pelo menos um cliente';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const rotaData = {
        nome: formData.nome.trim(),
        destino: formData.destino.trim(),
        distancia: parseFloat(formData.distancia),
        horario_partida: formData.horario_partida.toISOString(),
        veiculo_id: formData.veiculo_id,
        funcionario_id: formData.funcionario_id,
        clientes_id: formData.clientes_id,
        data_rota: formData.data_rota.toISOString().split('T')[0],
        observacao: formData.observacao.trim() || null,
        status: formData.status,
        tempo_medio_minutos: formData.tempo_medio_minutos ? parseInt(formData.tempo_medio_minutos) : 0
      };

      const { data, error } = await supabase
        .from('rota')
        .insert([rotaData])
        .single();

      if (error) throw error;

      Alert.alert('Sucesso', 'Rota cadastrada com sucesso!');
      navigation.goBack();

    } catch (error) {
      console.error('Erro ao cadastrar rota:', error);
      Alert.alert('Erro', error.message || 'Falha ao cadastrar rota');
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
          <Text style={styles.sectionTitle}>CADASTRO DE ROTA</Text>
          
          <TextInput
            label="Nome da Rota*"
            value={formData.nome}
            onChangeText={text => setFormData({...formData, nome: text})}
            style={styles.input}
            error={!!errors.nome}
          />
          {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}

          <TextInput
            label="Destino*"
            value={formData.destino}
            onChangeText={text => setFormData({...formData, destino: text})}
            style={styles.input}
            error={!!errors.destino}
          />
          {errors.destino && <Text style={styles.errorText}>{errors.destino}</Text>}

          <TextInput
            label="Distância (km)*"
            value={formData.distancia}
            onChangeText={text => setFormData({...formData, distancia: text})}
            style={styles.input}
            keyboardType="numeric"
            error={!!errors.distancia}
          />
          {errors.distancia && <Text style={styles.errorText}>{errors.distancia}</Text>}

          <TextInput
            label="Tempo Médio (minutos)"
            value={formData.tempo_medio_minutos}
            onChangeText={text => setFormData({...formData, tempo_medio_minutos: text})}
            style={styles.input}
            keyboardType="numeric"
          />

          {/* Seletor de Veículo */}
          {renderPicker(veiculos, formData.veiculo_id, 'veiculo_id', 'Veículo')}

          {/* Seletor de Motorista */}
          {renderPicker(funcionarios, formData.funcionario_id, 'funcionario_id', 'Motorista')}

          {/* Data da Rota */}
          <Text style={styles.label}>Data da Rota*</Text>
          <TouchableOpacity 
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {formData.data_rota.toLocaleDateString('pt-BR')}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={formData.data_rota}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setFormData({...formData, data_rota: selectedDate});
              }}
            />
          )}

          {/* Horário de Partida */}
          <Text style={styles.label}>Horário de Partida*</Text>
          <TouchableOpacity 
            style={styles.dateInput}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.dateText}>
              {formData.horario_partida.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={formData.horario_partida}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) setFormData({...formData, horario_partida: selectedTime});
              }}
            />
          )}

          {/* Lista de Clientes */}
          <Text style={styles.label}>Clientes*</Text>
          <View style={styles.pickerContainer}>
            {clientes.map(cliente => (
              <TouchableOpacity
                key={cliente.id}
                style={[
                  styles.pickerOption,
                  formData.clientes_id.includes(cliente.id) && styles.pickerOptionSelected
                ]}
                onPress={() => toggleCliente(cliente.id)}
              >
                <Text style={formData.clientes_id.includes(cliente.id) ? styles.pickerTextSelected : styles.pickerText}>
                  {cliente.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.clientes && <Text style={styles.errorText}>{errors.clientes}</Text>}

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
            {loading ? 'CADASTRANDO...' : 'CADASTRAR ROTA'}
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