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
import { Ionicons } from '@expo/vector-icons';
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
  const canSend = !!input.trim() && !sending;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
  messages: { padding: spacing.lg, paddingBottom: spacing.md },
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
