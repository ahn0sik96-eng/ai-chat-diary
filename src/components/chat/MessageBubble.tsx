import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChatMessage } from '@/types';
import { colors, radius, spacing } from '@/theme/tokens';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAi]}>
      <View style={[styles.bubble, isUser ? styles.user : styles.ai]}>
        {message.pending && message.content.length === 0 ? (
          <Text style={[styles.text, styles.aiText, styles.typing]}>· · ·</Text>
        ) : (
          <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>
            {message.content}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', marginVertical: spacing.xs / 2, flexDirection: 'row' },
  rowUser: { justifyContent: 'flex-end' },
  rowAi: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  user: { backgroundColor: colors.bubbleUser, borderBottomRightRadius: radius.sm },
  ai: { backgroundColor: colors.bubbleAi, borderBottomLeftRadius: radius.sm },
  text: { fontSize: 15, lineHeight: 21 },
  userText: { color: colors.bubbleUserText },
  aiText: { color: colors.bubbleAiText },
  typing: { letterSpacing: 2 },
});
