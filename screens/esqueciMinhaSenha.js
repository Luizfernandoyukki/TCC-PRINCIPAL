import { useState } from 'react';
import { Alert, Image, ImageBackground, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { PasswordService } from '../script/PasswordService';

export default function ForgotPasswordScreen({ navigation }) {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [token, setToken] = useState('');
  const [step, setStep] = useState(1); // 1 = verificação, 2 = nova senha
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async () => {
    try {
      setLoading(true);
      const result = await PasswordService.requestReset({
        nomeCompleto,
        cpf,
        dataNascimento
      });

      Alert.alert('Sucesso', result.message);
      setToken(result.token);
      setStep(2);
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteReset = async () => {
    try {
      setLoading(true);
      const result = await PasswordService.completeReset({
        token,
        novaSenha,
        confirmarSenha
      });

      Alert.alert('Sucesso', result.message);
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Erro', error.message);
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

      <ImageBackground source={require('../Assets/erro.png')} style={styles.backgroundImage}>
        <ScrollView contentContainerStyle={styles.formContainer}>
          <Text style={styles.title}>RECUPERAR SENHA</Text>
          
          {step === 1 ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nome Completo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite seu nome completo"
                  placeholderTextColor="#999"
                  value={nomeCompleto}
                  onChangeText={setNomeCompleto}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>CPF</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite seu CPF"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={cpf}
                  onChangeText={setCpf}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Data de Nascimento</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={dataNascimento}
                  onChangeText={setDataNascimento}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Token de Verificação</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite o token recebido"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={token}
                  onChangeText={setToken}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nova Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite a nova senha (mín. 6 caracteres)"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={novaSenha}
                  onChangeText={setNovaSenha}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirmar Nova Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirme a nova senha"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                />
              </View>
            </>
          )}
          
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            activeOpacity={0.5}
            onPress={step === 1 ? handleRequestReset : handleCompleteReset}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'PROCESSANDO...' : step === 1 ? 'SOLICITAR TOKEN' : 'REDEFINIR SENHA'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.5}
            onPress={() => step === 1 ? navigation.goBack() : setStep(1)}
          >
            <Text style={styles.backButtonText}>
              {step === 1 ? 'Voltar para o Login' : 'Voltar para verificação'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
  },
  formContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
    width: 320,
    borderRadius: 25,
  },
  inputContainer: {
    width: '90%',
    marginBottom: 20,
  },
  label: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    elevation: 3,
  },
  submitButton: {
    width: '80%',
    height: 60,
    marginVertical: 20,
    paddingVertical: 15,
    backgroundColor: '#043b57',
    borderRadius: 25,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  backButton: {
    marginTop: 10,
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
});