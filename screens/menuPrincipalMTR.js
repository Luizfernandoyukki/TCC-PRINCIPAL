import * as Font from 'expo-font';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StatusBar, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import styles from '../styles/EstilosdoMenuPrincipal';

export default function MenuPrincipalMTRScreen({ navigation }) {
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    async function loadFont() {
      await Font.loadAsync({
        'AdigianaUI': require('../Assets/fonts/AdigianaUI.ttf'),
      });
      setFontLoaded(true);
    }
    loadFont();
  }, []);

  const menuItems = [
    'ENTREGAS',
    'CLIENTES',
    'ETREGUES',
    'VEÍCULOS'
  ];

  const handleMenuItemPress = (index) => {
    const screens = [
      'EntregasMTR',
      'ClientesMTR',
      'EntregarMTR',
      'VeiculosMTR'
    ];
    navigation.navigate(screens[index]);
  };

  if (!fontLoaded) {
    return <View style={styles.container} />;
  }

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
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipalMTR')}>
            <Image 
              source={require('../Assets/MTR.png')} 
              style={styles.alerta}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress(index)}
            >
              <Text style={styles.menuText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
