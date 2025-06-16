import { useState } from 'react';
import { Alert, Image, ImageBackground, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { ErrorReportService } from '../script/ErrorReportService';

export default function ErrorScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !description) {
      Alert.alert('Atenção', 'Por favor, descreva o problema.');
      return;
    }

    try {
      setLoading(true);
      const result = await ErrorReportService.submitReport({
        name,
        email,
        title,
        description,
        device_info: `${Platform.OS} ${Platform.Version}`,
        app_version: '1.0.0'
      });

      Alert.alert('Sucesso', result.message);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao enviar relatório');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#043b57" barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.navigate('TelaInicial')}>
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
          <Text style={styles.title}>RELATAR ERRO</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu nome"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Título do Problema</Text>
            <TextInput
              style={styles.input}
              placeholder="Descreva brevemente o problema"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Descrição Detalhada</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Descreva com detalhes o erro encontrado..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={5}
              value={description}
              onChangeText={setDescription}
            />
          </View>
          
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            activeOpacity={0.5}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'ENVIANDO...' : 'ENVIAR RELATO'}
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
    backgroundColor: '#14721d',
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
    backgroundColor: '#14721d',
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
  multilineInput: {
    height: 150,
    textAlignVertical: 'top',
    paddingTop: 15,
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
  disabledButton: {
    backgroundColor: '#cccccc',
  },
});