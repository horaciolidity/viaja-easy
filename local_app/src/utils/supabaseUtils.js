
import { PostgrestQueryBuilder } from '@supabase/postgrest-js';

export function handleSupabaseError(context, error) {
  if (error) {
    console.error(`Error en Supabase: ${context}`, error.message);
    throw new Error(`${context}: ${error.message}`);
  }
}

const aliasRegex = /(\w+)as(\w+)/g;

function correctAliases(query) {
  if (typeof query !== 'string') {
    return query;
  }
  return query.replace(aliasRegex, (match, column, alias) => {
    const correctedAlias = alias.charAt(0).toLowerCase() + alias.slice(1);
    return `${correctedAlias}:${column}`;
  });
}

export function withSafeSelect(supabase) {
  const originalFrom = supabase.from.bind(supabase);

  supabase.from = (relation) => {
    const queryBuilder = originalFrom(relation);
    const originalSelect = queryBuilder.select.bind(queryBuilder);

    queryBuilder.select = (columns = '*', options = {}) => {
      const correctedColumns = correctAliases(columns);
      return originalSelect(correctedColumns, options);
    };

    return queryBuilder;
  };

  return supabase;
}
