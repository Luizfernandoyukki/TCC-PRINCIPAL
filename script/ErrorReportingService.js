// scripts/ErrorReportingService.js
import { databaseService } from '.services/localDatabase';
import { SyncService } from '.services/syncService';

export const ErrorReportingService = {
  async reportError(errorData) {
    // Salvar localmente
    const errorId = await databaseService.insertWithUUID('error_reports', {
      ...errorData,
      status: 'pending',
      created_at: new Date().toISOString()
    });

    // Tentar sincronizar imediatamente
    await SyncService.syncTable('error_reports');
    
    return errorId;
  },

  async getPendingReports() {
    return databaseService.select(
      'error_reports',
      'status = ?',
      ['pending']
    );
  }
};