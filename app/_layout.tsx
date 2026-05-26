import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Colors, FontSize } from '../constants/theme';

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.peachDark,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '채팅',
          tabBarIcon: ({ color }) => (
            <TabIcon label="💬" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="archive"
        options={{
          title: '일기장',
          tabBarIcon: ({ color }) => (
            <TabIcon label="📖" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: '스토어',
          tabBarIcon: ({ color }) => (
            <TabIcon label="🛍️" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{ href: null }}
      />
    </Tabs>
  );
}

function TabIcon({ label, color }: { label: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20, color }}>{label}</Text>;
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
});
