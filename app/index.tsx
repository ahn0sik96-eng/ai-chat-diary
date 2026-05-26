import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import CalendarView from '../components/CalendarView';
import {
  DiaryEntry, ScheduleEvent, Reminder,
  loadDiaryEntries, loadSchedules, loadReminders,
  toggleReminder, deleteSchedule, deleteReminder,
} from '../utils/storage';
import { PERSONAS, PersonaId, DEFAULT_PERSONA_ID } from '../constants/personas';
import { Colors, Radius, Spacing, FontSize } from '../constants/theme';
import { setupNotifications } from '../utils/notifications';

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const [selectedPersona, setSelectedPersona] = useState<PersonaId>(DEFAULT_PERSONA_ID);
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadDiaryEntries(), loadSchedules(), loadReminders()])
        .then(([d, s, r]) => { setDiaries(d); setSchedules(s); setReminders(r); });
    }, [])
  );

  useEffect(() => { setupNotifications(); }, []);

  const markedDates = useMemo(() => {
    const map: Record<string, { color: string }[]> = {};
    for (const entry of diaries) {
      const ds = entry.created_at.slice(0, 10);
      const p = PERSONAS.find((x) => x.id === entry.persona_id);
      if (!map[ds]) map[ds] = [];
      map[ds].push({ color: p?.accentColor ?? Colors.peach });
    }
    for (const event of schedules) {
      if (!map[event.date]) map[event.date] = [];
      map[event.date].push({ color: '#5C7AE0' });
    }
    for (const reminder of reminders) {
      const ds = reminder.datetime.slice(0, 10);
      if (!map[ds]) map[ds] = [];
      map[ds].push({ color: '#E0915C' });
    }
    return map;
  }, [diaries, schedules, reminders]);

  // Emotion emoji per date (from diary entries)
  const emotionDates = useMemo(() => {
    const map: Record<string, string> = {};
    for (const entry of diaries) {
      if (entry.emotionEmoji) {
        map[entry.created_at.slice(0, 10)] = entry.emotionEmoji;
      }
    }
    return map;
  }, [diaries]);

  const dateDiaries = useMemo(
    () => diaries.filter((e) => e.created_at.startsWith(selectedDate)),
    [diaries, selectedDate]
  );
  const dateSchedules = useMemo(
    () => schedules.filter((e) => e.date === selectedDate),
    [schedules, selectedDate]
  );
  const dateReminders = useMemo(
    () => reminders.filter((r) => r.datetime.startsWith(selectedDate)),
    [reminders, selectedDate]
  );

  async function handleToggleReminder(id: string) {
    await toggleReminder(id);
    setReminders(await loadReminders());
  }

  function handleDeleteSchedule(id: string) {
    Alert.alert('일정 삭제', '삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => {
        await deleteSchedule(id);
        setSchedules((prev) => prev.filter((e) => e.id !== id));
      }},
    ]);
  }

  function handleDeleteReminder(id: string) {
    Alert.alert('할 일 삭제', '삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => {
        await deleteReminder(id);
        setReminders((prev) => prev.filter((r) => r.id !== id));
      }},
    ]);
  }

  function startChat() {
    router.push({ pathname: '/chat', params: { personaId: selectedPersona } });
  }

  const persona = PERSONAS.find((p) => p.id === selectedPersona)!;
  const hasContent = dateDiaries.length > 0 || dateSchedules.length > 0 || dateReminders.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll}>
        <CalendarView
          markedDates={markedDates}
          onDayPress={setSelectedDate}
          selectedDate={selectedDate}
          emotionDates={emotionDates}
        />

        <View style={styles.dateSection}>
          <Text style={styles.dateLabel}>{formatSelectedDate(selectedDate)}</Text>

          {dateDiaries.map((entry) => {
            const p = PERSONAS.find((x) => x.id === entry.persona_id);
            return (
              <TouchableOpacity
                key={entry.id}
                style={[styles.diaryCard, { borderLeftColor: p?.accentColor ?? Colors.peach }]}
                onPress={() => router.push({ pathname: '/diary/[id]', params: { id: entry.id } })}
                activeOpacity={0.82}
              >
                <View style={styles.cardRow}>
                  <View style={[styles.tag, { backgroundColor: p?.accentLight }]}>
                    <Text style={styles.tagText}>{p?.name}</Text>
                  </View>
                </View>
                {entry.title ? <Text style={styles.cardTitle}>{entry.title}</Text> : null}
                {entry.summary ? <Text style={styles.cardSummary} numberOfLines={2}>{entry.summary}</Text> : null}
              </TouchableOpacity>
            );
          })}

          {dateSchedules.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>일정</Text>
              {dateSchedules.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.scheduleRow}
                  onLongPress={() => handleDeleteSchedule(event.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.scheduleDot} />
                  <Text style={styles.scheduleTitle}>{event.title}</Text>
                  {event.time && <Text style={styles.scheduleTime}>{event.time}</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {dateReminders.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>할 일</Text>
              {dateReminders.map((reminder) => (
                <TouchableOpacity
                  key={reminder.id}
                  style={styles.reminderRow}
                  onPress={() => handleToggleReminder(reminder.id)}
                  onLongPress={() => handleDeleteReminder(reminder.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, reminder.completed && styles.checkboxDone]}>
                    {reminder.completed && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <Text style={[styles.reminderTitle, reminder.completed && styles.reminderDone]}>
                    {reminder.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!hasContent && (
            <Text style={styles.emptyText}>이 날은 기록이 없어요</Text>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.personaRow}>
          {PERSONAS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.personaChip,
                selectedPersona === p.id && { backgroundColor: p.accentColor, borderColor: p.accentColor },
              ]}
              onPress={() => setSelectedPersona(p.id)}
            >
              <Text style={styles.personaEmoji}>{p.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.chatBtn, { backgroundColor: persona.accentColor }]}
          onPress={startChat}
          activeOpacity={0.82}
        >
          <Text style={styles.chatBtnText}>대화 시작하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function formatSelectedDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'long',
  });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  dateSection: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  dateLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  diaryCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderLeftWidth: 3, padding: Spacing.md, marginBottom: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  cardRow: { flexDirection: 'row', marginBottom: 6 },
  tag: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  tagText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500' },
  cardTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  cardSummary: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  sectionBlock: { marginTop: Spacing.sm, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted, marginBottom: Spacing.xs, textTransform: 'uppercase' },
  scheduleRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.sm,
    padding: Spacing.sm, marginBottom: 4, gap: Spacing.sm,
  },
  scheduleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5C7AE0' },
  scheduleTitle: { fontSize: FontSize.sm, color: Colors.text, flex: 1 },
  scheduleTime: { fontSize: FontSize.xs, color: Colors.textSecondary },
  reminderRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.sm,
    padding: Spacing.sm, marginBottom: 4, gap: Spacing.sm,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1.5,
    borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: Colors.peach, borderColor: Colors.peach },
  checkMark: { fontSize: 12, color: Colors.surface, fontWeight: '700' },
  reminderTitle: { fontSize: FontSize.sm, color: Colors.text, flex: 1 },
  reminderDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.lg,
  },
  personaRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  personaChip: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.grayLight, borderWidth: 1.5, borderColor: Colors.border,
  },
  personaEmoji: { fontSize: 20 },
  chatBtn: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm + 4,
    alignItems: 'center',
  },
  chatBtnText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
});
