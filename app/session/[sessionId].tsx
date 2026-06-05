import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { Ionicons } from '@expo/vector-icons';
import { ChatRepository } from '@/data/repositories/ChatRepository';
import { CalendarEvent, ChatSession } from '@/types';
import { getPersona } from '@/config/personas';
import { useChat } from '@/hooks/useChat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

export default function ChatScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [session, setSession] = useState<ChatSession | null>(null);
  const listRef = useRef<FlatList>(null);
  const [input, setInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  useEffect(() => {
    if (sessionId) ChatRepository.getSession(sessionId).then(setSession);
  }, [sessionId]);

  // Scroll to the latest message when the keyboard opens so it isn't hidden.
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    });
    return () => sub.remove();
  }, []);

  const onEventsAdded = useCallback((events: CalendarEvent[]) => {
    const titles = events.map((e) => e.title).join(', ');
    setToast(`📅 캘린더에 추가됨 · ${titles}`);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const { messages, sending, error, send } = useChat(
    sessionId,
    session?.personaId,
    onEventsAdded,
  );
  const persona = session ? getPersona(session.personaId) : null;

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length]);

  const onSend = () => {
    const text = input;
    setInput('');
    send(text);
  };

  const canMakeDiary = messages.filter((m) => m.role === 'user').length >= 1;
  const canSend = !!input.trim() && !sending;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: persona?.displayName ?? '채팅',
          headerBackButtonDisplayMode: 'minimal',
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerRight: () =>
            canMakeDiary ? (
              <Pressable
                onPress={() => router.push(`/diary/summarize/${sessionId}`)}
                style={styles.diaryBtn}
              >
                <Text style={styles.diaryBtnText}>일기 만들기</Text>
              </Pressable>
            ) : null,
        }}
      />
      {toast && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <TextInput
          style={styles.input}
          placeholder="메시지 보내기"
          placeholderTextColor={colors.textFaint}
          value={input}
          onChangeText={setInput}
          multiline
        />
        <Pressable
          style={[styles.sendBtn, !canSend && styles.sendBtnOff]}
          onPress={onSend}
          disabled={!canSend}
        >
          <Ionicons name="arrow-up" size={20} color={canSend ? colors.onPrimary : colors.textFaint} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  toast: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    zIndex: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    ...shadow.float,
  },
  toastText: { color: colors.onPrimary, fontWeight: '700', fontSize: 13 },
  messages: { padding: spacing.lg, paddingBottom: spacing.md, flexGrow: 1, justifyContent: 'flex-end' },
  diaryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  diaryBtnText: { color: colors.onPrimary, fontWeight: '700', fontSize: 13 },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: colors.surfaceAlt },
});
