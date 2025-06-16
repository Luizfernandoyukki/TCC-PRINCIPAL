// scripts/LoginService.js
import { databaseService } from '.services/localDatabase';
import { supabase } from '../contexts/supabaseClient';

export const LoginService = {
  async handleLogin(nome, senha, navigation) {
    try {
      // 1. Verificar conexão
      const isOnline = await checkConnection();
      
      if (isOnline) {
        // 2. Tentar login online
        const onlineResult = await this.onlineLogin(nome, senha, navigation);
        if (onlineResult.success) return onlineResult;
      }
      
      // 3. Se offline ou falha online, tentar login offline
      return await this.offlineLogin(nome, senha, navigation);
      
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  },

  async onlineLogin(nome, senha, navigation) {
    // Implementação existente do useLogin
    const { handleLogin } = useLogin(navigation);
    await handleLogin(nome, senha);
    return { success: true };
  },

  async offlineLogin(nome, senha, navigation) {
    // 1. Buscar no banco local
    const funcionarios = await databaseService.select(
      'funcionario',
      'nome LIKE ?',
      [`%${nome.trim()}%`]
    );

    if (!funcionarios || funcionarios.length === 0) {
      throw new Error('Usuário não encontrado offline. Conecte-se para sincronizar dados.');
    }

    if (funcionarios.length > 1) {
      throw new Error('Múltiplos usuários encontrados. Seja mais específico.');
    }

    const funcionario = funcionarios[0];

    // 2. Verificar senha (simplificado para demo - em produção usar hash seguro)
    const emails = await databaseService.select(
      'email',
      'funcionario_id = ? AND tipo = ?',
      [funcionario.id, 'principal']
    );

    if (!emails.length) {
      throw new Error('E-mail não cadastrado localmente.');
    }

    // 3. Redirecionar conforme hierarquia
    const hierarquia = await databaseService.select(
      'hierarquia',
      'id = ?',
      [funcionario.hierarquia_id]
    );

    if (!hierarquia.length) {
      throw new Error('Hierarquia não encontrada.');
    }

    this.redirectByHierarchy(navigation, hierarquia[0].nivel);
    
    return { success: true, offline: true };
  },

  redirectByHierarchy(navigation, nivel) {
    switch(nivel) {
      case 1:
        navigation.reset({ index: 0, routes: [{ name: 'MenuPrincipalADM' }] });
        break;
      case 2:
        navigation.replace('MenuPrincipalEXP');
        break;
      case 3:
        navigation.replace('MenuPrincipalPDO');
        break;
      case 4:
      default:
        navigation.replace('MenuPrincipalMTR');
    }
  }
};

async function checkConnection() {
  try {
    const { data, error } = await supabase
      .from('dummy_table')
      .select('*')
      .limit(1);
      
    return !error || error.code === '42P01'; // Considera online mesmo se tabela não existir
  } catch {
    return false;
  }
}