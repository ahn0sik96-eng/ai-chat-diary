import { Tabs } from "expo-router";
import { GlassTabBar } from "@/components/tab-bar";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <GlassTabBar state={props.state} navigation={props.navigation} />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="write" />
      <Tabs.Screen name="entries" />
      <Tabs.Screen name="calendar" />
    </Tabs>
  );
}
