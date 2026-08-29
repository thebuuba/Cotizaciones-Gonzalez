import type { AppDatabase } from './database'

export async function seedDevelopmentDatabase(database: AppDatabase): Promise<void> {
  if (!import.meta.env.DEV) return
  void database
}
