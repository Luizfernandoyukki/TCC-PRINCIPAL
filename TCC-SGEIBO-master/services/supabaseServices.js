import { supabase } from '../contexts/supabaseClient';

export const batchInsert = async (table, data, batchSize = 50) => {
  const batches = [];
  for (let i = 0; i < data.length; i += batchSize) {
    batches.push(data.slice(i, i + batchSize));
  }
  
  for (const batch of batches) {
    const { error } = await supabase.from(table).insert(batch);
    if (error) throw error;
  }
};