import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';

// Custom storage adapter para o Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

const SUPABASE_CONFIG = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fvnunimmhlabeppyqshx.supabase.co',
  key: process.env.EXPO_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bnVuaW1taGxhYmVwcHlxc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTg0NjIsImV4cCI6MjA2NTQzNDQ2Mn0.1i3Xzfm00I_kINNc2eKZxUM6YGtt6QBNRf2z6yvrlCM',
  options: {
    auth: {
      storage: ExpoSecureStoreAdapter,
      persistSession: true, // Alterado para true
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
      debug: __DEV__,
    },
    global: {
      headers: {
        'X-Client-Info': 'expo-cli',
      },
    },
  },
};


if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.key) {
  throw new Error('Supabase URL and Key são obrigatórios');
}


export const supabase = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.key,
  SUPABASE_CONFIG.options
);

// Helper para verificar conexão
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('dummy_table')
      .select('*')
      .limit(1);
      
    if (error && error.code !== '42P01') { // Ignora erro de tabela não existente
      throw error;
    }
    return true;
  } catch (error) {
    console.error('Erro na conexão com Supabase:', error.message);
    return false;
  }
};

// Contexto para o serviço Supabase
export const SupabaseService = {
  client: supabase,
  checkConnection: checkSupabaseConnection,
};