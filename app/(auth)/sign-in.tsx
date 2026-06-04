import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';
import { GradientBackground, Field, PrimaryButton } from '@/components';
import { BrandMark } from '@/components/BrandMark';
import { colors, fonts, fontSize, spacing } from '@/theme';

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e: any) {
      setError(e?.message ?? '로그인에 실패했어요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
            <BrandMark />
            <Text style={styles.tagline}>오늘 하루, AI와 함께 일기로</Text>

            <View style={styles.form}>
              <Field
                label="이메일"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@example.com"
              />
              <Field
                label="비밀번호"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton label="로그인" onPress={onSubmit} loading={loading} />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>아직 계정이 없나요?</Text>
              <Link href="/(auth)/sign-up" asChild>
                <Pressable hitSlop={8}>
                  <Text style={styles.link}>가입하기</Text>
                </Pressable>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  tagline: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  form: { gap: spacing.md },
  error: { color: colors.danger, fontFamily: fonts.medium, fontSize: fontSize.sm, marginLeft: 4 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.md },
  footerText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.md },
  link: { color: colors.primary, fontFamily: fonts.bold, fontSize: fontSize.md },
});
