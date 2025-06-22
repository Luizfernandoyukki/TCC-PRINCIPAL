import NetInfo from '@react-native-community/netinfo';
import { useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { supabase } from '../../../contexts/supabaseClient';
import { databaseService } from '../../../services/localDatabase';

const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function CadastroClientes({ navigation }) {
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    cnpj: '',
    rg: '',
    tipo: 'física',
    telefone: '',
    email: '',
    observacao: '',
    diasEntrega: []
  });
  const [endereco, setEndereco] = useState({
    rua: '',
    numero: '',
    complemento: '',
    cidade: '',
    estado: '',
    cep: ''
  });
  const [status, setStatus] = useState('ativo');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Função para alternar dias de entrega
  const toggleDiaEntrega = (dia) => {
    setFormData(prev => ({
      ...prev,
      diasEntrega: prev.diasEntrega.includes(dia)
        ? prev.diasEntrega.filter(d => d !== dia)
        : [...prev.diasEntrega, dia]
    }));
  };

  // Validação do formulário
  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.tipo) newErrors.tipo = 'Tipo é obrigatório';
    if (formData.tipo === 'física' && !formData.cpf) newErrors.cpf = 'CPF é obrigatório para pessoa física';
    if (formData.tipo === 'jurídica' && !formData.cnpj) newErrors.cnpj = 'CNPJ é obrigatório para pessoa jurídica';
    if (!formData.telefone) newErrors.telefone = 'Telefone é obrigatório';
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Email inválido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função de cadastro online/offline
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      // 1. Salva o endereço e pega o id (online/offline)
      const enderecoData = {
        rua: endereco.rua?.trim() || null,
        numero: endereco.numero?.trim() || null,
        complemento: endereco.complemento?.trim() || null,
        cidade: endereco.cidade?.trim() || null,
        estado: endereco.estado?.trim() || null,
        cep: endereco.cep?.trim() || null
      };
      let endereco_id;
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        const { data: enderecoDataSupabase, error: enderecoError } = await supabase
          .from('endereco')
          .insert([enderecoData])
          .select('id')
          .single();
        if (enderecoError) throw enderecoError;
        endereco_id = enderecoDataSupabase.id;
      } else {
        endereco_id = await databaseService.insertWithUUID('endereco', enderecoData);
      }

      // 2. Salva o cliente com o endereco_id (online/offline)
      const clienteData = {
        nome: formData.nome.trim(),
        cpf: formData.cpf?.trim() || null,
        cnpj: formData.cnpj?.trim() || null,
        rg: formData.rg?.trim() || null,
        tipo: formData.tipo,
        observacao: formData.observacao?.trim() || null,
        endereco_id,
        status,
        telefone: formData.telefone?.trim() || null,
        email: formData.email?.trim() || null,
        dias_entrega: formData.diasEntrega?.join(',') || null
      };

      if (state.isConnected) {
        const { error: clienteError } = await supabase.from('cliente').insert([clienteData]);
        if (clienteError) throw clienteError;
      } else {
        await databaseService.insertWithUUID('cliente', clienteData);
      }

      Alert.alert('Sucesso', 'Cliente cadastrado com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao cadastrar cliente');
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
            <Image    source={require('../../../Assets/alerta.png')} 
              style={styles.alerta}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CADASTRO DE CLIENTE</Text>
          
          {/* Nome */}
          <TextInput
            label="Nome Completo/Razão Social*"
            value={formData.nome}
            onChangeText={text => setFormData({...formData, nome: text})}
            style={styles.input}
            error={!!errors.nome}
          />
          {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}

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

          {/* CPF/CNPJ condicional */}
          {formData.tipo === 'física' ? (
            <TextInput
              label="CPF*"
              value={formData.cpf}
              onChangeText={text => setFormData({...formData, cpf: text})}
              style={styles.input}
              error={!!errors.cpf}
            />
          ) : (
            <TextInput
              label="CNPJ*"
              value={formData.cnpj}
              onChangeText={text => setFormData({...formData, cnpj: text})}
              style={styles.input}
              error={!!errors.cnpj}
            />
          )}
          {formData.tipo === 'física' ? errors.cpf && <Text style={styles.errorText}>{errors.cpf}</Text> : errors.cnpj && <Text style={styles.errorText}>{errors.cnpj}</Text>}

          {/* RG (opcional) */}
          <TextInput
            label="RG (Opcional)"
            value={formData.rg}
            onChangeText={text => setFormData({...formData, rg: text})}
            style={styles.input}
          />

          {/* Telefone */}
          <TextInput
            label="Telefone*"
            value={formData.telefone}
            onChangeText={text => setFormData({...formData, telefone: text})}
            style={styles.input}
            keyboardType="numeric"
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

          {/* Observações (Opcional) */}
          <TextInput
            label="Observações (Opcional)"
            value={formData.observacao}
            onChangeText={text => setFormData({...formData, observacao: text})}
            style={styles.input}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Dias de Entrega</Text>
          <View style={styles.checkboxContainer}>
            {diasSemana.map((dia) => (
              <View key={dia} style={styles.checkboxRow}>
                <TouchableOpacity onPress={() => toggleDiaEntrega(dia)}>
                  <View style={[styles.radioButton, formData.diasEntrega.includes(dia) && styles.radioButtonSelected]}>
                    <Text style={styles.radioText}>{dia}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Endereço */}
          <Text style={styles.sectionSubtitle}>Endereço</Text>
          <TextInput
            label="Rua"
            value={endereco.rua}
            onChangeText={text => setEndereco({...endereco, rua: text})}
            style={styles.input}
          />
          <View style={styles.row}>
            <TextInput
              label="Número"
              value={endereco.numero}
              onChangeText={text => setEndereco({...endereco, numero: text})}
              style={[styles.input, styles.halfInput]}
              keyboardType="numeric"
            />
            <TextInput
              label="Complemento"
              value={endereco.complemento}
              onChangeText={text => setEndereco({...endereco, complemento: text})}
              style={[styles.input, styles.halfInput]}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              label="Cidade"
              value={endereco.cidade}
              onChangeText={text => setEndereco({...endereco, cidade: text})}
              style={[styles.input, styles.halfInput]}
            />
            <TextInput
              label="Estado"
              value={endereco.estado}
              onChangeText={text => setEndereco({...endereco, estado: text})}
              style={[styles.input, styles.halfInput]}
              maxLength={2}
            />
          </View>
          <TextInput
            label="CEP"
            value={endereco.cep}
            onChangeText={text => setEndereco({...endereco, cep: text})}
            style={styles.input}
            keyboardType="numeric"
          />

          {/* Status */}
          <Text style={styles.label}>Status *</Text>
          <View style={styles.radioGroup}>
            {['ativo', 'inativo'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.radioButton,
                  status === item && styles.radioButtonSelected
                ]}
                onPress={() => setStatus(item)}
              >
                <Text style={status === item ? styles.radioTextSelected : styles.radioText}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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
    backgroundColor: '#fadb53',
    flex: 1,
  },
  header: {
    height: 120,
    backgroundColor: '#043b57',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'white',
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
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionSubtitle: {
    fontWeight: 'bold',
    color: '#043b57',
    marginTop: 20,
    marginBottom: 10,
    fontSize: 16,
  },
});