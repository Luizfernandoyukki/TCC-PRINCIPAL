import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import 'react-native-url-polyfill/auto';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NomesProvider } from './contexts/NomesContext';
import {
  CADASTRO_ROUTES,
  getRequiredRole,
  PROTECTED_ROUTES,
  PUBLIC_ROUTES
} from './routes';
import { databaseService, initDatabase } from './services/localDatabase';
import SyncService from './services/syncService';

const Stack = createNativeStackNavigator();


const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" />
  </View>
);

 
function AppRoutes() {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = React.useState(null);
  const [dbInitialized, setDbInitialized] = React.useState(false); 

    
    React.useEffect(() => {
    if (user) {
      setUserRole(user.hierarquia_nivel || 1); 
    } else {
      setUserRole(null);
    }
  }, [user]);

  useEffect(() => {
  const initializeApp = async () => {
    try {
      await initDatabase();
      
      const tables = await databaseService.executeQuery(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      console.log('Tabelas criadas:', tables.rows._array);
      
      setDbInitialized(true);
    } catch (error) {
      console.error('Falha na inicialização:', error);
      Alert.alert('Erro', 'Banco de dados não inicializado');
    }
  };

  initializeApp();
    const interval = setInterval(() => {
      SyncService.syncAllTables()
        .then((result) => console.log('Sincronização periódica:', result))
        .catch((error) => console.error('Erro na sincronização periódica:', error));
    }, 10 * 60 * 1000); 

    return () => clearInterval(interval);
  }, []);


  
  const filteredProtectedRoutes = PROTECTED_ROUTES.filter(route => {
    const requiredRole = getRequiredRole(route.name);
    return userRole <= requiredRole;
  });

  return (
    <Stack.Navigator>
      {user ? (
        <>
        {filteredProtectedRoutes.map((route) => (
            <Stack.Screen
              key={route.name}
              name={route.name}
              component={route.component}
            />
          ))}
          {CADASTRO_ROUTES && CADASTRO_ROUTES.map((route) => (
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