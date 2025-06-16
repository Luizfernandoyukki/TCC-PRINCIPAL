import { useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { supabase } from '../../../contexts/supabaseClient';

const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function CadastroClientes({ navigation }) {
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    cnpj: '',
    rg: '',
    tipo: 'física', // Valor padrão conforme schema
    endereco: '',
    diasEntrega: [],
    telefone: '',
    email: '',
    observacao: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Logs para debug
  const logAction = (action, details) => {
    console.log(`[Cliente] ${action}:`, details);
  };

  const toggleDiaEntrega = (dia) => {
    logAction('Dia de entrega alterado', dia);
    setFormData(prev => ({
      ...prev,
      diasEntrega: prev.diasEntrega.includes(dia)
        ? prev.diasEntrega.filter(d => d !== dia)
        : [...prev.diasEntrega, dia]
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validações conforme schema do banco
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.tipo) newErrors.tipo = 'Tipo é obrigatório';
    
    // Validação condicional para pessoa física/jurídica
    if (formData.tipo === 'física' && !formData.cpf) {
      newErrors.cpf = 'CPF é obrigatório para pessoa física';
    }
    
    if (formData.tipo === 'jurídica' && !formData.cnpj) {
      newErrors.cnpj = 'CNPJ é obrigatório para pessoa jurídica';
    }
    
    if (!formData.telefone) newErrors.telefone = 'Telefone é obrigatório';
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    logAction('Iniciando cadastro', formData);

    try {
      const clienteData = {
        nome: formData.nome.trim(),
        cpf: formData.tipo === 'física' ? formData.cpf : null,
        cnpj: formData.tipo === 'jurídica' ? formData.cnpj : null,
        rg: formData.rg || null,
        tipo: formData.tipo,
        observacao: formData.observacao.trim() || null,
        // endereco_id será preenchido após criar o endereço
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      logAction('Dados preparados', clienteData);

      // Inserção no Supabase
      const { data: cliente, error } = await supabase
        .from('cliente')
        .insert([clienteData])
        .single();

      if (error) {
        logAction('Erro no Supabase', error);
        throw error;
      }

      logAction('Cliente criado', cliente);
      Alert.alert('Sucesso', 'Cliente cadastrado com sucesso!');
      navigation.goBack();

    } catch (error) {
      logAction('Erro completo', error);
      Alert.alert(
        'Erro', 
        error.message || 'Não foi possível cadastrar o cliente. Verifique os dados e tente novamente.'
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CADASTRO DE CLIENTE</Text>
          
          {/* Tipo de Cliente (Pessoa Física/Jurídica) */}
          <Text style={styles.label}>Tipo de Cliente*</Text>
          <View style={styles.radioGroup}>
            {['física', 'jurídica'].map((tipo) => (
              <TouchableOpacity
                key={tipo}
                style={[
                  styles.radioButton,
                  formData.tipo === tipo && styles.radioButtonSelected
                ]}
                onPress={() => {
                  logAction('Tipo alterado', tipo);
                  setFormData({...formData, tipo});
                }}
              >
                <Text style={formData.tipo === tipo ? styles.radioTextSelected : styles.radioText}>
                  {tipo === 'física' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.tipo && <Text style={styles.errorText}>{errors.tipo}</Text>}

          {/* Nome */}
          <TextInput
            label="Nome Completo/Razão Social*"
            value={formData.nome}
            onChangeText={text => setFormData({...formData, nome: text})}
            style={styles.input}
            error={!!errors.nome}
          />
          {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}

          {/* CPF/CNPJ condicional */}
          {formData.tipo === 'física' ? (
            <>
              <TextInput
                label="CPF*"
                value={formData.cpf}
                onChangeText={text => setFormData({...formData, cpf: text})}
                style={styles.input}
                keyboardType="numeric"
                error={!!errors.cpf}
              />
              {errors.cpf && <Text style={styles.errorText}>{errors.cpf}</Text>}
            </>
          ) : (
            <>
              <TextInput
                label="CNPJ*"
                value={formData.cnpj}
                onChangeText={text => setFormData({...formData, cnpj: text})}
                style={styles.input}
                keyboardType="numeric"
                error={!!errors.cnpj}
              />
              {errors.cnpj && <Text style={styles.errorText}>{errors.cnpj}</Text>}
            </>
          )}

          {/* RG (opcional) */}
          <TextInput
            label="RG (Opcional)"
            value={formData.rg}
            onChangeText={text => setFormData({...formData, rg: text})}
            style={styles.input}
            keyboardType="numeric"
          />

          {/* Telefone */}
          <TextInput
            label="Telefone*"
            value={formData.telefone}
            onChangeText={text => setFormData({...formData, telefone: text})}
            style={styles.input}
            keyboardType="phone-pad"
            error={!!errors.telefone}
          />
          {errors.telefone && <Text style={styles.errorText}>{errors.telefone}</Text>}

          {/* Email (opcional com validação) */}
          <TextInput
            label="Email (Opcional)"
            value={formData.email}
            onChangeText={text => setFormData({...formData, email: text})}
            style={styles.input}
            keyboardType="email-address"
            error={!!errors.email}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

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
            {loading ? 'CADASTRANDO...' : 'CADASTRAR CLIENTE'}
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
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
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
  // Mantendo os estilos existentes para checkbox
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
  },
});