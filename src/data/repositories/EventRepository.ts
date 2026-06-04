import { CalendarEvent } from '@/types';
import { now, uid } from '@/utils/id';
import { getDb } from '../db';

interface EventRow {
  id: string;
  title: string;
  date: string;
  sessionId: string | null;
  createdAt: number;
}

function toEvent(r: EventRow): CalendarEvent {
  return {
    id: r.id,
    title: r.title,
    date: r.date,
    sessionId: r.sessionId ?? undefined,
    createdAt: r.createdAt,
  };
}

export const EventRepository = {
  async list(): Promise<CalendarEvent[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<EventRow>(
      `SELECT * FROM calendar_events ORDER BY date ASC`,
    );
    return rows.map(toEvent);
  },

  async add(input: { title: string; date: string; sessionId?: string }): Promise<CalendarEvent> {
    const db = await getDb();
    const ev: CalendarEvent = {
      id: uid(),
      title: input.title,
      date: input.date,
      sessionId: input.sessionId,
      createdAt: now(),
    };
    await db.runAsync(
      `INSERT INTO calendar_events (id, title, date, sessionId, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [ev.id, ev.title, ev.date, ev.sessionId ?? null, ev.createdAt],
    );
    return ev;
  },

  /** True if an event with the same date + title already exists (avoids duplicates). */
  async exists(date: string, title: string): Promise<boolean> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ c: number }>(
      `SELECT COUNT(*) as c FROM calendar_events WHERE date = ? AND title = ?`,
      [date, title],
    );
    return (row?.c ?? 0) > 0;
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM calendar_events WHERE id = ?`, [id]);
  },
};
