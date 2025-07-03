import { SUPABASE_KEY, SUPABASE_URL } from '@env'; // Importa do .env
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';

const ExpoSecureStoreAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('As variáveis SUPABASE_URL e SUPABASE_KEY devem estar definidas no .env');
}


const SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  key: SUPABASE_KEY,
  options: {
    auth: {
      storage: ExpoSecureStoreAdapter,
      persistSession: true, 
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


export const supabase = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.key,
  SUPABASE_CONFIG.options
);


export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase
      .from('dummy_table') // tabela qualquer, só pra teste
      .select('*')
      .limit(1);

    // Ignora erro de tabela inexistente
    if (error && error.code !== '42P01') {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Erro na conexão com Supabase:', error.message);
    return false;
  }
};


export const SupabaseService = {
  client: supabase,
  checkConnection: checkSupabaseConnection,
};
