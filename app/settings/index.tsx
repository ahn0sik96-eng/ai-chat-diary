import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { resetDb } from '@/data/db';
import { useSettingsStore } from '@/state/settingsStore';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function SettingsScreen() {
  const hasKey = useSettingsStore((s) => s.hasKey);

  const confirmReset = () => {
    Alert.alert('데이터 초기화', '모든 대화와 일기가 삭제돼요. 계속할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '초기화',
        style: 'destructive',
        onPress: async () => {
          await resetDb();
          Alert.alert('완료', '데이터가 초기화됐어요.');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <View style={styles.group}>
        <Row label="Grok API 키" value={hasKey ? '연결됨' : '미연결'} onPress={() => router.push('/settings/api-key')} />
        <Row label="페르소나" onPress={() => router.push('/settings/personas')} />
      </View>

      <View style={styles.group}>
        <Row label="데이터 초기화" danger onPress={confirmReset} />
      </View>

      <Text style={styles.version}>마음일기 v1.0.0 · 로컬 저장</Text>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  danger,
  onPress,
}: {
  label: string;
  value?: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={[styles.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {!danger && <Text style={styles.chevron}>›</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { ...typography.body, flex: 1 },
  rowValue: { ...typography.caption, marginRight: spacing.sm },
  chevron: { fontSize: 22, color: colors.textFaint },
  version: { ...typography.tiny, textAlign: 'center' },
});
