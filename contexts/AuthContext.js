// src/contexts/AuthContext.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
    
    const syncPendingOperations = async () => {
      const pendingOps = await AsyncStorage.getItem('pendingAuthOps');
      if (pendingOps && isOnline) {
        try {
          const ops = JSON.parse(pendingOps);
          // Processar operações pendentes
          await AsyncStorage.removeItem('pendingAuthOps');
        } catch (error) {
          console.error('Erro ao sincronizar operações:', error);
        }
      }
    };

    // Chame sempre que a conexão for restabelecida
    useEffect(() => {
      if (isOnline) syncPendingOperations();
    }, [isOnline]);

    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
      const checkConnection = async () => {
        const online = await checkSupabaseConnection();
        setIsOnline(online);
      };
      
      checkConnection();
    }, []);

    const signUp = async (email, password, userData) => {
    try {
      setLoading(true);
      
      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome: userData.nome,
            cpf: userData.CPF
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Falha ao criar usuário');

      // 2. Criar perfil no banco de dados
      const { error: profileError } = await supabase
        .from('funcionario')
        .insert({
          id: authData.user.id,
          ...userData
        });

      if (profileError) throw profileError;

      return authData.user;
    } catch (error) {
      console.error('Erro no cadastro:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Adicione ao value do Provider
  return (
    <AuthContext.Provider value={{
      user,
      userRole,
      loading,
      login,
      logout,
      signUp // Nova função exposta
    }}>
      {children}
    </AuthContext.Provider>
  );
  }, []);

  const loadUserProfile = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('funcionario')
        .select('hierarquia_id')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (!profile) throw new Error('Perfil não encontrado');

      setUserRole(profile.hierarquia_id);
      await AsyncStorage.setItem('userRole', profile.hierarquia_id.toString());
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setUserRole(4); // Define como motorista se ocorrer erro
    }
  };

  const handleLogout = async () => {
    setUser(null);
    setUserRole(null);
    await AsyncStorage.removeItem('userRole');
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      await handleLogout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userRole,
      loading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};