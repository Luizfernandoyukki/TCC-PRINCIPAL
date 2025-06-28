import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../../../contexts/supabaseClient';
import { databaseService } from '../../../services/localDatabase';
import styles from '../../../styles/EstilosdeEntidade';

import { maskCep, maskCpf, maskDate, maskPhone } from '../../../utils/masks';

export default function EditarFuncionarioScreen({ route, navigation }) {
  const { id } = route.params;
  const [funcionario, setFuncionario] = useState(null);
  const [useLocalData, setUseLocalData] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dados para selects
  const [enderecos, setEnderecos] = useState([]);
  const [generos, setGeneros] = useState([]);

  useEffect(() => {
    carregarFuncionario();
    carregarDadosAuxiliares();
  }, []);

  const carregarFuncionario = async () => {
    try {
      if (useLocalData) {
        const localData = await databaseService.selectById('funcionario', id);
        setFuncionario(localData);
      } else {
        const { data, error } = await supabase
          .from('funcionario')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setFuncionario(data);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados do funcionário.');
    } finally {
      setLoading(false);
    }
  };

  const carregarDadosAuxiliares = async () => {
    try {
      if (useLocalData) {
        const locaisEnderecos = await databaseService.select('endereco');
        const locaisGeneros = await databaseService.select('genero');
        setEnderecos(locaisEnderecos || []);
        setGeneros(locaisGeneros || []);
      } else {
        let { data: enderecosSup, error: errEnd } = await supabase.from('endereco').select('*');
        if (errEnd) throw errEnd;
        setEnderecos(enderecosSup || []);

        let { data: generosSup, error: errGen } = await supabase.from('genero').select('*');
        if (errGen) throw errGen;
        setGeneros(generosSup || []);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar dados auxiliares.');
    }
  };

  const handleChange = (field, value) => {
    let maskedValue = value;
    if (field === 'cpf') maskedValue = maskCpf(value);
    else if (field === 'telefone') maskedValue = maskPhone(value);
    else if (field === 'data_nascimento' || field === 'data_admissao' || field === 'data_demissao')
      maskedValue = maskDate(value);
    else if (field === 'cep') maskedValue = maskCep(value);

    setFuncionario({ ...funcionario, [field]: maskedValue });
  };

  const salvarAlteracoes = async () => {
    if (!funcionario.nome || !funcionario.cpf || !funcionario.data_nascimento || !funcionario.data_admissao) {
      Alert.alert('Aviso', 'Preencha os campos obrigatórios: Nome, CPF, Data de Nascimento e Data de Admissão.');
      return;
    }

    try {
      if (useLocalData) {
        await databaseService.update('funcionario', funcionario, 'id = ?', [id]);
      } else {
        const { error } = await supabase
          .from('funcionario')
          .update({
            nome: funcionario.nome.trim(),
            data_nascimento: funcionario.data_nascimento,
            cpf: funcionario.cpf,
            ctps: funcionario.ctps || null,
            rg: funcionario.rg || null,
            data_admissao: funcionario.data_admissao,
            data_demissao: funcionario.data_demissao || null,
            carga_horaria: funcionario.carga_horaria || null,
            numero_dependentes: funcionario.numero_dependentes || 0,
            numero_ficha: funcionario.numero_ficha || null,
            numero_aparelho: funcionario.numero_aparelho || null,
            nota: funcionario.nota || null,
            observacao: funcionario.observacao || null,
            endereco_id: funcionario.endereco_id || null,
            funcao_id: funcionario.funcao_id || null,
            genero_id: funcionario.genero_id || null,
            cargo_id: funcionario.cargo_id || null,
            hierarquia_id: funcionario.hierarquia_id || null,
            rota_id: funcionario.rota_id || null,
            foto_url: funcionario.foto_url || null,
            superior_id: funcionario.superior_id || null,
            senha: funcionario.senha || null,
            is_admin: funcionario.is_admin ? 1 : 0,
            is_superior: funcionario.is_superior ? 1 : 0,
          })
          .eq('id', id);

        if (error) throw error;
      }

      Alert.alert('Sucesso', 'Funcionário atualizado com sucesso.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    }
  };

  if (loading || !funcionario) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#043b57" barStyle="light-content" />
        <Text style={styles.emptyText}>Carregando funcionário...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container}
     behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
           keyboardVerticalOffset={100}>
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
      <ScrollView style={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={styles.label}>Nome *</Text>
        <TextInput
          style={styles.input}
          value={funcionario.nome}
          onChangeText={(text) => handleChange('nome', text)}
          placeholder="Nome completo"
        />

        <Text style={styles.label}>CPF *</Text>
        <TextInput
          style={styles.input}
          value={funcionario.cpf}
          keyboardType="numeric"
          onChangeText={(text) => handleChange('cpf', text)}
          placeholder="000.000.000-00"
          maxLength={14}
        />

        <Text style={styles.label}>Data de Nascimento *</Text>
        <TextInput
          style={styles.input}
          value={funcionario.data_nascimento}
          keyboardType="numeric"
          onChangeText={(text) => handleChange('data_nascimento', text)}
          placeholder="DD/MM/AAAA"
          maxLength={10}
        />

        <Text style={styles.label}>CTPS</Text>
        <TextInput
          style={styles.input}
          value={funcionario.ctps || ''}
          onChangeText={(text) => handleChange('ctps', text)}
          placeholder="Carteira de Trabalho"
        />

        <Text style={styles.label}>RG</Text>
        <TextInput
          style={styles.input}
          value={funcionario.rg || ''}
          onChangeText={(text) => handleChange('rg', text)}
          placeholder="Registro Geral"
        />

        <Text style={styles.label}>Data de Admissão *</Text>
        <TextInput
          style={styles.input}
          value={funcionario.data_admissao}
          keyboardType="numeric"
          onChangeText={(text) => handleChange('data_admissao', text)}
          placeholder="DD/MM/AAAA"
          maxLength={10}
        />

        <Text style={styles.label}>Data de Demissão</Text>
        <TextInput
          style={styles.input}
          value={funcionario.data_demissao || ''}
          keyboardType="numeric"
          onChangeText={(text) => handleChange('data_demissao', text)}
          placeholder="DD/MM/AAAA"
          maxLength={10}
        />

        <Text style={styles.label}>Carga Horária (h/semana)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={funcionario.carga_horaria ? String(funcionario.carga_horaria) : ''}
          onChangeText={(text) => handleChange('carga_horaria', parseInt(text) || 0)}
        />

        <Text style={styles.label}>Número de Dependentes</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={funcionario.numero_dependentes ? String(funcionario.numero_dependentes) : '0'}
          onChangeText={(text) => handleChange('numero_dependentes', parseInt(text) || 0)}
        />

        <Text style={styles.label}>Número da Ficha</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={funcionario.numero_ficha ? String(funcionario.numero_ficha) : ''}
          onChangeText={(text) => handleChange('numero_ficha', parseInt(text) || null)}
        />

        <Text style={styles.label}>Número do Aparelho</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={funcionario.numero_aparelho ? String(funcionario.numero_aparelho) : ''}
          onChangeText={(text) => handleChange('numero_aparelho', parseInt(text) || null)}
        />

        <Text style={styles.label}>Nota</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={funcionario.nota ? String(funcionario.nota) : ''}
          onChangeText={(text) => handleChange('nota', parseInt(text) || null)}
        />

        <Text style={styles.label}>Observação</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          multiline
          value={funcionario.observacao || ''}
          onChangeText={(text) => handleChange('observacao', text)}
        />

        {/* Select Endereço */}
        <Text style={styles.label}>Endereço</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={funcionario.endereco_id}
            onValueChange={(value) => handleChange('endereco_id', value)}
          >
            <Picker.Item label="Selecione um endereço" value={null} />
            {enderecos.map((end) => (
              <Picker.Item
                key={end.id}
                label={`${end.rua}, ${end.numero} - ${end.bairro}, ${end.cidade}/${end.uf}`}
                value={end.id}
              />
            ))}
          </Picker>
        </View>

        {/* Select Gênero */}
        <Text style={styles.label}>Gênero</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={funcionario.genero_id}
            onValueChange={(value) => handleChange('genero_id', value)}
          >
            <Picker.Item label="Selecione um gênero" value={null} />
            {generos.map((gen) => (
              <Picker.Item key={gen.id} label={gen.nome} value={gen.id} />
            ))}
          </Picker>
        </View>

        {/* Telefone simples - se quiser, pode adaptar para lista */}
        <Text style={styles.label}>Telefone</Text>
        <TextInput
          style={styles.input}
          value={funcionario.telefone || ''}
          keyboardType="phone-pad"
          onChangeText={(text) => handleChange('telefone', text)}
          placeholder="(00) 00000-0000"
          maxLength={15}
        />

        <TouchableOpacity style={styles.buttonEditar} onPress={salvarAlteracoes}>
          <Text style={styles.buttonTextInput}>Salvar Alterações</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
