import { supabase } from '../contexts/supabaseClient';
import { databaseService, initDatabase } from './localDatabase';

const SyncService = {
  async checkSupabaseConnection() {
    try {
      const { error } = await supabase
        .from('funcionario')
        .select('id')
        .limit(1);
      return !error;
    } catch {
      return false;
    }
  },

  // Normaliza dados entre Supabase e SQLite
  normalizeData(tableName, data) {
    if (!data) return data;

    // Converter tipos específicos
    if (tableName === 'funcionario') {
      return {
        ...data,
        is_admin: data.is_admin ? 1 : 0,
        is_superior: data.is_superior ? 1 : 0
      };
    }

    if (tableName === 'estoque') {
      return {
        ...data,
        disponivel_geral: data.disponivel_geral ? 1 : 0
      };
    }

    if (['pedido', 'entrega', 'entrada', 'saida'].includes(tableName)) {
      return {
        ...data,
        nota: data.nota ? 1 : 0
      };
    }

    return data;
  },

  // Sincroniza uma tabela específica
  async syncTable(tableName, batchSize = 100) {
    try {
      const isOnline = await this.checkSupabaseConnection();
      if (!isOnline) {
        console.log(`Modo offline - não sincronizando tabela ${tableName}`);
        return { success: false, offline: true };
      }

      // 1. Obter última data de sincronização
      const lastSync = await databaseService.getLastSync(tableName);
      console.log(`Última sincronização para ${tableName}: ${lastSync}`);

      // 2. Baixar dados do Supabase
      let query = supabase.from(tableName).select('*');
      if (lastSync) {
        query = query.gt('updated_at', lastSync);
      }

      const { data: supabaseData, error } = await query;
      if (error) throw error;

      // 3. Processar em lotes para evitar problemas de memória
      const batches = [];
      for (let i = 0; i < supabaseData.length; i += batchSize) {
        batches.push(supabaseData.slice(i, i + batchSize));
      }

      // 4. Atualizar banco local com os dados do Supabase
      for (const batch of batches) {
        await databaseService.transaction(
          batch.map(item => {
            const normalizedItem = this.normalizeData(tableName, {
              ...item,
              last_sync: new Date().toISOString()
            });

            return {
              sql: `
                INSERT OR REPLACE INTO ${tableName} 
                (${Object.keys(normalizedItem).join(', ')})
                VALUES (${Object.keys(normalizedItem).map(() => '?').join(', ')})
              `,
              params: Object.values(normalizedItem)
            };
          })
        );
      }

      // 5. Enviar alterações locais para o Supabase
      const unsyncedLocal = await databaseService.getUnsyncedRecords(tableName);
      console.log(`Registros locais não sincronizados: ${unsyncedLocal.length}`);

      for (const batch of this.chunkArray(unsyncedLocal, batchSize)) {
        const { error: upsertError } = await supabase
          .from(tableName)
          .upsert(batch.map(item => this.normalizeData(tableName, item)));

        if (!upsertError) {
          await databaseService.transaction(
            batch.map(item => ({
              sql: `UPDATE ${tableName} SET last_sync = ? WHERE id = ?`,
              params: [new Date().toISOString(), item.id]
            }))
          );
        }
      }

      return {
        success: true,
        table: tableName,
        downloaded: supabaseData.length,
        uploaded: unsyncedLocal.length,
        lastSync: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Erro na sincronização da tabela ${tableName}:`, error);
      return { success: false, error: error.message };
    }
  },

  // Sincronização completa para todas as tabelas
  async fullSync() {
    try {
      await initDatabase();
      
      // Ordem de sincronização importante devido às relações de chave estrangeira
      const tables = [
        'genero',
        'hierarquia',
        'funcao',
        'endereco',
        'telefone',
        'email',
        'veiculo',
        'funcionario',
        'cliente',
        'estoque',
        'rota',
        'pedido',
        'entrada',
        'saida',
        'entrega',
        'devolucao',
        'error_reports'
      ];

      const results = {};
      for (const table of tables) {
        if (await databaseService.tableExists(table)) {
          results[table] = await this.syncTable(table);
        } else {
          console.warn(`Tabela ${table} não existe no banco local`);
          results[table] = { success: false, error: 'Tabela não existe localmente' };
        }
      }

      return results;
    } catch (error) {
      console.error('Erro na sincronização completa:', error);
      throw error;
    }
  },

  // Sincronização incremental (apenas tabelas modificadas)
  async incrementalSync() {
    try {
      const tables = await databaseService.executeQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      const results = {};
      for (const table of tables.rows) {
        const tableName = table.name;
        if (!['sqlite_sequence'].includes(tableName)) {
          results[tableName] = await this.syncTable(tableName);
        }
      }

      return results;
    } catch (error) {
      console.error('Erro na sincronização incremental:', error);
      throw error;
    }
  },

  // Utilitário para dividir arrays em chunks
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  // Resolução de conflitos (última modificação vence)
  async resolveConflicts(tableName) {
    try {
      // Obter registros com conflitos (onde updated_at > last_sync)
      const conflictedRecords = await databaseService.getUnsyncedRecords(tableName);
      
      for (const record of conflictedRecords) {
        // Obter versão mais recente do Supabase
        const { data: supabaseRecord, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', record.id)
          .single();

        if (!error && supabaseRecord) {
          // Se o registro do Supabase for mais recente, sobrescrever local
          if (new Date(supabaseRecord.updated_at) > new Date(record.updated_at)) {
            await databaseService.update(
              tableName,
              this.normalizeData(tableName, {
                ...supabaseRecord,
                last_sync: new Date().toISOString()
              }),
              'id = ?',
              [record.id]
            );
          } else {
            // Se o registro local for mais recente, enviar para o Supabase
            await supabase
              .from(tableName)
              .upsert(this.normalizeData(tableName, record));
              
            await databaseService.update(
              tableName,
              { last_sync: new Date().toISOString() },
              'id = ?',
              [record.id]
            );
          }
        }
      }

      return { success: true, resolved: conflictedRecords.length };
    } catch (error) {
      console.error(`Erro na resolução de conflitos para ${tableName}:`, error);
      return { success: false, error };
    }
  }
};

export default SyncService;