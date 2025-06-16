import { useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

export default function MenuCadastroScreen({ navigation }) {
  const [formData, setFormData] = useState({
    nome: '',
    dataNascimento: '',
    dataAdmissao: '',
    genero: '',
    CPF: '',
    ctps: '',
    rg: '',
    cargaHoraria: '',
    nDependentes: '',
    hierarquia: '',
    funcao: '',
    numeroFicha: '',
    numeroAparelho: '',
    cep: '',
    uf: '',
    bairro: '',
    rua: '',
    numero: '',
    tipo: '',
    complemento: '',
    telefone1: '',
    telefone2: '',
    email1: '',
    email2: '',
    cargo: '',
    senha: '',
    confirmarSenha: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
    // Limpa o erro quando o usuário começa a digitar
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Campos obrigatórios
    const requiredFields = [
      'nome', 'dataNascimento', 'dataAdmissao', 'genero', 
      'CPF', 'ctps', 'rg', 'cargaHoraria', 'nDependentes',
      'hierarquia', 'funcao', 'numeroFicha', 'cep', 'uf',
      'bairro', 'rua', 'numero', 'tipo', 'telefone1', 
      'email1', 'cargo', 'senha', 'confirmarSenha'
    ];

    requiredFields.forEach(key => {
      if (!formData[key]) {
        newErrors[key] = 'Campo obrigatório';
        isValid = false;
      }
    });

    // Validação específica para senha
    if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não coincidem';
      isValid = false;
    }

    // Validação de e-mail se o segundo e-mail foi preenchido
    if (formData.email2 && !/\S+@\S+\.\S+/.test(formData.email2)) {
      newErrors.email2 = 'E-mail inválido';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log('Dados do formulário:', formData);
      Alert.alert('Sucesso', 'Cadastro realizado com sucesso!');
      // navigation.navigate('OutraTela'); // Descomente para navegar após cadastro
    } else {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios corretamente');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#043b57" barStyle="light-content" />
      
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image 
              source={require('../Assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Error')}>
            <Image 
              source={require('../Assets/alerta.png')} 
              style={styles.alerta}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conteúdo com Scroll */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Seção de Dados Pessoais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CADASTRO COLABORADOR</Text>
          
          <View style={styles.sectionContent}>
            <TextInput
              label="Nome Completo*"
              value={formData.nome}
              onChangeText={(text) => handleChange('nome', text)}
              style={styles.input}
              mode="outlined"
              error={!!errors.nome}
            />
            {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}
            
            <TextInput
              label="Data de Nascimento*"
              value={formData.dataNascimento}
              onChangeText={(text) => handleChange('dataNascimento', text)}
              style={styles.input}
              mode="outlined"
              placeholder="DD/MM/AAAA"
              error={!!errors.dataNascimento}
            />
            {errors.dataNascimento && <Text style={styles.errorText}>{errors.dataNascimento}</Text>}
            
            <TextInput
              label="Data de Admissão*"
              value={formData.dataAdmissao}
              onChangeText={(text) => handleChange('dataAdmissao', text)}
              style={styles.input}
              mode="outlined"
              placeholder="DD/MM/AAAA"
              error={!!errors.dataAdmissao}
            />
            {errors.dataAdmissao && <Text style={styles.errorText}>{errors.dataAdmissao}</Text>}
            
            <TextInput
              label="Gênero*"
              value={formData.genero}
              onChangeText={(text) => handleChange('genero', text)}
              style={styles.input}
              mode="outlined"
              error={!!errors.genero}
            />
            {errors.genero && <Text style={styles.errorText}>{errors.genero}</Text>}
          </View>
        </View>

        {/* Seção de Documentos */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <TextInput
              label="CPF*"
              value={formData.CPF}
              onChangeText={(text) => handleChange('CPF', text)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              error={!!errors.CPF}
            />
            {errors.CPF && <Text style={styles.errorText}>{errors.CPF}</Text>}
            
            <TextInput
              label="CTPS*"
              value={formData.ctps}
              onChangeText={(text) => handleChange('ctps', text)}
              style={styles.input}
              mode="outlined"
              error={!!errors.ctps}
            />
            {errors.ctps && <Text style={styles.errorText}>{errors.ctps}</Text>}
            
            <TextInput
              label="RG*"
              value={formData.rg}
              onChangeText={(text) => handleChange('rg', text)}
              style={styles.input}
              mode="outlined"
              error={!!errors.rg}
            />
            {errors.rg && <Text style={styles.errorText}>{errors.rg}</Text>}
          </View>
        </View>

        {/* Seção de Trabalho */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <TextInput
              label="Carga Horária*"
              value={formData.cargaHoraria}
              onChangeText={(text) => handleChange('cargaHoraria', text)}
              style={styles.input}
              mode="outlined"
              error={!!errors.cargaHoraria}
            />
            {errors.cargaHoraria && <Text style={styles.errorText}>{errors.cargaHoraria}</Text>}
            
            <TextInput
              label="Nº de Dependentes*"
              value={formData.nDependentes}
              onChangeText={(text) => handleChange('nDependentes', text)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              error={!!errors.nDependentes}
            />
            {errors.nDependentes && <Text style={styles.errorText}>{errors.nDependentes}</Text>}
            
            <TextInput
              label="Hierarquia*"
              value={formData.hierarquia}
              onChangeText={(text) => handleChange('hierarquia', text)}
              style={styles.input}
              mode="outlined"
              error={!!errors.hierarquia}
            />
            {errors.hierarquia && <Text style={styles.errorText}>{errors.hierarquia}</Text>}
            
            <TextInput
              label="Função*"
              value={formData.funcao}
              onChangeText={(text) => handleChange('funcao', text)}
              style={styles.input}
              mode="outlined"
              error={!!errors.funcao}
            />
            {errors.funcao && <Text style={styles.errorText}>{errors.funcao}</Text>}
            
            <TextInput
              label="Número da Ficha*"
              value={formData.numeroFicha}
              onChangeText={(text) => handleChange('numeroFicha', text)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              error={!!errors.numeroFicha}
            />
            {errors.numeroFicha && <Text style={styles.errorText}>{errors.numeroFicha}</Text>}
            
            <TextInput
              label="Nº do Aparelho Eletrônico"
              value={formData.numeroAparelho}
              onChangeText={(text) => handleChange('numeroAparelho', text)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Seção de Endereço */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>ENDEREÇO</Text>
          
          <View style={styles.sectionContent}>
            <TextInput
              label="CEP*"
              value={formData.cep}
              onChangeText={(text) => handleChange('cep', text)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              error={!!errors.cep}
            />
            {errors.cep && <Text style={styles.errorText}>{errors.cep}</Text>}
            
            <TextInput
              label="UF*"
              value={formData.uf}
              onChangeText={(text) => handleChange('uf', text)}
              style={styles.input}
              mode="outlined"
              error={!!errors.uf}
            />
            {errors.uf && <Text style={styles.errorText}>{errors.uf}</Text>}
            
            <TextInput
              label="Bairro*"
              value={formData.bairro}
              onChangeText={(text) => handleChange('bairro', text)}
              style={styles.input}
              mode="outlined"
              error={!!errors.bairro}
            />
            {errors.bairro && <Text style={styles.errorText}>{errors.bairro}</Text>}
            
            <TextInput
              label="Rua*"
              value={formData.rua}
              onChangeText={(text) => handleChange('rua', text)}
              style={styles.input}
              mode="outlined"
              error={!!errors.rua}
            />
            {errors.rua && <Text style={styles.errorText}>{errors.rua}</Text>}
            
            <TextInput
              label="Número*"
              value={formData.numero}
              onChangeText={(text) => handleChange('numero', text)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              error={!!errors.numero}
            />
            {errors.numero && <Text style={styles.errorText}>{errors.numero}</Text>}
            
            <TextInput
              label="Tipo*"
              value={formData.tipo}
              onChangeText={(text) => handleChange('tipo', text)}
              style={styles.input}
              mode="outlined"
              error={!!errors.tipo}
            />
            {errors.tipo && <Text style={styles.errorText}>{errors.tipo}</Text>}
            
            <TextInput
              label="Complemento"
              value={formData.complemento}
              onChangeText={(text) => handleChange('complemento', text)}
              style={styles.input}
              mode="outlined"
            />
          </View>
        </View>

        {/* Seção de Contato */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>CONTATOS</Text>
          
          <View style={styles.sectionContent}>
            <TextInput
              label="Telefone Principal*"
              value={formData.telefone1}
              onChangeText={(text) => handleChange('telefone1', text)}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
              error={!!errors.telefone1}
            />
            {errors.telefone1 && <Text style={styles.errorText}>{errors.telefone1}</Text>}
            
            <TextInput
              label="Telefone Secundário (Opcional)"
              value={formData.telefone2}
              onChangeText={(text) => handleChange('telefone2', text)}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
            />
            
            <TextInput
              label="E-mail Principal*"
              value={formData.email1}
              onChangeText={(text) => handleChange('email1', text)}
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
              error={!!errors.email1}
            />
            {errors.email1 && <Text style={styles.errorText}>{errors.email1}</Text>}
            
            <TextInput
              label="E-mail Secundário (Opcional)"
              value={formData.email2}
              onChangeText={(text) => handleChange('email2', text)}
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
              error={!!errors.email2}
            />
            {errors.email2 && <Text style={styles.errorText}>{errors.email2}</Text>}
            
            <TextInput
              label="Cargo*"
              value={formData.cargo}
              onChangeText={(text) => handleChange('cargo', text)}
              style={styles.input}
              mode="outlined"
              error={!!errors.cargo}
            />
            {errors.cargo && <Text style={styles.errorText}>{errors.cargo}</Text>}
          </View>
        </View>

        {/* Seção de Senha */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <TextInput
              label="Senha*"
              value={formData.senha}
              onChangeText={(text) => handleChange('senha', text)}
              style={styles.input}
              mode="outlined"
              secureTextEntry={true}
              error={!!errors.senha}
            />
            {errors.senha && <Text style={styles.errorText}>{errors.senha}</Text>}
            
            <TextInput
              label="Confirmar Senha*"
              value={formData.confirmarSenha}
              onChangeText={(text) => handleChange('confirmarSenha', text)}
              style={styles.input}
              mode="outlined"
              secureTextEntry={true}
              error={!!errors.confirmarSenha}
            />
            {errors.confirmarSenha && <Text style={styles.errorText}>{errors.confirmarSenha}</Text>}
          </View>
        </View>

        {/* Botão de cadastrar */}
        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            onPress={handleSubmit}
            style={styles.registerButton}
            labelStyle={styles.buttonLabel}
          >
            CADASTRAR
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
    width: 50,
    height: 50,
    marginRight: 30,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fadb53',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#043b57',
    marginBottom: 15,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#043b57',
    marginBottom: 15,
    textAlign: 'center',
  },
  sectionContent: {
    paddingHorizontal: 10,
  },
  input: {
    marginBottom: 5,
    backgroundColor: 'white',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    fontSize: 12,
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerButton: {
    backgroundColor: '#043b57',
    borderRadius: 25,
    width: 200,
    paddingVertical: 5,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});