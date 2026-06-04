import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Users, Globe } from 'lucide-react-native';

import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import { getPersona } from '@/data/personas';
import { MoodBadge } from './MoodBadge';
import type { Entry, Mood, PersonaId, Visibility } from '@/lib/types';

type GridItem = Pick<Entry, 'id' | 'title' | 'persona' | 'visibility'> & {
  mood: Mood | null;
};

const VIS_ICON = { private: Lock, followers: Users, public: Globe } as const;

/** 프로필용 2열 일기 그리드 셀. */
export function EntryGridCell({
  item,
  onPress,
  showVisibility = false,
}: {
  item: GridItem;
  onPress?: () => void;
  showVisibility?: boolean;
}) {
  const persona = getPersona(item.persona as PersonaId);
  const VisIcon = VIS_ICON[item.visibility as Visibility];
  return (
    <Pressable style={styles.cell} onPress={onPress}>
      <LinearGradient
        colors={persona.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.overlay}>
          <View style={styles.topRow}>
            <MoodBadge mood={item.mood} size="sm" />
            {showVisibility && VisIcon ? (
              <VisIcon size={14} color="rgba(255,255,255,0.9)" />
            ) : null}
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {item.title ?? '작성 중인 일기'}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1, aspectRatio: 0.82, marginBottom: spacing.md },
  gradient: { flex: 1, borderRadius: radius.lg, overflow: 'hidden' },
  overlay: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(11,11,20,0.30)',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.white, fontFamily: fonts.hand, fontSize: fontSize.lg },
});
