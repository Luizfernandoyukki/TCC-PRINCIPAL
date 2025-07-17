import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../../contexts/supabaseClient';
import { databaseService } from '../../../services/localDatabase';
import { maskCep, maskCnpj, maskCpf, maskPhone } from '../../../utils/masks';

const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function EditarClienteScreen({ navigation, route }) {
  const { clienteId } = route.params;
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    cnpj: '',
    tipo: 'física',
    observacao: '',
    diasEntrega: [],
    status: 'ativo'
  });
  const [endereco, setEndereco] = useState({
    cep: '',
    uf: '',
    cidade: '',
    bairro: '',
    rua: '',
    numero: '',
    complemento: '',
    tipo: ''
  });
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [useLocalData, setUseLocalData] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setLoading(true);
      let clienteData;

      if (useLocalData) {
        clienteData = await databaseService.selectById('cliente', clienteId);
      } else {
        const { data, error } = await supabase
          .from('cliente')
          .select('*')
          .eq('id', clienteId)
          .single();
        if (error) throw error;
        clienteData = data;
      }

      if (clienteData) {
        const [enderecoData, telefoneData, emailData] = await Promise.all([
          useLocalData
            ? databaseService.selectById('endereco', clienteData.endereco_id)
            : supabase.from('endereco').select('*').eq('id', clienteData.endereco_id).single(),
          clienteData.telefone_id
            ? (useLocalData
              ? databaseService.selectById('telefone', clienteData.telefone_id)
              : supabase.from('telefone').select('*').eq('id', clienteData.telefone_id).single())
            : Promise.resolve({ data: null }),
          clienteData.email_id
            ? (useLocalData
              ? databaseService.selectById('email', clienteData.email_id)
              : supabase.from('email').select('*').eq('id', clienteData.email_id).single())
            : Promise.resolve({ data: null })
        ]);

        const diasEntrega = useLocalData
          ? clienteData.dias_entrega?.split(',') || []
          : clienteData.dias_entrega?.map((dia) => diasSemana[dia]) || [];

        setFormData(prev => ({
          ...prev,
          nome: clienteData.nome || '',
          cpf: clienteData.cpf ? maskCpf(clienteData.cpf) : '',
          cnpj: clienteData.cnpj ? maskCnpj(clienteData.cnpj) : '',
          tipo: clienteData.tipo || 'física',
          observacao: clienteData.observacao || '',
          diasEntrega,
          status: clienteData.status || 'ativo',
          endereco_id: clienteData.endereco_id,
          telefone_id: clienteData.telefone_id,
          email_id: clienteData.email_id
        }));

        if (enderecoData.data) {
          setEndereco({
            cep: enderecoData.data.cep ? maskCep(enderecoData.data.cep) : '',
            uf: enderecoData.data.uf || '',
            cidade: enderecoData.data.cidade || '',
            bairro: enderecoData.data.bairro || '',
            rua: enderecoData.data.rua || '',
            numero: enderecoData.data.numero || '',
            complemento: enderecoData.data.complemento || '',
            tipo: enderecoData.data.tipo || ''
          });
        }

        if (telefoneData.data) {
          setTelefone(maskPhone(telefoneData.data.numero || ''));
        }

        if (emailData.data) {
          setEmail(emailData.data.email || '');
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados do cliente');
    } finally {
      setLoading(false);
    }
  }

  function toggleDiaEntrega(dia) {
    setFormData(prev => ({
      ...prev,
      diasEntrega: prev.diasEntrega.includes(dia)
        ? prev.diasEntrega.filter(d => d !== dia)
        : [...prev.diasEntrega, dia]
    }));
  }

  function validateForm() {
    const newErrors = {};
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.tipo) newErrors.tipo = 'Tipo é obrigatório';

    if (formData.tipo === 'física') {
      if (!formData.cpf) newErrors.cpf = 'CPF é obrigatório';
      else if (formData.cpf.length !== 14) newErrors.cpf = 'CPF inválido';
    }

    if (formData.tipo === 'jurídica') {
      if (!formData.cnpj) newErrors.cnpj = 'CNPJ é obrigatório';
      else if (formData.cnpj.length !== 18) newErrors.cnpj = 'CNPJ inválido';
    }

    if (!telefone) newErrors.telefone = 'Telefone é obrigatório';
    if (email && !/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Email inválido';

    if (!endereco.cep.trim()) newErrors.cep = 'CEP é obrigatório';
    if (!endereco.uf.trim()) newErrors.uf = 'Estado (UF) é obrigatório';
    if (!endereco.cidade.trim()) newErrors.cidade = 'Cidade é obrigatória';
    if (!endereco.bairro.trim()) newErrors.bairro = 'Bairro é obrigatório';
    if (!endereco.rua.trim()) newErrors.rua = 'Rua é obrigatória';
    if (!endereco.numero.trim()) newErrors.numero = 'Número é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function salvarAlteracoes() {
    if (!validateForm()) return;
    const onlyNumbers = (str) => str.replace(/\D/g, '');

    setLoading(true);
    try {
      const enderecoData = {
        cep: endereco.cep ? onlyNumbers(endereco.cep) : null,
        uf: endereco.uf.trim(),
        cidade: endereco.cidade.trim(),
        bairro: endereco.bairro.trim(),
        rua: endereco.rua.trim(),
        numero: endereco.numero.trim(),
        complemento: endereco.complemento?.trim() || null,
        tipo: endereco.tipo?.trim() || null
      };

      const networkState = await NetInfo.fetch();
      const isConnected = networkState.isConnected;

      if (isConnected) {
        await supabase.from('endereco').update(enderecoData).eq('id', formData.endereco_id);
        if (formData.telefone_id)
          await supabase.from('telefone').update({ numero: telefone.trim() }).eq('id', formData.telefone_id);
        if (formData.email_id)
          await supabase.from('email').update({ email: email.trim() }).eq('id', formData.email_id);
      } else {
        await databaseService.update('endereco', enderecoData, 'id = ?', [formData.endereco_id]);
        if (formData.telefone_id)
          await databaseService.update('telefone', { numero: telefone.trim() }, 'id = ?', [formData.telefone_id]);
        if (formData.email_id)
          await databaseService.update('email', { email: email.trim() }, 'id = ?', [formData.email_id]);
      }

      const diasEntregaFormatado = isConnected
        ? formData.diasEntrega.map((dia) => diasSemana.indexOf(dia))
        : formData.diasEntrega.join(',');

      const clienteData = {
        nome: formData.nome.trim(),
        cpf: formData.tipo === 'física' && formData.cpf ? onlyNumbers(formData.cpf) : null,
        cnpj: formData.tipo === 'jurídica' && formData.cnpj ? onlyNumbers(formData.cnpj) : null,
        tipo: formData.tipo,
        observacao: formData.observacao?.trim() || null,
        status: formData.status,
        dias_entrega: diasEntregaFormatado
      };

      if (isConnected) {
        await supabase.from('cliente').update(clienteData).eq('id', clienteId);
      } else {
        await databaseService.update('cliente', clienteData, 'id = ?', [clienteId]);
      }

      Alert.alert('Sucesso', 'Cliente atualizado com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao atualizar cliente');
    } finally {
      setLoading(false);
    }
  }
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
          <Text style={styles.sectionTitle}>EDITAR CLIENTE</Text>

          <Text style={styles.label}>Nome*</Text>
          <TextInput
            value={formData.nome}
            onChangeText={text => setFormData({ ...formData, nome: text })}
            style={styles.input}
          />
          {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}

          <Text style={styles.label}>Tipo Cliente*</Text>
          <View style={styles.radioGroup}>
            {['física', 'jurídica'].map(tipo => (
              <TouchableOpacity
                key={tipo}
                style={[styles.radioButton, formData.tipo === tipo && styles.radioButtonSelected]}
                onPress={() => setFormData({ ...formData, tipo })}
              >
                <Text style={formData.tipo === tipo ? styles.radioTextSelected : styles.radioText}>
                  {tipo === 'física' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.tipo && <Text style={styles.errorText}>{errors.tipo}</Text>}

          {formData.tipo === 'física' ? (
            <>
              <Text style={styles.label}>CPF*</Text>
              <TextInput
                value={formData.cpf}
                onChangeText={text => setFormData({ ...formData, cpf: maskCpf(text) })}
                style={styles.input}
                keyboardType="numeric"
                maxLength={14}
              />
              {errors.cpf && <Text style={styles.errorText}>{errors.cpf}</Text>}
            </>
          ) : (
            <>
              <Text style={styles.label}>CNPJ*</Text>
              <TextInput
                value={formData.cnpj}
                onChangeText={text => setFormData({ ...formData, cnpj: maskCnpj(text) })}
                style={styles.input}
                keyboardType="numeric"
                maxLength={18}
              />
              {errors.cnpj && <Text style={styles.errorText}>{errors.cnpj}</Text>}
            </>
          )}

          <Text style={styles.label}>Telefone*</Text>
          <TextInput
            value={telefone}
            onChangeText={text => setTelefone(maskPhone(text))}
            style={styles.input}
            keyboardType="phone-pad"
            maxLength={15}
          />
          {errors.telefone && <Text style={styles.errorText}>{errors.telefone}</Text>}

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={text => setEmail(text)}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <Text style={styles.label}>Observação</Text>
          <TextInput
            value={formData.observacao}
            onChangeText={text => setFormData({ ...formData, observacao: text })}
            style={[styles.input, { height: 80 }]}
            multiline
          />

          <Text style={styles.label}>Dias de Entrega</Text>
          <View style={styles.checkboxContainer}>
            {diasSemana.map(dia => (
              <TouchableOpacity key={dia} onPress={() => toggleDiaEntrega(dia)}>
                <View style={[styles.radioButton, formData.diasEntrega.includes(dia) && styles.radioButtonSelected]}>
                  <Text style={formData.diasEntrega.includes(dia) ? styles.radioTextSelected : styles.radioText}>
                    {dia}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Status*</Text>
          <View style={styles.radioGroup}>
            {['ativo', 'inativo'].map(item => (
              <TouchableOpacity
                key={item}
                style={[styles.radioButton, formData.status === item && styles.radioButtonSelected]}
                onPress={() => setFormData({ ...formData, status: item })}
              >
                <Text style={formData.status === item ? styles.radioTextSelected : styles.radioText}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionSubtitle}>Endereço</Text>

          <Text style={styles.label}>CEP*</Text>
          <TextInput
            value={endereco.cep}
            onChangeText={text => setEndereco({ ...endereco, cep: maskCep(text) })}
            style={styles.input}
            keyboardType="numeric"
            maxLength={9}
          />
          {errors.cep && <Text style={styles.errorText}>{errors.cep}</Text>}

          <Text style={styles.label}>Estado (UF)*</Text>
          <TextInput
            value={endereco.uf}
            onChangeText={text => setEndereco({ ...endereco, uf: text.toUpperCase() })}
            style={styles.input}
            maxLength={2}
            autoCapitalize="characters"
          />
          {errors.uf && <Text style={styles.errorText}>{errors.uf}</Text>}

          <Text style={styles.label}>Cidade*</Text>
          <TextInput
            value={endereco.cidade}
            onChangeText={text => setEndereco({ ...endereco, cidade: text })}
            style={styles.input}
          />
          {errors.cidade && <Text style={styles.errorText}>{errors.cidade}</Text>}

          <Text style={styles.label}>Bairro*</Text>
          <TextInput
            value={endereco.bairro}
            onChangeText={text => setEndereco({ ...endereco, bairro: text })}
            style={styles.input}
          />
          {errors.bairro && <Text style={styles.errorText}>{errors.bairro}</Text>}

          <Text style={styles.label}>Rua*</Text>
          <TextInput
            value={endereco.rua}
            onChangeText={text => setEndereco({ ...endereco, rua: text })}
            style={styles.input}
          />
          {errors.rua && <Text style={styles.errorText}>{errors.rua}</Text>}

          <Text style={styles.label}>Número*</Text>
          <TextInput
            value={endereco.numero}
            onChangeText={text => setEndereco({ ...endereco, numero: text })}
            style={styles.input}
            keyboardType="numeric"
          />
          {errors.numero && <Text style={styles.errorText}>{errors.numero}</Text>}

          <Text style={styles.label}>Complemento</Text>
          <TextInput
            value={endereco.complemento}
            onChangeText={text => setEndereco({ ...endereco, complemento: text })}
            style={styles.input}
          />

          <Text style={styles.label}>Tipo</Text>
          <TextInput
            value={endereco.tipo}
            onChangeText={text => setEndereco({ ...endereco, tipo: text })}
            style={styles.input}
          />

          <TouchableOpacity
            style={styles.registerButton}
            onPress={salvarAlteracoes}
            disabled={loading}
          >
            <Text style={styles.buttonLabel}>{loading ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}</Text>
          </TouchableOpacity>
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
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#043b57',
    marginVertical: 15,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    marginBottom: 15,
    color: '#043b57',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 5,
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
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  registerButton: {
    backgroundColor: '#043b57',
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
  },
});