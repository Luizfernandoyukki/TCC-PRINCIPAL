import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-url-polyfill/auto';
import { supabase } from './contexts/supabaseClient';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NomesProvider } from './contexts/NomesContext';

import { initDatabase } from './services/localDatabase';
import SyncService from './services/syncService';
// Rotas
import {
  CADASTRO_ROUTES,
  getRequiredRole,
  PROTECTED_ROUTES,
  PUBLIC_ROUTES
} from './routes';

const Stack = createNativeStackNavigator();

// Componente de carregamento
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" />
  </View>
);

useEffect(() => {
  const initializeLocalDB = async () => {
    try {
      await initDatabase();
      setDbInitialized(true);
      console.log('Banco de dados local inicializado');

      // CHAMADA DA SINCRONIZAÇÃO COMPLETA
      const syncResult = await SyncService.initialSync();
      console.log('Sincronização completa:', syncResult);
    } catch (error) {
      console.error('Falha ao inicializar banco local:', error);
      setDbInitialized(true);
    }
  };

  initializeLocalDB();
}, []);
useEffect(() => {
  const interval = setInterval(() => {
    SyncService.syncAllTables()
      .then((result) => console.log('Sincronização periódica:', result))
      .catch((error) => console.error('Erro na sincronização periódica:', error));
  }, 10 * 60 * 1000); // 10 minutos

  return () => clearInterval(interval);
}, []);


function AppRoutes() {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = React.useState(null);
  const [dbInitialized, setDbInitialized] = React.useState(false); // Novo estado para controle do banco local

  // Inicializa o banco de dados local
  useEffect(() => {
    const initializeLocalDB = async () => {
      try {
        await initDatabase();
        setDbInitialized(true);
        console.log('Banco de dados local inicializado');
      } catch (error) {
        console.error('Falha ao inicializar banco local:', error);
        // Mesmo com erro, continuamos o app (modo offline limitado)
        setDbInitialized(true);
      }
    };
    
    initializeLocalDB();
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          // Tenta pegar do AsyncStorage primeiro
          const storedRole = await AsyncStorage.getItem('userRole');
          if (storedRole) {
            setUserRole(parseInt(storedRole));
            return;
          }
          // Se não tiver, busca do Supabase
          const { data: funcionario, error } = await supabase
            .from('funcionario')
            .select('hierarquia_id')
            .eq('id', user.id)
            .single();

          if (funcionario && !error) {
            setUserRole(funcionario.hierarquia_id);
            await AsyncStorage.setItem('userRole', funcionario.hierarquia_id.toString());
          }
        } catch (error) {
          console.error('Erro ao carregar perfil:', error);
        }
      }
    };
    fetchUserRole();
  }, [user]);

  // Aguarda tanto o carregamento do auth quanto a inicialização do banco local
  if (loading || (user && !userRole) || !dbInitialized) {
    return <LoadingScreen />;
  }

  // Filtra as rotas protegidas conforme o papel do usuário
  const filteredProtectedRoutes = PROTECTED_ROUTES.filter(route => {
    const requiredRole = getRequiredRole(route.name);
    return userRole <= requiredRole;
  });

  return (
    <Stack.Navigator {...(user
      ? { initialRouteName: 'MenuPrincipalADM' }
      : { initialRouteName: 'Login' }
    )}>
      {user ? (
        <>
          {CADASTRO_ROUTES && CADASTRO_ROUTES.map((route) => (
            <Stack.Screen
              key={route.name}
              name={route.name}
              component={route.component}
            />
          ))}
          {filteredProtectedRoutes.map((route) => (
            <Stack.Screen
              key={route.name}
              name={route.name}
              component={route.component}
            />
          ))}
        </>
      ) : (
        <>
          {PUBLIC_ROUTES.map((route) => (
            <Stack.Screen
              key={route.name}
              name={route.name}
              component={route.component}
              options={{ headerShown: route.name !== 'Login' }}
            />
          ))}
        </>
      )}
    </Stack.Navigator>
  );
}

// Componente principal do App
export default function App() {
  return (
    <AuthProvider>
      <NomesProvider>
        <NavigationContainer>
          <AppRoutes />
        </NavigationContainer>
      </NomesProvider>
    </AuthProvider>
  );
}