import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PERSONAS } from '@/config/personas';
import { PersonaAvatar } from '@/components/ui/PersonaAvatar';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function PersonasScreen() {
  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        5명의 친구가 각자 다른 말투로 이야기를 들어줘요. 말투는 코드의{' '}
        <Text style={styles.code}>src/config/personas.ts</Text> 에서 직접 다듬을 수 있어요.
      </Text>
      {PERSONAS.map((p) => (
        <View key={p.id} style={styles.card}>
          <View style={styles.header}>
            <PersonaAvatar name={p.displayName} color={p.accent} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{p.displayName}</Text>
              <Text style={styles.tag}>{p.tagline}</Text>
            </View>
          </View>
          <Text style={styles.greetingLabel}>첫 인사</Text>
          <Text style={styles.greeting}>“{p.greeting}”</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  intro: { ...typography.caption, lineHeight: 19, marginBottom: spacing.lg },
  code: { fontWeight: '700', color: colors.accent },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { ...typography.bodyStrong },
  tag: { ...typography.caption, marginTop: 2 },
  greetingLabel: { ...typography.tiny, marginTop: spacing.md, color: colors.textFaint },
  greeting: { ...typography.body, fontStyle: 'italic', marginTop: spacing.xs, color: colors.textMuted },
});
