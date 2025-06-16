import * as Font from 'expo-font';
import { useEffect, useState } from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/EstilosdoMenuPrincipal';

export default function MenuPrincipalADMScreen({ navigation }) {
  console.log('Renderizando MenuPrincipalADMScreen');
  const [fontLoaded, setFontLoaded] = useState(false);
  const { logout } = useAuth();

  const menuItems = [
    'FUNÇÕES',
    'ESTOQUE',
    'CLIENTES',
    'FUNCIONARIOS',
    'ENTREGAS',
    'ROTAS',
    'BALANÇO',
    'VEÍCULOS',
    'DEVOLUÇÕES',
    'PEDIDOS',
    'SAIR'
  ];

  const screens = [
    'Funcoes',
    'Estoque',
    'Clientes',
    'Funcionarios',
    'Entregas',
    'Rotas',
    'Balanco',
    'Veiculos',
    'Devolucao',
    'Pedidos'
  ];

  useEffect(() => {
    async function loadFont() {
      await Font.loadAsync({
        'AdigianaUI': require('../Assets/fonts/AdigianaUI.ttf'),
      });
      setFontLoaded(true);
    }
    loadFont();
  }, []);

  const handleMenuItemPress = (index) => {
    if (menuItems[index] === 'SAIR') {
      logout();
      return;
    }
    if (screens[index]) {
      navigation.navigate(screens[index]);
    }
  };

  if (!fontLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Carregando fonte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={require('../Assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipalADM')}>
            <Image
              source={require('../Assets/ADM.png')}
              style={styles.alerta}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} bounces={false} overScrollMode="never">
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                item === 'SAIR' && { backgroundColor: '#e53935' }
              ]}
              onPress={() => handleMenuItemPress(index)}
            >
              <Text style={[
                styles.menuText,
                item === 'SAIR' && { color: '#fff' }
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

