import { databaseService } from '../services/localDatabase';
import { SyncService } from '../services/syncService';

export const ErrorReportingService = {
  async reportError(errorData) {
    const errorId = await databaseService.insertWithUUID('error_reports', {
      ...errorData,
      status: 'pending',
      created_at: new Date().toISOString()
    });

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