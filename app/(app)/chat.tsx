import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Check } from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';
import {
  getOrCreateTodayEntry,
  getMessages,
  updateEntryPersona,
} from '@/lib/queries';
import { sendChatMessage, summarizeEntry } from '@/lib/api';
import { getPersona, DEFAULT_PERSONA } from '@/data/personas';
import { todayKey, formatEntryDate } from '@/lib/date';
import type { Entry, Message, PersonaId } from '@/lib/types';
import {
  GradientBackground,
  ChatBubble,
  PersonaPicker,
  ScreenHeader,
} from '@/components';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

export default function ChatScreen() {
  const { session, profile } = useAuth();
  const router = useRouter();
  const listRef = useRef<FlatList<Message>>(null);

  const [entry, setEntry] = useState<Entry | null>(null);
  const [persona, setPersona] = useState<PersonaId>(
    profile?.default_persona ?? DEFAULT_PERSONA
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    (async () => {
      if (!session) return;
      try {
        const e = await getOrCreateTodayEntry(
          session.user.id,
          profile?.default_persona ?? DEFAULT_PERSONA
        );
        setEntry(e);
        setPersona(e.persona);
        setMessages(await getMessages(e.id));
      } catch (err) {
        console.warn('chat init failed', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [session]);

  async function onChangePersona(id: PersonaId) {
    setPersona(id);
    if (entry) {
      try {
        await updateEntryPersona(entry.id, id);
      } catch {
        /* 무시 */
      }
    }
  }

  async function onSend() {
    const text = input.trim();
    if (!text || !entry || !session || sending) return;
    setInput('');
    setSending(true);

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      entry_id: entry.id,
      user_id: session.user.id,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const reply = await sendChatMessage(entry.id, text);
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      console.warn('send failed', err);
      setMessages((prev) => [
        ...prev,
        {
          ...optimistic,
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '앗, 답장을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.',
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function onFinish() {
    if (!entry || finishing) return;
    setFinishing(true);
    try {
      await summarizeEntry(entry.id);
      router.replace(`/(app)/entry/${entry.id}`);
    } catch (err) {
      console.warn('summarize failed', err);
      setFinishing(false);
    }
  }

  const personaMeta = getPersona(persona);
  const userTurns = messages.filter((m) => m.role === 'user').length;
  const canFinish = userTurns >= 2 && !finishing;

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader
          title={formatEntryDate(todayKey())}
          back
          right={
            <Pressable
              onPress={onFinish}
              disabled={!canFinish}
              style={[styles.finishBtn, !canFinish && styles.finishDisabled]}
              hitSlop={6}
            >
              {finishing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Check size={15} color={colors.primary} strokeWidth={2.6} />
                  <Text style={styles.finishText}>완성</Text>
                </>
              )}
            </Pressable>
          }
        />

        <PersonaPicker selected={persona} onSelect={onChangePersona} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={8}
        >
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              contentContainerStyle={styles.list}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
              ListHeaderComponent={
                <ChatBubble
                  persona={persona}
                  message={{
                    role: 'assistant',
                    content: `안녕, 나는 ${personaMeta.name}야. 오늘 하루 어땠어? 편하게 이야기해줘.`,
                  }}
                />
              }
              renderItem={({ item }) => (
                <ChatBubble message={item} persona={persona} />
              )}
            />
          )}

          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="오늘 있었던 일을 들려줘..."
              placeholderTextColor={colors.textFaint}
              multiline
              onSubmitEditing={onSend}
            />
            <Pressable
              onPress={onSend}
              disabled={!input.trim() || sending}
              style={[styles.sendBtn, (!input.trim() || sending) && styles.sendDisabled]}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Send size={20} color={colors.white} strokeWidth={2.4} />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.lg, paddingBottom: spacing.md },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  finishDisabled: { opacity: 0.4 },
  finishText: { color: colors.primary, fontFamily: fonts.bold, fontSize: fontSize.sm },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.glassStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  sendDisabled: { opacity: 0.5 },
});
