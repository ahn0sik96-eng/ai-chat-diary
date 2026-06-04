import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { apiKeyStore } from '@/api/apiKey';
import { useSettingsStore } from '@/state/settingsStore';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function ApiKeyScreen() {
  const [key, setKey] = useState('');
  const [loaded, setLoaded] = useState(false);
  const saveKey = useSettingsStore((s) => s.saveKey);
  const clearKey = useSettingsStore((s) => s.clearKey);
  const hasKey = useSettingsStore((s) => s.hasKey);

  useEffect(() => {
    apiKeyStore.get().then((k) => {
      if (k) setKey(k);
      setLoaded(true);
    });
  }, []);

  const onSave = async () => {
    await saveKey(key);
    router.back();
  };

  const onClear = async () => {
    await clearKey();
    setKey('');
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Text style={styles.label}>xAI Grok API 키</Text>
      <TextInput
        style={styles.input}
        placeholder="xai-..."
        placeholderTextColor={colors.textFaint}
        value={key}
        onChangeText={setKey}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={loaded && hasKey && key.length > 0 ? false : false}
        multiline
      />
      <Text style={styles.help}>
        개발자 전용 옵션이에요. 일반 사용자는 키를 넣을 필요가 없어요 — 실제 서비스는
        서버(프록시)가 키를 안전하게 보관하고 AI를 호출합니다. 이 화면은 서버 없이
        로컬에서 바로 테스트하고 싶을 때만 쓰세요.
      </Text>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>ℹ️ 참고</Text>
        <Text style={styles.noticeText}>
          여기에 키를 넣으면 이 기기에서 xAI를 직접 호출합니다(보안 저장소에 저장).
          비워두면 앱은 백엔드 프록시를 사용하고, 프록시도 없으면 예시(mock) 응답으로
          동작해요.
        </Text>
      </View>

      <Button label="저장하기" onPress={onSave} disabled={!key.trim()} style={{ marginTop: spacing.lg }} />
      {hasKey && (
        <Button label="키 삭제" variant="ghost" onPress={onClear} style={{ marginTop: spacing.sm }} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  label: { ...typography.bodyStrong, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    minHeight: 64,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
  },
  help: { ...typography.caption, marginTop: spacing.md, lineHeight: 19 },
  notice: {
    marginTop: spacing.xl,
    backgroundColor: '#FFF6E9',
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  noticeTitle: { ...typography.bodyStrong, color: colors.warning, marginBottom: spacing.xs },
  noticeText: { ...typography.caption, color: '#8A6D3B', lineHeight: 19 },
});
