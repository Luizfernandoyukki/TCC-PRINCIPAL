
import { View, StyleSheet, TouchableOpacity, ImageBackground, StatusBar, Image } from 'react-native';
import { Text } from 'react-native-paper';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#043b57" barStyle="light-content" />
      
      {/* Cabeçalho azul (mantido igual) */}
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

      
      <ImageBackground source={require('../Assets/Fundo.png')} style={styles.backgroundImage}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.3}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>LOGIN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button1}
            activeOpacity={0.5}
            onPress={() => navigation.navigate('CadastroUser')}
          >
            <Text style={styles.buttonText}>CADASTRE-SE</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Estilos do cabeçalho (mantidos iguais)
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
  // Novos estilos para a tela inicial
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
    button: {
    width: '80%',
    height: '75',
    marginVertical: 15,
    paddingVertical: 15,
    backgroundColor: '#043b57',
    borderRadius: 25,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
   button1: {
    width: '80%',
    height: '75',
    marginVertical: 15,
    paddingVertical: 15,
    backgroundColor: '#14721d',
    borderRadius: 25,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
  },
});