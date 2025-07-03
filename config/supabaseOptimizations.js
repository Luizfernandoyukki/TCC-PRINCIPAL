
export const supabaseOptimizations = {
  queryOptions: {
    count: 'exact',
    head: false,
    returning: 'minimal'
  },
  insertOptions: {
    returning: 'minimal',
    count: 'exact'
  },
  storageOptions: {
    cacheControl: '3600',
    upsert: false
  }
};