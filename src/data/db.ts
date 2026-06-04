import * as SQLite from 'expo-sqlite';

/**
 * SQLite setup + schema. High-volume chat messages are normalized into their own
 * table; low-volume JSON blobs (diary sentences, canvas layout) are stored as TEXT.
 *
 * The repository layer (src/data/repositories) is the only place that touches this db,
 * so swapping to a remote backend (e.g. Supabase) later means re-implementing the
 * repositories, not the rest of the app.
 */

const DB_NAME = 'maumdiary.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await migrate(db);
      return db;
    });
  }
  return dbPromise;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id          TEXT PRIMARY KEY NOT NULL,
      personaId   TEXT NOT NULL,
      title       TEXT NOT NULL,
      createdAt   INTEGER NOT NULL,
      updatedAt   INTEGER NOT NULL,
      diaryId     TEXT
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id          TEXT PRIMARY KEY NOT NULL,
      sessionId   TEXT NOT NULL,
      role        TEXT NOT NULL,
      content     TEXT NOT NULL,
      createdAt   INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_messages_session
      ON chat_messages (sessionId, createdAt);

    CREATE TABLE IF NOT EXISTS diaries (
      id            TEXT PRIMARY KEY NOT NULL,
      sessionId     TEXT NOT NULL,
      personaId     TEXT NOT NULL,
      style         TEXT NOT NULL,
      title         TEXT NOT NULL,
      sentences     TEXT NOT NULL,   -- JSON: DiarySentence[]
      rawSummary    TEXT NOT NULL,
      mood          TEXT,
      coverImageUri TEXT,
      visibility    TEXT NOT NULL DEFAULT 'private',
      createdAt     INTEGER NOT NULL,
      updatedAt     INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_diaries_created
      ON diaries (createdAt DESC);

    CREATE TABLE IF NOT EXISTS diary_layouts (
      id            TEXT PRIMARY KEY NOT NULL,
      diaryId       TEXT NOT NULL UNIQUE,
      canvasWidth   REAL NOT NULL,
      canvasHeight  REAL NOT NULL,
      background    TEXT NOT NULL,   -- JSON: DiaryBackground
      elements      TEXT NOT NULL,   -- JSON: CanvasElement[]
      updatedAt     INTEGER NOT NULL
    );
  `);
}

/** Drop everything — used by the "reset" action in settings (dev/testing aid). */
export async function resetDb(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    DROP TABLE IF EXISTS diary_layouts;
    DROP TABLE IF EXISTS diaries;
    DROP TABLE IF EXISTS chat_messages;
    DROP TABLE IF EXISTS chat_sessions;
  `);
  dbPromise = null;
  await getDb();
}
