import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../../contexts/supabaseClient';
import styles from '../../../styles/EstilosdeEntidade';
import { maskCep, maskCpf, maskDate, maskPhone } from '../../../utils/masks';

export default function EditarFuncionarioScreen({ route, navigation }) {
  const { id } = route.params;
  const [funcionario, setFuncionario] = useState({
    nome: '',
    cpf: '',
    data_nascimento: '',
    ctps: '',
    rg: '',
    data_admissao: '',
    data_demissao: '',
    carga_horaria: '',
    numero_dependentes: 0,
    numero_ficha: '',
    numero_aparelho: '',
    observacao: '',
    funcao_id: null,
    genero_id: null,
    telefone: '',
    is_admin: false,
    is_superior: false,
    endereco_id: null
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

  const [generos, setGeneros] = useState([]);
  const [funcoes, setFuncoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        // Carrega dados do funcionário
        const { data: funcionarioData, error: funcError } = await supabase
          .from('funcionario')
          .select('*')
          .eq('id', id)
          .single();

        if (funcError) throw funcError;
        setFuncionario(funcionarioData);

        // Carrega endereço se existir
        if (funcionarioData?.endereco_id) {
          const { data: enderecoData, error: endError } = await supabase
            .from('endereco')
            .select('*')
            .eq('id', funcionarioData.endereco_id)
            .single();
          
          if (!endError && enderecoData) {
            setEndereco(enderecoData);
          }
        }

        // Carrega opções para selects
        const [
          { data: generosData, error: genError },
          { data: funcoesData, error: funError }
        ] = await Promise.all([
          supabase.from('genero').select('*'),
          supabase.from('funcao').select('*')
        ]);

        if (genError) throw genError;
        if (funError) throw funError;

        setGeneros(generosData || []);
        setFuncoes(funcoesData || []);

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        Alert.alert('Erro', 'Não foi possível carregar os dados do funcionário');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleChange = (field, value) => {
    let maskedValue = value;
    
    // Aplica máscaras conforme o campo
    switch(field) {
      case 'cpf': maskedValue = maskCpf(value); break;
      case 'telefone': maskedValue = maskPhone(value); break;
      case 'data_nascimento':
      case 'data_admissao':
      case 'data_demissao': maskedValue = maskDate(value); break;
      case 'cep': maskedValue = maskCep(value); break;
      case 'carga_horaria':
      case 'numero_dependentes':
      case 'numero_ficha':
      case 'numero_aparelho':
        maskedValue = value.replace(/[^0-9]/g, '');
        break;
    }

    setFuncionario(prev => ({
      ...prev,
      [field]: maskedValue
    }));

    // Limpa erro se existir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleEnderecoChange = (field, value) => {
    let maskedValue = value;
    if (field === 'cep') maskedValue = maskCep(value);
    if (field === 'uf') maskedValue = value.toUpperCase();

    setEndereco(prev => ({
      ...prev,
      [field]: maskedValue
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Campos obrigatórios
    const requiredFields = [
      'nome', 'cpf', 'data_nascimento', 'data_admissao'
    ];

    requiredFields.forEach(field => {
      if (!funcionario[field]) {
        newErrors[field] = 'Campo obrigatório';
        isValid = false;
      }
    });

    // Validações específicas
    if (funcionario.cpf && funcionario.cpf.length !== 14) {
      newErrors.cpf = 'CPF incompleto';
      isValid = false;
    }

    if (funcionario.data_nascimento && funcionario.data_nascimento.length !== 10) {
      newErrors.data_nascimento = 'Data inválida';
      isValid = false;
    }

    if (funcionario.data_admissao && funcionario.data_admissao.length !== 10) {
      newErrors.data_admissao = 'Data inválida';
      isValid = false;
    }

    if (funcionario.telefone && funcionario.telefone.replace(/\D/g, '').length < 10) {
      newErrors.telefone = 'Telefone incompleto';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const salvarAlteracoes = async () => {
    if (!validateForm()) {
      Alert.alert('Aviso', 'Preencha os campos obrigatórios corretamente');
      return;
    }

    try {
      setSaving(true);

      // Atualiza endereço primeiro se existir
      let enderecoId = funcionario.endereco_id;
      if (enderecoId) {
        const { error: endError } = await supabase
          .from('endereco')
          .update(endereco)
          .eq('id', enderecoId);

        if (endError) throw endError;
      }

      // Prepara dados do funcionário
      const funcionarioData = {
        nome: funcionario.nome.trim(),
        cpf: funcionario.cpf.replace(/\D/g, ''),
        data_nascimento: funcionario.data_nascimento,
        ctps: funcionario.ctps || null,
        rg: funcionario.rg || null,
        data_admissao: funcionario.data_admissao,
        data_demissao: funcionario.data_demissao || null,
        carga_horaria: funcionario.carga_horaria ? parseInt(funcionario.carga_horaria) : null,
        numero_dependentes: funcionario.numero_dependentes ? parseInt(funcionario.numero_dependentes) : 0,
        numero_ficha: funcionario.numero_ficha || null,
        numero_aparelho: funcionario.numero_aparelho || null,
        observacao: funcionario.observacao || null,
        funcao_id: funcionario.funcao_id,
        genero_id: funcionario.genero_id,
        telefone: funcionario.telefone ? funcionario.telefone.replace(/\D/g, '') : null,
        is_admin: funcionario.is_admin,
        is_superior: funcionario.is_superior,
        endereco_id: enderecoId
      };

      // Atualiza funcionário
      const { error } = await supabase
        .from('funcionario')
        .update(funcionarioData)
        .eq('id', id);

      if (error) throw error;

      Alert.alert('Sucesso', 'Funcionário atualizado com sucesso');
      navigation.goBack();

    } catch (error) {
      console.error('Erro ao salvar:', error);
      Alert.alert('Erro', 'Não foi possível salvar as alterações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#043b57" barStyle="light-content" />
        <ActivityIndicator size="large" color="#043b57" />
        <Text style={styles.emptyText}>Carregando dados do funcionário...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <StatusBar backgroundColor="#043b57" barStyle="light-content" />
      
      {/* Cabeçalho */}
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

      {/* Conteúdo */}
      <ScrollView 
        style={styles.scrollContent} 
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.section}>
          {/* Dados Pessoais */}
          <Text style={styles.sectionTitle}>DADOS PESSOAIS</Text>
          
          <Text style={styles.label}>Nome *</Text>
          <TextInput
            style={[styles.input, errors.nome && styles.errorInput]}
            value={funcionario.nome}
            onChangeText={(text) => handleChange('nome', text)}
            placeholder="Nome completo"
          />
          {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}

          <Text style={styles.label}>CPF *</Text>
          <TextInput
            style={[styles.input, errors.cpf && styles.errorInput]}
            value={funcionario.cpf}
            keyboardType="numeric"
            onChangeText={(text) => handleChange('cpf', text)}
            placeholder="000.000.000-00"
            maxLength={14}
          />
          {errors.cpf && <Text style={styles.errorText}>{errors.cpf}</Text>}

          <Text style={styles.label}>Data de Nascimento *</Text>
          <TextInput
            style={[styles.input, errors.data_nascimento && styles.errorInput]}
            value={funcionario.data_nascimento}
            keyboardType="numeric"
            onChangeText={(text) => handleChange('data_nascimento', text)}
            placeholder="DD/MM/AAAA"
            maxLength={10}
          />
          {errors.data_nascimento && <Text style={styles.errorText}>{errors.data_nascimento}</Text>}

          <Text style={styles.label}>CTPS</Text>
          <TextInput
            style={styles.input}
            value={funcionario.ctps || ''}
            onChangeText={(text) => handleChange('ctps', text)}
            placeholder="Carteira de Trabalho"
            maxLength={11}
          />

          <Text style={styles.label}>RG</Text>
          <TextInput
            style={styles.input}
            value={funcionario.rg || ''}
            onChangeText={(text) => handleChange('rg', text)}
            placeholder="Registro Geral"
            maxLength={11}
          />

          <Text style={styles.label}>Data de Admissão *</Text>
          <TextInput
            style={[styles.input, errors.data_admissao && styles.errorInput]}
            value={funcionario.data_admissao}
            keyboardType="numeric"
            onChangeText={(text) => handleChange('data_admissao', text)}
            placeholder="DD/MM/AAAA"
            maxLength={10}
          />
          {errors.data_admissao && <Text style={styles.errorText}>{errors.data_admissao}</Text>}

          <Text style={styles.label}>Data de Demissão</Text>
          <TextInput
            style={styles.input}
            value={funcionario.data_demissao || ''}
            keyboardType="numeric"
            onChangeText={(text) => handleChange('data_demissao', text)}
            placeholder="DD/MM/AAAA"
            maxLength={10}
          />

          {/* Dados Trabalhistas */}
          <Text style={styles.sectionTitle}>DADOS TRABALHISTAS</Text>
          
          <Text style={styles.label}>Carga Horária (h/semana)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={funcionario.carga_horaria ? String(funcionario.carga_horaria) : ''}
            onChangeText={(text) => handleChange('carga_horaria', text)}
          />

          <Text style={styles.label}>Número de Dependentes</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={funcionario.numero_dependentes ? String(funcionario.numero_dependentes) : '0'}
            onChangeText={(text) => handleChange('numero_dependentes', text)}
          />

          <Text style={styles.label}>Número da Ficha</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={funcionario.numero_ficha ? String(funcionario.numero_ficha) : ''}
            onChangeText={(text) => handleChange('numero_ficha', text)}
          />

          <Text style={styles.label}>Número do Aparelho</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={funcionario.numero_aparelho ? String(funcionario.numero_aparelho) : ''}
            onChangeText={(text) => handleChange('numero_aparelho', text)}
          />

          <Text style={styles.label}>Observação</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            multiline
            value={funcionario.observacao || ''}
            onChangeText={(text) => handleChange('observacao', text)}
          />

          {/* Endereço */}
          <Text style={styles.sectionTitle}>ENDEREÇO</Text>
          
          <Text style={styles.label}>CEP</Text>
          <TextInput
            style={styles.input}
            value={endereco.cep || ''}
            keyboardType="numeric"
            onChangeText={(text) => handleEnderecoChange('cep', text)}
            maxLength={9}
            placeholder="00000-000"
          />

          <Text style={styles.label}>UF</Text>
          <TextInput
            style={styles.input}
            value={endereco.uf || ''}
            onChangeText={(text) => handleEnderecoChange('uf', text)}
            maxLength={2}
            placeholder="UF"
          />

          <Text style={styles.label}>Cidade</Text>
          <TextInput
            style={styles.input}
            value={endereco.cidade || ''}
            onChangeText={(text) => handleEnderecoChange('cidade', text)}
            placeholder="Cidade"
          />

          <Text style={styles.label}>Bairro</Text>
          <TextInput
            style={styles.input}
            value={endereco.bairro || ''}
            onChangeText={(text) => handleEnderecoChange('bairro', text)}
            placeholder="Bairro"
          />

          <Text style={styles.label}>Rua</Text>
          <TextInput
            style={styles.input}
            value={endereco.rua || ''}
            onChangeText={(text) => handleEnderecoChange('rua', text)}
            placeholder="Rua"
          />

          <Text style={styles.label}>Número</Text>
          <TextInput
            style={styles.input}
            value={endereco.numero ? String(endereco.numero) : ''}
            keyboardType="numeric"
            onChangeText={(text) => handleEnderecoChange('numero', text)}
            placeholder="Número"
          />

          <Text style={styles.label}>Complemento</Text>
          <TextInput
            style={styles.input}
            value={endereco.complemento || ''}
            onChangeText={(text) => handleEnderecoChange('complemento', text)}
            placeholder="Complemento"
          />

          <Text style={styles.label}>Tipo de Endereço</Text>
          <TextInput
            style={styles.input}
            value={endereco.tipo || ''}
            onChangeText={(text) => handleEnderecoChange('tipo', text)}
            placeholder="Tipo de endereço"
          />

          {/* Dados Adicionais */}
          <Text style={styles.sectionTitle}>DADOS ADICIONAIS</Text>
          
          <Text style={styles.label}>Gênero</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={funcionario.genero_id}
              onValueChange={(value) => setFuncionario({...funcionario, genero_id: value})}
            >
              <Picker.Item label="Selecione um gênero" value={null} />
              {generos.map((genero) => (
                <Picker.Item key={genero.id} label={genero.nome} value={genero.id} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Função</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={funcionario.funcao_id}
              onValueChange={(value) => setFuncionario({...funcionario, funcao_id: value})}
            >
              <Picker.Item label="Selecione uma função" value={null} />
              {funcoes.map((funcao) => (
                <Picker.Item key={funcao.id} label={funcao.nome} value={funcao.id} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={[styles.input, errors.telefone && styles.errorInput]}
            value={funcionario.telefone || ''}
            keyboardType="phone-pad"
            onChangeText={(text) => handleChange('telefone', text)}
            placeholder="(00) 00000-0000"
            maxLength={15}
          />
          {errors.telefone && <Text style={styles.errorText}>{errors.telefone}</Text>}

          {/* Botão de Salvar */}
          <TouchableOpacity 
            style={styles.buttonEditar} 
            onPress={salvarAlteracoes}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonTextInput}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}