import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MessageCircle, Lock, Users, Globe, Send } from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';
import {
  getEntryDetail,
  getComments,
  addComment,
  toggleReaction,
  setEntryVisibility,
  getMessages,
} from '@/lib/queries';
import { formatEntryDate, timeAgo } from '@/lib/date';
import type { Comment, FeedEntry, Message, Visibility } from '@/lib/types';
import {
  GradientBackground,
  GlassCard,
  ScreenHeader,
  Avatar,
  MoodBadge,
  PersonaBadge,
  ChatBubble,
} from '@/components';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const VIS_OPTIONS: { id: Visibility; label: string; icon: typeof Lock }[] = [
  { id: 'private', label: '나만', icon: Lock },
  { id: 'followers', label: '팔로워', icon: Users },
  { id: 'public', label: '전체', icon: Globe },
];

export default function EntryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();

  const [entry, setEntry] = useState<FeedEntry | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showConversation, setShowConversation] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  const isOwner = entry && session && entry.user_id === session.user.id;

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const e = await getEntryDetail(id);
      setEntry(e);
      setComments(await getComments(id));
      if (e && session && e.user_id === session.user.id) {
        setMessages(await getMessages(id));
      }
    } catch (err) {
      console.warn('entry load failed', err);
    } finally {
      setLoading(false);
    }
  }, [id, session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onReact() {
    if (!entry || !session) return;
    setEntry({
      ...entry,
      reacted: !entry.reacted,
      reaction_count: entry.reaction_count + (entry.reacted ? -1 : 1),
    });
    try {
      await toggleReaction(entry.id, session.user.id);
    } catch {
      load();
    }
  }

  async function onChangeVisibility(v: Visibility) {
    if (!entry) return;
    setEntry({ ...entry, visibility: v });
    try {
      await setEntryVisibility(entry.id, v);
    } catch {
      load();
    }
  }

  async function onSubmitComment() {
    const text = commentText.trim();
    if (!text || !entry || !session) return;
    setCommentText('');
    try {
      await addComment(entry.id, session.user.id, text);
      setComments(await getComments(entry.id));
      setEntry((prev) => prev && { ...prev, comment_count: prev.comment_count + 1 });
    } catch (err) {
      console.warn('comment failed', err);
    }
  }

  if (loading) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (!entry) {
    return (
      <GradientBackground>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScreenHeader title="일기" back />
          <View style={styles.center}>
            <Text style={styles.muted}>일기를 찾을 수 없어요.</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  const name = entry.author.display_name || entry.author.username;

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title={formatEntryDate(entry.entry_date)} back />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={8}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 작성자 */}
            <Pressable
              style={styles.authorRow}
              onPress={() => !isOwner && router.push(`/(app)/user/${entry.user_id}`)}
            >
              <Avatar uri={entry.author.avatar_url} name={name} size={42} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.meta}>{timeAgo(entry.created_at)}</Text>
              </View>
              <PersonaBadge persona={entry.persona} />
            </Pressable>

            {/* 일기 본문 */}
            <GlassCard style={styles.diaryCard}>
              <View style={styles.moodRow}>
                <MoodBadge mood={entry.mood} />
              </View>
              {entry.title ? <Text style={styles.title}>{entry.title}</Text> : null}
              <Text style={styles.summary}>{entry.summary ?? '아직 요약되지 않은 일기예요.'}</Text>
            </GlassCard>

            {/* 공개 범위 (작성자만) */}
            {isOwner ? (
              <View style={styles.visRow}>
                {VIS_OPTIONS.map((opt) => {
                  const active = entry.visibility === opt.id;
                  const Icon = opt.icon;
                  return (
                    <Pressable
                      key={opt.id}
                      style={[styles.visChip, active && styles.visChipActive]}
                      onPress={() => onChangeVisibility(opt.id)}
                    >
                      <Icon size={14} color={active ? colors.white : colors.textMuted} />
                      <Text style={[styles.visText, active && styles.visTextActive]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {/* 대화 다시 보기 (작성자만, 비공개) */}
            {isOwner && messages.length > 0 ? (
              <View style={styles.conversation}>
                <Pressable onPress={() => setShowConversation((s) => !s)}>
                  <Text style={styles.sectionToggle}>
                    {showConversation ? '대화 숨기기' : '그날의 대화 다시 보기'}
                  </Text>
                </Pressable>
                {showConversation
                  ? messages.map((m) => (
                      <ChatBubble key={m.id} message={m} persona={entry.persona} />
                    ))
                  : null}
              </View>
            ) : null}

            {/* 액션 */}
            <View style={styles.actions}>
              <Pressable style={styles.action} onPress={onReact} hitSlop={8}>
                <Heart
                  size={22}
                  color={entry.reacted ? colors.pink : colors.textMuted}
                  fill={entry.reacted ? colors.pink : 'transparent'}
                  strokeWidth={2.2}
                />
                <Text style={[styles.actionText, entry.reacted && { color: colors.pink }]}>
                  공감 {entry.reaction_count}
                </Text>
              </Pressable>
              <View style={styles.action}>
                <MessageCircle size={22} color={colors.textMuted} strokeWidth={2.2} />
                <Text style={styles.actionText}>댓글 {entry.comment_count}</Text>
              </View>
            </View>

            {/* 댓글 목록 */}
            <View style={styles.comments}>
              {comments.map((c) => {
                const cName = c.author?.display_name || c.author?.username || '익명';
                return (
                  <View key={c.id} style={styles.commentRow}>
                    <Avatar uri={c.author?.avatar_url} name={cName} size={32} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.commentName}>{cName}</Text>
                      <Text style={styles.commentText}>{c.content}</Text>
                    </View>
                    <Text style={styles.commentTime}>{timeAgo(c.created_at)}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* 댓글 입력 */}
          <View style={styles.commentBar}>
            <TextInput
              style={styles.commentInput}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="따뜻한 댓글을 남겨보세요"
              placeholderTextColor={colors.textFaint}
            />
            <Pressable
              onPress={onSubmitComment}
              disabled={!commentText.trim()}
              style={[styles.sendBtn, !commentText.trim() && styles.sendDisabled]}
            >
              <Send size={18} color={colors.white} strokeWidth={2.4} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.md },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: fontSize.md },
  meta: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: fontSize.xs, marginTop: 1 },
  diaryCard: { gap: spacing.sm },
  moodRow: { flexDirection: 'row' },
  title: { color: colors.text, fontFamily: fonts.hand, fontSize: fontSize.xxl },
  summary: { color: colors.text, fontFamily: fonts.regular, fontSize: fontSize.md, lineHeight: 24 },
  visRow: { flexDirection: 'row', gap: spacing.sm },
  visChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  visChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  visText: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: fontSize.sm },
  visTextActive: { color: colors.white, fontFamily: fonts.bold },
  conversation: { gap: 2 },
  sectionToggle: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xl,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: fontSize.sm },
  comments: { gap: spacing.md },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  commentName: { color: colors.text, fontFamily: fonts.bold, fontSize: fontSize.sm },
  commentText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.sm, lineHeight: 20, marginTop: 1 },
  commentTime: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: fontSize.xs },
  commentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.glassBorder,
  },
  commentInput: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    backgroundColor: colors.glassStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  sendDisabled: { opacity: 0.5 },
});
