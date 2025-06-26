import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableOpacity,
  View
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { LoginService } from '../script/LoginService';
import headerStyles from '../styles/Estilocabecalho';
import styles from '../styles/EstilosdeLogin';

export default function LoginScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    
    try {
      await LoginService.handleLogin(nome.trim(), senha, navigation);
    } catch (error) {
      setErrorMsg(error.message || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#043b57" barStyle="light-content" />
      <View style={headerStyles.header}>
        <View style={headerStyles.headerContent}>
          <TouchableOpacity onPress={() => navigation.navigate('TelaInicial')}>
            <Image 
              source={require('../Assets/logo.png')} 
              style={headerStyles.logo} 
              resizeMode="contain" 
            />
          </TouchableOpacity>
          <TouchableOpacity 
          onPress={() => {
               Alert.alert(
              'Botão Inoperante',
              'Botão disponivel apos acesso ao sistema.',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'OK', onPress: () => console.log('Usuário confirmou') }
              ]
            );}}>
            <Image 
              source={require('../Assets/alerta.png')} 
              style={headerStyles.alerta} 
              resizeMode="contain" 
            />
          </TouchableOpacity>
        </View>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.select({ ios: 40, android: 0 })}
        style={styles.card}
      >
        <Text style={styles.title}>LOGIN</Text>
        <TextInput
          label="Nome"
          value={nome}
          onChangeText={setNome}
          mode="flat"
          style={styles.input}
          underlineColor="#d1d5db"
          activeUnderlineColor="#3b82f6"
          theme={{ colors: { text: '#1f2937', placeholder: '#9ca3af' } }}
          placeholder="Digite seu nome"
        />
        <TextInput
          label="Senha"
          value={senha}
          onChangeText={setSenha}
          mode="flat"
          style={styles.input}
          secureTextEntry={secureTextEntry}
          right={
            <TextInput.Icon
              name={secureTextEntry ? "eye-off" : "eye"}
              onPress={() => setSecureTextEntry(!secureTextEntry)}
            />
          }
          underlineColor="#d1d5db"
          activeUnderlineColor="#3b82f6"
          theme={{ colors: { text: '#1f2937', placeholder: '#9ca3af' } }}
        />
        <View style={styles.botoes}>
          <Button
            mode="contained"
            onPress={onLogin}
            style={styles.loginButton}
            labelStyle={styles.buttonLabel}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : 'ENTRAR'}
          </Button>
        </View>
        {errorMsg ? (
          <Text style={{ color: 'red', marginTop: 10, textAlign: 'center' }}>{errorMsg}</Text>
        ) : null}
        <TouchableOpacity 
          style={styles.cadastroText} 
          onPress={() => navigation.navigate('EsqueciMinhaSenha')}
        >
          <Text style={styles.cadastroText}>Esqueci a Senha</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}