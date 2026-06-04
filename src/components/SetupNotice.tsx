import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Settings2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import { GradientBackground } from './GradientBackground';
import { GlassCard } from './GlassCard';

/**
 * .env (Supabase) 가 설정되지 않았을 때 보여주는 안내 화면.
 * 키 없이도 앱이 크래시 없이 떠서 무엇을 해야 하는지 알려준다.
 */
export function SetupNotice() {
  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.wrap}>
          <View style={styles.iconWrap}>
            <Settings2 size={34} color={colors.primary} strokeWidth={1.8} />
          </View>
          <Text style={styles.title}>설정이 필요해요</Text>
          <Text style={styles.subtitle}>
            앱을 실행하려면 Supabase 연결 정보가 필요합니다. 프로젝트 루트에{' '}
            <Text style={styles.code}>.env</Text> 파일을 만들고 아래 값을 채워주세요.
          </Text>
          <GlassCard style={styles.card}>
            <Text style={styles.mono}>EXPO_PUBLIC_SUPABASE_URL=...</Text>
            <Text style={styles.mono}>EXPO_PUBLIC_SUPABASE_ANON_KEY=...</Text>
          </GlassCard>
          <Text style={styles.hint}>
            자세한 절차는 README.md 의 "셋업" 섹션을 참고하세요.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.sm,
  },
  title: { color: colors.text, fontFamily: fonts.heavy, fontSize: fontSize.xxl },
  subtitle: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  code: { color: colors.primary, fontFamily: fonts.bold },
  card: { alignSelf: 'stretch', marginTop: spacing.sm, gap: 6 },
  mono: { color: colors.text, fontFamily: fonts.medium, fontSize: fontSize.sm },
  hint: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: fontSize.sm, marginTop: spacing.sm },
});
