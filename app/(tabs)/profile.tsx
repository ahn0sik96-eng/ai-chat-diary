import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DiaryRepository } from '@/data/repositories/DiaryRepository';
import { ChatRepository } from '@/data/repositories/ChatRepository';
import { colors, gradients, radius, spacing, typography } from '@/theme/tokens';

export default function ProfileScreen() {
  const [diaryCount, setDiaryCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      DiaryRepository.list().then((d) => setDiaryCount(d.length));
      ChatRepository.listSessions().then((s) => setChatCount(s.length));
    }, []),
  );

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <View style={styles.head}>
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Ionicons name="person" size={34} color={colors.onPrimary} />
        </LinearGradient>
        <Text style={styles.name}>나의 마음일기</Text>
        <View style={styles.stats}>
          <Stat value={diaryCount} label="일기" />
          <View style={styles.divider} />
          <Stat value={chatCount} label="대화" />
        </View>
      </View>

      <View style={styles.menu}>
        <MenuRow icon="people-outline" label="페르소나 살펴보기" onPress={() => router.push('/settings/personas')} />
        <MenuRow icon="settings-outline" label="설정" onPress={() => router.push('/settings')} last />
      </View>

      <Text style={styles.soon}>소셜 기능(팔로우·피드)은 곧 추가될 예정이에요.</Text>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable style={[styles.menuRow, last && { borderBottomWidth: 0 }]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  head: { alignItems: 'center', paddingVertical: spacing.xl },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...typography.heading, marginTop: spacing.md },
  stats: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, gap: spacing.xl },
  stat: { alignItems: 'center' },
  statValue: { ...typography.title, fontSize: 22 },
  statLabel: { ...typography.caption, marginTop: 2 },
  divider: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: colors.borderStrong },
  menu: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuLabel: { ...typography.body, flex: 1 },
  soon: { ...typography.caption, textAlign: 'center', marginTop: spacing.xl },
});
