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

export default function SignUp() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit() {
    setError(null);
    if (username.trim().length < 2) {
      setError('사용자 이름은 2자 이상이어야 해요.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 해요.');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, username);
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? '가입에 실패했어요.');
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
            <Text style={styles.tagline}>나만의 AI 일기 친구를 만나보세요</Text>

            {done ? (
              <View style={styles.form}>
                <Text style={styles.notice}>
                  가입 확인 메일을 보냈어요. 메일 인증 후 로그인해 주세요.
                </Text>
                <Link href="/(auth)/sign-in" asChild>
                  <Pressable>
                    <PrimaryButton label="로그인하러 가기" />
                  </Pressable>
                </Link>
              </View>
            ) : (
              <>
                <View style={styles.form}>
                  <Field
                    label="사용자 이름"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    placeholder="moody_diary"
                  />
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
                    placeholder="6자 이상"
                  />
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  <PrimaryButton label="가입하기" onPress={onSubmit} loading={loading} />
                </View>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>이미 계정이 있나요?</Text>
                  <Link href="/(auth)/sign-in" asChild>
                    <Pressable hitSlop={8}>
                      <Text style={styles.link}>로그인</Text>
                    </Pressable>
                  </Link>
                </View>
              </>
            )}
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
  notice: {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  error: { color: colors.danger, fontFamily: fonts.medium, fontSize: fontSize.sm, marginLeft: 4 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.md },
  footerText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.md },
  link: { color: colors.primary, fontFamily: fonts.bold, fontSize: fontSize.md },
});
