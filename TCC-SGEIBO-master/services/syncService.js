import { databaseService } from './localDatabase';
import { supabase } from './supabaseClient';

const SyncService = {
  // Sincronização básica (download from Supabase)
  async syncTable(tableName, columns = '*', filter = '') {
    try {
      // 1. Obter data da última sincronização
      const lastSync = await databaseService.getLastSync(tableName);
      
      // 2. Buscar dados atualizados do Supabase
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

      // 3. Atualizar banco local
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

  // Sincronizar todas as tabelas importantes
  async syncAllTables() {
    const tables = ['funcionario', 'cliente', 'estoque', 'pedido'];
    const results = {};

    for (const table of tables) {
      results[table] = await this.fullSync(table);
    }

    return results;
  },

  // Sincronização inicial do app
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