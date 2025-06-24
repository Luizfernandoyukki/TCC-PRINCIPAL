import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SQLite from 'expo-sqlite'; // <-- Adicione esta linha
import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import 'react-native-url-polyfill/auto';
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

function AppRoutes() {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = React.useState(null);
  const [dbInitialized, setDbInitialized] = React.useState(false); // Novo estado para controle do banco local

  // Adicione este useEffect para definir o userRole após login
  React.useEffect(() => {
    if (user) {
      // Exemplo: supondo que user.role exista
      setUserRole(user.role || 1); // 1 = ADMIN padrão
    } else {
      setUserRole(null);
    }
  }, [user]);

  useEffect(() => {
    console.log('SQLite:', SQLite);
    console.log('SQLite.openDatabase:', SQLite.openDatabase);

    const initializeLocalDB = async () => {
      try {
        console.log('Inicializando banco de dados local...');
        await initDatabase();
        console.log('Banco de dados local inicializado com sucesso');
        setDbInitialized(true);
        
        // Verifica se há dados para sincronizar
        SyncService.syncAllTables().catch(error => {
          console.log('Sincronização inicial falhou, continuando em modo offline:', error);
        });
      } catch (error) {
        console.error('Falha ao inicializar banco local:', error);
        Alert.alert(
          'Aviso', 
          'O banco de dados local não pôde ser inicializado. Alguns recursos offline podem não estar disponíveis.'
        );
        setDbInitialized(true); // Continua mesmo com erro
      }
    };

    initializeLocalDB();

    // Sincronização periódica
    const interval = setInterval(() => {
      SyncService.syncAllTables()
        .then((result) => console.log('Sincronização periódica:', result))
        .catch((error) => console.error('Erro na sincronização periódica:', error));
    }, 10 * 60 * 1000); // 10 minutos

    return () => clearInterval(interval);
  }, []);


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