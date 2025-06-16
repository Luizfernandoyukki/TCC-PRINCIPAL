import { supabase } from '../contexts/supabaseClient';
import { databaseService, initDatabase } from './localDatabase';

const SyncService = {
  // Função para verificar conexão com Supabase
  async checkSupabaseConnection() {
    try {
      const { error } = await supabase
        .from('funcionario')
        .select('*')
        .limit(1);
        
      return !error; // Retorna true se não houver erro
    } catch {
      return false;
    }
  },

  // Sincronização básica (download from Supabase) com verificação de conexão
  async syncTable(tableName, columns = '*', filter = '') {
    try {
      // 1. Verificar se está online
      const isOnline = await this.checkSupabaseConnection();
      if (!isOnline) {
        console.log(`Modo offline - não sincronizando tabela ${tableName}`);
        return { success: false, offline: true };
      }
      
      // 2. Obter data da última sincronização
      const lastSync = await databaseService.getLastSync(tableName);
      
      // 3. Buscar dados atualizados do Supabase
      let query = supabase
        .from(tableName)
        .select(columns);

      if (lastSync) {
        query = query.gt('updated_at', lastSync);
      }

      if (filter) {
        query = query.filter(filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // 4. Atualizar banco local
      for (const item of data) {
        const existing = await databaseService.select(
          tableName,
          'id = ?',
          [item.id]
        );

        const record = {
          ...item,
          last_sync: new Date().toISOString()
        };

        if (existing.length > 0) {
          await databaseService.update(
            tableName,
            record,
            'id = ?',
            [item.id]
          );
        } else {
          await databaseService.insert(tableName, record);
        }
      }

      return {
        success: true,
        table: tableName,
        count: data.length,
        lastSync: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Sync error for table ${tableName}:`, error);
      return { success: false, error };
    }
  },

  // Sincronização bidirecional completa
 async fullSync(tableName) {
    try {
      // 1. Download from Supabase
      const downloadResult = await this.syncTable(tableName);
      
      if (!downloadResult.success) {
        throw downloadResult.error;
      }

      // 2. Upload local changes
      const localChanges = await databaseService.select(
        tableName,
        'last_sync IS NULL OR updated_at > last_sync'
      );

      for (const item of localChanges) {
        const { error } = await supabase
          .from(tableName)
          .upsert(item);

        if (!error) {
          await databaseService.update(
            tableName,
            { last_sync: new Date().toISOString() },
            'id = ?',
            [item.id]
          );
        }
      }

      return {
        success: true,
        downloaded: downloadResult.count,
        uploaded: localChanges.length
      };
    } catch (error) {
      console.error(`Full sync error for ${tableName}:`, error);
      return { success: false, error };
    }
  },

  async syncAllTables() {
    const tables = ['funcionario', 'cliente', 'estoque', 'pedido'];
    const results = {};

    for (const table of tables) {
      results[table] = await this.fullSync(table);
    }

    return results;
  },

  async initialSync() {
    try {
      await initDatabase();
      return await this.syncAllTables();
    } catch (error) {
      console.error('Initial sync failed:', error);
      throw error;
    }
  }
};

export default SyncService;