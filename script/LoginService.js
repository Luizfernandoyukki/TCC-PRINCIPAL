import bcrypt from 'bcryptjs';
import { supabase } from '../contexts/supabaseClient';
import { databaseService } from '../services/localDatabase';

export const LoginService = {
  async handleLogin(email, senha, navigation) {
    try {
      const isOnline = await checkConnection();

      if (isOnline) {
        console.log('[LoginService] Conectado à internet. Tentando login online...');
        try {
          const onlineResult = await this.onlineLogin(email, senha);
          this.redirectByHierarchy(navigation, onlineResult.hierarchyLevel);
          return { ...onlineResult, isOnline: true };
        } catch (onlineError) {
          console.error('[LoginService] Erro no login online:', onlineError.message);
          throw new Error(onlineError.message || 'Erro ao fazer login online');
        }
      } else {
        console.warn('[LoginService] Sem internet. Tentando login offline...');
        const offlineResult = await this.offlineLogin(email, senha);
        this.redirectByHierarchy(navigation, offlineResult.hierarchyLevel);
        return { ...offlineResult, isOnline: false };
      }
    } catch (error) {
      console.error('[LoginService] Falha no login:', error);
      this.redirectToLoginScreen(navigation, error.message || 'Erro ao realizar login');
      throw error;
    }
  },

  async onlineLogin(email, senha) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (authError || !authData?.user) {
      throw new Error(authError?.message || 'Credenciais inválidas');
    }

    const userId = authData.user.id;

    const { data: funcionario, error: funcionarioError } = await supabase
      .from('funcionario')
      .select(`
        id,
        hierarquia_id,
        hierarquia:nivel
      `)
      .eq('id', userId)
      .single();

    if (funcionarioError || !funcionario) {
      throw new Error('Perfil de funcionário não encontrado no banco de dados online');
    }

    if (!funcionario.hierarquia || !funcionario.hierarquia.nivel) {
      throw new Error('Nível de hierarquia não definido');
    }

    return {
      success: true,
      userId,
      hierarchyLevel: funcionario.hierarquia.nivel
    };
  },

  async offlineLogin(email, senhaDigitada) {
    const query = `
      SELECT 
        f.id, 
        f.nome, 
        f.senha, 
        f.hierarquia_id,
        h.nivel as hierarquia_nivel
      FROM funcionario f
      JOIN hierarquia h ON f.hierarquia_id = h.id
      JOIN email e ON e.funcionario_id = f.id
      WHERE e.email = ? AND e.tipo = ?
    `;

    const result = await databaseService.executeQuery(query, [email, 'principal']);

    if (!result.rows || result.rows.length === 0) {
      throw new Error('Usuário não encontrado no banco local');
    }

    const funcionario = result.rows._array[0];

    const senhaCorreta = await bcrypt.compare(senhaDigitada, funcionario.senha);
    if (!senhaCorreta) {
      throw new Error('Senha incorreta');
    }

    if (!funcionario.hierarquia_nivel) {
      throw new Error('Nível de hierarquia indefinido');
    }

    return {
      success: true,
      userId: funcionario.id,
      hierarchyLevel: funcionario.hierarquia_nivel,
      isOffline: true
    };
  },

  redirectByHierarchy(navigation, nivel) {
    const routesMap = {
      1: 'MenuPrincipalADM',
      2: 'MenuPrincipalEXP',
      3: 'MenuPrincipalPDO',
      4: 'MenuPrincipalMTR'
    };

    const targetRoute = routesMap[nivel] || 'Login';

    if (navigation?.reset) {
      navigation.reset({
        index: 0,
        routes: [{ name: targetRoute }]
      });
    } else {
      console.error('[LoginService] Navigation reset não disponível');
    }
  },

  redirectToLoginScreen(navigation, errorMessage = '') {
    if (navigation?.navigate) {
      navigation.navigate('Login', {
        error: errorMessage || 'Erro ao fazer login'
      });
    } else {
      console.error('[LoginService] Navigation.navigate não disponível');
    }
  }
};

// Verifica se há internet funcional com Supabase
async function checkConnection() {
  try {
    const { error } = await supabase
      .from('funcionario')
      .select('id')
      .limit(1)
      .single();
    return !error;
  } catch (error) {
    console.error('[LoginService] Falha ao verificar conexão com Supabase:', error);
    return false;
  }
}
