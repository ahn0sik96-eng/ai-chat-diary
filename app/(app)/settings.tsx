import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, LogOut, ChevronRight, ShieldCheck } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';
import { getPersona } from '@/data/personas';
import { GradientBackground, GlassCard, ScreenHeader } from '@/components';
import { colors, fonts, fontSize, spacing } from '@/theme';

export default function SettingsScreen() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="설정" back />
        <View style={styles.body}>
          <GlassCard padded={false}>
            <Row
              icon={Sparkles}
              label="AI 페르소나"
              value={getPersona(profile?.default_persona).name}
              onPress={() => router.push('/(app)/personas')}
            />
            <Divider />
            <Row
              icon={ShieldCheck}
              label="기본 공개 범위"
              value="비공개 (안전)"
            />
          </GlassCard>

          <GlassCard padded={false} style={{ marginTop: spacing.lg }}>
            <Row icon={LogOut} label="로그아웃" danger onPress={signOut} />
          </GlassCard>

          <Text style={styles.version}>무디 (Moody) · v1.0.0</Text>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  const tint = danger ? colors.danger : colors.text;
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <Icon size={20} color={tint} strokeWidth={2.2} />
      <Text style={[styles.rowLabel, { color: tint }]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress && !danger ? (
        <ChevronRight size={18} color={colors.textFaint} />
      ) : null}
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  rowLabel: { fontFamily: fonts.medium, fontSize: fontSize.md, flex: 1 },
  rowValue: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.glassBorder, marginLeft: 52 },
  version: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.xl },
});
