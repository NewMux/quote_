import type { SQLiteDatabase } from 'expo-sqlite';
import { up as migration001 } from './migrations/001_init';

const MIGRATIONS: Array<(db: SQLiteDatabase) => Promise<void>> = [migration001];

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = row?.user_version ?? 0;

  for (let version = currentVersion + 1; version <= MIGRATIONS.length; version++) {
    const step = MIGRATIONS[version - 1];
    await step(db);
    await db.execAsync(`PRAGMA user_version = ${version}`);
    currentVersion = version;
  }
}
