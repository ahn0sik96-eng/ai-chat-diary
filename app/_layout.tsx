import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSettingsStore } from '@/state/settingsStore';
import { colors } from '@/theme/tokens';

export default function RootLayout() {
  const refreshKey = useSettingsStore((s) => s.refreshKey);

  useEffect(() => {
    refreshKey();
  }, [refreshKey]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700' },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="chat/index" options={{ title: '채팅' }} />
          <Stack.Screen name="session/[sessionId]" options={{ headerShown: false }} />
          <Stack.Screen
            name="diary/summarize/[sessionId]"
            options={{ title: '일기로 만들기', presentation: 'modal' }}
          />
          <Stack.Screen
            name="diary/decorate/[diaryId]"
            options={{ title: '다이어리 꾸미기', headerShown: false }}
          />
          <Stack.Screen name="diary/[diaryId]" options={{ title: '일기' }} />
          <Stack.Screen name="settings/index" options={{ title: '설정' }} />
          <Stack.Screen name="settings/api-key" options={{ title: 'Grok API 키' }} />
          <Stack.Screen name="settings/personas" options={{ title: '페르소나' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
