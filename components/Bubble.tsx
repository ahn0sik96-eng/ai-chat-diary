import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, FontSize } from '../constants/theme';

interface BubbleProps {
  role: 'user' | 'assistant';
  content: string;
  accentColor?: string;
  accentLight?: string;
  timestamp?: string;
  fontFamily?: string;
  imageUri?: string;
}

export default function Bubble({
  role,
  content,
  accentColor = Colors.peach,
  accentLight = Colors.peachLight,
  timestamp,
  fontFamily,
  imageUri,
}: BubbleProps) {
  const isUser = role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.bubbleUser, { backgroundColor: accentColor }]
            : [styles.bubbleAssistant, { backgroundColor: accentLight }],
        ]}
      >
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
        {content ? (
          <Text style={[styles.text, fontFamily ? { fontFamily } : null]}>{content}</Text>
        ) : null}
        {timestamp && (
          <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
            {formatTime(timestamp)}
          </Text>
        )}
      </View>
    </View>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  rowUser: { justifyContent: 'flex-end' },
  rowAssistant: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    overflow: 'hidden',
  },
  bubbleUser: { borderBottomRightRadius: Radius.sm },
  bubbleAssistant: { borderBottomLeftRadius: Radius.sm },
  image: {
    width: 200,
    height: 200,
    borderRadius: Radius.sm,
    marginBottom: Spacing.xs,
  },
  text: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    alignSelf: 'flex-end',
  },
  timestampUser: { color: 'rgba(28,28,30,0.45)' },
});
