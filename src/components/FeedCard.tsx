import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Heart, MessageCircle } from 'lucide-react-native';

import { colors, fonts, fontSize, spacing } from '@/theme';
import { formatEntryDate, timeAgo } from '@/lib/date';
import type { FeedEntry } from '@/lib/types';
import { GlassCard } from './GlassCard';
import { Avatar } from './Avatar';
import { MoodBadge } from './MoodBadge';
import { PersonaBadge } from './PersonaBadge';

/**
 * 피드/탐색용 일기 카드. 공유되는 것은 요약/감정뿐이며 대화 원문은 노출하지 않는다.
 */
export function FeedCard({
  entry,
  onPress,
  onToggleReaction,
  onComment,
}: {
  entry: FeedEntry;
  onPress?: () => void;
  onToggleReaction?: () => void;
  onComment?: () => void;
}) {
  const name = entry.author.display_name || entry.author.username;

  return (
    <GlassCard style={styles.card}>
      <Pressable onPress={onPress}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Avatar uri={entry.author.avatar_url} name={name} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.meta}>
              {formatEntryDate(entry.entry_date)} · {timeAgo(entry.created_at)}
            </Text>
          </View>
          <PersonaBadge persona={entry.persona} />
        </View>

        {/* 본문 */}
        {entry.title ? <Text style={styles.title}>{entry.title}</Text> : null}
        {entry.summary ? (
          <Text style={styles.summary} numberOfLines={5}>
            {entry.summary}
          </Text>
        ) : null}

        <View style={styles.moodRow}>
          <MoodBadge mood={entry.mood} size="sm" />
        </View>
      </Pressable>

      {/* 액션 */}
      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={onToggleReaction} hitSlop={8}>
          <Heart
            size={20}
            color={entry.reacted ? colors.pink : colors.textMuted}
            fill={entry.reacted ? colors.pink : 'transparent'}
            strokeWidth={2.2}
          />
          <Text style={[styles.actionText, entry.reacted && { color: colors.pink }]}>
            {entry.reaction_count > 0 ? entry.reaction_count : '공감'}
          </Text>
        </Pressable>
        <Pressable style={styles.action} onPress={onComment} hitSlop={8}>
          <MessageCircle size={20} color={colors.textMuted} strokeWidth={2.2} />
          <Text style={styles.actionText}>
            {entry.comment_count > 0 ? entry.comment_count : '댓글'}
          </Text>
        </Pressable>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: fontSize.md },
  meta: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: fontSize.xs, marginTop: 1 },
  title: { color: colors.text, fontFamily: fonts.hand, fontSize: fontSize.xl, marginBottom: 6 },
  summary: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.md, lineHeight: 22 },
  moodRow: { flexDirection: 'row', marginTop: spacing.md },
  actions: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.glassBorder,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: fontSize.sm },
});
