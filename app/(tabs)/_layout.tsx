import React from 'react';
import { Tabs } from 'expo-router';
import { ColorValue, Text } from 'react-native';
import { colors } from '@/theme/tokens';

function TabIcon({ icon, color }: { icon: string; color: ColorValue }) {
  return <Text style={{ fontSize: 22, color }}>{icon}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { fontWeight: '800', fontSize: 20 },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '일기',
          headerTitle: '마음일기',
          tabBarIcon: ({ color }) => <TabIcon icon="📔" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat/index"
        options={{
          title: '채팅',
          headerTitle: '채팅',
          tabBarIcon: ({ color }) => <TabIcon icon="💬" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          headerTitle: '프로필',
          tabBarIcon: ({ color }) => <TabIcon icon="🌷" color={color} />,
        }}
      />
    </Tabs>
  );
}
