import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, fonts, fontSize, radius } from '@/theme';
import { getPersona } from '@/data/personas';
import type { Message, PersonaId } from '@/lib/types';
import { PersonaAvatar } from './PersonaBadge';

/** 채팅 말풍선. 사용자=오른쪽 그라데이션, AI=왼쪽 글래스 + 페르소나 아바타. */
export function ChatBubble({
  message,
  persona,
}: {
  message: Pick<Message, 'role' | 'content'>;
  persona: PersonaId;
}) {
  const mine = message.role === 'user';

  if (mine) {
    return (
      <View style={[styles.row, styles.rowMine]}>
        <LinearGradient
          colors={getPersona(persona).gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.mine]}
        >
          <Text style={styles.mineText}>{message.content}</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.row, styles.rowTheirs]}>
      <PersonaAvatar persona={persona} size={30} />
      <View style={[styles.bubble, styles.theirs]}>
        <Text style={styles.theirsText}>{message.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 5, alignItems: 'flex-end', gap: 8 },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10 },
  mine: {
    borderRadius: radius.lg,
    borderBottomRightRadius: 6,
  },
  theirs: {
    backgroundColor: colors.glassStrong,
    borderRadius: radius.lg,
    borderBottomLeftRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  mineText: { color: colors.white, fontFamily: fonts.medium, fontSize: fontSize.md, lineHeight: 21 },
  theirsText: { color: colors.text, fontFamily: fonts.regular, fontSize: fontSize.md, lineHeight: 21 },
});
