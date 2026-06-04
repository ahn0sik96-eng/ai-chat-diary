import { ChatMessage, ChatSession, PersonaId } from '@/types';
import { now, uid } from '@/utils/id';
import { getDb } from '../db';

interface SessionRow {
  id: string;
  personaId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  diaryId: string | null;
}

interface MessageRow {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  createdAt: number;
}

function toSession(r: SessionRow): ChatSession {
  return {
    id: r.id,
    personaId: r.personaId as PersonaId,
    title: r.title,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    diaryId: r.diaryId ?? undefined,
  };
}

export const ChatRepository = {
  async createSession(personaId: PersonaId, title = '새 대화'): Promise<ChatSession> {
    const db = await getDb();
    const ts = now();
    const session: ChatSession = {
      id: uid(),
      personaId,
      title,
      createdAt: ts,
      updatedAt: ts,
    };
    await db.runAsync(
      `INSERT INTO chat_sessions (id, personaId, title, createdAt, updatedAt, diaryId)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [session.id, session.personaId, session.title, session.createdAt, session.updatedAt, null],
    );
    return session;
  },

  async listSessions(): Promise<ChatSession[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<SessionRow>(
      `SELECT * FROM chat_sessions ORDER BY updatedAt DESC`,
    );
    return rows.map(toSession);
  },

  async getSession(id: string): Promise<ChatSession | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<SessionRow>(
      `SELECT * FROM chat_sessions WHERE id = ?`,
      [id],
    );
    return row ? toSession(row) : null;
  },

  async touchSession(id: string, title?: string): Promise<void> {
    const db = await getDb();
    if (title !== undefined) {
      await db.runAsync(`UPDATE chat_sessions SET updatedAt = ?, title = ? WHERE id = ?`, [
        now(),
        title,
        id,
      ]);
    } else {
      await db.runAsync(`UPDATE chat_sessions SET updatedAt = ? WHERE id = ?`, [now(), id]);
    }
  },

  async setSessionDiary(sessionId: string, diaryId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(`UPDATE chat_sessions SET diaryId = ?, updatedAt = ? WHERE id = ?`, [
      diaryId,
      now(),
      sessionId,
    ]);
  },

  async deleteSession(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM chat_messages WHERE sessionId = ?`, [id]);
    await db.runAsync(`DELETE FROM chat_sessions WHERE id = ?`, [id]);
  },

  async addMessage(
    sessionId: string,
    role: ChatMessage['role'],
    content: string,
  ): Promise<ChatMessage> {
    const db = await getDb();
    const msg: ChatMessage = {
      id: uid(),
      sessionId,
      role,
      content,
      createdAt: now(),
    };
    await db.runAsync(
      `INSERT INTO chat_messages (id, sessionId, role, content, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [msg.id, msg.sessionId, msg.role, msg.content, msg.createdAt],
    );
    await this.touchSession(sessionId);
    return msg;
  },

  async listMessages(sessionId: string): Promise<ChatMessage[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<MessageRow>(
      `SELECT * FROM chat_messages WHERE sessionId = ? ORDER BY createdAt ASC`,
      [sessionId],
    );
    return rows.map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      role: r.role as ChatMessage['role'],
      content: r.content,
      createdAt: r.createdAt,
    }));
  },
};
