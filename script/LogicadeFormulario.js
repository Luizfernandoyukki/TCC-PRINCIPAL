import bcrypt from 'bcryptjs';
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
  genero_id: 1,         // valor padrão válido
  CPF: '',
  ctps: '',
  rg: '',
  cargaHoraria: '1',    // valor padrão válido
  nDependentes: '0',
  hierarquia_id: 1,     // valor padrão válido
  funcao_id: 1,         // valor padrão válido
  cargo_id: 1,          // valor padrão válido
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
  telefone2: '',
  email1: '',
  email2: '',
  senha: '',
  confirmarSenha: '',
  is_admin: false,
  is_superior: false,
  superior_id: null,
  foto: null
};

export default async function useCadastroForm(navigation) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const senhaHash = await bcrypt.hash(formData.senha, 10);
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
    cargos: [],
    superiores: []
  });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [
          { data: hierarquias, error: hierarquiasError },
          { data: funcoes, error: funcoesError },
          { data: cargos, error: cargosError },
          { data: superiores, error: superioresError }
        ] = await Promise.all([
          supabase.from('hierarquia').select('*').order('nivel'),
          supabase.from('funcao').select('*'),
          supabase.from('cargo').select('*'),
          supabase.from('funcionario')
            .select('id, nome')
            .or('is_superior.eq.true,is_admin.eq.true')
            .order('nome')
        ]);

        if (hierarquiasError) throw hierarquiasError;
        if (funcoesError) throw funcoesError;
        if (cargosError) throw cargosError;
        if (superioresError) throw superioresError;

        setOpcoes(prev => ({
          ...prev,
          hierarquias: hierarquias || [],
          funcoes: funcoes || [],
          cargos: cargos || [],
          superiores: superiores || []
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

  // Função utilitária para garantir valor válido entre 1 e 10
  const getFirstValidId = (options) => {
    if (!options || options.length === 0) return 1;
    // Tenta de 1 até 10
    for (let i = 1; i <= 10; i++) {
      if (options.some(opt => opt.id === i)) return i;
    }
    // Se não encontrar, retorna o primeiro id disponível entre 1 e 10
    const validOption = options.find(opt => typeof opt.id === 'number' && opt.id >= 1 && opt.id <= 10);
    return validOption ? validOption.id : 1;
  };

  const handleAdminChange = (value) => {
    const isAdmin = value === 'true';

    setFormData(prev => ({
      ...prev,
      is_admin: isAdmin,
      is_superior: isAdmin,
      superior_id: null,
      hierarquia_id: isAdmin ? 1 : prev.hierarquia_id,
      funcao_id: isAdmin ? 1 : prev.funcao_id,
      cargo_id: isAdmin ? 1 : prev.cargo_id
    }));
    setShowSuperiorFields(!isAdmin);
  };

  const applyMask = (field, value) => {
    switch(field) {
      case 'CPF': return maskCpf(value);
      case 'telefone1':
      case 'telefone2': return maskPhone(value);
      case 'cep': return maskCep(value);
      case 'dataNascimento':
      case 'dataAdmissao': return maskDate(value);
      default: return value;
    }
  };

  const handleChange = (field, value) => {
    const numericFields = [
      'genero_id', 'hierarquia_id', 'funcao_id', 'cargo_id',
      'cargaHoraria', 'nDependentes'
    ];

    if (numericFields.includes(field)) {
      value = value === '' ? null : value;
      // Apenas converte para string se NÃO for genero_id
      if (value !== null && field !== 'genero_id') {
        value = value.toString().replace(/[^0-9]/g, '');
      }
      // Para genero_id, mantenha como número
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
      value = value.trimStart(); // Remove espaços só do início enquanto digita
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

    // Só exige campos profissionais se NÃO for admin
    if (!formData.is_admin) {
      requiredFields.push('hierarquia_id', 'funcao_id', 'cargo_id');
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

    // Só valida campos numéricos profissionais se NÃO for admin
    const numericFields = {
      cargaHoraria: 'Carga horária',
      nDependentes: 'Número de dependentes',
      genero_id: 'Gênero'
    };
    if (!formData.is_admin) {
      numericFields.hierarquia_id = 'Hierarquia';
      numericFields.funcao_id = 'Função';
      numericFields.cargo_id = 'Cargo';
    }

    Object.entries(numericFields).forEach(([field, name]) => {
      if (formData[field] === '' || formData[field] === null) {
        newErrors[field] = `${name} é obrigatório`;
        isValid = false;
      } else if (isNaN(safeParseInt(formData[field]))) {
        newErrors[field] = `${name} deve ser um número válido`;
        isValid = false;
      }
    });

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
      console.log('formData inicial:', JSON.stringify(formData));
      console.log('opcoes:', JSON.stringify(opcoes));

      // 1. Criar usuário no Auth
      console.log('Tentando criar usuário no Auth...');
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
      console.log('Resultado Auth:', { authData, authError });

      if (authError) {
        if (authError.message && authError.message.includes('already registered')) {
          throw new Error('Este e-mail já está cadastrado. Faça login ou use outro e-mail.');
        }
        throw authError || new Error('Erro ao criar usuário');
      }
      if (!authData?.user?.id) throw new Error('Falha ao criar usuário');

      const userId = authData.user.id;
      console.log('Usuário criado com id:', userId);

      // Verificar se já existe funcionário com este usuário
      const { data: existingFuncionario } = await supabase
        .from('funcionario')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingFuncionario) {
        throw new Error('Já existe um funcionário cadastrado com este usuário. Faça login ou use outro e-mail.');
      }

      // Verificar se já existe funcionário com este CPF
      const { data: existingCpf } = await supabase
        .from('funcionario')
        .select('id')
        .eq('cpf', formData.CPF.replace(/\D/g, ''))
        .single();

      if (existingCpf) {
        throw new Error('Já existe um funcionário cadastrado com este CPF.');
      }

      // 2. Upload da foto (se existir)
      let fotoUrl = null;
      if (formData.foto) {
        console.log('Tentando fazer upload da foto...');
        fotoUrl = await uploadPhoto(userId);
        console.log('URL da foto:', fotoUrl);
      } else {
        console.log('Nenhuma foto selecionada para upload.');
      }

      // 3. IDs de referência
      const hierarquiaId = getFirstValidId(opcoes.hierarquias);
      const funcaoId = getFirstValidId(opcoes.funcoes);
      const cargoId = getFirstValidId(opcoes.cargos);
      console.log('IDs selecionados:', { hierarquiaId, funcaoId, cargoId });

      // 4. Cadastrar endereço
      console.log('Tentando cadastrar endereço...');
      console.log('Dados do endereço:', {
        cep: formData.cep.replace(/\D/g, ''),
        uf: formData.uf,
        cidade: formData.cidade,
        bairro: formData.bairro,
        rua: formData.rua,
        numero: formData.numero,
        complemento: formData.complemento,
        tipo: formData.tipo_endereco
      });
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

      console.log('Resultado endereço:', { endereco, endError });

      if (endError || !endereco) {
        throw endError || new Error('Falha ao cadastrar endereço');
      }

      // 5. Preparar dados do funcionário (agora com endereco.id)
      const funcionarioData = {
        id: userId,
        nome: formData.nome.trim(), // Remove espaços antes/depois ao salvar
        data_nascimento: formData.dataNascimento,
        cpf: formData.CPF.replace(/\D/g, ''),
        ctps: formData.ctps,
        rg: formData.rg,
        senha: senhaHash,
        data_admissao: formData.dataAdmissao,
        carga_horaria: (safeParseInt(formData.cargaHoraria) >= 1 && safeParseInt(formData.cargaHoraria) <= 10)
          ? safeParseInt(formData.cargaHoraria)
          : 1,
        numero_dependentes: (safeParseInt(formData.nDependentes) >= 0 && safeParseInt(formData.nDependentes) <= 10)
          ? safeParseInt(formData.nDependentes)
          : 0,
        numero_ficha: formData.numeroFicha,
        numero_aparelho: formData.numeroAparelho,
        hierarquia_id: (safeParseInt(formData.hierarquia_id) >= 1 && safeParseInt(formData.hierarquia_id) <= 10)
          ? safeParseInt(formData.hierarquia_id)
          : 1,
        funcao_id: (safeParseInt(formData.funcao_id) >= 1 && safeParseInt(formData.funcao_id) <= 10)
          ? safeParseInt(formData.funcao_id)
          : 1,
        cargo_id: (safeParseInt(formData.cargo_id) >= 1 && safeParseInt(formData.cargo_id) <= 10)
          ? safeParseInt(formData.cargo_id)
          : 1,
        genero_id: (safeParseInt(formData.genero_id) >= 1 && safeParseInt(formData.genero_id) <= 10)
          ? safeParseInt(formData.genero_id)
          : 1,
        is_admin: formData.is_admin,
        is_superior: formData.is_superior,
        superior_id: formData.superior_id,
        foto_url: fotoUrl,
        endereco_id: endereco.id
      };
      console.log('Dados do funcionário a serem inseridos:', funcionarioData);

      // 6. Cadastrar funcionário
      console.log('Tentando cadastrar funcionário...');
      const { error: funcError } = await supabase
        .from('funcionario')
        .insert(funcionarioData);

      console.log('Resultado funcionário:', { funcError });

      if (funcError) throw funcError;

      // 7. Cadastrar contatos (telefone e email em tabelas separadas)
      if (formData.telefone1) {
        console.log('Tentando cadastrar telefone principal...');
        const { error: telefone1Error } = await supabase
          .from('telefone')
          .insert({
            tipo: 'principal',
            numero: formData.telefone1.replace(/\D/g, ''),
            funcionario_id: userId
          });
        console.log('Resultado telefone principal:', { telefone1Error });
        if (telefone1Error) throw telefone1Error;
      }

      if (formData.telefone2) {
        console.log('Tentando cadastrar telefone secundário...');
        const { error: telefone2Error } = await supabase
          .from('telefone')
          .insert({
            tipo: 'secundario',
            numero: formData.telefone2.replace(/\D/g, ''),
            funcionario_id: userId
          });
        console.log('Resultado telefone secundário:', { telefone2Error });
        if (telefone2Error) throw telefone2Error;
      }

      if (formData.email1) {
        console.log('Tentando cadastrar email principal...');
        const { error: email1Error } = await supabase
          .from('email')
          .insert({
            tipo: 'principal',
            email: formData.email1,
            funcionario_id: userId
          });
        console.log('Resultado email principal:', { email1Error });
        if (email1Error) throw email1Error;
      }

      if (formData.email2) {
        console.log('Tentando cadastrar email secundário...');
        const { error: email2Error } = await supabase
          .from('email')
          .insert({
            tipo: 'secundario',
            email: formData.email2,
            funcionario_id: userId
          });
        console.log('Resultado email secundário:', { email2Error });
        if (email2Error) throw email2Error;
      }

      console.log('Contatos cadastrados com sucesso!');

      Alert.alert('Sucesso', 'Cadastro realizado com sucesso!');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Erro completo:', error, JSON.stringify(error));
      let errorMessage = 'Falha ao cadastrar. Verifique os dados e tente novamente.';
      if (error && typeof error === 'object') {
        if (error.message) errorMessage = error.message;
        else if (error.details) errorMessage = error.details;
        else errorMessage = JSON.stringify(error);
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
