import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export interface DeviceCalendarEvent {
  id: string;
  title: string;
  startDate: string; // ISO
  endDate: string;   // ISO
  allDay: boolean;
}

export async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

export async function getDeviceCalendarEvents(date: Date): Promise<DeviceCalendarEvent[]> {
  try {
    const granted = await requestCalendarPermission();
    if (!granted) return [];

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    if (calendars.length === 0) return [];

    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    const ids = calendars.map((c) => c.id);
    const events = await Calendar.getEventsAsync(ids, start, end);

    return events.map((e) => ({
      id: e.id,
      title: e.title,
      startDate: new Date(e.startDate).toISOString(),
      endDate: new Date(e.endDate).toISOString(),
      allDay: e.allDay,
    }));
  } catch {
    return [];
  }
}

export async function addEventToDeviceCalendar(
  title: string,
  date: string,
  time?: string
): Promise<boolean> {
  try {
    const granted = await requestCalendarPermission();
    if (!granted) return false;

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const writable = calendars.find((c) => c.allowsModifications) ?? calendars[0];
    if (!writable) return false;

    const startDate = new Date(`${date}T${time ?? '09:00'}:00`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    await Calendar.createEventAsync(writable.id, {
      title,
      startDate,
      endDate,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    return true;
  } catch {
    return false;
  }
}

export function formatEventTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
