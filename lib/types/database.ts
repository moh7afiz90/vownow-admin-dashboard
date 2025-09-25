// Re-export the database types for convenience
export type { Database, Tables, TablesInsert, TablesUpdate } from './database.types';

// Fallback type if database.types is not available
export interface Database {
  public: {
    Tables: Record<string, unknown>;
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
}