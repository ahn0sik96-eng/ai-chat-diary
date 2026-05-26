import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Bubble from '../components/Bubble';
import { ChatMessage, saveDiaryEntry } from '../utils/storage';
import { sendMessage, summarizeToDiary, makeUserMessage, makeAssistantMessage } from '../utils/ai';
import { PERSONAS, PersonaId } from '../constants/personas';
import { Colors, Radius, Spacing, FontSize } from '../constants/theme';

export default function ChatScreen() {
  const { personaId } = useLocalSearchParams<{ personaId: PersonaId }>();
  const router = useRouter();
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const listRef = useRef<FlatList>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg = makeUserMessage(text);
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setSending(true);
    scrollToBottom();

    try {
      const reply = await sendMessage(persona.id, next);
      const assistantMsg = makeAssistantMessage(reply);
      setMessages((prev) => [...prev, assistantMsg]);
      scrollToBottom();
    } catch {
      Alert.alert('오류', '메시지 전송에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSending(false);
    }
  }

  async function handleSave() {
    if (messages.length === 0) return;
    setSaving(true);
    try {
      const { title, content } = await summarizeToDiary(messages);
      await saveDiaryEntry({ persona_id: persona.id, title, summary: content, messages });
      Alert.alert('저장 완료', `"${title}"\n\n일기장에 저장됐어요.`, [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('오류', '일기 저장에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  }

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
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={messages.length === 0 || saving}
        >
          <Text style={[styles.saveBtnText, (messages.length === 0 || saving) && styles.saveBtnDisabled]}>
            {saving ? '저장 중' : '저장'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
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
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>{persona.emoji}</Text>
              <Text style={styles.emptyName}>{persona.name}</Text>
              <Text style={styles.emptyText}>편하게 오늘 하루 얘기해줘</Text>
            </View>
          }
        />

        <View style={styles.inputRow}>
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
              style={[styles.sendBtn, { backgroundColor: input.trim() ? persona.accentColor : Colors.grayLight }]}
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: { width: 40, justifyContent: 'center' },
  backText: { fontSize: FontSize.xl, color: Colors.text },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  headerEmoji: { fontSize: 18 },
  headerName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  saveBtn: { width: 44, alignItems: 'flex-end' },
  saveBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.peachDark },
  saveBtnDisabled: { opacity: 0.3 },
  listContent: { paddingVertical: Spacing.md, flexGrow: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyEmoji: { fontSize: 40, marginBottom: Spacing.sm },
  emptyName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginBottom: Spacing.xs },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.grayLight,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.md,
    color: Colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
});
