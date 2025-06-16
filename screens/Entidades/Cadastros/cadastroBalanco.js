import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { supabase } from '../../../contexts/supabaseClient';

export default function CadastroBalanco({ navigation }) {
  // Estados do formulário
  const [nome, setNome] = useState('');
  const [data, setData] = useState(new Date());
  const [motivo, setMotivo] = useState('');
  const [periodo, setPeriodo] = useState('mensal');
  const [tipo, setTipo] = useState('completo');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Logs para debug
  const logAction = (action, details) => {
    console.log(`[Balanço] ${action}:`, details);
  };

  const handleSave = async () => {
    // Validação dos campos obrigatórios
    if (!nome.trim()) {
      Alert.alert('Atenção', 'O nome do balanço é obrigatório');
      logAction('Validação falhou', { campo: 'nome' });
      return;
    }

    // Validação do período
    const periodosValidos = ['diário', 'semanal', 'mensal', 'anual', 'customizado'];
    if (!periodosValidos.includes(periodo)) {
      Alert.alert('Atenção', 'Período selecionado é inválido');
      logAction('Validação falhou', { campo: 'periodo', valor: periodo });
      return;
    }

    // Validação do tipo
    const tiposValidos = ['entrada', 'saída', 'completo'];
    if (!tiposValidos.includes(tipo)) {
      Alert.alert('Atenção', 'Tipo selecionado é inválido');
      logAction('Validação falhou', { campo: 'tipo', valor: tipo });
      return;
    }

    setLoading(true);
    logAction('Iniciando cadastro', { nome, data, tipo });

    try {
      const balancoData = {
        nome: nome.trim(),
        data: data.toISOString().split('T')[0], // Formato YYYY-MM-DD
        periodo,
        tipo,
        motivo: motivo.trim() || null, // Campo opcional (pode ser NULL)
        usuario_id: supabase.auth.user()?.id
      };

      logAction('Dados preparados', balancoData);

      const { data: balanco, error } = await supabase
        .from('balanco')
        .insert([balancoData])
        .single();

      if (error) {
        logAction('Erro no Supabase', error);
        throw error;
      }

      logAction('Balanço criado', balanco);
      Alert.alert('Sucesso', 'Balanço cadastrado com sucesso!');
      navigation.navigate('DetalhesBalanco', { id: balanco.id });

    } catch (error) {
      logAction('Erro completo', error);
      Alert.alert(
        'Erro', 
        error.message || 'Não foi possível salvar o balanço. Verifique os dados e tente novamente.'
      );
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

      <ScrollView contentContainerStyle={styles.content}>
        {/* Campo Obrigatório */}
        <TextInput
          label="Nome do Balanço *"
          value={nome}
          onChangeText={setNome}
          style={styles.input}
          mode="outlined"
          error={!nome.trim()}
        />

        {/* Data (Obrigatória mas tem valor padrão) */}
        <TouchableOpacity 
          style={styles.dateInput}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            Data: {data.toLocaleDateString('pt-BR')}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={data}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                logAction('Data alterada', selectedDate);
                setData(selectedDate);
              }
            }}
          />
        )}

        {/* Campo Opcional */}
        <TextInput
          label="Motivo (Opcional)"
          value={motivo}
          onChangeText={setMotivo}
          style={styles.input}
          mode="outlined"
          multiline
        />

        {/* Período (Obrigatório mas tem valor padrão) */}
        <Text style={styles.label}>Período *</Text>
        <View style={styles.radioGroup}>
          {['diário', 'semanal', 'mensal', 'anual', 'customizado'].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.radioButton,
                periodo === item && styles.radioButtonSelected
              ]}
              onPress={() => {
                logAction('Período selecionado', item);
                setPeriodo(item);
              }}
            >
              <Text style={periodo === item ? styles.radioTextSelected : styles.radioText}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tipo (Obrigatório mas tem valor padrão) */}
        <Text style={styles.label}>Tipo *</Text>
        <View style={styles.radioGroup}>
          {['entrada', 'saída', 'completo'].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.radioButton,
                tipo === item && styles.radioButtonSelected
              ]}
              onPress={() => {
                logAction('Tipo selecionado', item);
                setTipo(item);
              }}
            >
              <Text style={tipo === item ? styles.radioTextSelected : styles.radioText}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
          loading={loading}
          disabled={loading}
        >
          {loading ? 'SALVANDO...' : 'SALVAR BALANÇO'}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'white',
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
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#043b57',
    fontWeight: 'bold',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  radioButton: {
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
    color: '#043b57',
  },
  radioTextSelected: {
    color: 'white',
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#043b57',
    padding: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#844a05',
  },
  header: {
    height: 120,
    backgroundColor: '#043b57',
    width: '100%',
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
});