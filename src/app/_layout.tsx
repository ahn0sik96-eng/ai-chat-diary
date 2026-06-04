import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DiaryProvider } from "@/lib/store";
import { colors } from "@/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <DiaryProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: "fade",
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="entry/[id]"
              options={{ animation: "slide_from_right" }}
            />
          </Stack>
        </DiaryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
