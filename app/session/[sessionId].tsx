import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
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
import { ChatRepository } from '@/data/repositories/ChatRepository';
import { ChatSession } from '@/types';
import { getPersona } from '@/config/personas';
import { useChat } from '@/hooks/useChat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function ChatScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [session, setSession] = useState<ChatSession | null>(null);
  const listRef = useRef<FlatList>(null);
  const [input, setInput] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (sessionId) ChatRepository.getSession(sessionId).then(setSession);
  }, [sessionId]);

  const { messages, sending, error, send } = useChat(sessionId, session?.personaId);
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

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: persona?.displayName ?? '채팅',
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
          placeholder="메시지를 입력하세요…"
          placeholderTextColor={colors.textFaint}
          value={input}
          onChangeText={setInput}
          multiline
          onSubmitEditing={onSend}
        />
        <Pressable
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={onSend}
          disabled={!input.trim() || sending}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  messages: { padding: spacing.lg, paddingBottom: spacing.md },
  diaryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
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
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
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
  sendBtnDisabled: { backgroundColor: colors.primarySoft },
  sendIcon: { color: colors.onPrimary, fontSize: 22, fontWeight: '800' },
});
