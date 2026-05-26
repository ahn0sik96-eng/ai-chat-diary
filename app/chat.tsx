import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, SafeAreaView, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Bubble from '../components/Bubble';
import SchedulePopup, { DetectedSchedule } from '../components/SchedulePopup';
import {
  ChatMessage, saveDiaryEntry, saveSchedule, saveReminder,
} from '../utils/storage';
import {
  sendMessage, summarizeToDiary, extractFromChat,
  generateProactiveOpener, makeUserMessage, makeAssistantMessage,
} from '../utils/ai';
import { setupNotifications, scheduleReminderNotification } from '../utils/notifications';
import { addShortTermEntry } from '../utils/memory';
import { addEventToDeviceCalendar } from '../utils/calendar';
import { useProactiveContext } from '../hooks/useProactiveContext';
import { PERSONAS, PersonaId } from '../constants/personas';
import { Colors, Radius, Spacing, FontSize } from '../constants/theme';

// Simple regex-based pre-check before calling Gemini extraction
function mightContainSchedule(text: string): boolean {
  return /내일|모레|다음\s*주|월요일|화요일|수요일|목요일|금요일|토요일|일요일|\d{1,2}시|\d{1,2}월\s*\d{1,2}일|약속|미팅|회의|예약|방문/.test(text);
}

