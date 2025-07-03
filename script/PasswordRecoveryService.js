import { databaseService } from '../services/localDatabase';
import { SyncService } from '../services/syncService';

export const PasswordRecoveryService = {
  async requestPasswordReset({ nomeCompleto, cpf, dataNascimento }) {
    const funcionarios = await databaseService.select(
      'funcionario',
      'nome = ? AND cpf = ?',
      [nomeCompleto, cpf.replace(/\D/g, '')]
    );

    if (!funcionarios.length) {
      throw new Error('Dados não conferem. Verifique ou conecte-se para sincronizar.');
    }

    const funcionario = funcionarios[0];

    const dbDate = new Date(funcionario.data_nascimento);
    const inputDate = new Date(
      dataNascimento.split('/')[2],
      dataNascimento.split('/')[1] - 1,
      dataNascimento.split('/')[0]
    );

    if (dbDate.getTime() !== inputDate.getTime()) {
      throw new Error('Data de nascimento não confere.');
    }

    const token = Math.random().toString(36).substring(2, 8).toUpperCase();
    await databaseService.insert('password_reset_tokens', {
      funcionario_id: funcionario.id,
      token,
      expires_at: new Date(Date.now() + 3600000).toISOString() 
    });

    return { 
      success: true,
      message: 'Solicitação registrada localmente. Conecte-se para concluir.',
      token
    };
  },

  async completePasswordReset(token, novaSenha) {
    const tokens = await databaseService.select(
      'password_reset_tokens',
      'token = ? AND expires_at > ?',
      [token, new Date().toISOString()]
    );

    if (!tokens.length) {
      throw new Error('Token inválido ou expirado.');
    }

    const tokenRecord = tokens[0];

    await databaseService.update(
      'funcionario',
      { senha: novaSenha },
      'id = ?',
      [tokenRecord.funcionario_id]
    );

    await databaseService.delete(
      'password_reset_tokens',
      'token = ?',
      [token]
    );

    SyncService.syncTable('funcionario');
    
    return { success: true };
  }
};