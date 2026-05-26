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
import { ChatMessage } from '../utils/supabase';
import { sendMessage, makeUserMessage, makeAssistantMessage } from '../utils/ai';
import { PERSONAS, PersonaId } from '../constants/personas';
import { Colors, Radius, Spacing, FontSize } from '../constants/theme';

export default function ChatScreen() {
  const { personaId } = useLocalSearchParams<{ personaId: PersonaId }>();
  const router = useRouter();
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
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
    } catch (e) {
      Alert.alert('오류', '메시지 전송에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>{persona.emoji}</Text>
          <Text style={styles.headerName}>{persona.name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Message list */}
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
              <Text style={styles.emptyText}>
                안녕하세요! 오늘 하루 어떠셨나요?{'\n'}무슨 이야기든 편하게 해주세요 🌸
              </Text>
            </View>
          }
        />

        {/* Input bar */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="오늘 하루를 이야기해 주세요..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
          />
          {sending ? (
            <View style={styles.sendBtn}>
              <ActivityIndicator size="small" color={Colors.text} />
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: persona.accentColor }]}
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <Text style={styles.sendIcon}>→</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
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
  headerCenter: { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  headerEmoji: { fontSize: 20 },
  headerName: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
  listContent: { paddingVertical: Spacing.md, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
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
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray,
  },
  sendIcon: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
});
