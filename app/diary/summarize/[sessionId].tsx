import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DIARY_STYLE_LIST } from '@/config/diaryStyles';
import { summarizeConversation, SummaryResult } from '@/api/summarizeService';
import { ChatRepository } from '@/data/repositories/ChatRepository';
import { DiaryRepository } from '@/data/repositories/DiaryRepository';
import { ChatSession, DiaryStyle } from '@/types';
import { Button } from '@/components/ui/Button';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

type Phase = 'pick' | 'loading' | 'preview';

const STYLE_ICON: Record<DiaryStyle, keyof typeof Ionicons.glyphMap> = {
  normal: 'document-text-outline',
  emotional: 'heart-outline',
  poetic: 'moon-outline',
};

export default function SummarizeScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [style, setStyle] = useState<DiaryStyle>('normal');
  const [phase, setPhase] = useState<Phase>('pick');
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) ChatRepository.getSession(sessionId).then(setSession);
  }, [sessionId]);

  const generate = async () => {
    if (!sessionId) return;
    setError(null);
    setPhase('loading');
    try {
      const history = await ChatRepository.listMessages(sessionId);
      const res = await summarizeConversation(style, history);
      setResult(res);
      setPhase('preview');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '요약에 실패했어요.');
      setPhase('pick');
    }
  };

  const editSentence = (id: string, text: string) => {
    setResult((prev) =>
      prev
        ? { ...prev, sentences: prev.sentences.map((s) => (s.id === id ? { ...s, text } : s)) }
        : prev,
    );
  };

  const removeSentence = (id: string) => {
    setResult((prev) =>
      prev ? { ...prev, sentences: prev.sentences.filter((s) => s.id !== id) } : prev,
    );
  };

  const saveAndDecorate = async () => {
    if (!result || !session || !sessionId) return;
    const cleaned = result.sentences
      .filter((s) => s.text.trim().length > 0)
      .map((s, i) => ({ ...s, order: i }));
    const diary = await DiaryRepository.create({
      sessionId,
      personaId: session.personaId,
      style,
      title: result.title,
      sentences: cleaned,
      rawSummary: result.rawSummary,
      mood: result.mood,
    });
    await ChatRepository.setSessionDiary(sessionId, diary.id);
    router.replace(`/diary/decorate/${diary.id}`);
  };

  if (phase === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>오늘 하루를 일기로 옮기는 중…</Text>
      </View>
    );
  }

  if (phase === 'preview' && result) {
    return (
      <View style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.previewTitle}>{result.title}</Text>
          {result.mood ? <Text style={styles.mood}>오늘의 기분 · {result.mood}</Text> : null}
          <Text style={styles.hint}>문장을 다듬거나 지울 수 있어요. 마음에 들면 꾸미러 가요.</Text>
          {result.sentences.map((s) => (
            <View key={s.id} style={styles.sentenceRow}>
              <TextInput
                style={styles.sentenceInput}
                value={s.text}
                onChangeText={(t) => editSentence(s.id, t)}
                multiline
              />
              <Pressable onPress={() => removeSentence(s.id)} hitSlop={8}>
                <Text style={styles.removeBtn}>✕</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
        <View style={styles.footer}>
          <Button label="다시 요약" variant="secondary" onPress={generate} style={{ flex: 1 }} />
          <Button label="꾸미러 가기 →" onPress={saveAndDecorate} style={{ flex: 1.4 }} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>어떤 일기로 만들까요?</Text>
      {DIARY_STYLE_LIST.map((s) => {
        const active = style === s.id;
        return (
          <Pressable
            key={s.id}
            style={[styles.styleCard, active && styles.styleCardActive]}
            onPress={() => setStyle(s.id)}
          >
            <Ionicons
              name={STYLE_ICON[s.id]}
              size={22}
              color={active ? colors.text : colors.textMuted}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.styleName}>{s.displayName}</Text>
              <Text style={styles.styleDesc}>{s.description}</Text>
            </View>
            <View style={[styles.radio, active && styles.radioOn]} />
          </Pressable>
        );
      })}
      {error && <Text style={styles.error}>{error}</Text>}
      <Button label="일기 만들기" variant="primary" onPress={generate} style={{ marginTop: spacing.lg }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  loadingText: { ...typography.body, color: colors.textMuted },
  sectionTitle: { ...typography.heading, marginBottom: spacing.lg },
  styleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleCardActive: { borderColor: colors.primary, ...shadow.card },
  styleEmoji: { fontSize: 30 },
  styleName: { ...typography.bodyStrong },
  styleDesc: { ...typography.caption, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  previewTitle: { ...typography.title, marginBottom: spacing.xs },
  mood: { ...typography.caption, color: colors.primary, marginBottom: spacing.md },
  hint: { ...typography.caption, marginBottom: spacing.lg },
  sentenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sentenceInput: { flex: 1, ...typography.body, paddingVertical: spacing.md },
  removeBtn: { color: colors.textFaint, fontSize: 16, padding: spacing.xs },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.md },
});
