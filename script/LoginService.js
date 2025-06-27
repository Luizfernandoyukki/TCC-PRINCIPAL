import bcrypt from 'bcryptjs';
import { supabase } from '../contexts/supabaseClient';
import { databaseService } from '../services/localDatabase';

export const LoginService = {
  async handleLogin(email, senha, navigation) {
    try {
      const isOnline = await checkConnection();

      if (isOnline) {
        try {
          const onlineResult = await this.onlineLogin(email, senha);
          this.redirectByHierarchy(navigation, onlineResult.hierarchyLevel);
          return { ...onlineResult, isOnline: true };
        } catch (onlineError) {
          console.log('Login online falhou, tentando offline:', onlineError.message);
        }
      }

      try {
        const offlineResult = await this.offlineLogin(email, senha);
        this.redirectByHierarchy(navigation, offlineResult.hierarchyLevel);
        return { ...offlineResult, isOnline: false };
      } catch (offlineError) {
        console.error('Erro no login offline:', offlineError);
        this.redirectToLoginScreen(navigation, offlineError.message);
        throw offlineError;
      }
    } catch (error) {
      console.error('Erro geral no login:', error);
      this.redirectToLoginScreen(navigation, error.message);
      throw error;
    }
  },

  async onlineLogin(email, senha) {
    // 1. Autenticação no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (authError || !authData?.user) {
      throw new Error(authError?.message || 'Credenciais inválidas');
    }

    const userId = authData.user.id;

    // 2. Busca informações do funcionário
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
      throw new Error('Perfil de funcionário não encontrado no banco de dados');
    }

    // 3. Verifica se o funcionário tem hierarquia válida
    if (!funcionario.hierarquia || !funcionario.hierarquia.nivel) {
      throw new Error('Nível de hierarquia não definido para o funcionário');
    }

    return {
      success: true,
      userId,
      hierarchyLevel: funcionario.hierarquia.nivel
    };
  },

  async offlineLogin(email, senhaDigitada) {
    try {
      // 1. Busca o funcionário no banco local
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
        throw new Error('Usuário não encontrado no banco de dados local');
      }

      const funcionario = result.rows._array[0];
      
      // 2. Verificação de senha
      const senhaCorreta = await bcrypt.compare(senhaDigitada, funcionario.senha);
      if (!senhaCorreta) {
        throw new Error('Senha incorreta');
      }

      // 3. Verifica hierarquia
      if (!funcionario.hierarquia_nivel) {
        throw new Error('Nível de hierarquia não definido');
      }

      return {
        success: true,
        userId: funcionario.id,
        hierarchyLevel: funcionario.hierarquia_nivel,
        isOffline: true
      };

    } catch (error) {
      console.error('Erro no login offline:', error);
      throw new Error(error.message || 'Falha no login offline');
    }
  },

  redirectByHierarchy(navigation, nivel) {
    const routesMap = {
      1: 'MenuPrincipalADM',  // ADMIN
      2: 'MenuPrincipalEXP',  // EXPEDICAO
      3: 'MenuPrincipalPDO',  // PRODUCAO
      4: 'MenuPrincipalMTR'   // MOTORISTA
    };

    const targetRoute = routesMap[nivel] || 'Login';
    
    if (navigation?.reset) {
      navigation.reset({
        index: 0,
        routes: [{ name: targetRoute }]
      });
    } else {
      console.error('Navegação não disponível para redirecionamento');
    }
  },

  redirectToLoginScreen(navigation, errorMessage = '') {
    if (navigation?.navigate) {
      navigation.navigate('Login', { 
        error: errorMessage || 'Erro durante o login' 
      });
    } else {
      console.error('Navegação não disponível para redirecionar para login');
    }
  }
};

async function checkConnection() {
  try {
    // Verificação mais robusta de conexão
    const { error } = await supabase
      .from('funcionario')
      .select('id')
      .limit(1)
      .single();

    return !error;
  } catch (error) {
    console.log('Verificação de conexão falhou:', error);
    return false;
  }
}