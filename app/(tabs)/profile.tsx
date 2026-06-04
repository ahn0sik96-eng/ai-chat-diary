import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { DiaryRepository } from '@/data/repositories/DiaryRepository';
import { ChatRepository } from '@/data/repositories/ChatRepository';
import { useSettingsStore } from '@/state/settingsStore';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

export default function ProfileScreen() {
  const [diaryCount, setDiaryCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const hasKey = useSettingsStore((s) => s.hasKey);

  useFocusEffect(
    useCallback(() => {
      DiaryRepository.list().then((d) => setDiaryCount(d.length));
      ChatRepository.listSessions().then((s) => setChatCount(s.length));
    }, []),
  );

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 36 }}>🌷</Text>
        </View>
        <Text style={styles.name}>나의 마음일기</Text>
        <View style={styles.stats}>
          <Stat value={diaryCount} label="일기" />
          <View style={styles.divider} />
          <Stat value={chatCount} label="대화" />
        </View>
      </View>

      <View style={styles.menu}>
        <MenuRow
          icon="🔑"
          label="Grok API 키"
          value={hasKey ? '연결됨' : '연결 안 됨'}
          valueColor={hasKey ? colors.success : colors.warning}
          onPress={() => router.push('/settings/api-key')}
        />
        <MenuRow icon="💬" label="페르소나 살펴보기" onPress={() => router.push('/settings/personas')} />
        <MenuRow icon="⚙️" label="설정" onPress={() => router.push('/settings')} />
      </View>

      <Text style={styles.soon}>👥 소셜 기능(팔로우·피드)은 곧 추가될 예정이에요.</Text>
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
  value,
  valueColor,
  onPress,
}: {
  icon: string;
  label: string;
  value?: string;
  valueColor?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      {value ? <Text style={[styles.menuValue, valueColor ? { color: valueColor } : null]}>{value}</Text> : null}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.card,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...typography.heading, marginTop: spacing.md },
  stats: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, gap: spacing.xl },
  stat: { alignItems: 'center' },
  statValue: { ...typography.title, fontSize: 22, color: colors.primary },
  statLabel: { ...typography.caption },
  divider: { width: 1, height: 32, backgroundColor: colors.border },
  menu: { marginTop: spacing.xl, backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuIcon: { fontSize: 20 },
  menuLabel: { ...typography.body, flex: 1 },
  menuValue: { ...typography.caption, fontWeight: '700' },
  chevron: { fontSize: 22, color: colors.textFaint },
  soon: { ...typography.caption, textAlign: 'center', marginTop: spacing.xl },
});
