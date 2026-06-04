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
        키는 이 기기에만 안전하게 저장돼요(보안 저장소). 키가 없어도 앱을 둘러볼 수
        있고, 채팅·요약은 예시 응답으로 동작해요.
      </Text>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>⚠️ 보안 안내</Text>
        <Text style={styles.noticeText}>
          지금은 키가 앱(기기)에 저장됩니다. 개인용/테스트 용도로는 괜찮지만, 앱을 정식
          출시하기 전에는 반드시 서버(예: Supabase Edge Function)를 통해 키를 숨기도록
          바꿔야 해요.
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
