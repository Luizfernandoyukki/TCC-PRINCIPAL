// src/screens/clientes/CadastroClientes.js

import NetInfo from '@react-native-community/netinfo';
import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { supabase } from '../../../contexts/supabaseClient';
import { databaseService } from '../../../services/localDatabase';
import styles from '../../../styles/EstilosdeEntidade';

import { maskCep, maskCnpj, maskCpf, maskPhone } from '../../../utils/masks';

const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function CadastroClientes({ navigation }) {
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    cnpj: '',
    tipo: 'física',
    observacao: '',
    diasEntrega: []
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

  const [status, setStatus] = useState('ativo');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const toggleDiaEntrega = (dia) => {
    setFormData(prev => ({
      ...prev,
      diasEntrega: prev.diasEntrega.includes(dia)
        ? prev.diasEntrega.filter(d => d !== dia)
        : [...prev.diasEntrega, dia]
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.tipo) newErrors.tipo = 'Tipo é obrigatório';

    if (formData.tipo === 'física') {
      if (!formData.cpf) newErrors.cpf = 'CPF é obrigatório';
      else if (formData.cpf.length !== 14) newErrors.cpf = 'CPF inválido';
    }

    if (formData.tipo === 'jurídica') {
      if (!formData.cnpj) newErrors.cnpj = 'CNPJ é obrigatório';
      else if (formData.cnpj.length !==  18) newErrors.cnpj = 'CNPJ inválido';
    }

    if (!telefone) newErrors.telefone = 'Telefone é obrigatório';
    if (email && !/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Email inválido';

    // Validação endereço
    if (!endereco.cep.trim()) newErrors.cep = 'CEP é obrigatório';
    if (!endereco.uf.trim()) newErrors.uf = 'Estado (UF) é obrigatório';
    if (!endereco.cidade.trim()) newErrors.cidade = 'Cidade é obrigatória';
    if (!endereco.bairro.trim()) newErrors.bairro = 'Bairro é obrigatório';
    if (!endereco.rua.trim()) newErrors.rua = 'Rua é obrigatória';
    if (!endereco.numero.trim()) newErrors.numero = 'Número é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    const cepLimpo = endereco.cep.replace(/\D/g, '');
    const onlyNumbers = (str) => str.replace(/\D/g, '');


    setLoading(true);
    try {
      const enderecoData = {
        cep: endereco.cep ? endereco.cep.replace(/\D/g, '') : null, // remove tudo que nao eh digito
        uf: endereco.uf.trim(),
        cidade: endereco.cidade.trim(),
        bairro: endereco.bairro.trim(),
        rua: endereco.rua.trim(),
        numero: endereco.numero.trim(),
        complemento: endereco.complemento.trim() || null,
        tipo: endereco.tipo.trim() || null
      };

      let endereco_id;
      let telefone_id;
      let email_id;

      const state = await NetInfo.fetch();

      if (state.isConnected) {
        const { data: enderecoResult, error: enderecoError } = await supabase
          .from('endereco')
          .insert([enderecoData])
          .select('id')
          .single();

        if (enderecoError) throw enderecoError;
        endereco_id = enderecoResult.id;

        const { data: telefoneResult, error: telError } = await supabase
          .from('telefone')
          .insert([{ numero: telefone.trim() }])
          .select('id')
          .single();

        if (telError) throw telError;
        telefone_id = telefoneResult.id;

        const { data: emailResult, error: emailError } = await supabase
          .from('email')
          .insert([{ email: email.trim() }])
          .select('id')
          .single();

        if (emailError) throw emailError;
        email_id = emailResult.id;

      } else {
        endereco_id = await databaseService.insertWithUUID('endereco', enderecoData);
        telefone_id = await databaseService.insertOrSelect('telefone', { numero: telefone.trim() });
        email_id = await databaseService.insertOrSelect('email', { endereco: email.trim() });
      }

      const diasEntregaFormatado = state.isConnected
  ? formData.diasEntrega.map((dia) => diasSemana.indexOf(dia)) // Supabase: array de números
  : formData.diasEntrega.map((dia) => diasSemana.indexOf(dia)); // SQLite: salvar como JSON string

      const clienteData = {
        nome: formData.nome.trim(),
        cpf: formData.tipo === 'física' && formData.cpf ? onlyNumbers(formData.cpf) : null,
        cnpj: formData.tipo === 'jurídica' && formData.cnpj ? onlyNumbers(formData.cnpj) : null,
        tipo: formData.tipo,
        observacao: formData.observacao?.trim() || null,
        endereco_id,
        status,
        telefone_id,
        email_id,
        dias_entrega: diasEntregaFormatado
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <StatusBar backgroundColor="#043b57" barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={require('../../../Assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Error')}>
            <Image source={require('../../../Assets/alerta.png')} style={styles.alerta} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CADASTRO DE CLIENTE</Text>

          <TextInput
            label="Nome"
            value={formData.nome}
            onChangeText={text => setFormData({ ...formData, nome: text })}
            style={styles.input}
            error={!!errors.nome}
          />
          {!!errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}

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
          {!!errors.tipo && <Text style={styles.errorText}>{errors.tipo}</Text>}

          {formData.tipo === 'física' ? (
            <>
              <TextInput
                label="CPF*"
                value={formData.cpf}
                onChangeText={text => setFormData({ ...formData, cpf: maskCpf(text) })}
                style={styles.input}
                error={!!errors.cpf}
                keyboardType="numeric"
                maxLength={14}
              />
              {!!errors.cpf && <Text style={styles.errorText}>{errors.cpf}</Text>}
            </>
          ) : (
            <>
              <TextInput
                label="CNPJ*"
                value={formData.cnpj}
                onChangeText={text => setFormData({ ...formData, cnpj: maskCnpj(text) })}
                style={styles.input}
                error={!!errors.cnpj}
                keyboardType="numeric"
                maxLength={ 18}
              />
              {!!errors.cnpj && <Text style={styles.errorText}>{errors.cnpj}</Text>}
            </>
          )}

          <TextInput
            label="Telefone*"
            value={telefone}
            onChangeText={text => setTelefone(maskPhone(text))}
            style={styles.input}
            keyboardType="phone-pad"
            error={!!errors.telefone}
            maxLength={15}
          />
          {!!errors.telefone && <Text style={styles.errorText}>{errors.telefone}</Text>}

          <TextInput
            label="Email"
            value={email}
            onChangeText={text => setEmail(text)}
            style={styles.input}
            keyboardType="email-address"
            error={!!errors.email}
            autoCapitalize="none"
          />
          {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <TextInput
            label="Observação"
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
                style={[styles.radioButton, status === item && styles.radioButtonSelected]}
                onPress={() => setStatus(item)}
              >
                <Text style={status === item ? styles.radioTextSelected : styles.radioText}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionSubtitle}>Endereço</Text>

          <TextInput
            label="CEP*"
            value={endereco.cep}
            onChangeText={text => setEndereco({ ...endereco, cep: maskCep(text) })}
            style={styles.input}
            keyboardType="numeric"
            maxLength={9}
            error={!!errors.cep}
          />
          {!!errors.cep && <Text style={styles.errorText}>{errors.cep}</Text>}

          <TextInput
            label="Estado (UF)*"
            value={endereco.uf}
            onChangeText={text => setEndereco({ ...endereco, uf: text.toUpperCase() })}
            style={styles.input}
            maxLength={2}
            error={!!errors.uf}
            autoCapitalize="characters"
          />
          {!!errors.uf && <Text style={styles.errorText}>{errors.uf}</Text>}

          <TextInput
            label="Cidade*"
            value={endereco.cidade}
            onChangeText={text => setEndereco({ ...endereco, cidade: text })}
            style={styles.input}
            error={!!errors.cidade}
          />
          {!!errors.cidade && <Text style={styles.errorText}>{errors.cidade}</Text>}

          <TextInput
            label="Bairro*"
            value={endereco.bairro}
            onChangeText={text => setEndereco({ ...endereco, bairro: text })}
            style={styles.input}
            error={!!errors.bairro}
          />
          {!!errors.bairro && <Text style={styles.errorText}>{errors.bairro}</Text>}

          <TextInput
            label="Rua*"
            value={endereco.rua}
            onChangeText={text => setEndereco({ ...endereco, rua: text })}
            style={styles.input}
            error={!!errors.rua}
          />
          {!!errors.rua && <Text style={styles.errorText}>{errors.rua}</Text>}

          <TextInput
            label="Número*"
            value={endereco.numero}
            onChangeText={text => setEndereco({ ...endereco, numero: text })}
            style={styles.input}
            keyboardType="numeric"
            error={!!errors.numero}
          />
          {!!errors.numero && <Text style={styles.errorText}>{errors.numero}</Text>}

          <TextInput
            label="Complemento"
            value={endereco.complemento}
            onChangeText={text => setEndereco({ ...endereco, complemento: text })}
            style={styles.input}
          />

          <TextInput
            label="Tipo"
            value={endereco.tipo}
            onChangeText={text => setEndereco({ ...endereco, tipo: text })}
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.buttonEditar}
            labelStyle={styles.buttonTextInput}
            loading={loading}
            disabled={loading}
          >
            CADASTRAR CLIENTE
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
