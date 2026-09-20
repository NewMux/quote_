import type { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('ALTER TABLE clients ADD COLUMN photo_uri TEXT');
}
