import { Stack } from 'expo-router';

import { colors } from '@/theme';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="personas" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
