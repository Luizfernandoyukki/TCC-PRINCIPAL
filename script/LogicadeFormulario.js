import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../contexts/supabaseClient';
import { maskCep, maskCpf, maskDate, maskPhone } from '../utils/masks';

const initialFormData = {
  nome: '',
  dataNascimento: new Date(),
  dataAdmissao: new Date(),
  genero_id: null,         
  CPF: '',
  ctps: '',
  rg: '',
  cargaHoraria: '',   
  nDependentes: '',
  hierarquia_id: null,    
  funcao_id: null,             
  numeroFicha: '',
  numeroAparelho: '',
  cep: '',
  uf: '',
  cidade: '',
  bairro: '',
  rua: '',
  numero: '',
  tipo_endereco: '',
  complemento: '',
  telefone1: '',
  email1: '',
  senha: '',
  confirmarSenha: '',
  is_admin: false,
  is_superior: false,
  superior_id: null,
  foto: null
};

export default function useCadastroForm(navigation) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [datePickerField, setDatePickerField] = useState('');
  const [showSuperiorFields, setShowSuperiorFields] = useState(false);
  const [opcoes, setOpcoes] = useState({
    generos: [
      { id: 1, nome: 'Masculino' },
      { id: 2, nome: 'Feminino' },
      { id: 3, nome: 'Outro' }
    ],
    hierarquias: [],
    funcoes: [],
    superiores: []
  });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        console.log('Carregando opções do banco de dados...');
        const [
          { data: hierarquias, error: hierarquiasError },
          { data: funcoes, error: funcoesError },
          { data: superiores, error: superioresError }
        ] = await Promise.all([
          supabase.from('hierarquia').select('*').order('nivel'),
          supabase.from('funcao').select('*'),
          supabase.from('funcionario')
            .select('id, nome')
            .or('is_superior.eq.true,is_admin.eq.true')
            .order('nome')
        ]);

        if (hierarquiasError) throw hierarquiasError;
        if (funcoesError) throw funcoesError;
        if (superioresError) throw superioresError;

        console.log('Opções carregadas:', {
          hierarquias: hierarquias?.length,
          funcoes: funcoes?.length,
          superiores: superiores?.length
        });

        setOpcoes(prev => ({
          ...prev,
          hierarquias: hierarquias || [],
          funcoes: funcoes || [],
          superiores: superiores || []
        }));

        // Define valores iniciais apenas se não forem administradores
        setFormData(prev => ({
          ...prev,
          genero_id: prev.genero_id || 1,
          hierarquia_id: prev.is_admin ? null : (hierarquias?.[0]?.id || null),
          funcao_id: prev.is_admin ? null : (funcoes?.[0]?.id || null)
        }));

      } catch (error) {
        console.error('Erro ao carregar opções:', error);
        Alert.alert('Erro', 'Não foi possível carregar as opções do sistema');
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  const safeParseInt = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value.toString().replace(/[^0-9]/g, ''));
    return isNaN(num) ? null : num;
  };

  const handleAdminChange = (value) => {
    const isAdmin = value === 'true';
    console.log('Alterando status de admin para:', isAdmin);

    setFormData(prev => ({
      ...prev,
      is_admin: isAdmin,
      is_superior: isAdmin,
      superior_id: null,
      // Reseta hierarquia e função apenas se for admin
      hierarquia_id: isAdmin ? null : (opcoes.hierarquias[0]?.id || null),
      funcao_id: isAdmin ? null : (opcoes.funcoes[0]?.id || null)
    }));

    setShowSuperiorFields(!isAdmin);
    setErrors(prev => ({
      ...prev,
      hierarquia_id: null,
      funcao_id: null,
      superior_id: null
    }));
  };

  const applyMask = (field, value) => {
    switch(field) {
      case 'CPF': return maskCpf(value);
      case 'telefone1': return maskPhone(value);
      case 'cep': return maskCep(value);
      case 'dataNascimento':
      case 'dataAdmissao': return maskDate(value);
      default: return value;
    }
  };

  const handleChange = (field, value) => {
    const numericFields = [
      'genero_id', 'hierarquia_id', 'funcao_id',
      'cargaHoraria', 'nDependentes'
    ];

    if (numericFields.includes(field)) {
      value = value === '' ? null : value;
      if (value !== null && field !== 'genero_id') {
        value = value.toString().replace(/[^0-9]/g, '');
      }
      if (field === 'genero_id' && typeof value === 'string') {
        value = Number(value);
      }
    }

    if (['ctps', 'rg'].includes(field)) {
      value = value.replace(/[^0-9]/g, '').slice(0, 11);
    } else if (['numeroFicha', 'numeroAparelho'].includes(field)) {
      value = value.replace(/[^0-9]/g, '');
    }

    const maskedValue = applyMask(field, value);
    setFormData(prev => ({
      ...prev,
      [field]: maskedValue
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }

    if (field === 'nome') {
      value = value.trimStart();
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setDatePickerField('');
    if (selectedDate) {
      const field = datePickerField;
      handleChange(field, selectedDate);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos acessar sua galeria para selecionar uma foto');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        const compressedImage = await manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 500 } }],
          { compress: 0.7, format: SaveFormat.JPEG }
        );
        
        setFormData(prev => ({
          ...prev,
          foto: {
            uri: compressedImage.uri,
            name: `foto_${Date.now()}.jpg`,
            type: 'image/jpeg'
          }
        }));
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const uploadPhoto = async (userId) => {
    if (!formData.foto || !userId) return null;

    try {
      const manipulatedImage = await manipulateAsync(
        formData.foto.uri,
        [{ resize: { width: 400 } }],
        { compress: 0.6, format: SaveFormat.JPEG }
      );

      const fileExt = 'jpg';
      const fileName = `foto_${userId}_${Date.now()}.${fileExt}`;
      const filePath = `fotos_funcionarios/${fileName}`;

      const response = await fetch(manipulatedImage.uri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('funcionarios')
        .upload(filePath, blob, {
          contentType: 'image/jpeg'
        });

      if (error) throw error;

      return `${supabase.storageUrl}/object/public/funcionarios/${filePath}`;
    } catch (error) {
      console.error('Erro no upload da foto:', error);
      return null;
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    const requiredFields = [
      'nome', 'dataNascimento', 'dataAdmissao', 'genero_id', 
      'CPF', 'ctps', 'rg', 'cargaHoraria', 'nDependentes',
      'numeroFicha', 'cep', 'uf', 'cidade', 'bairro', 'rua', 'numero', 
      'tipo_endereco', 'telefone1', 'email1', 'senha', 
      'confirmarSenha', 'is_admin'
    ];

    // Campos obrigatórios para não-administradores
    if (!formData.is_admin) {
      if (!formData.hierarquia_id) {
        newErrors.hierarquia_id = 'Selecione uma hierarquia';
        isValid = false;
      }
      if (!formData.funcao_id) {
        newErrors.funcao_id = 'Selecione uma função';
        isValid = false;
      }
      if (!formData.superior_id) {
        newErrors.superior_id = 'Selecione um superior hierárquico';
        isValid = false;
      }
    }

    requiredFields.forEach(key => {
      if (!formData[key] && formData[key] !== 0) {
        newErrors[key] = 'Campo obrigatório';
        isValid = false;
      }
    });

    // Validações numéricas
    const numericValidations = {
      cargaHoraria: {
        value: formData.cargaHoraria,
        min: 1,
        max: 24,
        message: 'Carga horária deve ser entre 1 e 24 horas'
      },
      nDependentes: {
        value: formData.nDependentes,
        min: 0,
        max: 20,
        message: 'Número de dependentes deve ser entre 0 e 20'
      },
      genero_id: {
        value: formData.genero_id,
        min: 1,
        max: 3,
        message: 'Selecione um gênero válido'
      }
    };

    if (!formData.is_admin) {
      numericValidations.hierarquia_id = {
        value: formData.hierarquia_id,
        message: 'Selecione uma hierarquia válida'
      };
      numericValidations.funcao_id = {
        value: formData.funcao_id,
        message: 'Selecione uma função válida'
      };
    }

    Object.entries(numericValidations).forEach(([field, validation]) => {
      const numValue = safeParseInt(validation.value);
      
      if (numValue === null) {
        newErrors[field] = validation.message;
        isValid = false;
      } else if (validation.min !== undefined && numValue < validation.min) {
        newErrors[field] = validation.message;
        isValid = false;
      } else if (validation.max !== undefined && numValue > validation.max) {
        newErrors[field] = validation.message;
        isValid = false;
      }
    });

    // Validações específicas
    if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não coincidem';
      isValid = false;
    }

    if (formData.email1 && !/\S+@\S+\.\S+/.test(formData.email1)) {
      newErrors.email1 = 'E-mail inválido';
      isValid = false;
    }

    if (formData.CPF && formData.CPF.length !== 14) {
      newErrors.CPF = 'CPF incompleto';
      isValid = false;
    }

    if (formData.telefone1 && formData.telefone1.replace(/\D/g, '').length < 10) {
      newErrors.telefone1 = 'Telefone deve ter pelo menos 10 dígitos';
      isValid = false;
    }

    if (formData.ctps && (formData.ctps.length !== 11 || isNaN(formData.ctps))) {
      newErrors.ctps = 'CTPS deve ter exatamente 11 dígitos';
      isValid = false;
    }

    if (formData.rg && (formData.rg.length !== 11 || isNaN(formData.rg))) {
      newErrors.rg = 'RG deve ter exatamente 11 dígitos';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios corretamente');
      return;
    }
  
    try {
      setLoading(true);
      console.log('--- INICIANDO CADASTRO ---');
      console.log('Dados do formulário:', JSON.stringify(formData, null, 2));
      console.log('Opções disponíveis:', JSON.stringify(opcoes, null, 2));

      // Criar usuário no Auth
      console.log('Criando usuário no Auth...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email1,
        password: formData.senha,
        options: {
          data: {
            nome: formData.nome,
            cpf: formData.CPF
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          throw new Error('Este e-mail já está cadastrado. Faça login ou use outro e-mail.');
        }
        throw authError;
      }

      if (!authData?.user?.id) {
        throw new Error('Falha ao criar usuário no sistema de autenticação');
      }

      const userId = authData.user.id;
      console.log('Usuário criado com ID:', userId);

      // Verificar se já existe um funcionário com este usuário ou CPF
      const { data: existingFuncionario } = await supabase
        .from('funcionario')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingFuncionario) {
        throw new Error('Já existe um funcionário cadastrado com este usuário.');
      }

      const { data: existingCpf } = await supabase
        .from('funcionario')
        .select('id')
        .eq('cpf', formData.CPF.replace(/\D/g, ''))
        .single();

      if (existingCpf) {
        throw new Error('Já existe um funcionário cadastrado com este CPF.');
      }

      // Upload da foto (se existir)
      let fotoUrl = null;
      if (formData.foto) {
        console.log('Fazendo upload da foto...');
        fotoUrl = await uploadPhoto(userId);
        console.log('Foto enviada com URL:', fotoUrl);
      }

      // Cadastrar endereço
      console.log('Cadastrando endereço...');
      const { data: endereco, error: endError } = await supabase
        .from('endereco')
        .insert({
          cep: formData.cep.replace(/\D/g, ''),
          uf: formData.uf,
          cidade: formData.cidade,
          bairro: formData.bairro,
          rua: formData.rua,
          numero: formData.numero,
          complemento: formData.complemento,
          tipo: formData.tipo_endereco
        })
        .select()
        .single();

      if (endError || !endereco) {
        throw endError || new Error('Falha ao cadastrar endereço');
      }

      // Preparar dados do funcionário
      const funcionarioData = {
        id: userId,
        nome: formData.nome.trim(),
        data_nascimento: formData.dataNascimento,
        cpf: formData.CPF.replace(/\D/g, ''),
        ctps: formData.ctps,
        rg: formData.rg,
        data_admissao: formData.dataAdmissao,
        carga_horaria: safeParseInt(formData.cargaHoraria) || 1,
        numero_dependentes: safeParseInt(formData.nDependentes) || 0,
        numero_ficha: formData.numeroFicha,
        numero_aparelho: formData.numeroAparelho,
        genero_id: formData.genero_id,
        is_admin: formData.is_admin,
        is_superior: formData.is_superior,
        superior_id: formData.superior_id,
        foto_url: fotoUrl,
        endereco_id: endereco.id
      };

      // Adicionar hierarquia e função apenas se não for admin
      if (!formData.is_admin) {
        funcionarioData.hierarquia_id = formData.hierarquia_id;
        funcionarioData.funcao_id = formData.funcao_id;
      }

      console.log('Dados do funcionário:', funcionarioData);

      // Cadastrar funcionário
      const { error: funcError } = await supabase
        .from('funcionario')
        .insert(funcionarioData);

      if (funcError) throw funcError;

      // Cadastrar telefone
      if (formData.telefone1) {
        const { error: telefoneError } = await supabase
          .from('telefone')
          .insert({
            numero: formData.telefone1.replace(/\D/g, ''),
            tipo: 'principal',
            funcionario_id: userId
          });

        if (telefoneError) throw telefoneError;
      }

      // Cadastrar email
      if (formData.email1) {
        const { error: emailError } = await supabase
          .from('email')
          .insert({
            email: formData.email1,
            tipo: 'principal',
            funcionario_id: userId
          });

        if (emailError) throw emailError;
      }

      console.log('Cadastro realizado com sucesso!');
      Alert.alert('Sucesso', 'Cadastro realizado com sucesso!');
      navigation.navigate('Login');

    } catch (error) {
      console.error('Erro no cadastro:', error);
      let errorMessage = 'Falha ao cadastrar. Verifique os dados e tente novamente.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
      console.log('--- FIM DO CADASTRO ---');
    }
  };

  return {
    formData,
    errors,
    loading,
    opcoes,
    datePickerField,
    showSuperiorFields,
    handleAdminChange,
    handleChange,
    handleSubmit,
    pickImage,
    setDatePickerField,
    handleDateChange
  };
}