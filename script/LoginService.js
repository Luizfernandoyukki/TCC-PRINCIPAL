import bcrypt from 'bcryptjs';
import { supabase } from '../contexts/supabaseClient';
import { databaseService } from '../services/localDatabase';

export const LoginService = {
  async handleLogin(email, senha, navigation) {
    try {
      const isOnline = await checkConnection();

      if (isOnline) {
        const onlineResult = await this.onlineLogin(email, senha, navigation);
        if (onlineResult.success) return onlineResult;
      }

      return await this.offlineLogin(email, senha, navigation);
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Erro ao fazer login.');
    }
  },

  async onlineLogin(email, senha, navigation) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error || !data?.user) {
      throw new Error('Email ou senha incorretos.');
    }

    const userId = data.user.id;

    const { data: funcionario, error: funcionarioError } = await supabase
      .from('funcionario')
      .select('hierarquia_id')
      .eq('id', userId)
      .single();

    if (funcionarioError || !funcionario) {
      throw new Error('Funcionário não encontrado.');
    }

    this.redirectByHierarchy(navigation, funcionario.hierarquia_id);
    return { success: true };
  },

  async offlineLogin(email, senhaDigitada, navigation) {
    const funcionarios = await databaseService.select(
      'email e JOIN funcionario f ON e.funcionario_id = f.id',
      'e.email = ? AND e.tipo = ?',
      [email, 'principal']
    );

    if (!funcionarios.length) {
      throw new Error('Usuário não encontrado offline.');
    }

    const funcionario = funcionarios[0];
    const senhaCorreta = await bcrypt.compare(senhaDigitada, funcionario.senha);

    if (!senhaCorreta) {
      throw new Error('Senha incorreta (offline).');
    }

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
    switch (nivel) {
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
    const { error } = await supabase
      .from('dummy_table')
      .select('*')
      .limit(1);
    return !error || error.code === '42P01';
  } catch {
    return false;
  }
}