export default function ChatScreen() {
  const { personaId } = useLocalSearchParams<{ personaId: PersonaId }>();
  const router = useRouter();
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openerShown, setOpenerShown] = useState(false);

  // Schedule popup
  const [popupSchedules, setPopupSchedules] = useState<DetectedSchedule[]>([]);
  const [popupVisible, setPopupVisible] = useState(false);

  const listRef = useRef<FlatList>(null);
  const { context: proactiveContext, loading: loadingOpener } = useProactiveContext();

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  // Generate proactive opener once context is ready
  useEffect(() => {
    if (loadingOpener || openerShown || !proactiveContext) return;
    setOpenerShown(true);
    let cancelled = false;
    generateProactiveOpener(persona.id, proactiveContext).then((opener) => {
      if (!cancelled && opener) {
        setMessages([makeAssistantMessage(opener)]);
        scrollToBottom();
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [loadingOpener]);

  async function handlePickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPendingImage(result.assets[0].uri);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text && !pendingImage) return;
    if (sending) return;

    const userMsg = makeUserMessage(text || '(사진)', pendingImage ?? undefined);
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setPendingImage(null);
    setSending(true);
    scrollToBottom();

    try {
      const reply = await sendMessage(persona.id, next);
      const assistantMsg = makeAssistantMessage(reply);
      const withReply = [...next, assistantMsg];
      setMessages(withReply);
      scrollToBottom();

      // Real-time schedule detection (lightweight regex first)
      if (mightContainSchedule(text)) {
        detectAndShowPopup(withReply);
      }
    } catch {
      Alert.alert('오류', '메시지 전송에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSending(false);
    }
  }

  async function detectAndShowPopup(currentMessages: ChatMessage[]) {
    try {
      const extracted = await extractFromChat(currentMessages);
      const detectedItems: DetectedSchedule[] = [
        ...extracted.schedules.map((s) => ({
          title: s.title, date: s.date, time: s.time,
          isReminder: false,
        })),
        ...extracted.reminders.map((r) => ({
          title: r.title,
          date: r.datetime.slice(0, 10),
          time: r.datetime.slice(11, 16),
          isReminder: true,
        })),
      ];
      if (detectedItems.length > 0 && !popupVisible) {
        setPopupSchedules(detectedItems);
        setPopupVisible(true);
      }
    } catch {}
  }

  async function handlePopupConfirm(items: DetectedSchedule[]) {
    setPopupVisible(false);
    try {
      for (const item of items) {
        if (item.isReminder) {
          await setupNotifications();
          const dt = `${item.date}T${item.time ?? '09:00'}:00`;
          const notifId = await scheduleReminderNotification(item.title, dt);
          await saveReminder({
            title: item.title, datetime: dt,
            completed: false, notificationId: notifId || undefined,
          });
        } else {
          await saveSchedule({ title: item.title, date: item.date, time: item.time });
          addEventToDeviceCalendar(item.title, item.date, item.time); // fire-and-forget
        }
      }
    } catch {}
  }

  async function handleSave() {
    if (messages.filter((m) => m.role === 'user').length === 0) return;
    setSaving(true);
    try {
      const [diary, extracted] = await Promise.all([
        summarizeToDiary(messages),
        extractFromChat(messages),
      ]);

      const diaryEntry = await saveDiaryEntry({
        persona_id: persona.id,
        title: diary.title,
        summary: diary.content,
        emotionEmoji: diary.emotionEmoji,
        messages,
      });

      // Save to short-term memory
      await addShortTermEntry({
        date: new Date().toISOString().slice(0, 10),
        summary: diary.title,
        emotionEmoji: diary.emotionEmoji,
        topics: extracted.schedules.map((s) => s.title).slice(0, 3),
      });

      // Save schedules & reminders not yet saved via popup
      let extra = 0;
      for (const s of extracted.schedules) {
        await saveSchedule({ title: s.title, date: s.date, time: s.time, sourceDiaryId: diaryEntry.id });
        extra++;
      }
      if (extracted.reminders.length > 0) await setupNotifications();
      for (const r of extracted.reminders) {
        const notifId = await scheduleReminderNotification(r.title, r.datetime);
        await saveReminder({
          title: r.title, datetime: r.datetime, completed: false,
          notificationId: notifId || undefined, sourceDiaryId: diaryEntry.id,
        });
        extra++;
      }

      let msg = `"${diary.title}"\n\n일기가 저장됐어요.`;
      if (extra > 0) msg += `\n일정 ${extra}개도 캘린더에 추가됐어요.`;

      Alert.alert('저장 완료', msg, [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('오류', '저장에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  }

  const canSave = messages.filter((m) => m.role === 'user').length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>{persona.emoji}</Text>
          <Text style={styles.headerName}>{persona.name}</Text>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={!canSave || saving}>
          <Text style={[styles.saveBtnText, (!canSave || saving) && styles.saveBtnDisabled]}>
            {saving ? '저장 중' : '저장'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <Bubble
              role={item.role}
              content={item.content}
              accentColor={persona.accentColor}
              accentLight={persona.accentLight}
              timestamp={item.timestamp}
              imageUri={item.imageUri}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            loadingOpener ? (
              <View style={styles.empty}>
                <ActivityIndicator size="small" color={Colors.textMuted} />
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>{persona.emoji}</Text>
                <Text style={styles.emptyName}>{persona.name}</Text>
                <Text style={styles.emptyText}>편하게 오늘 하루 얘기해줘</Text>
              </View>
            )
          }
        />

        {pendingImage && (
          <View style={styles.previewRow}>
            <Image source={{ uri: pendingImage }} style={styles.previewImage} />
            <TouchableOpacity style={styles.previewClose} onPress={() => setPendingImage(null)}>
              <Text style={styles.previewCloseText}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.photoBtn} onPress={handlePickImage}>
            <Text style={styles.photoBtnText}>+</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="오늘 어땠어?"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
          />
          {sending ? (
            <View style={[styles.sendBtn, { backgroundColor: Colors.grayLight }]}>
              <ActivityIndicator size="small" color={Colors.textSecondary} />
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.sendBtn,
                { backgroundColor: (input.trim() || pendingImage) ? persona.accentColor : Colors.grayLight },
              ]}
              onPress={handleSend}
              disabled={!input.trim() && !pendingImage}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      <SchedulePopup
        visible={popupVisible}
        schedules={popupSchedules}
        onConfirm={handlePopupConfirm}
        onDismiss={() => setPopupVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: { width: 40, justifyContent: 'center' },
  backText: { fontSize: FontSize.xl, color: Colors.text },
  headerCenter: {
    flex: 1, alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 6,
  },
  headerEmoji: { fontSize: 18 },
  headerName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  saveBtn: { width: 44, alignItems: 'flex-end' },
  saveBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.peachDark },
  saveBtnDisabled: { opacity: 0.3 },
  listContent: { paddingVertical: Spacing.md, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyEmoji: { fontSize: 40, marginBottom: Spacing.sm },
  emptyName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginBottom: Spacing.xs },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  previewRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  previewImage: { width: 60, height: 60, borderRadius: Radius.sm },
  previewClose: {
    marginLeft: Spacing.sm, width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.gray, alignItems: 'center', justifyContent: 'center',
  },
  previewCloseText: { fontSize: 16, color: Colors.text, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: Spacing.md, borderTopWidth: 1,
    borderTopColor: Colors.border, backgroundColor: Colors.surface, gap: Spacing.sm,
  },
  photoBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: Colors.grayLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  photoBtnText: { fontSize: 22, color: Colors.textSecondary, fontWeight: '300', marginTop: -1 },
  input: {
    flex: 1, backgroundColor: Colors.grayLight, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.md, color: Colors.text, maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  sendIcon: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
});
